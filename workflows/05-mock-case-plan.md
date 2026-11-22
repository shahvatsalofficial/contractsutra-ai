# Workflow 5: Plan safe mock verification

## Purpose
Generate sample positive and invalid cases, never contact live systems or mark cases passed.

## Preconditions
- User-approved local source files; no uncontrolled external targets
- Record input versions and file SHA-256
- Confirm that the parser has explicit coverage for the input format

## Execution stages
1. ContractSutra Prime assigns scoped specialized agents and immutable source versions.
2. Perform review using only supported deterministic operations; refer to the canonical skills.
3. Create NOT_RUN case templates and include stable IDs and JSON pointers where possible.
4. Cross-check the source evidence. Mark all generated-but-unexecuted artifacts NOT_RUN.
5. Independent Auditor challenges risk categories, missing consumer knowledge, unsupported constructs and security assumptions.
6. Return a recommendation, never automatically deploy or approve a release.

## Exit and verification
- PASS only if the acceptance evidence exists and is reviewed.
- PARTIAL if supported subset succeeded but important integration or verification is missing.
- BLOCKED for invalid or unsafe inputs; NOT_RUN if no execution occurred.
- The generated package ships the workflow instructions, not an autonomous engine that executes all agents.
