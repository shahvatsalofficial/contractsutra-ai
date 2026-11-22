# ContractSutra compatibility policy

Compatibility is directional. A provider candidate that narrows accepted **requests** may break existing callers; a provider candidate that weakens promised **responses** may break existing decoders. The starter uses conservative approximations and reports unknowns for complex constructs.

| Change | Default assessment | Important caveat |
| --- | --- | --- |
| Remove endpoint/operation | Breaking | Routing aliases or undocumented use not inspected |
| Add required request parameter/body property | Breaking | Input normalization may exist at runtime |
| Add optional request parameter/property | Additive/info | Closed request decoders require testing |
| Remove response field | Breaking | Some consumers may not read it |
| Make previously required response field optional | Breaking | Some clients expect guaranteed presence |
| Add optional response field | Additive | Strict client decoders may reject unknown fields |
| Change field type | Breaking | Coercion/runtime behavior not inspected |
| Reduce permitted request enum values | Breaking | Consumers may use a removed value |
| Expand response enum values | Risky | Closed-set consumer handling may fail |
| Remove supported media type/response status | Breaking | Client reliance unknown |
| Unsupported local/remote refs, complex schema compositions | Risky/unknown | Full semantic compatibility unproven |
| Create new operation | Additive | Security policies and rate limits not analyzed |

Important: the starter intentionally does **not** infer comprehensive schema compatibility for versioned OpenAPI contracts. For robust support, use pinned standard-compliant schema parsers and differential runtime tests. Verified source: https://spec.openapis.org/oas/latest.html
