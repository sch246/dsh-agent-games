/** On-demand Markdown game catalog with one settings and browser-management authority. */

import { isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-connection'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import { defineTool } from '@deepseek-ai/dsh-tools'
import z from '@deepseek-ai/schemastery'
import { AgentGameCatalog } from './catalog.js'
import { AGENT_GAMES_RPC_CHANNEL, createAgentGamesRpcHandler } from './rpc.js'
import type { CreateGameRequest, UpdateGameRequest } from './types.js'

export const name = '@dsh-external/dsh-agent-games'
export const inject = ['tools']
export const AGENT_GAMES_NS = settingsNamespace('agent-games')

const DEFAULT_GAMES_DIR = fileURLToPath(new URL('../games/', import.meta.url))

export interface Config {
  gamesDir: string
}

export const Config: z<Config> = z.object({
  gamesDir: z.string().default(DEFAULT_GAMES_DIR),
})

interface GameArgs {
  action: 'list' | 'get' | 'create' | 'update' | 'remove'
  gameId?: string
  name?: string
  rules?: string
  requires?: string[]
}

function required(value: string | undefined, subject: string): string {
  if (value === undefined || value.trim() === '') throw new Error(`${subject} is required`)
  return value
}

function validateConfig(value: Config): void {
  if (value.gamesDir.trim() === '') throw new Error('gamesDir must be a non-empty absolute path')
  if (!isAbsolute(value.gamesDir)) throw new Error('gamesDir must be an absolute path')
}

function output(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

/** Build the model-facing tool over the shared catalog authority. */
export function createAgentGameTool(catalog: AgentGameCatalog) {
  return defineTool({
    name: 'agentgame_game',
    description: 'CRUD for Markdown game prompts kept out of normal context. list/get read games; create/update/remove edit the .md catalog through simple fields, so you never need to inspect plugin source or front matter.',
    isConcurrencySafe: () => true,
    parameters: {
      action: { type: 'string', required: true, enum: ['list', 'get', 'create', 'update', 'remove'] },
      gameId: { type: 'string', description: 'Game id; required except for list.' },
      name: { type: 'string', description: 'Display name; required for create, optional for update.' },
      rules: { type: 'string', description: 'Markdown rules/prompt; required for create, optional for update.' },
      requires: { type: 'array', items: { type: 'string' }, description: 'Related plugin names; optional metadata for create/update.' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args: unknown, value: string) => [{ type: 'text', text: value }],
    },
    async execute(args: GameArgs) {
      if (args.action === 'list') {
        return output((await catalog.list()).map(({ id, name, requires }) => ({ id, name, requires })))
      }
      const gameId = required(args.gameId, 'gameId')
      if (args.action === 'get') return output(await catalog.get(gameId))
      if (args.action === 'create') {
        const request: CreateGameRequest = {
          id: gameId,
          name: required(args.name, 'name'),
          rules: required(args.rules, 'rules'),
          ...(args.requires === undefined ? {} : { requires: args.requires }),
        }
        return output(await catalog.create(request))
      }
      if (args.action === 'update') {
        const request: UpdateGameRequest = {
          id: gameId,
          ...(args.name === undefined ? {} : { name: args.name }),
          ...(args.rules === undefined ? {} : { rules: args.rules }),
          ...(args.requires === undefined ? {} : { requires: args.requires }),
        }
        return output(await catalog.update(request))
      }
      await catalog.remove(gameId)
      return output({ removed: gameId })
    },
  })
}

/** Register the model tool, live settings namespace, and optional browser management RPC. */
export function apply(ctx: Context, config: Config): void {
  validateConfig(config)
  const catalog = new AgentGameCatalog(config.gamesDir)
  let source = () => config
  installSettingsSection(ctx, AGENT_GAMES_NS, Config, config, {
    validate: validateConfig,
    setSource: current => { source = current },
    onChange: () => { catalog.useGamesDir(source().gamesDir) },
  })
  ctx.inject(['connection'], (connectionCtx) => {
    connectionCtx.connection.rpc.handle(
      AGENT_GAMES_RPC_CHANNEL,
      createAgentGamesRpcHandler(catalog),
      { authority: 'loopback' },
    )
  })
  ctx.effect(
    () => ctx.tools.register(createAgentGameTool(catalog)),
    '@dsh-external/dsh-agent-games: agentgame_game',
  )
}
