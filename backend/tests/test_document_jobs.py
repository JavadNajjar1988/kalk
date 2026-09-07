import pytest
from pathlib import Path
from PIL import Image
from types import SimpleNamespace

from app.core.config import settings
from app.api.routes import data_import
from app.services import document_jobs


def test_json_write_retries_a_transient_windows_bind_mount_lock(tmp_path, monkeypatch):
    original_replace = Path.replace
    attempts = 0

    def flaky_replace(path, target):
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            raise PermissionError("temporary bind-mount lock")
        return original_replace(path, target)

    monkeypatch.setattr(Path, "replace", flaky_replace)
    target = tmp_path / "job.json"

    document_jobs._write_json(target, {"status": "running"})

    assert attempts == 3
    assert document_jobs._read_json(target) == {"status": "running"}


def test_document_job_is_persistent_owned_and_resumable(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "DOCUMENT_JOB_DIR", str(tmp_path))
    job = document_jobs.create_job("متن سند".encode(), "report.txt", "user-1", False)

    stored = document_jobs.get_job(job["id"], "user-1")
    assert stored["status"] == "queued"
    assert stored["pageCount"] == 1
    assert document_jobs.public_job(stored).get("sourcePath") is None
    assert document_jobs.public_job(stored).get("owner") is None
    assert document_jobs.public_job(stored).get("workerId") is None
    with pytest.raises(PermissionError):
        document_jobs.get_job(job["id"], "user-2")

    cancelled = document_jobs.request_cancel(job["id"], "user-1")
    assert cancelled["status"] == "cancelled"
    resumed = document_jobs.resume_job(job["id"], "user-1")
    assert resumed["status"] == "queued"


def test_job_page_applies_semantic_safety_to_persisted_results(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "DOCUMENT_JOB_DIR", str(tmp_path))
    job = document_jobs.create_job("متن سند".encode(), "report.txt", "user-1", False)
    document_jobs._write_json(
        document_jobs._job_dir(job["id"]) / "pages" / "1.json",
        {
            "page": 1,
            "warnings": [],
            "items": [
                {
                    "id": "operation",
                    "kind": "event",
                    "name": "عملیات طریق القدس",
                    "evidence": "عملیات طریق القدس",
                },
                {
                    "id": "generic-person",
                    "kind": "person",
                    "name": "نیروهای ایرانی",
                    "evidence": "نیروهای ایرانی",
                },
            ],
        },
    )

    page = document_jobs.get_job_page(job["id"], 1, "user-1")

    assert page["persisted"] is True
    assert [(item["kind"], item["name"]) for item in page["items"]] == [
        ("scenario", "عملیات طریق القدس")
    ]
    assert any("پالایش معنایی" in warning for warning in page["warnings"])


@pytest.mark.asyncio
async def test_document_job_worker_persists_each_page(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "DOCUMENT_JOB_DIR", str(tmp_path))

    async def fake_extract(page_data, raw, filename, settings_obj):
        return {
            **page_data,
            "image": None,
            "documentId": "doc",
            "filename": filename,
            "items": [],
            "persisted": True,
        }

    monkeypatch.setattr(document_jobs, "extract_page", fake_extract)
    job = document_jobs.create_job("متن سند".encode(), "report.txt", "user-1", False)
    await document_jobs._process_job(job["id"])

    stored = document_jobs.get_job(job["id"], "user-1")
    assert stored["status"] == "completed"
    assert stored["processedPages"] == [1]
    page = document_jobs.get_job_page(job["id"], 1, "user-1")
    assert page["text"] == "متن سند"
    assert page["persisted"] is True


def test_detect_map_pages_promotes_reviewable_image_and_keeps_other_failures(
    tmp_path, monkeypatch
):
    monkeypatch.setattr(settings, "DOCUMENT_JOB_DIR", str(tmp_path))
    job = document_jobs.create_job(b"document", "maps.txt", "user-1", False)
    stored = document_jobs.get_job(job["id"], "user-1")
    stored.update(
        status="partial",
        filename="maps.pdf",
        failedPages={
            "1": "بازشناسی این صفحه تصویری کامل نشد؛ صفحه احتمالاً نقشه یا تصویر پرجزئیات است.",
            "2": "مدل خروجی قابل استفاده تولید نکرد.",
        },
        pageCount=2,
    )
    document_jobs._write_json(document_jobs._metadata_path(job["id"]), stored)

    def fake_read_page(raw, filename, page, force_ocr):
        return {
            "page": page,
            "pageCount": 2,
            "text": "",
            "image": Image.new("RGB", (320, 200), "white"),
            "method": "ocr",
            "warnings": [],
        }

    monkeypatch.setattr(document_jobs, "read_page", fake_read_page)
    promoted = document_jobs.detect_map_pages(job["id"], "user-1")

    assert promoted["processedPages"] == [1]
    assert set(promoted["failedPages"]) == {"2"}
    assert promoted["mapPages"]["1"]["status"] == "needs_placement"
    assert document_jobs.get_map_page_path(job["id"], 1, "user-1").is_file()
    page = document_jobs.get_job_page(job["id"], 1, "user-1")
    assert page["pageKind"] == "military-map"
    assert page["method"] == "map-reference"


@pytest.mark.asyncio
async def test_attach_map_page_stages_rotated_image_layer_without_fake_coordinates(
    tmp_path, monkeypatch
):
    jobs_dir = tmp_path / "jobs"
    images_dir = tmp_path / "scenario-images"
    monkeypatch.setattr(settings, "DOCUMENT_JOB_DIR", str(jobs_dir))
    monkeypatch.setattr(settings, "SCENARIO_IMAGE_DIR", str(images_dir))
    job = document_jobs.create_job(b"document", "maps.txt", "user-1", False)
    stored = document_jobs.get_job(job["id"], "user-1")
    stored["mapPages"] = {
        "1": {"page": 1, "status": "needs_placement", "rotationDegrees": 0}
    }
    document_jobs._write_json(document_jobs._metadata_path(job["id"]), stored)
    map_path = document_jobs._map_page_path(job["id"], 1)
    map_path.parent.mkdir(parents=True)
    Image.new("RGB", (100, 60), "white").save(map_path, format="WEBP")

    scenario = SimpleNamespace(
        id="scenario-1", archived_at=None, content={"mapLayers": []}, modified=None
    )

    class FakeDb:
        added = []
        committed = False

        async def get(self, model, key):
            return scenario if key == scenario.id else None

        def add(self, value):
            self.added.append(value)

        async def commit(self):
            self.committed = True

    db = FakeDb()
    response = await data_import.attach_document_map_page(
        job["id"],
        1,
        data_import.DocumentMapLayerRequest(
            scenarioId=scenario.id,
            layerName="کالک صفحه ۱",
            rotationDegrees=90,
        ),
        db,
        {"user_id": "user-1"},
    )

    layer = scenario.content["mapLayers"][0]
    assert response["data"]["requiresPlacement"] is True
    assert layer["requiresPlacement"] is True
    assert layer["imageRotate"] == pytest.approx(1.5707963268)
    assert "imageCenter" not in layer
    assert "extent" not in layer
    assert (images_dir / Path(layer["url"]).name).is_file()
    assert db.committed is True
