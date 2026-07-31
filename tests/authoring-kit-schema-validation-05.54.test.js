/* Incremento 05.54 — os schemas publicados validam os exemplos reais na suíte oficial. */
const fs = require("fs");
const path = require("path");
const Ajv2020 = require("ajv/dist/2020");
const addFormats = require("ajv-formats");

const root = path.resolve(__dirname, "..");
const readJSON = relative => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
// `required` pode referenciar propriedades declaradas no schema pai; isso é
// válido no Draft 2020-12, apesar de o lint adicional `strictRequired` do Ajv
// exigir uma declaração redundante no mesmo subschema condicional.
const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  strictRequired: false,
  allowUnionTypes: true
});
addFormats(ajv);

const cases = [
  ["schemas/catalog-document.schema.json", "sample-document.json"],
  ["schemas/catalog-document.schema.json", "authoring-kit/examples/minimal-document.json"],
  ["schemas/catalog-capabilities.schema.json", "authoring-kit/capabilities.json"],
  ["schemas/catalog-source.schema.json", "authoring-kit/examples/catalog-source.json"],
  ["schemas/catalog-source.schema.json", "authoring-kit/examples/reference-catalog-source.json"],
  ["schemas/catalog-generation-plan.schema.json", "authoring-kit/examples/catalog-generation-plan.json"],
  ["schemas/catalog-project-package.schema.json", "authoring-kit/examples/catalog-project.json"]
];

const validators = new Map();
for (const [schemaPath, valuePath] of cases) {
  const validate = validators.get(schemaPath) || ajv.compile(readJSON(schemaPath));
  validators.set(schemaPath, validate);
  const valid = validate(readJSON(valuePath));
  assert(valid, `${valuePath} não atende ${schemaPath}: ${ajv.errorsText(validate.errors, { separator: " | " })}`);
}

for (const file of fs.readdirSync(path.join(root, "schemas")).filter(name => name.endsWith(".schema.json"))) {
  const canonical = fs.readFileSync(path.join(root, "schemas", file));
  const bundled = fs.readFileSync(path.join(root, "authoring-kit", "schemas", file));
  assert(canonical.equals(bundled), `A cópia de schema do kit diverge: ${file}.`);
}

console.log(`✓ ${cases.length} exemplos atendem aos JSON Schemas Draft 2020-12 publicados pelo Authoring Kit.`);
