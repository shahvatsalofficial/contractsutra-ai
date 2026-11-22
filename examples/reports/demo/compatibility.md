# ContractSutra AI — Compatibility Evidence

> Static specification comparison; NOT proof of actual consumer or runtime compatibility. Unresolved semantics require review.

## Verdict

**Gate disabled (--fail-on none): report only, nothing blocked**

| Breaking | Needs review | Additive | Informational | Unresolved fragments |
| ---: | ---: | ---: | ---: | ---: |
| 2 | 0 | 2 | 1 | 0 |

## Inputs

- Engine: `contractsutra-offline-openapi-json-subset-v0.1`
- Before SHA-256: `0c5d70b0865a224f589ca27951bf32d3f7b0cfdded0b644cbd1495b3e5ce2bb6`
- After SHA-256: `539d74151a038ae6170cf6e11d7e4dd137a0e2bf6002c1f24a0f0acd7c8c8e01`
- Consumer manifest: 2 entries, USER_DECLARED_UNVERIFIED, SHA-256 `c43d8fbe4a136f8dce20f570e79713af8c9482f2aea2675237564509092211cf`

## Findings

| ID | Severity | Code | Pointer | Declared consumers |
| --- | --- | --- | --- | --- |
| CS-5D4DFCCBC0E1 | Breaking | `FIELD_ADDED` | `#/paths/~1invitations/post/requestBody/content/application~1json/schema/properties/organizationId` | admin-console |
| CS-CF9D95D774DE | Informational | `FIELD_ADDED` | `#/paths/~1invitations/post/requestBody/content/application~1json/schema/properties/source` | admin-console |
| CS-64C332DBE59C | Breaking | `FIELD_REMOVED` | `#/paths/~1invitations/post/responses/201/content/application~1json/schema/properties/role` | admin-console |
| CS-9E1FDE917AF2 | Additive | `FIELD_ADDED` | `#/paths/~1invitations/post/responses/201/content/application~1json/schema/properties/roleName` | admin-console |
| CS-888AFB689BE7 | Additive | `FIELD_ADDED` | `#/paths/~1invitations/post/responses/201/content/application~1json/schema/properties/source` | admin-console |

### Breaking (2)

#### CS-5D4DFCCBC0E1 — FIELD_ADDED

Schema field added: organizationId (required)

- JSON pointer: `#/paths/~1invitations/post/requestBody/content/application~1json/schema/properties/organizationId`
- Direction: request
- Consumer impact: DECLARED_CONSUMERS_MATCHED_UNVERIFIED
- Evidence: OBSERVED_IN_SPEC
- Affected declared consumers: admin-console

#### CS-64C332DBE59C — FIELD_REMOVED

Schema field removed: role

- JSON pointer: `#/paths/~1invitations/post/responses/201/content/application~1json/schema/properties/role`
- Direction: response
- Consumer impact: DECLARED_CONSUMERS_MATCHED_UNVERIFIED
- Evidence: OBSERVED_IN_SPEC
- Affected declared consumers: admin-console

### Additive (2)

#### CS-9E1FDE917AF2 — FIELD_ADDED

Schema field added: roleName (required)

- JSON pointer: `#/paths/~1invitations/post/responses/201/content/application~1json/schema/properties/roleName`
- Direction: response
- Consumer impact: DECLARED_CONSUMERS_MATCHED_UNVERIFIED
- Evidence: OBSERVED_IN_SPEC
- Affected declared consumers: admin-console

#### CS-888AFB689BE7 — FIELD_ADDED

Schema field added: source (optional)

- JSON pointer: `#/paths/~1invitations/post/responses/201/content/application~1json/schema/properties/source`
- Direction: response
- Consumer impact: DECLARED_CONSUMERS_MATCHED_UNVERIFIED
- Evidence: OBSERVED_IN_SPEC
- Affected declared consumers: admin-console

### Informational (1)

#### CS-CF9D95D774DE — FIELD_ADDED

Schema field added: source (optional)

- JSON pointer: `#/paths/~1invitations/post/requestBody/content/application~1json/schema/properties/source`
- Direction: request
- Consumer impact: DECLARED_CONSUMERS_MATCHED_UNVERIFIED
- Evidence: OBSERVED_IN_SPEC
- Affected declared consumers: admin-console

## Review and migration guidance

- Resolve breaking changes with a versioned path, compatibility shim, or coordinated consumer migration.
- For risky or unresolved semantics, obtain producer and consumer test evidence before release.
- Review additive changes with consumers that may use closed-world response decoders.
- Preserve prior schema versions, change IDs, and decision records for audit.

## Verification gaps

- 0 unsupported or unresolved semantic fragments were found.
- Pact Broker verification and endpoint testing: NOT_RUN.
- Real consumer runtime tests: NOT_RUN.
- Host IDE adapter activation: NOT_RUN.
