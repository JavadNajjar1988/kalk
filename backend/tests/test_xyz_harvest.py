"""XYZ harvest URL normalization (no live HTTP)."""

import pytest

from app.services.sdi.harvest import (
    _concrete_tile_url_to_template,
    _fill_xyz_template,
    _normalize_xyz_tile_template,
    _xyz_template_variants,
    should_harvest_xyz,
)


def test_concrete_tile_url_to_template():
    assert _concrete_tile_url_to_template(
        "http://212.33.198.117:5055/map_tile/mapbox/4/3/8.png"
    ) == "http://212.33.198.117:5055/map_tile/mapbox/{z}/{x}/{y}.png"
    assert _concrete_tile_url_to_template(
        "http://212.33.198.117:5055/map_tile/mapbox/2/1/1"
    ) == "http://212.33.198.117:5055/map_tile/mapbox/{z}/{x}/{y}"
    assert _concrete_tile_url_to_template("/base/2/1/0") == "/base/{z}/{x}/{y}"
    q = _concrete_tile_url_to_template("http://h/t/1/2/3.jpg?k=1")
    assert q.startswith("http://h/t/{z}/{x}/{y}.jpg")
    assert "k=1" in q


def test_normalize_xyz_tile_template():
    assert (
        _normalize_xyz_tile_template("http://example.com/root")
        == "http://example.com/root/{z}/{x}/{y}"
    )
    assert (
        _normalize_xyz_tile_template("http://212.33.198.117:5055/map_tile/mapbox")
        == "http://212.33.198.117:5055/map_tile/mapbox/{z}/{x}/{y}"
    )
    t = "http://x/layer/{z}/{x}/{y}.png"
    assert _normalize_xyz_tile_template(t) == t


def test_should_harvest_xyz():
    assert should_harvest_xyz("http://a/b", ["wms"]) is False
    assert should_harvest_xyz("http://a/b", ["xyz"]) is True
    assert should_harvest_xyz("http://a/{z}/{x}/{y}", []) is True
    assert should_harvest_xyz("http://a/1/2/3.png", []) is True


def test_fill_xyz_template_tms():
    assert _fill_xyz_template("http://h/{z}/{x}/{-y}.png", 2, 2, 2) == "http://h/2/2/1.png"


def test_xyz_template_variants_order():
    base = "http://h/a/{z}/{x}/{y}.png"
    v = _xyz_template_variants(base)
    assert base in v
    assert "http://h/a/{z}/{x}/{y}" in v
    assert "http://h/a/{z}/{y}/{x}.png" in v
    assert any("{-y}" in x for x in v)

    no_ext = "http://212.33.198.117:5055/map_tile/mapbox/{z}/{x}/{y}"
    v2 = _xyz_template_variants(no_ext)
    assert no_ext in v2
    assert "http://212.33.198.117:5055/map_tile/mapbox/{z}/{x}/{y}.png" in v2


@pytest.mark.asyncio
async def test_harvest_xyz_layers_probes_with_mock(monkeypatch):
    from app.services.sdi import harvest as h

    async def _instant_match(tpl: str):
        return tpl, "default"

    monkeypatch.setattr(h, "_probe_xyz_template", _instant_match)

    out = await h.harvest_xyz_layers("http://example.com/tiles")
    assert len(out) == 1
    assert out[0]["url_or_path"] == "http://example.com/tiles/{z}/{x}/{y}"
    assert out[0]["extra_metadata"]["xyz_probe"] == "default"
