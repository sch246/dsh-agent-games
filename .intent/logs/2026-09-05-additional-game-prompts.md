# Additional game prompts

Date: 2026-09-05

## Authority

The user authorized adding new Markdown games by referring to the existing game, and writing dependency plugins if needed, while discussing a match between Codex and fable-5.1. This extends the catalog beyond Who Is the Undercover; it does not authorize restoring the removed historical Undercover variant.

## Investigated scope

The catalog reads Markdown entries from its configured directory on each operation. The existing `dsh-spawn-agent` plugin provides model-selected, continuable player conversations. A host-run simultaneous-bid game can use those private conversations without changing the catalog implementation, profile, or browser bundle.

## Consequence

Preserve `undercover.md` and permit additional user-requested game prompts. The initial addition is `goofspiel`, displayed as `暗拍夺宝`, with complete player rules and hosting instructions. Its exact rules are an agent-authored implementation under this authorization, not a user-confirmed realization lock. Catalog parsing and rule review do not establish live deployment or completed match evidence.

This supersedes the current-catalog-only statements in STATE. The 2026-09-01 decision to retain exactly one quick Who Is the Undercover variant remains in force.
