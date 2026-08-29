import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { AgentGameCatalog } from '../lib/types/catalog.js'
import { createAgentGameTool } from '../lib/index.js'

test('the model tool performs self-contained game CRUD', async () => {
  const root = await mkdtemp(join(tmpdir(), 'agentgame-tools-'))
  try {
    const tool = createAgentGameTool(new AgentGameCatalog(join(root, 'games')))
    assert.equal(tool.name, 'agentgame_game')
    await tool.execute({ action: 'create', gameId: 'demo', name: 'Demo', rules: '# Demo\n\nTake turns.' }, {})
    const game = JSON.parse(await tool.execute({ action: 'get', gameId: 'demo' }, {}))
    assert.equal(game.name, 'Demo')
    assert.match(game.rules, /Take turns/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
