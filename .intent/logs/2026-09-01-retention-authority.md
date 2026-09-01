# Independent Agent Games retention

Date: 2026-09-01

## Authority

During the Harness alpha.2 migration, the user explicitly required retaining `agent-games` and preserving its Who Is the Undercover prompt. The user also required retaining `shared-room` as a separately composable capability that games may use. Agent Games must survive retirement of `super-injector` and must be installed through ordinary profile composition.

## Checked content boundary

The current worktree modifies `games/undercover.md` and deletes `games/undercover-notool.md`. Both historical prompts remain recoverable from Git commit `f98ef75c681be2ef99cf05cbe02c6aa92e8b27cd`. The migration must not overwrite, restore, commit, or otherwise choose between these user changes until the user confirms whether the catalog should retain one or both variants.

The user confirmed the game capability and prompt retention, not every current management UI behavior, Markdown metadata field, directory default, or visual detail. Those details remain realization evidence until separately confirmed.
