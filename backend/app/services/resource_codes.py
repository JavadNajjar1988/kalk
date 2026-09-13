from __future__ import annotations

import hashlib
import re


RESOURCE_CODE_PREFIXES = {
    "personnel": "PER",
    "equipment": "EQP",
    "units": "UNT",
    "ammunition": "AMM",
    "logistics": "LOG",
    "ranks": "RNK",
    "maps": "MAP",
}

DOCUMENT_KIND_TO_RESOURCE_TYPE = {
    "person": "personnel",
    "equipment": "equipment",
    "unit": "units",
}


def build_resource_reference_code(resource_type: str, stable_id: str) -> str | None:
    """Build the Kalk display code; the database identity remains the stable ID."""
    prefix = RESOURCE_CODE_PREFIXES.get(resource_type)
    if not prefix:
        return None
    identity_tail = stable_id.rsplit("-", 1)[-1]
    token = re.sub(r"[^0-9a-f]", "", identity_tail.casefold())
    if len(token) < 10:
        token = hashlib.sha256(stable_id.encode("utf-8")).hexdigest()
    return f"{prefix}-{token[:10].upper()}"


def build_document_resource_reference_code(kind: str, draft_id: str) -> str | None:
    resource_type = DOCUMENT_KIND_TO_RESOURCE_TYPE.get(kind)
    return build_resource_reference_code(resource_type, draft_id) if resource_type else None
