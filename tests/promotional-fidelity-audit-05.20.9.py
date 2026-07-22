#!/usr/bin/env python3
"""DB-05.20.9 — auditoria de fidelidade promocional sem comparação pixel a pixel."""
from __future__ import annotations

import argparse
import colorsys
import json
from collections import deque
from pathlib import Path
from typing import Any

from PIL import Image

OFFER_ROLES = {"offer", "offer-unit", "commercial-offer", "promotion-offer"}
CONTAINER_TYPES = {"product-card", "layout-container", "footer-item"}


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def color_masks(image: Image.Image) -> dict[str, list[bool]]:
    pixels = list(image.convert("RGB").getdata())
    masks = {key: [] for key in ("red", "yellow", "dark", "saturated", "white")}
    for red, green, blue in pixels:
        r, g, b = red / 255.0, green / 255.0, blue / 255.0
        hue, saturation, value = colorsys.rgb_to_hsv(r, g, b)
        luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
        masks["red"].append(((hue < 0.045 or hue > 0.955) and saturation > 0.55 and value > 0.35))
        masks["yellow"].append(0.10 < hue < 0.18 and saturation > 0.55 and value > 0.45)
        masks["dark"].append(luminance < 0.18)
        masks["saturated"].append(saturation > 0.45)
        masks["white"].append(luminance > 0.92 and saturation < 0.12)
    return masks


def largest_component_pct(mask: list[bool], width: int, height: int) -> float:
    visited = bytearray(len(mask))
    largest = 0
    for start, active in enumerate(mask):
        if not active or visited[start]:
            continue
        visited[start] = 1
        queue = deque([start])
        size = 0
        while queue:
            current = queue.popleft()
            size += 1
            x, y = current % width, current // width
            for neighbor in (
                current - 1 if x > 0 else -1,
                current + 1 if x + 1 < width else -1,
                current - width if y > 0 else -1,
                current + width if y + 1 < height else -1,
            ):
                if neighbor >= 0 and mask[neighbor] and not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)
        largest = max(largest, size)
    return 100.0 * largest / max(1, len(mask))


def image_metrics(path: Path) -> dict[str, float]:
    image = Image.open(path).convert("RGB")
    masks = color_masks(image)
    total = image.width * image.height
    return {
        "width": image.width,
        "height": image.height,
        "redPct": 100.0 * sum(masks["red"]) / total,
        "yellowPct": 100.0 * sum(masks["yellow"]) / total,
        "darkPct": 100.0 * sum(masks["dark"]) / total,
        "saturatedPct": 100.0 * sum(masks["saturated"]) / total,
        "whitePct": 100.0 * sum(masks["white"]) / total,
        "largestRedComponentPct": largest_component_pct(masks["red"], image.width, image.height),
        "largestYellowComponentPct": largest_component_pct(masks["yellow"], image.width, image.height),
        "largestDarkComponentPct": largest_component_pct(masks["dark"], image.width, image.height),
    }


def flatten_components(nodes: list[dict[str, Any]], parent: dict[str, Any] | None = None) -> list[tuple[dict[str, Any], dict[str, Any] | None]]:
    output: list[tuple[dict[str, Any], dict[str, Any] | None]] = []
    for node in nodes:
        output.append((node, parent))
        output.extend(flatten_components(node.get("children") or [], node))
    return output


def nearest_price_container(node: dict[str, Any], parents: dict[str, dict[str, Any] | None]) -> str:
    current = node
    while current:
        if current.get("type") in CONTAINER_TYPES or current.get("props", {}).get("recipeRole") in OFFER_ROLES:
            return str(current.get("id"))
        current = parents.get(str(current.get("id")))
    return str(node.get("id"))


def commercial_structure(document: dict[str, Any]) -> dict[str, Any]:
    page = document["pages"][0]
    flat = flatten_components(page.get("children") or [])
    nodes = [node for node, _ in flat]
    parents = {str(node.get("id")): parent for node, parent in flat}
    collections = {collection.get("id"): collection for collection in document.get("collections") or []}
    table_rows = list((collections.get("tableRows") or {}).get("items") or [])

    offer_nodes = [
        node for node in nodes
        if node.get("type") == "product-card" or node.get("props", {}).get("recipeRole") in OFFER_ROLES
    ]
    price_containers: set[str] = set()
    for node in nodes:
        props = node.get("props") or {}
        text = " ".join(str(props.get(key) or "") for key in ("content", "label", "price"))
        if "R$" in text.upper():
            price_containers.add(nearest_price_container(node, parents))
        if node.get("type") == "data-table" and any("R$" in str(row.get("price") or "").upper() for row in table_rows):
            price_containers.add(nearest_price_container(node, parents))

    footer = next((node for node in nodes if node.get("type") == "catalog-footer"), None)
    footer_y = float((footer or {}).get("frame", {}).get("y", page["size"]["height"]))
    page_height = float(page["size"]["height"])
    benefits = [
        node for node, parent in flat
        if node.get("type") == "icon"
        and parent is None
        and 0.72 * page_height <= float(node.get("frame", {}).get("y", -1)) < footer_y
    ]
    callouts = [node for node in nodes if node.get("props", {}).get("recipeRole") == "callout"]

    mode = "independent-repeated-offers"
    if len(offer_nodes) == 1 and len(table_rows) >= 2:
        mode = "single-card-with-tabular-variants"
    elif len(offer_nodes) < 4:
        mode = "insufficient-independent-offers"

    return {
        "independentOfferUnits": len(offer_nodes),
        "priceContainers": len(price_containers),
        "commercialRows": len(table_rows),
        "benefitUnits": len(benefits),
        "calloutUnits": len(callouts),
        "primaryOfferPresentation": mode,
        "componentCounts": {
            component_type: sum(1 for node in nodes if node.get("type") == component_type)
            for component_type in sorted({str(node.get("type")) for node in nodes})
        },
    }


def threshold_result(name: str, value: float, threshold: float, relation: str) -> dict[str, Any]:
    passed = value >= threshold if relation == "min" else value <= threshold
    return {"name": name, "value": round(value, 6), "relation": relation, "threshold": threshold, "passed": passed}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifact-dir", required=True)
    parser.add_argument("--profile", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--enforce", action="store_true", help="Retorna status 1 quando a categoria promocional não atingir os pisos.")
    args = parser.parse_args()

    artifact_dir = Path(args.artifact_dir)
    profile = read_json(Path(args.profile))
    document = read_json(artifact_dir / "promotional-generalization-document.json")
    benchmark = read_json(artifact_dir / "promotional-generalization-report.json")
    screen = image_metrics(artifact_dir / "constructed-canvas.png")
    reimported = image_metrics(artifact_dir / "reimported-canvas.png")
    structure = commercial_structure(document)

    thresholds = profile["categoryThresholds"]
    color_checks = [
        threshold_result("redPct", screen["redPct"], thresholds["redPctMin"], "min"),
        threshold_result("yellowPct", screen["yellowPct"], thresholds["yellowPctMin"], "min"),
        threshold_result("darkPct", screen["darkPct"], thresholds["darkPctMin"], "min"),
        threshold_result("saturatedPct", screen["saturatedPct"], thresholds["saturatedPctMin"], "min"),
        threshold_result("whitePct", screen["whitePct"], thresholds["whitePctMax"], "max"),
        threshold_result("largestRedComponentPct", screen["largestRedComponentPct"], thresholds["largestRedComponentPctMin"], "min"),
        threshold_result("largestYellowComponentPct", screen["largestYellowComponentPct"], thresholds["largestYellowComponentPctMin"], "min"),
        threshold_result("largestDarkComponentPct", screen["largestDarkComponentPct"], thresholds["largestDarkComponentPctMin"], "min"),
    ]
    expectations = profile["structuralExpectations"]
    structure_checks = [
        threshold_result("independentOfferUnits", structure["independentOfferUnits"], expectations["independentOfferUnitsMin"], "min"),
        threshold_result("priceContainers", structure["priceContainers"], expectations["priceContainersMin"], "min"),
        threshold_result("commercialRows", structure["commercialRows"], expectations["commercialRowsMin"], "min"),
        threshold_result("benefitUnits", structure["benefitUnits"], expectations["benefitUnitsMin"], "min"),
        threshold_result("calloutUnits", structure["calloutUnits"], expectations["calloutUnitsMin"], "min"),
        {
            "name": "primaryOfferPresentation",
            "value": structure["primaryOfferPresentation"],
            "expected": expectations["primaryOfferPresentation"],
            "passed": structure["primaryOfferPresentation"] == expectations["primaryOfferPresentation"],
        },
    ]

    color_score = round(100 * sum(check["passed"] for check in color_checks) / len(color_checks), 1)
    structure_score = round(100 * sum(check["passed"] for check in structure_checks) / len(structure_checks), 1)
    parity_deltas = {
        key: round(abs(screen[key] - reimported[key]), 6)
        for key in ("redPct", "yellowPct", "darkPct", "saturatedPct", "whitePct")
    }
    findings: list[dict[str, Any]] = []
    for code, check_name, message in (
        ("PROMOTIONAL_RED_DEFICIT", "redPct", "O vermelho aparece principalmente como linha/ícone, não como superfície promocional dominante."),
        ("PROMOTIONAL_YELLOW_ABSENT", "yellowPct", "O amarelo de urgência/preço da referência está praticamente ausente."),
        ("DARK_CONTRAST_DEFICIT", "darkPct", "A reprodução não possui massas escuras suficientes para a hierarquia de varejo da referência."),
        ("SATURATION_DEFICIT", "saturatedPct", "A página permanece editorial e neutra, com baixa ocupação de cores saturadas."),
        ("EDITORIAL_WHITESPACE_EXCESS", "whitePct", "A ocupação de branco excede o teto leniente da categoria promocional."),
    ):
        check = next(item for item in color_checks if item["name"] == check_name)
        if not check["passed"]:
            findings.append({"code": code, "severity": "P1", "message": message, "evidence": check})
    if structure["independentOfferUnits"] < expectations["independentOfferUnitsMin"]:
        findings.append({
            "code": "OFFER_UNITS_COLLAPSED",
            "severity": "P0",
            "message": "As quatro ofertas da referência foram colapsadas em uma única apresentação de produto.",
            "evidence": {
                "independentOfferUnits": structure["independentOfferUnits"],
                "commercialRows": structure["commercialRows"],
                "presentation": structure["primaryOfferPresentation"],
            },
        })
    if structure["priceContainers"] < expectations["priceContainersMin"]:
        findings.append({
            "code": "PRICE_HIERARCHY_TABULAR",
            "severity": "P0",
            "message": "Os quatro preços existem como dados, mas não como quatro blocos comerciais independentes.",
            "evidence": {"priceContainers": structure["priceContainers"], "commercialRows": structure["commercialRows"]},
        })

    fidelity_status = "category-compatible" if color_score >= 75 and structure_score >= 80 else "insufficient-category-match"
    report = {
        "suite": "DB-05.20.9 promotional fidelity audit",
        "profileVersion": profile["profileVersion"],
        "auditExecution": "valid",
        "blocking": bool(args.enforce),
        "fidelityStatus": fidelity_status,
        "scores": {
            "promotionalColor": color_score,
            "commercialStructure": structure_score,
            "overall": round((color_score + structure_score) / 2, 1),
        },
        "reference": profile["source"],
        "policy": profile["interpretation"],
        "benchmarkStatus": benchmark.get("status"),
        "screen": screen,
        "reimported": reimported,
        "roundTripColorDeltas": parity_deltas,
        "structure": structure,
        "checks": {"color": color_checks, "structure": structure_checks},
        "findings": findings,
        "conclusion": (
            "A reprodução preserva conteúdo e fluxo técnico, mas pertence a uma gramática visual editorial/tabular diferente da referência promocional."
            if fidelity_status != "category-compatible"
            else "A reprodução atingiu os pisos lenientes de categoria promocional."
        ),
    }
    write_json(Path(args.output), report)
    print(json.dumps({
        "fidelityStatus": fidelity_status,
        "scores": report["scores"],
        "structure": structure,
        "findings": [finding["code"] for finding in findings],
    }, ensure_ascii=False, indent=2))
    return 1 if args.enforce and fidelity_status != "category-compatible" else 0


if __name__ == "__main__":
    raise SystemExit(main())
