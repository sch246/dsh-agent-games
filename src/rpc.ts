/** Browser-management RPC over the same catalog used by the model tool. */

import type { ConnectionRpcHandler } from '@deepseek-ai/dsh-client-connection'
import type { AgentGameCatalog } from './catalog.js'
import type { CreateGameRequest, UpdateGameRequest } from './types.js'

export const AGENT_GAMES_RPC_CHANNEL = '/agent-games'

function objectOf(value: unknown, subject: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${subject} must be a JSON object`)
  }
  return value as Record<string, unknown>
}

function stringOf(value: unknown, subject: string): string {
  if (typeof value !== 'string') throw new Error(`${subject} must be a string`)
  return value
}

function optionalStringArray(value: unknown, subject: string): string[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
    throw new Error(`${subject} must be an array of strings`)
  }
  return value as string[]
}

function idRequest(value: unknown): { id: string } {
  const input = objectOf(value, 'request')
  return { id: stringOf(input.id, 'id') }
}

function createRequest(value: unknown): CreateGameRequest {
  const input = objectOf(value, 'request')
  const requires = optionalStringArray(input.requires, 'requires')
  return {
    id: stringOf(input.id, 'id'),
    name: stringOf(input.name, 'name'),
    rules: stringOf(input.rules, 'rules'),
    ...(requires === undefined ? {} : { requires }),
  }
}

function updateRequest(value: unknown): UpdateGameRequest {
  const input = objectOf(value, 'request')
  const name = input.name === undefined ? undefined : stringOf(input.name, 'name')
  const rules = input.rules === undefined ? undefined : stringOf(input.rules, 'rules')
  const requires = optionalStringArray(input.requires, 'requires')
  return {
    id: stringOf(input.id, 'id'),
    ...(name === undefined ? {} : { name }),
    ...(rules === undefined ? {} : { rules }),
    ...(requires === undefined ? {} : { requires }),
  }
}

function failure(error: unknown) {
  return {
    ok: false as const,
    error: {
      code: 'internal' as const,
      message: error instanceof Error ? error.message : String(error),
      details: {},
    },
  }
}

/** Build the loopback-only game-management RPC handler. */
export function createAgentGamesRpcHandler(catalog: AgentGameCatalog): ConnectionRpcHandler {
  return async (endpoint, payload) => {
    try {
      if (endpoint === 'list') {
        objectOf(payload, 'request')
        const games = await catalog.list()
        return {
          ok: true,
          value: { games: games.map(({ id, name, requires }) => ({ id, name, requires })) },
        }
      }
      if (endpoint === 'get') {
        const { id } = idRequest(payload)
        return { ok: true, value: await catalog.get(id) }
      }
      if (endpoint === 'create') {
        return { ok: true, value: await catalog.create(createRequest(payload)) }
      }
      if (endpoint === 'update') {
        return { ok: true, value: await catalog.update(updateRequest(payload)) }
      }
      if (endpoint === 'remove') {
        const { id } = idRequest(payload)
        await catalog.remove(id)
        return { ok: true, value: { removed: id } }
      }
      throw new Error(`unknown agent-games endpoint ${JSON.stringify(endpoint)}`)
    } catch (error) {
      return failure(error)
    }
  }
}
