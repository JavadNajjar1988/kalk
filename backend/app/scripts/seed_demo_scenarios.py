"""
درج/به‌روزرسانی سناریوهای دمو در دیتابیس از روی JSONهای `front_kalknegar/public/scenarios/`.

شناسهٔ هر ردیف: `demo-` + نام فایل بدون پسوند `.json` (مثل `demo-Operation_Beit_ol_Moqaddas_1982_FA`).

اجرا از پوشهٔ backend (با venv و `.env`):
    python -m app.scripts.seed_demo_scenarios
"""

from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.scenario import Scenario

# نسبت به این فایل: app/scripts -> app -> backend -> repo root
_REPO_ROOT = Path(__file__).resolve().parents[3]
_SCENARIOS_DIR = _REPO_ROOT / "front_kalknegar" / "public" / "scenarios"


def _load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        raise ValueError(f"Expected JSON object in {path}")
    return data


async def seed() -> None:
    if not _SCENARIOS_DIR.is_dir():
        raise FileNotFoundError(
            f"Scenarios directory not found: {_SCENARIOS_DIR}\n"
            "Run this script from the repo with front_kalknegar present."
        )

    json_files = sorted(_SCENARIOS_DIR.glob("*.json"))
    if not json_files:
        raise FileNotFoundError(f"No *.json files under {_SCENARIOS_DIR}")

    now = datetime.now(timezone.utc)
    async with AsyncSessionLocal() as db:
        for path in json_files:
            stem = path.stem
            scenario_id = f"demo-{stem}"
            raw = _load_json(path)

            name = (raw.get("name") or "").strip() or stem
            if len(name) > 200:
                name = name[:200]
            desc = raw.get("description")
            if isinstance(desc, str) and len(desc) > 2000:
                desc = desc[:2000]
            image = raw.get("image")
            if isinstance(image, str) and len(image) > 500:
                image = image[:500]

            raw["id"] = scenario_id

            result = await db.execute(select(Scenario).where(Scenario.id == scenario_id))
            existing = result.scalar_one_or_none()

            if existing:
                existing.name = name
                existing.description = desc
                existing.image = image
                existing.content = raw
                existing.modified = now
            else:
                db.add(
                    Scenario(
                        id=scenario_id,
                        name=name,
                        description=desc,
                        image=image,
                        content=raw,
                        created=now,
                        modified=now,
                    )
                )
            print(f"OK  {scenario_id}  ←  {path.name}")

        await db.commit()

    print(f"\nDone. Seeded {len(json_files)} demo scenario(s).")


def main() -> None:
    asyncio.run(seed())


if __name__ == "__main__":
    main()
