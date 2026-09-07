"""Run explicitly against the configured local model; never imported as a test."""
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from app.services.document_extraction import extract_page, read_page


async def main():
    source = Path(sys.argv[1])
    number = int(sys.argv[2])
    raw = source.read_bytes()
    page = read_page(raw, source.name, number)
    result = await extract_page(page, raw, source.name, settings)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    asyncio.run(main())
