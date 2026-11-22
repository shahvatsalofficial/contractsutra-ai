# Test report and proof

Recorded {{DATE}} on Node {{NODE}}, {{PLATFORM}}. Regenerate with `npm run proof`. Raw files are in [`docs/proof`](https://github.com/shahvatsalofficial/contractsutra-ai/tree/main/docs/proof) and the [samples](samples/) folder.

## Summary
| Measure | Result |
| --- | --- |
| Automated tests | **{{PASS}} / {{TESTS}}** passed, {{FAIL}} failed, {{SKIPPED}} skipped |
| Gold corpus | **{{GOLD}} / {{GOLDN}}** scenarios agree (precision and recall 1.00 on this corpus) |
| Fuzz | **{{FUZZ}}** mutated spec pairs: {{FUZZFAIL}} crashes, non-determinism, render failures or unexpected self-diff findings |
| Independent audit of the demo report | 12 / 12 checks PASS |
| CI matrix | Ubuntu, Windows, macOS on Node 22 and 24 (see Actions tab) |

## Test groups
| Area | What is proven |
| --- | --- |
| Parsing and validation | Version gate, missing paths, bad operations, `$ref` resolution, cycles, external refs, BOM |
| Rules | Each direction-aware rule in both directions; constraint tightening and relaxing; stable IDs; no change gives zero findings |
| Consumers | Manifest limits, declared mapping, `UNKNOWN` stays unknown |
| Reports | Escaping of hostile text, every finding in MD and HTML, SARIF mapping, six-plus-one file set |
| Audit | Pass on clean output; FAIL on edited report, forged counts, forged IDs, over-claimed verification, tampered chain, missing files, empty directory |
| CLI | Exit codes 0/2/3/4, strict flags, `verify` seal |
| Server / MCP / IDE | Auth, rate limit, read-only, traversal refusal, 9 IDE packs, protocol refusal |

## Gold corpus
Author-labelled synthetic scenarios (operation removed, field required, type changed, composition introduced, ...). The full table with expected and observed output is in [samples](samples/TEST-RESULTS.md). **Caveat:** the corpus measures agreement with the author's own rules. It is not an accuracy measurement on real-world APIs; publish your own spec pairs as issues to grow it.

## Benchmark
Synthetic specs on one machine, wall-clock of the comparison step only. See `benchmark.json`. These numbers describe this host, not a guarantee.

## Reproduce
```bash
git clone https://github.com/shahvatsalofficial/contractsutra-ai && cd contractsutra-ai
npm test && npm run demo && npm run proof
```

## Known gaps
- Symlink-based security tests cannot run where the OS denies symlink creation (common on Windows without developer mode). They self-skip there and run on Linux/macOS CI.
- Not covered: real production specs at scale, YAML, GraphQL, AsyncAPI, protobuf, live Pact.
