# DSH Agent Games

Status: draft product map for independent Agent Games retained while `super-injector` retires. The current single quick Who Is the Undercover prompt is user-selected. The alpha.2 candidate is installed but not yet accepted through a realization lock.

## Product direction

Keep reusable game instructions outside ordinary model context, let the model or user select and edit them on demand, and preserve user-authored games across Harness migrations. Agent Games owns the game catalog and management experience, not the rooms or runtime state a selected game may use.

## Required capabilities and verification

- The plugin can be installed and removed through ordinary profile composition without `super-injector`.
- The shipped catalog contains exactly one Who Is the Undercover entry: `undercover`, displayed as `谁是卧底`. It is the user's current optimized quick mode. Historical `undercover-notool` content is not restored as a second game.
- No game prompt enters normal context merely because the plugin is installed. The model retrieves a game's complete rules only through an explicit catalog operation.
- The model-facing `agentgame_game` capability lists and reads games and can create, update or remove an entry through id, display name, dependency metadata and Markdown rules without requiring the model to edit front matter directly.
- Model operations, browser operations and settings use one live catalog authority. A change through one surface becomes visible through the others without maintaining a second browser copy.
- The Plugins settings page shows a compact Agent Games entry that opens the full game manager. The manager can choose the game directory, browse game cards, create and delete games, edit name/dependencies/Markdown rules, and switch between source and rendered preview.
- The manager compares each game's declared plugin dependencies with the deployed plugin inventory. Missing dependencies are advisory warnings: the catalog and editor continue to work.
- The user's game files, including the complete quick Who Is the Undercover prompt, survive Harness and plugin migration without silent replacement, restoration, deletion or format conversion.
- Shared-room availability may enrich a game, but its absence does not erase the game catalog. Either plugin can be installed without the other.
- Retiring `super-injector` does not remove or duplicate Agent Games.

Relevant verification cold-loads the real Plugins page, opens the manager, reads the single Who Is the Undercover entry, edits and restores a disposable game through both model and browser surfaces, checks dependency warnings, and confirms normal sessions do not receive game rules before explicit selection.

## Current alpha.2 realization map

- Preserve the user-owned `games/` worktree before any build or profile operation. The current source of truth contains `undercover.md` only; historical files are not installation inputs.
- Build both Host and browser faces against the selected Harness source checkout. The published package must include the Host entry, `lib/client.js`, game files and its Bundle patch.
- Install the package checkout through `dsh plugin --profile <name> add <checkout>`. Require profile dependency and Bundle membership, restart after membership changes, then confirm exactly one Agent Games Host row and browser boot entry.
- The configured game directory determines the live content. Compare it with the intended source directory before claiming that the quick prompt was installed.
- Perform the real model, browser and context-admission observations above before accepting a realization. A client bundle that downloads successfully is not semantic acceptance.

## Conditional avoidance

- A migration must not infer that a deleted historical game was lost and restore it. The single quick `undercover` entry is intentional.
- Changing the configured directory must not split model and browser operations across different catalogs.
- Dependency metadata must not become a runtime load dependency or block editing when another plugin is absent.
- UI convenience must not require loading every prompt into model context.

## Conditional decisions

- If a target cannot host the manager inside the official Plugins settings page, preserve the compact entry and full editing workflow in a package-owned surface and ask before accepting a visibly different navigation model.
- Exact spacing, component choice and file serialization may change with the Host, provided the confirmed workflow and existing user files remain intact. A later user correction can lock a concrete presentation detail into STATE.

## Non-goals

- Owning rooms, players, messages, models, roles, or game adjudication.
- Loading every game prompt into every conversation.
- Preserving the injector-based loading mechanism.
