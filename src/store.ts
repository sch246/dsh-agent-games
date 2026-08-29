/** Markdown game-prompt catalog. */

import { access, mkdir, readFile, readdir, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { withFileLock, writeFileAtomic } from '@deepseek-ai/dsh-atomic-write'
import type { GameDefinition } from './types.js'

export type { GameDefinition } from './types.js'

const GAME_HEADER = /^---\n([\s\S]*?)\n---\n([\s\S]+)$/u
const SAFE_ID = /^[a-zA-Z0-9_-]{1,96}$/u

function sanitizeId(value: string, subject: string): string {
  const id = value.trim()
  if (!SAFE_ID.test(id)) throw new Error(`${subject} may only contain letters, digits, "_" and "-" (1..96 chars)`)
  return id
}

function objectOf(value: unknown, subject: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${subject} must be a JSON object`)
  return value as Record<string, unknown>
}

function stringOf(value: unknown, subject: string): string {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${subject} must be a non-empty string`)
  return value
}

function stringArrayOf(value: unknown, subject: string): string[] {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || item.trim() === '')) {
    throw new Error(`${subject} must be an array of non-empty strings`)
  }
  return value.map(item => (item as string).trim())
}

function isEnoent(error: unknown): boolean {
  return (error as NodeJS.ErrnoException | null)?.code === 'ENOENT'
}

function renderGame(game: Omit<GameDefinition, 'id'>): string {
  return `---\n${JSON.stringify({ name: game.name, requires: game.requires })}\n---\n${game.rules.trim()}\n`
}

/** Parse one game guide. Extra front-matter fields are ignored. */
export function parseGameMarkdown(idInput: string, markdownInput: string, filename = '<memory>'): GameDefinition {
  const id = sanitizeId(idInput, 'game id')
  const markdown = markdownInput.endsWith('\n') ? markdownInput : `${markdownInput}\n`
  const match = GAME_HEADER.exec(markdown)
  if (match === null) throw new Error(`game ${filename} must start with JSON front matter between --- lines`)
  let metadataValue: unknown
  try {
    metadataValue = JSON.parse(match[1]!)
  } catch (error) {
    throw new Error(`game metadata in ${filename} is invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
  }
  const metadata = objectOf(metadataValue, `game metadata in ${filename}`)
  const rules = match[2]!.trim()
  if (rules === '') throw new Error(`game ${filename} has no rules`)
  return {
    id,
    name: stringOf(metadata.name, `game metadata in ${filename} name`).trim(),
    requires: stringArrayOf(metadata.requires, `game metadata in ${filename} requires`),
    rules: `${rules}\n`,
  }
}

/** Filesystem implementation for game prompt CRUD. */
export class AgentGameStore {
  private readonly gamesDir: string
  private readonly queues = new Map<string, Promise<void>>()

  constructor(gamesDir: string) {
    this.gamesDir = resolve(gamesDir)
  }

  private gamePath(id: string): string {
    return join(this.gamesDir, `${sanitizeId(id, 'game id')}.md`)
  }

  private async enqueue<T>(id: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(id) ?? Promise.resolve()
    const task = previous.catch(() => undefined).then(operation)
    const tail = task.then(() => undefined, () => undefined)
    this.queues.set(id, tail)
    try {
      return await task
    } finally {
      if (this.queues.get(id) === tail) this.queues.delete(id)
    }
  }

  async listGames(): Promise<GameDefinition[]> {
    await mkdir(this.gamesDir, { recursive: true, mode: 0o700 })
    const entries = (await readdir(this.gamesDir, { withFileTypes: true }))
      .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
      .sort((left, right) => left.name.localeCompare(right.name))
    return await Promise.all(entries.map(async entry => {
      const id = entry.name.slice(0, -3)
      const path = join(this.gamesDir, entry.name)
      return parseGameMarkdown(id, await readFile(path, 'utf8'), path)
    }))
  }

  async getGame(id: string): Promise<GameDefinition> {
    const path = this.gamePath(id)
    try {
      return parseGameMarkdown(id, await readFile(path, 'utf8'), path)
    } catch (error) {
      if (isEnoent(error)) throw new Error(`game "${id}" not found`)
      throw error
    }
  }

  async createGame(input: { id: string; name: string; rules: string; requires?: string[] }): Promise<GameDefinition> {
    const id = sanitizeId(input.id, 'game id')
    const path = this.gamePath(id)
    const game: GameDefinition = {
      id,
      name: stringOf(input.name, 'name').trim(),
      requires: stringArrayOf(input.requires, 'requires'),
      rules: `${stringOf(input.rules, 'rules').trim()}\n`,
    }
    await mkdir(this.gamesDir, { recursive: true, mode: 0o700 })
    return await this.enqueue(id, () => withFileLock(path, async () => {
      try {
        await access(path)
        throw new Error(`game "${id}" already exists`)
      } catch (error) {
        if (!isEnoent(error)) throw error
      }
      await writeFileAtomic(path, renderGame(game), { mode: 0o600, dirMode: 0o700 })
      return game
    }))
  }

  async updateGame(input: { id: string; name?: string; rules?: string; requires?: string[] }): Promise<GameDefinition> {
    const id = sanitizeId(input.id, 'game id')
    if (input.name === undefined && input.rules === undefined && input.requires === undefined) {
      throw new Error('update requires at least one of name, rules, or requires')
    }
    const path = this.gamePath(id)
    await mkdir(this.gamesDir, { recursive: true, mode: 0o700 })
    return await this.enqueue(id, () => withFileLock(path, async () => {
      const current = await this.getGame(id)
      const game: GameDefinition = {
        id,
        name: input.name === undefined ? current.name : stringOf(input.name, 'name').trim(),
        requires: input.requires === undefined ? current.requires : stringArrayOf(input.requires, 'requires'),
        rules: input.rules === undefined ? current.rules : `${stringOf(input.rules, 'rules').trim()}\n`,
      }
      await writeFileAtomic(path, renderGame(game), { mode: 0o600, dirMode: 0o700 })
      return game
    }))
  }

  async removeGame(idInput: string): Promise<void> {
    const id = sanitizeId(idInput, 'game id')
    const path = this.gamePath(id)
    await this.enqueue(id, () => withFileLock(path, async () => {
      try {
        await rm(path)
      } catch (error) {
        if (isEnoent(error)) throw new Error(`game "${id}" not found`)
        throw error
      }
    }))
  }
}
