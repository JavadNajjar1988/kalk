from app.services.mbtiles_tiles import MBTilesTileService


def test_xyz_scheme_reads_xyz_y_without_flipping():
    assert MBTilesTileService._tile_row_for_scheme("xyz", 1, 0) == 0


def test_tms_scheme_flips_xyz_y_to_tms_row():
    assert MBTilesTileService._tile_row_for_scheme("tms", 1, 0) == 1
