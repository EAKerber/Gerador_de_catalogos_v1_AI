#!/usr/bin/env python3
"""DB-05.20.14 — adapta a auditoria 05.20.9 ao benchmark de ofertas independentes."""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "tests" / "promotional-fidelity-audit-05.20.9.py"
SPEC = importlib.util.spec_from_file_location("promotional_fidelity_audit_05209", SOURCE)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("Não foi possível carregar a auditoria promocional base.")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

_BASE_COMMERCIAL_STRUCTURE = MODULE.commercial_structure


def commercial_structure_v2(document: dict[str, Any]) -> dict[str, Any]:
    result = _BASE_COMMERCIAL_STRUCTURE(document)
    result["tabularRows"] = result["commercialRows"]
    result["commercialRows"] = max(result["commercialRows"], result["independentOfferUnits"])
    result["commercialRecordSource"] = (
        "independent-offer-units"
        if result["independentOfferUnits"] >= result["tabularRows"]
        else "table-rows"
    )
    return result


MODULE.commercial_structure = commercial_structure_v2

if __name__ == "__main__":
    raise SystemExit(MODULE.main())
