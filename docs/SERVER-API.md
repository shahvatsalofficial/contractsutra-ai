# Read-only HTTP reports endpoint

Run: `CONTRACTSUTRA_TOKEN=<32-plus-character-secret> node src/cli/main.mjs serve --dir examples/reports/demo --port 8765`.

Binds only `127.0.0.1`; requires `Authorization: Bearer <token>` on every GET. Paths: `/v1/health`, `/v1/report`, `/v1/consumers`, `/v1/cases`. All other methods 405, unrecognized paths 404, simple per-process rate cap 100 requests/min/IP, static file 2 MiB max. No report mutation. Not intended for public internet, enterprise SSO, production container ingress or multi-tenancy.
