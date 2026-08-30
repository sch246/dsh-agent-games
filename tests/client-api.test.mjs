import assert from 'node:assert/strict'
import test from 'node:test'
import { AGENT_GAMES_RPC_CHANNEL, createAgentGamesClient } from '../lib/types/client/api.js'
import { hasGamesDirOverride } from '../lib/types/client/settings.js'

test('games directory reset follows user-layer presence', () => {
  assert.equal(hasGamesDirOverride(undefined), false)
  assert.equal(hasGamesDirOverride({}), false)
  assert.equal(hasGamesDirOverride({ gamesDir: '/same-as-base' }), true)
})

test('browser client maps card operations to the generic RPC channel', async () => {
  const calls = []
  const rpc = {
    async call(channel, endpoint, payload) {
      calls.push({ channel, endpoint, payload })
      if (endpoint === 'list') {
        return { ok: true, value: { games: [{ id: 'demo', name: 'Demo', requires: ['room'] }] } }
      }
      if (endpoint === 'remove') return { ok: true, value: { removed: payload.id } }
      return { ok: true, value: { id: payload.id, name: 'Demo', requires: [], rules: '# Demo\n' } }
    },
  }
  const client = createAgentGamesClient(rpc)

  assert.deepEqual(await client.list(), {
    games: [{ id: 'demo', name: 'Demo', requires: ['room'] }],
  })
  assert.equal((await client.get('demo')).rules, '# Demo\n')
  await client.remove('demo')
  assert.deepEqual(calls, [
    { channel: AGENT_GAMES_RPC_CHANNEL, endpoint: 'list', payload: {} },
    { channel: AGENT_GAMES_RPC_CHANNEL, endpoint: 'get', payload: { id: 'demo' } },
    { channel: AGENT_GAMES_RPC_CHANNEL, endpoint: 'remove', payload: { id: 'demo' } },
  ])
})

test('browser client rejects RPC failures and malformed response values', async () => {
  const failed = createAgentGamesClient({
    async call() {
      return { ok: false, error: { code: 'internal', message: 'disk unavailable', details: {} } }
    },
  })
  await assert.rejects(failed.list(), /disk unavailable/)

  const malformed = createAgentGamesClient({
    async call() { return { ok: true, value: { games: [{ id: 'demo' }] } } },
  })
  await assert.rejects(malformed.list(), /game name is not a string/)
})
