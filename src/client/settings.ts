/** Browser settings values and user-layer interpretation for the game catalog. */

/** Schema-resolved settings section for the game catalog. */
export interface AgentGamesSettings {
  /** Absolute directory containing the Markdown game definitions. */
  gamesDir: string
}

/**
 * Report whether the user layer stores a games-directory override.
 * @param user - Raw user layer from the settings scope snapshot.
 * @returns Whether `gamesDir` is present, even when its value equals the composition default.
 */
export function hasGamesDirOverride(user: unknown): boolean {
  return user !== null && typeof user === 'object' && Object.hasOwn(user, 'gamesDir')
}
