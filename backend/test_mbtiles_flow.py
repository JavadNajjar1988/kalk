import requests

base = "http://127.0.0.1:8000/api"

# 1. List maps and find MBTiles ones
print("=== Current Maps ===")
r = requests.get(f"{base}/maps")
data = r.json()
for m in data.get("maps", []):
    print(f"  [{m['id']}] {m['name']} | type={m['storage_type']} | active={m['is_active']}")
    print(f"       url_template={m['url_template']}")

# 2. Test tile serving for MBTiles
mbtiles_maps = [m for m in data.get("maps", []) if m["storage_type"] == "mbtiles"]
if mbtiles_maps:
    m = mbtiles_maps[0]
    mid = m["id"]
    print(f"\n=== Testing tile from map [{mid}] {m['name']} ===")
    
    # Test new direct endpoint
    url = f"{base}/tile-cache/mbtiles/{mid}/0/0/0"
    print(f"GET {url}")
    tr = requests.get(url)
    print(f"  Status: {tr.status_code}")
    if tr.ok:
        print(f"  Content-Type: {tr.headers.get('content-type')}")
        print(f"  Size: {len(tr.content)} bytes")
        print(f"  First bytes: {tr.content[:8].hex()}")
    else:
        print(f"  Error: {tr.text[:200]}")
    
    # Test z=2 tile
    url2 = f"{base}/tile-cache/mbtiles/{mid}/2/1/1"
    print(f"\nGET {url2}")
    tr2 = requests.get(url2)
    print(f"  Status: {tr2.status_code}")
    if tr2.ok:
        print(f"  Content-Type: {tr2.headers.get('content-type')}")
        print(f"  Size: {len(tr2.content)} bytes")
else:
    print("\nNo MBTiles maps found. Uploading test sample...")
    with open("static/maps/test_sample.mbtiles", "rb") as f:
        resp = requests.post(
            f"{base}/maps/upload",
            data={"name": "Test Sample", "description": "Test"},
            files={"file": ("test_sample.mbtiles", f, "application/octet-stream")},
        )
    print(f"Upload: {resp.status_code}")
    d = resp.json()
    mid = d["id"]
    print(f"Map ID: {mid}, URL: {d.get('url_template')}")
    
    # Test new direct endpoint
    url = f"{base}/tile-cache/mbtiles/{mid}/0/0/0"
    print(f"\nGET {url}")
    tr = requests.get(url)
    print(f"  Status: {tr.status_code}")
    if tr.ok:
        print(f"  Content-Type: {tr.headers.get('content-type')}")
        print(f"  Size: {len(tr.content)} bytes")
    else:
        print(f"  Error: {tr.text[:200]}")
