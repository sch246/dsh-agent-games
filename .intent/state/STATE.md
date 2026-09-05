# DSH Agent Games

Status: draft product map for independent Agent Games retained while `super-injector` retires. The quick Who Is the Undercover prompt is user-selected; additional game prompts are user-authorized. Earlier records report an installed alpha.2 candidate; its current deployment and semantic acceptance are not established here.

## Product direction

Keep reusable game instructions outside ordinary model context, let the model or user select and edit them on demand, and preserve user-authored games across Harness migrations. Agent Games owns the game catalog and management experience, not the rooms or runtime state a selected game may use.

## Required capabilities and verification

- The plugin can be installed and removed through ordinary profile composition without `super-injector`.
- The shipped catalog contains exactly one Who Is the Undercover entry: `undercover`, displayed as `谁是卧底`. Its complete [undercover.md](../../games/undercover.md) prompt is the user-selected optimized quick mode; preserve the full instructions, not only a rules summary. Historical `undercover-notool` content is not restored as a second game.
- Additional user-requested games coexist with `undercover`. The [goofspiel](../../games/goofspiel.md) entry, displayed as `暗拍夺宝`, supplies player rules and hosting instructions for a two-player simultaneous-bid match; game adjudication remains outside the catalog plugin.
- No game prompt enters normal context merely because the plugin is installed. The model retrieves a game's complete rules only through an explicit catalog operation.
- The model-facing `agentgame_game` capability lists and reads games and can create, update or remove an entry through id, display name, dependency metadata and Markdown rules without requiring the model to edit front matter directly.
- Model operations, browser operations and settings use one live catalog authority. A change through one surface becomes visible through the others without maintaining a second browser copy.
- The Plugins settings page shows a compact Agent Games entry that opens the full game manager. The manager can choose the game directory, browse game cards, create and delete games, edit name/dependencies/Markdown rules, and switch between source and rendered preview.
- The manager compares each game's declared plugin dependencies with the deployed plugin inventory. Missing dependencies are advisory warnings: the catalog and editor continue to work.
- The user's game files, including the complete quick Who Is the Undercover prompt, survive Harness and plugin migration without silent replacement, restoration, deletion or format conversion.
- Shared-room availability may enrich a game, but its absence does not erase the game catalog. Either plugin can be installed without the other.
- Retiring `super-injector` does not remove or duplicate Agent Games.

Relevant verification cold-loads the real Plugins page, opens the manager, reads the single Who Is the Undercover entry, edits and restores a disposable game through both model and browser surfaces, checks dependency warnings, and confirms normal sessions do not receive game rules before explicit selection.

## Installation and maintenance map

The recorded target is Harness alpha.2 at the revision in `STATE.json.resources`; it is compatibility evidence, not a permanent runtime requirement or proof of the present deployment. No realization lock is selected. Start here for current effects and operations; selected LOGs explain consequential choices, and any historical LOCK is optional recovery evidence.

### Sources, ownership and data

`src/index.ts` registers `agentgame_game` and the `agent-games` settings namespace; `src/catalog.ts` serializes CRUD and directory switching over `src/store.ts`. `src/rpc.ts` and `src/client/` connect the same catalog to the browser. `gamesDir` is an absolute path, defaults to this package’s `games/`, and may be changed through live Host settings. The package has no Host patch. `package.json` declares the Bundle, browser injections and `./client` export.

The [manifest](../../package.json), [Bundle patch](../../cordis.patch.yml) and [build script](../../scripts/build.sh) own the current executable paths. Read the selected Harness checkout’s `apps/cli/reference/README.md` for profile composition and `docs/development.md` for its build prerequisites. Build against the same checkout that will run the profile, with its dependencies and required peer artifacts ready. Build scripts create local dependency links and `lib/`; these are replaceable outputs, unlike runtime data.

### Build, compose and remove

Set absolute paths and the intended profile; run the build from this plugin checkout. The commands describe installation operations, not actions performed by this document update.

```bash
export DSH_CHECKOUT=/absolute/path/to/deepseek-harness
export DSH_HOME=/absolute/path/to/dsh-home
PROFILE=web
PLUGIN=/absolute/path/to/dsh-agent-games
cd "$PLUGIN"
DSH_CHECKOUT="$DSH_CHECKOUT" bash scripts/build.sh
cd "$DSH_CHECKOUT"
pnpm dsh plugin --profile "$PROFILE" add "$PLUGIN"
pnpm dsh plugin --profile "$PROFILE" why @dsh-external/dsh-agent-games
pnpm dsh --profile "$PROFILE" --dump-config
```

For a requested removal, use the same environment and run from the Harness checkout:

```bash
pnpm dsh plugin --profile "$PROFILE" remove @dsh-external/dsh-agent-games
```

`dsh plugin` maintains the profile dependency, pnpm lockfile, installed resolution and `dsh.profile.bundles` together. After add/update/remove, inspect all four under `$DSH_HOME/profiles/$PROFILE` and the composed config: exactly one `dsh-agent-games` row when installed, none when removed. Later profile/home patches replace a row’s complete config, so preserve existing overrides. A running profile retains its startup Bundle set; activation needs an authorized restart, then a fresh-session check for duplicate tool owners, including residual `super-injector` entries. For first install or changed composition, validate a candidate with the target package set in a private Home before changing a managed profile.

### Upgrade and verification

After a Harness upgrade, inspect settings persistence, management RPC/connection, Plugins settings extension and browser injection APIs before adapting their consumers. Build Host before Client through the owned script. Keep model and browser on the same catalog and keep dependency hints advisory. If a required native extension is missing, a Host patch may supply it with marked ownership and drift-aware removal; use upstream support and retire the patch when available.

Run `DSH_CHECKOUT="$DSH_CHECKOUT" npm test` from this repository for both builds and owner-local tests. Then exercise the real model/browser acceptance above, including cross-surface edits, a directory switch, invalid or missing game ids, missing optional dependencies and a cold browser load with one client entry and no relevant error. Parsing Markdown or downloading `lib/client.js` does not prove gameplay or model-context admission.

Keep the configured game directory, including uncommitted files, and Host settings/session data. Removing Agent Games must not remove shared-room or spawn-agent. Verify the tool and manager disappear after activation while those independent capabilities remain. Never restore `undercover-notool.md` during cleanup.

## Conditional avoidance

- A migration must not infer that a deleted historical game was lost and restore it. The single quick `undercover` entry is intentional.
- Changing the configured directory must not split model and browser operations across different catalogs.
- Dependency metadata must not become a runtime load dependency or block editing when another plugin is absent.
- UI convenience must not require loading every prompt into model context.

## Target-dependent commitments

- When the Host exposes an official Plugins settings extension, Agent Games contributes its compact entry and manager there. A Host without that concept does not need a recreated imitation of the old Plugins page; the confirmed catalog-management capability uses the target's applicable native surface.
- When the deployment exposes a plugin inventory, the manager shows dependency status from it. A target without an inventory concept does not gain a package-owned scanner merely to reproduce those badges; dependency metadata remains editable and advisory.
- When Markdown files remain the deployment's game-resource format, maintenance preserves their content and metadata without conversion. A target using another user-editable resource mechanism must preserve the confirmed catalog and user content, not the old serialization for its own sake.

Exact spacing and component choice are not yet locked behavior. A later user correction can make a concrete presentation detail part of STATE.

## Non-goals

- Owning rooms, players, messages, models, roles, or game adjudication.
- Loading every game prompt into every conversation.
- Preserving the injector-based loading mechanism.
