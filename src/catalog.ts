/** One mutable catalog authority shared by model tools, settings, and browser management. */

import { resolve } from 'node:path'
import { AgentGameStore } from './store.js'
import type { CreateGameRequest, GameDefinition, UpdateGameRequest } from './types.js'

/** Serializes directory switches with CRUD so a committed setting has one unambiguous cutover. */
export class AgentGameCatalog {
  private requestedGamesDir: string
  private store: AgentGameStore
  private tail: Promise<void> = Promise.resolve()

  constructor(gamesDir: string) {
    this.requestedGamesDir = resolve(gamesDir)
    this.store = new AgentGameStore(this.requestedGamesDir)
  }

  /** Queue a live directory cutover after earlier operations and before later ones. */
  useGamesDir(gamesDir: string): void {
    const next = resolve(gamesDir)
    if (next === this.requestedGamesDir) return
    this.requestedGamesDir = next
    const task = this.tail.then(() => {
      this.store = new AgentGameStore(next)
    })
    this.tail = task.catch(() => undefined)
  }

  private async run<T>(operation: (store: AgentGameStore) => Promise<T>): Promise<T> {
    const task = this.tail.then(() => operation(this.store))
    this.tail = task.then(() => undefined, () => undefined)
    return await task
  }

  async list(): Promise<GameDefinition[]> {
    return await this.run(store => store.listGames())
  }

  async get(id: string): Promise<GameDefinition> {
    return await this.run(store => store.getGame(id))
  }

  async create(request: CreateGameRequest): Promise<GameDefinition> {
    return await this.run(store => store.createGame(request))
  }

  async update(request: UpdateGameRequest): Promise<GameDefinition> {
    return await this.run(store => store.updateGame(request))
  }

  async remove(id: string): Promise<void> {
    await this.run(store => store.removeGame(id))
  }
}
