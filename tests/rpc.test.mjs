import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createAgentGameTool } from '../lib/index.js'
import { AgentGameCatalog } from '../lib/types/catalog.js'
import { createAgentGamesRpcHandler } from '../lib/types/rpc.js'

test('model tool and browser RPC share one live catalog', async () => {
  const root = await mkdtemp(join(tmpdir(), 'agentgame-rpc-'))
  try {
    const catalog = new AgentGameCatalog(join(root, 'games'))
    const tool = createAgentGameTool(catalog)
    const rpc = createAgentGamesRpcHandler(catalog)

    await tool.execute({ action: 'create', gameId: 'demo', name: 'Demo', rules: '# Demo' }, {})
    const listed = await rpc('list', {}, AbortSignal.abort())
    assert.equal(listed.ok, true)
    assert.deepEqual(listed.value.games.map(game => game.id), ['demo'])

    const updated = await rpc('update', { id: 'demo', name: 'Renamed' }, AbortSignal.abort())
    assert.equal(updated.ok, true)
    const fromTool = JSON.parse(await tool.execute({ action: 'get', gameId: 'demo' }, {}))
    assert.equal(fromTool.name, 'Renamed')

    const removed = await rpc('remove', { id: 'demo' }, AbortSignal.abort())
    assert.deepEqual(removed, { ok: true, value: { removed: 'demo' } })
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('browser RPC rejects malformed requests as business errors', async () => {
  const root = await mkdtemp(join(tmpdir(), 'agentgame-rpc-invalid-'))
  try {
    const rpc = createAgentGamesRpcHandler(new AgentGameCatalog(join(root, 'games')))
    const malformed = await rpc('create', { id: 3 }, AbortSignal.abort())
    assert.equal(malformed.ok, false)
    assert.match(malformed.error.message, /id must be a string/)

    const unknown = await rpc('mystery', {}, AbortSignal.abort())
    assert.equal(unknown.ok, false)
    assert.match(unknown.error.message, /unknown agent-games endpoint/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('rapid directory changes settle on the last requested catalog', async () => {
  const root = await mkdtemp(join(tmpdir(), 'agentgame-directory-'))
  try {
    const first = join(root, 'first')
    const second = join(root, 'second')
    const catalog = new AgentGameCatalog(first)
    catalog.useGamesDir(second)
    catalog.useGamesDir(first)
    await catalog.create({ id: 'final', name: 'Final', rules: '# Final' })

    const firstCatalog = new AgentGameCatalog(first)
    assert.deepEqual((await firstCatalog.list()).map(game => game.id), ['final'])
    const secondCatalog = new AgentGameCatalog(second)
    assert.deepEqual(await secondCatalog.list(), [])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
