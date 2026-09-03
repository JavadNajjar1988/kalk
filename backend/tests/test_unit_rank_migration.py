from importlib import import_module


migration = import_module("migrations.versions.0020_merge_unit_rank_resources")


def test_migration_revision_identifiers_fit_alembic_version_column() -> None:
    previous = import_module("migrations.versions.0019_add_sdi_map_scenario_assignments")

    assert len(previous.revision) <= 32
    assert len(migration.revision) <= 32
    assert migration.down_revision == previous.revision


def test_legacy_unit_rank_metadata_is_mapped_to_canonical_unit_fields() -> None:
    legacy = {
        "level": 4,
        "category": "زرهی",
        "authority": ["زرهی", "ضدزره"],
        "requirements": {
            "parentCommand": "لشکر نمونه",
            "province": "خراسان رضوی",
            "garrisonCity": "نیشابور",
            "baseName": "پادگان نمونه",
            "coordinates": {"lat": "36.214", "lng": "58.796"},
            "personnelStrength": "۳۵۰۰",
            "readiness": "بالا",
        },
    }

    assert migration._is_unit_profile(legacy) is True
    mapped = migration._canonical_metadata(legacy)
    assert mapped["echelon"] == "تیپ"
    assert mapped["unitType"] == "زرهی"
    assert mapped["capabilities"] == ["زرهی", "ضدزره"]
    assert mapped["garrisonCity"] == "نیشابور"
    assert mapped["homeLocation"] == {"latitude": "36.214", "longitude": "58.796"}
    assert mapped["migratedFromType"] == "ranks"
    assert mapped["legacyRankMetadata"] == legacy
