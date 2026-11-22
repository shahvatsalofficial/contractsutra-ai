# Workflow catalog

1. `01-contract-intake` — **Inspect and pin inputs**: Read only approved local files; hash before/after; determine OpenAPI version and whether YAML/GraphQL/AsyncAPI are unsupported for actual execution.
2. `02-spec-validate` — **Validate and normalize**: Check path/operation objects; local refs and cycles; bound file size, nesting and output.
3. `03-semantic-compare` — **Diff contracts**: Apply request/response variance rules; classify operation, media, field, required/enum/nullability changes.
4. `04-consumer-evidence` — **Map declared consumers**: Match operation IDs from a supplied manifest; mark imported assumptions unverified and unknown consumers unknown.
5. `05-mock-case-plan` — **Plan safe mock verification**: Generate sample positive and invalid cases, never contact live systems or mark cases passed.
6. `06-ci-gate` — **Apply release gate**: Use explicit fail threshold, retain logs and require a human exception process for risky changes.
7. `07-deprecation-migration` — **Plan safe transition**: Draft semver, field alias, sunset, backwards compatibility shim, migration and rollback plan.
8. `08-independent-audit` — **Audit and communicate**: Check evidence hashes, reporting, incomplete semantic coverage, unresolved risks and publicity claims.
