/** JSON views shared by the game catalog tool, management RPC, and browser card. */

export interface GameDefinition {
  id: string
  name: string
  requires: string[]
  rules: string
}

export interface GameSummary {
  id: string
  name: string
  requires: string[]
}

export interface GameListResult {
  games: GameSummary[]
}

export interface CreateGameRequest {
  id: string
  name: string
  rules: string
  requires?: string[]
}

export interface UpdateGameRequest {
  id: string
  name?: string
  rules?: string
  requires?: string[]
}

export interface RemoveGameResult {
  removed: string
}
