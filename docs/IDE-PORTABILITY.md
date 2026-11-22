# IDE portability truth table

The nine `adapters/ide/` directories provide manually reviewable instruction packs for Claude Code, Cursor, Codex, Gemini CLI, GitHub Copilot, Windsurf, Cline, Roo Code and Continue. CLI `install-ide` copies a pack under the target's `.contractsutra/ide-packs/<host>` directory, **not** directly into host-native paths. This avoids modifying an IDE's config without explicit approval. Read the pack and manually place/activate files if that IDE and version support them.

| Host | Pack | Real native execution tested |
| --- | --- | --- |
| Claude | `adapters/ide/claude/.claude/CLAUDE.md` | NOT_RUN |
| Cursor | `adapters/ide/cursor/.cursor/rules/contractsutra.mdc` | NOT_RUN |
| Codex | `adapters/ide/codex/AGENTS.md` | NOT_RUN |
| Gemini | `adapters/ide/gemini/GEMINI.md` | NOT_RUN |
| Copilot | `adapters/ide/copilot/.github/copilot-instructions.md` | NOT_RUN |
| Windsurf | `adapters/ide/windsurf/.windsurf/rules/contractsutra.md` | NOT_RUN |
| Cline | `adapters/ide/cline/.clinerules/contractsutra.md` | NOT_RUN |
| Roo | `adapters/ide/roo/.roo/rules/contractsutra.md` | NOT_RUN |
| Continue | `adapters/ide/continue/.continue/rules/contractsutra.md` | NOT_RUN |

**Claude:** project-level `.claude/agents/` role definitions exist; activation in a live Claude Code process has not been verified.

**MCP:** an experimental legacy-compatible (`2025-11-25`) stdio server is implemented with read-only tools and root path confinement. It has a local mock protocol test, **not** a validated cross-host certification or support for the July 2026 protocol. Confirm current host expectations first.
