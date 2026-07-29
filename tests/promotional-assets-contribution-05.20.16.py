#!/usr/bin/env python3
"""DB-05.20.16 — separa contribuição visual dos assets da capacidade nativa do V2."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def delta(after: float, before: float) -> float:
    return round(float(after) - float(before), 6)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifact-root", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    root = Path(args.artifact_root)
    baseline_benchmark = read_json(root / "baseline" / "promotional-generalization-report.json")
    assets_benchmark = read_json(root / "assets" / "promotional-generalization-report.json")
    baseline_fidelity = read_json(root / "baseline-fidelity-report.json")
    assets_fidelity = read_json(root / "assets-fidelity-report.json")

    baseline_scores = baseline_fidelity["scores"]
    assets_scores = assets_fidelity["scores"]
    baseline_screen = baseline_fidelity["screen"]
    assets_screen = assets_fidelity["screen"]
    constructed = assets_benchmark["constructed"]
    reimported = assets_benchmark["reimported"]

    checks = [
        {"name": "baselineActions", "value": baseline_benchmark["actionCount"], "relation": "max", "threshold": 190, "passed": baseline_benchmark["actionCount"] <= 190},
        {"name": "assetActions", "value": assets_benchmark["assetPhase"]["actionCount"], "relation": "max", "threshold": 30, "passed": assets_benchmark["assetPhase"]["actionCount"] <= 30},
        {"name": "assetCollectionCount", "value": constructed["assetCollectionCount"], "relation": "eq", "threshold": 3, "passed": constructed["assetCollectionCount"] == 3},
        {"name": "assetUsages", "value": constructed["assetUsages"], "relation": "eq", "threshold": 5, "passed": constructed["assetUsages"] == 5},
        {"name": "placeholderArts", "value": constructed["placeholderArts"], "relation": "eq", "threshold": 0, "passed": constructed["placeholderArts"] == 0},
        {"name": "independentOfferUnits", "value": assets_fidelity["structure"]["independentOfferUnits"], "relation": "min", "threshold": 4, "passed": assets_fidelity["structure"]["independentOfferUnits"] >= 4},
        {"name": "priceContainers", "value": assets_fidelity["structure"]["priceContainers"], "relation": "min", "threshold": 4, "passed": assets_fidelity["structure"]["priceContainers"] >= 4},
        {"name": "commercialStructure", "value": assets_scores["commercialStructure"], "relation": "eq", "threshold": 100, "passed": assets_scores["commercialStructure"] == 100},
        {"name": "promotionalColor", "value": assets_scores["promotionalColor"], "relation": "min", "threshold": 50, "passed": assets_scores["promotionalColor"] >= 50},
        {"name": "overall", "value": assets_scores["overall"], "relation": "min", "threshold": 75, "passed": assets_scores["overall"] >= 75},
        {"name": "roundTripAssetUsages", "value": reimported["assetUsages"], "relation": "eq", "threshold": 5, "passed": reimported["assetUsages"] == 5},
        {"name": "roundTripPlaceholders", "value": reimported["placeholderArts"], "relation": "eq", "threshold": 0, "passed": reimported["placeholderArts"] == 0},
        {"name": "roundTripMissingReferences", "value": reimported["publication"]["missingReferences"], "relation": "eq", "threshold": 0, "passed": reimported["publication"]["missingReferences"] == 0},
        {"name": "schemaVersion", "value": constructed["schemaVersion"], "relation": "eq", "threshold": "1.16.0", "passed": constructed["schemaVersion"] == "1.16.0"},
    ]

    failed = [item for item in checks if not item["passed"]]
    asset_hashes = {item["sha256"] for item in constructed["assetDigests"]}
    fixture_hashes = set(assets_benchmark["package"]["hashes"])
    hashes_passed = len(asset_hashes) == 3 and asset_hashes == fixture_hashes
    checks.append({"name": "portableAssetHashes", "value": sorted(asset_hashes), "relation": "set-eq", "threshold": sorted(fixture_hashes), "passed": hashes_passed})
    if not hashes_passed:
        failed.append(checks[-1])

    color_keys = (
        "redPct",
        "yellowPct",
        "darkPct",
        "saturatedPct",
        "whitePct",
        "largestRedComponentPct",
        "largestYellowComponentPct",
        "largestDarkComponentPct",
    )
    contribution = {
        key: {
            "baseline": baseline_screen[key],
            "withAssets": assets_screen[key],
            "delta": delta(assets_screen[key], baseline_screen[key]),
        }
        for key in color_keys
    }

    report = {
        "suite": "DB-05.20.16 promotional real-assets contribution",
        "status": "pass" if not failed else "fail",
        "policy": assets_benchmark["policy"],
        "actions": {
            "nativeV2": baseline_benchmark["actionCount"],
            "assetPhase": assets_benchmark["assetPhase"]["actionCount"],
            "combinedObserved": assets_benchmark["actionCount"],
        },
        "scores": {
            "baseline": baseline_scores,
            "withAssets": assets_scores,
            "delta": {
                "promotionalColor": delta(assets_scores["promotionalColor"], baseline_scores["promotionalColor"]),
                "commercialStructure": delta(assets_scores["commercialStructure"], baseline_scores["commercialStructure"]),
                "overall": delta(assets_scores["overall"], baseline_scores["overall"]),
            },
        },
        "visualContribution": contribution,
        "nativeStructureAttribution": {
            "baselineOfferUnits": baseline_fidelity["structure"]["independentOfferUnits"],
            "withAssetsOfferUnits": assets_fidelity["structure"]["independentOfferUnits"],
            "baselinePriceContainers": baseline_fidelity["structure"]["priceContainers"],
            "withAssetsPriceContainers": assets_fidelity["structure"]["priceContainers"],
            "presentation": assets_fidelity["structure"]["primaryOfferPresentation"],
            "commercialRecordSource": assets_fidelity["structure"].get("commercialRecordSource"),
            "conclusion": "Oferta, preço, código e medida continuam nativos; assets resolvem somente mídia, marca e desenho técnico.",
        },
        "assetContribution": {
            "assets": constructed["assetCollectionCount"],
            "usages": constructed["assetUsages"],
            "placeholderReduction": baseline_benchmark["metrics"]["placeholderArts"] - constructed["placeholderArts"],
            "usagePlan": assets_benchmark["assetPhase"]["usagePlan"],
            "packageAssets": assets_benchmark["package"]["assetCount"],
            "roundTripUsages": reimported["assetUsages"],
        },
        "checks": checks,
        "failures": failed,
        "conclusion": (
            "Os assets foram medidos como contribuição visual e de completude, sem receber crédito pela estrutura comercial nativa."
            if not failed
            else "O benchmark não preservou todos os gates necessários para atribuir o ganho exclusivamente aos assets."
        ),
    }
    write_json(Path(args.output), report)

    if args.enforce and failed:
        print("DB-05.20.16 falhou: " + ", ".join(item["name"] for item in failed))
        return 1
    print(
        "✓ DB-05.20.16 separou "
        f"{assets_benchmark['assetPhase']['actionCount']} ações de asset das {baseline_benchmark['actionCount']} ações nativas; "
        f"estrutura {assets_scores['commercialStructure']}/100, cromático {assets_scores['promotionalColor']}/100, consolidado {assets_scores['overall']}/100."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
