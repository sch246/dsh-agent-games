/** Typed browser facade for the Agent Games generic RPC channel. */

import type { ClientConnectionRpc } from '@deepseek-ai/dsh-client-connection/client'
import type {
  CreateGameRequest, GameDefinition, GameListResult, GameSummary, UpdateGameRequest,
} from '@dsh-external/dsh-agent-games/types'

export const AGENT_GAMES_RPC_CHANNEL = '/agent-games'

function objectOf(value: unknown, subject: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${subject} is not a JSON object`)
  }
  return value as Record<string, unknown>
}

function stringOf(value: unknown, subject: string): string {
  if (typeof value !== 'string') throw new Error(`${subject} is not a string`)
  return value
}

function stringsOf(value: unknown, subject: string): string[] {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
    throw new Error(`${subject} is not an array of strings`)
  }
  return value as string[]
}

function gameSummaryOf(value: unknown): GameSummary {
  const game = objectOf(value, 'game summary')
  return {
    id: stringOf(game.id, 'game id'),
    name: stringOf(game.name, 'game name'),
    requires: stringsOf(game.requires, 'game dependencies'),
  }
}

function gameOf(value: unknown): GameDefinition {
  const game = objectOf(value, 'game')
  return { ...gameSummaryOf(game), rules: stringOf(game.rules, 'game Markdown') }
}

async function call(rpc: ClientConnectionRpc, endpoint: string, payload: unknown): Promise<unknown> {
  const result = await rpc.call(AGENT_GAMES_RPC_CHANNEL, endpoint, payload)
  if (!result.ok) throw new Error(`${endpoint} failed: ${result.error.code}: ${result.error.message}`)
  return result.value
}

/** Create the five catalog operations consumed by the settings card. */
export function createAgentGamesClient(rpc: ClientConnectionRpc) {
  return {
    async list(): Promise<GameListResult> {
      const value = objectOf(await call(rpc, 'list', {}), 'game list')
      if (!Array.isArray(value.games)) throw new Error('game list entries are not an array')
      return { games: value.games.map(gameSummaryOf) }
    },
    async get(id: string): Promise<GameDefinition> {
      return gameOf(await call(rpc, 'get', { id }))
    },
    async create(request: CreateGameRequest): Promise<GameDefinition> {
      return gameOf(await call(rpc, 'create', request))
    },
    async update(request: UpdateGameRequest): Promise<GameDefinition> {
      return gameOf(await call(rpc, 'update', request))
    },
    async remove(id: string): Promise<void> {
      const value = objectOf(await call(rpc, 'remove', { id }), 'remove result')
      stringOf(value.removed, 'removed game id')
    },
  }
}
