# Local read-only MCP stdio — experimental

Start from repository root: `node src/cli/main.mjs mcp --root .`. Protocol: legacy `2025-11-25` JSON-RPC newline stdio, with `initialize`, `ping`, `tools/list`, and `tools/call` for `contractsutra_compare` and `contractsutra_cases`. All paths are resolved through `realpath` and are confined to `--root`. Tool calls perform local analysis, write nothing, and never fetch a URL.

**Protocol limitations:** official MCP changed in July 2026; this compatibility server is not a complete 2026 lifecycle implementation and has not been activated in external IDE hosts. It needs host-specific protocol negotiation, permissions, official SDK compliance testing and independent hardening before claiming a published MCP connector.
