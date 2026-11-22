# Compatibility rules

Guiding principle: a provider must keep accepting old valid **requests** and keep satisfying old promised **responses**.

| Change | In a request | In a response |
| --- | --- | --- |
| Operation removed | breaking | breaking |
| Operation added | additive | additive |
| Field added (optional) | info | additive |
| Field added (required) | **breaking** | additive |
| Field removed | needs review | **breaking** |
| Optional becomes required | **breaking** | additive |
| Required becomes optional | additive | **breaking** |
| Type changed | breaking | breaking |
| Nullable removed | breaking | additive |
| Nullable introduced | additive | **breaking** |
| Enum values removed | **breaking** | needs review |
| Enum values added | additive | needs review |
| Bound tightened (`maxLength` down, `minimum` up, ...) | **breaking** | additive |
| Bound relaxed | additive | needs review |
| `pattern` / `additionalProperties:false` newly added | **breaking** | needs review |
| Format changed | needs review | needs review |
| Parameter added (required) | **breaking** | n/a |
| Parameter removed | needs review (breaking if it was required) | n/a |
| Media type removed | breaking | breaking |
| Response status removed | n/a | breaking |

## Never silent
Anything the engine cannot decide becomes `SCHEMA_UNKNOWN` or `UNRESOLVED_SEMANTICS` (needs review): `oneOf`, `anyOf`, `allOf`, external or cyclic `$ref`, nesting beyond 6 levels, `$ref` path items.

## Caveats
- An *additive* response field can still break a strict client that rejects unknown fields. That is why consumer mapping exists.
- Renames show up as a removal plus an addition. Treat that as a hypothesis, not a proven rename.
- Semantic changes with no schema change (a field now returns different units) are invisible to any static diff.
- Version strings and SemVer are not evidence of compatibility.

Source of truth: `src/core/compare.mjs`. Every rule above has a unit test and most have a gold-corpus scenario.
