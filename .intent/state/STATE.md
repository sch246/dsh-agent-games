# DSH Agent Games

Status: draft independent capability selected for retention while `super-injector` retires. The exact retained Who Is the Undercover variant is awaiting user confirmation. No realization lock is accepted.

## Intent

Keep reusable agent-game prompts outside normal model context and expose them only when a game is selected. The capability is independently installed and includes a user-maintained Who Is the Undercover prompt. It may compose with the separately installed `shared-room` capability without making either plugin's lifecycle depend on the other.

## Acceptance

- The plugin can be installed and removed through ordinary profile composition without `super-injector`.
- A model can discover and retrieve the game catalog on demand, including Who Is the Undercover.
- The user's current game files survive Harness and plugin migration without silent replacement, restoration, deletion, or format conversion.
- Shared-room availability may enrich a game, but its absence does not erase the game catalog.
- Retiring `super-injector` does not remove or duplicate Agent Games.

## Constraints and decisions

- `games/undercover.md` is currently modified and `games/undercover-notool.md` is currently deleted in the user worktree. Migration preserves that state until the user chooses whether one or both variants belong in the retained catalog.
- The exact management UI, Markdown metadata, CRUD vocabulary, game directory default, and visual design are not yet user-locked behavior.
- Builds and structural checks are implementation evidence. User observation on the real profile decides semantic acceptance.

## Non-goals

- Owning rooms, players, messages, models, roles, or game adjudication.
- Loading every game prompt into every conversation.
- Preserving the injector-based loading mechanism.
