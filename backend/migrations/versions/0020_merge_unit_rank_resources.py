"""merge unit-like rank resources into canonical units

Revision ID: 0020_merge_unit_ranks
Revises: 0019_sdi_scenario_ids
"""

from __future__ import annotations

import json
from typing import Any

from alembic import op
import sqlalchemy as sa


revision = "0020_merge_unit_ranks"
down_revision = "0019_sdi_scenario_ids"
branch_labels = None
depends_on = None


resources = sa.table(
    "resources",
    sa.column("id", sa.String()),
    sa.column("type", sa.String()),
    sa.column("metadata", sa.JSON()),
)

UNIT_REQUIREMENT_KEYS = {
    "parentCommand",
    "garrisonCity",
    "province",
    "baseName",
    "coordinates",
    "personnelStrength",
    "readiness",
    "commanderName",
    "contact",
}

ECHELON_BY_LEVEL = {
    5: "لشکر",
    4: "تیپ",
    3: "گردان / اسکادران",
    2: "گروهان / آتشبار",
    1: "دسته / جزء مستقل",
}


def _dict(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return value
    if isinstance(value, str) and value.strip():
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            return {}
    return {}


def _is_unit_profile(metadata: dict[str, Any]) -> bool:
    requirements = _dict(metadata.get("requirements"))
    return bool(UNIT_REQUIREMENT_KEYS.intersection(requirements))


def _canonical_metadata(metadata: dict[str, Any]) -> dict[str, Any]:
    requirements = _dict(metadata.get("requirements"))
    coordinates = _dict(requirements.get("coordinates"))
    canonical = dict(metadata)
    canonical.update(
        {
            "echelon": ECHELON_BY_LEVEL.get(metadata.get("level"), "نامشخص"),
            "unitType": metadata.get("category"),
            "capabilities": metadata.get("authority") or [],
            "parentName": requirements.get("parentCommand"),
            "garrisonCity": requirements.get("garrisonCity"),
            "province": requirements.get("province"),
            "baseName": requirements.get("baseName"),
            "homeLocation": {
                "latitude": coordinates.get("lat"),
                "longitude": coordinates.get("lng"),
            }
            if coordinates.get("lat") and coordinates.get("lng")
            else None,
            "nominalPersonnelStrength": requirements.get("personnelStrength"),
            "defaultReadiness": requirements.get("readiness"),
            "commanderName": requirements.get("commanderName"),
            "contact": requirements.get("contact"),
            "migratedFromType": "ranks",
            "unitRankMigrationVersion": 1,
            "legacyRankMetadata": metadata,
        }
    )
    return {key: value for key, value in canonical.items() if value is not None}


def upgrade() -> None:
    bind = op.get_bind()
    rows = bind.execute(
        sa.select(resources.c.id, resources.c["metadata"]).where(resources.c.type == "ranks")
    ).mappings()
    for row in rows:
        metadata = _dict(row["metadata"])
        if not _is_unit_profile(metadata):
            continue
        bind.execute(
            sa.update(resources)
            .where(resources.c.id == row["id"])
            .values(type="units", metadata=_canonical_metadata(metadata))
        )


def downgrade() -> None:
    bind = op.get_bind()
    rows = bind.execute(
        sa.select(resources.c.id, resources.c["metadata"]).where(resources.c.type == "units")
    ).mappings()
    for row in rows:
        metadata = _dict(row["metadata"])
        if metadata.get("unitRankMigrationVersion") != 1:
            continue
        legacy = _dict(metadata.get("legacyRankMetadata"))
        bind.execute(
            sa.update(resources)
            .where(resources.c.id == row["id"])
            .values(type="ranks", metadata=legacy)
        )
