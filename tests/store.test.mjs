import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { AgentGameStore, parseGameMarkdown } from '../lib/types/store.js'

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'agentgame-'))
  const gamesDir = join(root, 'games')
  return {
    root,
    gamesDir,
    store: new AgentGameStore(gamesDir),
    async cleanup() {
      await rm(root, { recursive: true, force: true })
    },
  }
}

test('game CRUD edits Markdown through simple fields', async () => {
  const value = await fixture()
  try {
    const created = await value.store.createGame({
      id: 'undercover',
      name: '谁是卧底',
      rules: '# 谁是卧底\n\n轮流描述，然后投票。',
      requires: ['shared-room'],
    })
    assert.equal(created.name, '谁是卧底')
    assert.deepEqual((await value.store.listGames()).map(game => game.id), ['undercover'])

    const updated = await value.store.updateGame({ id: 'undercover', rules: '# 新规则\n\n自由发挥。', requires: [] })
    assert.equal(updated.name, '谁是卧底')
    assert.equal(updated.rules, '# 新规则\n\n自由发挥。\n')
    assert.deepEqual(updated.requires, [])

    const path = join(value.gamesDir, 'undercover.md')
    assert.equal(parseGameMarkdown('undercover', await readFile(path, 'utf8')).rules, updated.rules)
    assert.equal((await stat(value.gamesDir)).mode & 0o777, 0o700)
    assert.equal((await stat(path)).mode & 0o777, 0o600)

    await assert.rejects(
      value.store.createGame({ id: 'undercover', name: 'duplicate', rules: 'duplicate' }),
      /already exists/,
    )
    await assert.rejects(value.store.updateGame({ id: 'undercover' }), /at least one/)
    await value.store.removeGame('undercover')
    await assert.rejects(value.store.getGame('undercover'), /not found/)
  } finally {
    await value.cleanup()
  }
})

test('malformed game Markdown fails without being overwritten', async () => {
  const value = await fixture()
  try {
    await value.store.createGame({ id: 'broken', name: 'Broken', rules: 'initial' })
    const path = join(value.gamesDir, 'broken.md')
    await writeFile(path, 'not front matter', 'utf8')
    await assert.rejects(value.store.getGame('broken'), /must start with JSON front matter/)
    await assert.rejects(value.store.updateGame({ id: 'broken', rules: 'replacement' }), /must start with JSON front matter/)
    assert.equal(await readFile(path, 'utf8'), 'not front matter')

    const bundled = parseGameMarkdown(
      'undercover',
      await readFile(new URL('../games/undercover.md', import.meta.url), 'utf8'),
      'games/undercover.md',
    )
    assert.equal(bundled.name, '谁是卧底')
  } finally {
    await value.cleanup()
  }
})
