# Operations and release

## Release process
1. `npm test`, `npm run lint`, `npm run demo`, `npm run proof` all green locally.
2. Bump `version` in `package.json` and `VERSION` in `src/core/report.mjs`; update `CHANGELOG.md` and `CITATION.cff`.
3. Commit, tag `vX.Y.Z`, push the tag.
4. `release.yml` runs the tests, checks the tag matches `package.json`, skips if the version is already on npm, then runs `npm publish --provenance --access public` using **npm trusted publishing (OIDC)**: no stored npm token.
5. A GitHub release is created with notes from the changelog.
6. `pages.yml` rebuilds the documentation site from `documents/html` on every change to `documents/`.

## One-time npm setup
On npmjs.com open the package, Settings, Trusted Publisher, and link repository `shahvatsalofficial/contractsutra-ai`, workflow `release.yml`. The first publish of a brand-new package needs a manual `npm publish --access public` from a logged-in maintainer account.

## CI
`ci.yml` runs on Ubuntu, Windows and macOS (Node 22 and 24): lint, tests, doctor, demo, a real gate run (must exit `2`), independent audit and seal verification, an `npm pack` clean-install smoke test, and a committed-secret scan. The audit report is uploaded as an artifact.

## Running the report server
```powershell
$env:CONTRACTSUTRA_TOKEN = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
contractsutra serve --dir reports --port 8765
```
It binds to `127.0.0.1` only and is read-only.

## Rollback
npm versions are immutable; publish a fixed patch version and `npm deprecate` the bad one. Reports are plain files, so there is no migration.

## Support
GitHub issues for bugs and features; private security reports per `SECURITY.md`. No SLA.
