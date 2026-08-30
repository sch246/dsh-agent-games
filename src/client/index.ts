/** Browser contribution for the official Plugins configuration page. */

import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client'
import { AgentGamesCard, type AgentGamesCardInjected, type AgentGamesSettings } from './AgentGamesCard.js'
import { createAgentGamesClient } from './api.js'
import { en, zh, type AgentGamesLocaleKey } from './locales.js'
import { installStyles } from './styles.js'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'settings.agentGames': AgentGamesLocaleKey
  }
}

export const NS = 'settings.agentGames'
export const SETTINGS_NS = 'agent-games'
export const inject = ['slots', 'locale', 'remote', 'remote.pluginInventory', 'settingsScope', 'connection']

function decodeSettings(section: unknown): AgentGamesSettings | undefined {
  if (section === null || typeof section !== 'object' || Array.isArray(section)) return undefined
  const gamesDir = (section as Record<string, unknown>).gamesDir
  return typeof gamesDir === 'string' ? { gamesDir } : undefined
}

/** Register exactly one keyed plugin card backed by the generic Connection RPC. */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => installStyles(), 'dsh-agent-games: browser styles')
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-agent-games: dictionaries')
  const connection = ctx.get('connection') as ConnectionHandle
  const games = createAgentGamesClient(connection.rpc)
  const settings = ctx.settingsScope.bind<AgentGamesSettings>({
    namespace: SETTINGS_NS,
    decode: decodeSettings,
  })

  const unwrap = <T,>(result: { ok: true; value: T } | { ok: false; error: { code: string; message: string } }, operation: string): T => {
    if (!result.ok) throw new Error(`${operation} failed: ${result.error.code}: ${result.error.message}`)
    return result.value
  }
  const injected = (): AgentGamesCardInjected => ({
    settings,
    list: games.list,
    get: games.get,
    create: games.create,
    update: games.update,
    remove: games.remove,
    inventory: async () => unwrap(await ctx.remote.pluginInventory.list(), 'pluginInventory.list'),
  })

  ctx.slots.inject('settings.plugin.item', () => ctx.slots.register({
    name: 'settings.plugin.item',
    key: SETTINGS_NS,
    locale: NS,
    inject: injected,
  }, AgentGamesCard))
}

export type { AgentGamesCardInjected, AgentGamesCardProps, AgentGamesSettings } from './AgentGamesCard.js'
export type { AgentGamesLocaleKey } from './locales.js'
