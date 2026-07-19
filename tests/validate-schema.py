"""Valida o documento de exemplo contra o JSON Schema do projeto."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
schema = json.loads((ROOT / "schemas/catalog-document.schema.json").read_text(encoding="utf-8"))
document = json.loads((ROOT / "sample-document.json").read_text(encoding="utf-8"))
package_schema = json.loads((ROOT / "schemas/catalog-project-package.schema.json").read_text(encoding="utf-8"))
capabilities_schema = json.loads((ROOT / "schemas/catalog-capabilities.schema.json").read_text(encoding="utf-8"))
source_schema = json.loads((ROOT / "schemas/catalog-source.schema.json").read_text(encoding="utf-8"))
plan_schema = json.loads((ROOT / "schemas/catalog-generation-plan.schema.json").read_text(encoding="utf-8"))
package_example = json.loads((ROOT / "authoring-kit/examples/catalog-project.json").read_text(encoding="utf-8"))
capabilities_example = json.loads((ROOT / "authoring-kit/capabilities.json").read_text(encoding="utf-8"))
source_example = json.loads((ROOT / "authoring-kit/examples/catalog-source.json").read_text(encoding="utf-8"))
plan_example = json.loads((ROOT / "authoring-kit/examples/catalog-generation-plan.json").read_text(encoding="utf-8"))

try:
    from jsonschema import Draft202012Validator
except ModuleNotFoundError:
    # Fallback sem dependências para ambientes em que jsonschema não está instalado.
    assert schema["properties"]["schemaVersion"]["const"] == "1.16.0"
    assert document["schemaVersion"] == "1.16.0"
    assert "editor" not in schema["required"]
    assert isinstance(document.get("collections"), list)
    assert {item["id"] for item in document["collections"]} >= {"assets", "products", "subcatalogs", "templates", "tableRows", "colorLegends"}
    assert document["numbering"]["cardNext"] >= 1
    assert next(item for item in document["collections"] if item["id"] == "templates")["label"] == "Meus componentes"
    assert package_schema["properties"]["packageFormat"]["const"] == "CatalogProjectPackage"
    assert package_example["packageVersion"] == "1.0.0"
    assert package_example["policy"]["assetMode"] == "assisted"
    assert capabilities_schema["properties"]["manifestType"]["const"] == "CatalogCapabilities"
    assert capabilities_example["editor"]["schemaVersion"] == "1.16.0"
    assert capabilities_example["components"]
    assert source_example["sourceFormat"] == "CatalogSource" and source_example["products"]
    assert plan_schema["properties"]["planFormat"]["const"] == "CatalogGenerationPlan"
    assert plan_example["planVersion"] == "1.0.0" and plan_example["products"]

    def validate_components(children):
        for component in children:
            for field in ("id", "type", "name", "frame", "constraints", "props", "style", "children"):
                assert field in component, f"{component.get('id')}: campo ausente {field}"
            if component["type"] == "art":
                assert "assetId" in component["props"]
                assert component["props"]["fit"] in {"contain", "cover", "original"}
                assert 0 <= component["props"]["focalX"] <= 100
                assert 0 <= component["props"]["focalY"] <= 100
                assert component["props"]["vectorMode"] in {"original", "token"}
                assert component["props"]["captionPosition"] in {"below", "overlay"}
            if component["type"] == "data-table":
                assert component["props"]["collectionId"]
                assert component["props"]["rowIds"]
                assert component["props"]["columns"]
            if component["type"] == "product-card":
                assert set(component["binding"]["overrides"]) >= {"title", "specOne", "specTwo", "code", "package", "price", "assetId"}
                assert component["presentation"]["mode"] in {"standard", "hero", "technical", "variants", "data-only"}
            if component.get("slot"):
                assert isinstance(component["slot"].get("span"), int)
                assert component["slot"]["span"] >= 1
            if component["type"] in {"layout-container", "catalog-header", "product-card", "catalog-footer"}:
                assert component.get("reflow", {}).get("mode") in {"auto", "manual"}
            validate_components(component["children"])

    for page in document["pages"]:
        validate_components(page["children"])
    print("✓ Documento, pacote, CatalogSource, plano e capacidades atendem aos contratos 05.6 (fallback sem jsonschema).")
else:
    errors = sorted(Draft202012Validator(schema).iter_errors(document), key=lambda error: list(error.path))
    if errors:
        for error in errors:
            print(f"{list(error.path)}: {error.message}")
        raise SystemExit(1)
    document_without_editor = dict(document)
    document_without_editor.pop("editor", None)
    optional_editor_errors = list(Draft202012Validator(schema).iter_errors(document_without_editor))
    if optional_editor_errors:
        for error in optional_editor_errors:
            print(f"documento autoral sem editor {list(error.path)}: {error.message}")
        raise SystemExit(1)
    extra_validations = [
        ("pacote", package_schema, package_example),
        ("capacidades", capabilities_schema, capabilities_example),
        ("fonte semântica", source_schema, source_example),
        ("plano editorial", plan_schema, plan_example),
    ]
    for label, contract, value in extra_validations:
        contract_errors = sorted(Draft202012Validator(contract).iter_errors(value), key=lambda error: list(error.path))
        if contract_errors:
            for error in contract_errors:
                print(f"{label} {list(error.path)}: {error.message}")
            raise SystemExit(1)
    print("✓ Documento 1.15, plano 1.0, pacote 1.0 e capacidades 1.0 válidos; sessão de editor permanece opcional.")
