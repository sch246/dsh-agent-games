/** Official Plugins-settings card for the Markdown game catalog. */

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { PluginInventorySnapshot } from '@deepseek-ai/dsh-api-remotes/client'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import { MarkdownText, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {
  CreateGameRequest, GameDefinition, GameListResult, GameSummary, UpdateGameRequest,
} from '@dsh-external/dsh-agent-games/types'
import css from './styles.js'

export interface AgentGamesSettings {
  gamesDir: string
}

/** Host and settings operations injected by the Client registration. */
export interface AgentGamesCardInjected {
  settings: SettingsScope<AgentGamesSettings>
  list: () => Promise<GameListResult>
  get: (id: string) => Promise<GameDefinition>
  create: (request: CreateGameRequest) => Promise<GameDefinition>
  update: (request: UpdateGameRequest) => Promise<GameDefinition>
  remove: (id: string) => Promise<void>
  inventory: () => Promise<PluginInventorySnapshot>
}

export type AgentGamesCardProps =
  PropsRuntime<'settings.plugin.item'>
  & PropsLocale<'settings.agentGames'>
  & InjectFace<AgentGamesCardInjected>

type CatalogState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; games: GameSummary[]; inventory?: PluginInventorySnapshot }

interface EditorDraft {
  mode: 'create' | 'update'
  id: string
  name: string
  requires: string
  rules: string
}

function dependencyList(text: string): string[] {
  return [...new Set(text.split(/[\n,]/u).map(value => value.trim()).filter(Boolean))]
}

function draftFrom(game: GameDefinition): EditorDraft {
  return {
    mode: 'update',
    id: game.id,
    name: game.name,
    requires: game.requires.join('\n'),
    rules: game.rules,
  }
}

function dependencyReady(requirement: string, inventory: PluginInventorySnapshot | undefined): boolean | undefined {
  if (inventory === undefined) return undefined
  const entry = inventory.entries.find(candidate => candidate.moduleName === requirement)
  return entry !== undefined && entry.enabled && entry.fiberPhase === 'active'
}

function dependencyLabel(
  requirement: string,
  inventory: PluginInventorySnapshot | undefined,
  t: AgentGamesCardProps['t'],
): string {
  if (inventory === undefined) return requirement
  const entry = inventory.entries.find(candidate => candidate.moduleName === requirement)
  if (entry === undefined) return `${requirement} · ${t('dependencyUnavailable')}`
  if (!entry.enabled || entry.fiberPhase !== 'active') return `${requirement} · ${t('dependencyDisabled')}`
  return `${requirement} · ${t('dependencyReady')}`
}

/** Render the plugin configuration card and its expandable game-definition cards. */
export function AgentGamesCard(props: AgentGamesCardProps): ReactNode {
  const { settings, list, get, create, update, remove, inventory, t } = props
  const settingsView = useSyncExternalStore(
    listener => settings.subscribe(listener),
    () => settings.getSnapshot(),
    () => settings.getSnapshot(),
  )
  const [directoryDraft, setDirectoryDraft] = useState('')
  const [managerOpen, setManagerOpen] = useState(false)
  const [directoryStatus, setDirectoryStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [catalog, setCatalog] = useState<CatalogState>({ status: 'loading' })
  const [request, setRequest] = useState(0)
  const [openId, setOpenId] = useState<string | null>(null)
  const [editor, setEditor] = useState<EditorDraft | null>(null)
  const [editorStatus, setEditorStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>('idle')
  const [tab, setTab] = useState<'source' | 'preview'>('source')

  useEffect(() => {
    if (!managerOpen) return
    const closeTopmostDialog = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      // Settings and Modal both listen on document; one Escape belongs to the topmost dialog only.
      event.preventDefault()
      event.stopImmediatePropagation()
      setManagerOpen(false)
    }
    document.addEventListener('keydown', closeTopmostDialog, true)
    return () => { document.removeEventListener('keydown', closeTopmostDialog, true) }
  }, [managerOpen])

  useEffect(() => {
    if (settingsView.status === 'ready' && settingsView.value !== undefined) {
      setDirectoryDraft(settingsView.value.gamesDir)
    }
  }, [settingsView])

  const reload = useCallback(() => {
    setCatalog({ status: 'loading' })
    void Promise.allSettled([list(), inventory()]).then((results) => {
      const games = results[0]
      if (games.status === 'rejected') {
        setCatalog({ status: 'error' })
        return
      }
      setCatalog({
        status: 'ready',
        games: games.value.games,
        ...(results[1].status === 'fulfilled' ? { inventory: results[1].value } : {}),
      })
    })
  }, [inventory, list])

  useEffect(() => { reload() }, [reload, request])

  const activeDirectory = settingsView.status === 'ready' ? settingsView.value?.gamesDir ?? '' : ''
  const directoryDirty = directoryDraft.trim() !== activeDirectory
  const saveDirectory = (): void => {
    const value = directoryDraft.trim()
    if (value === '' || !settingsView.writable) return
    setDirectoryStatus('saving')
    void settings.set('gamesDir', value).then(
      () => {
        setDirectoryStatus('saved')
        setOpenId(null)
        setEditor(null)
        setRequest(current => current + 1)
      },
      () => { setDirectoryStatus('error') },
    )
  }
  const resetDirectory = (): void => {
    if (!settingsView.writable) return
    setDirectoryStatus('saving')
    void settings.unset('gamesDir').then(
      () => {
        setDirectoryStatus('saved')
        setOpenId(null)
        setEditor(null)
        setRequest(current => current + 1)
      },
      () => { setDirectoryStatus('error') },
    )
  }

  const openGame = (game: GameSummary): void => {
    if (openId === game.id) {
      setOpenId(null)
      setEditor(null)
      return
    }
    setOpenId(game.id)
    setEditor(null)
    setEditorStatus('loading')
    setTab('source')
    void get(game.id).then(
      value => {
        setEditor(draftFrom(value))
        setEditorStatus('idle')
      },
      () => { setEditorStatus('error') },
    )
  }

  const startCreate = (): void => {
    setOpenId('__new__')
    setEditor({ mode: 'create', id: '', name: '', requires: '', rules: '# 新游戏\n\n' })
    setEditorStatus('idle')
    setTab('source')
  }

  const saveEditor = (): void => {
    if (editor === null || editorStatus === 'saving') return
    const id = editor.id.trim()
    const name = editor.name.trim()
    if (id === '' || name === '' || editor.rules.trim() === '') {
      setEditorStatus('error')
      return
    }
    const requires = dependencyList(editor.requires)
    setEditorStatus('saving')
    const operation = editor.mode === 'create'
      ? create({ id, name, rules: editor.rules, requires })
      : update({ id, name, rules: editor.rules, requires })
    void operation.then(
      (saved) => {
        setOpenId(saved.id)
        setEditor(draftFrom(saved))
        setEditorStatus('idle')
        setRequest(current => current + 1)
      },
      () => { setEditorStatus('error') },
    )
  }

  const deleteEditor = (): void => {
    if (editor === null || editor.mode !== 'update' || !window.confirm(t('deleteConfirm'))) return
    setEditorStatus('saving')
    void remove(editor.id).then(
      () => {
        setOpenId(null)
        setEditor(null)
        setEditorStatus('idle')
        setRequest(current => current + 1)
      },
      () => { setEditorStatus('error') },
    )
  }

  const inventorySnapshot = catalog.status === 'ready' ? catalog.inventory : undefined
  const editorDependencies = useMemo(
    () => editor === null ? [] : dependencyList(editor.requires),
    [editor],
  )
  const missingEditorDependencies = editorDependencies.filter(value => dependencyReady(value, inventorySnapshot) === false)

  const renderEditor = (): ReactNode => {
    if (editorStatus === 'loading') return <p className={css.status}>{t('loading')}</p>
    if (editor === null) return editorStatus === 'error' ? <p className={css.error}>{t('loadError')}</p> : null
    return (
      <div className={css.editor}>
        <div className={css.editorHeader}>
          <h4>{editor.mode === 'create' ? t('newGame') : editor.name}</h4>
          <div className={css.tabs} role="tablist" aria-label={t('markdown')}>
            <button type="button" role="tab" aria-selected={tab === 'source'} onClick={() => { setTab('source') }}>{t('source')}</button>
            <button type="button" role="tab" aria-selected={tab === 'preview'} onClick={() => { setTab('preview') }}>{t('preview')}</button>
          </div>
        </div>
        <div className={css.fieldGrid}>
          <label className={css.field}>
            <span>{t('id')}</span>
            <input value={editor.id} disabled={editor.mode === 'update'} onChange={event => { setEditor({ ...editor, id: event.currentTarget.value }); setEditorStatus('idle') }} />
          </label>
          <label className={css.field}>
            <span>{t('name')}</span>
            <input value={editor.name} onChange={event => { setEditor({ ...editor, name: event.currentTarget.value }); setEditorStatus('idle') }} />
          </label>
        </div>
        <label className={css.field}>
          <span>{t('dependencies')}</span>
          <textarea rows={3} value={editor.requires} onChange={event => { setEditor({ ...editor, requires: event.currentTarget.value }); setEditorStatus('idle') }} />
          <span className={css.hint}>{t('dependenciesHint')}</span>
        </label>
        {missingEditorDependencies.length > 0 ? (
          <div className={css.warning} role="status">
            {t('missingDependency')}: {missingEditorDependencies.join(', ')}
          </div>
        ) : null}
        {tab === 'source' ? (
          <label className={css.field}>
            <span>{t('markdown')}</span>
            <textarea className={css.markdownEditor} value={editor.rules} onChange={event => { setEditor({ ...editor, rules: event.currentTarget.value }); setEditorStatus('idle') }} />
          </label>
        ) : (
          <div className={css.preview} role="tabpanel"><MarkdownText text={editor.rules} /></div>
        )}
        {editorStatus === 'error' ? <p className={css.error}>{t('saveError')} {t('requiredFields')}</p> : null}
        <div className={css.footer}>
          {editor.mode === 'update' ? <button type="button" data-danger onClick={deleteEditor}>{t('delete')}</button> : null}
          <button type="button" onClick={() => { setOpenId(null); setEditor(null) }}>{t('cancel')}</button>
          <button type="button" data-primary disabled={editorStatus === 'saving'} onClick={saveEditor}>
            {editorStatus === 'saving' ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <li className={css.summaryCard} data-plugin-card="agent-games">
        <span className={css.summaryText}>
          <strong className={css.summaryName}>{t('title')}</strong>
          <span className={css.summaryDescription}>{t('description')}</span>
        </span>
        <button className={css.openManager} type="button" onClick={() => { setManagerOpen(true) }}>
          {t('openManager')}
        </button>
      </li>
      <Modal
        open={managerOpen}
        onClose={() => { setManagerOpen(false) }}
        title={t('title')}
        description={t('description')}
        closeLabel={t('closeManager')}
        className={css.managerModal}
        contentClassName={css.managerModalContent}
      >
        <section className={css.section} data-game-manager="agent-games" tabIndex={-1} autoFocus>
          <div className={css.directory}>
            <label className={css.field}>
              <span>{t('gamesDir')}</span>
              <input value={directoryDraft} disabled={settingsView.status !== 'ready'} onChange={event => { setDirectoryDraft(event.currentTarget.value); setDirectoryStatus('idle') }} />
              <span className={css.hint}>{t('gamesDirHint')}</span>
            </label>
            <div className={css.actions}>
              <button type="button" data-primary disabled={!directoryDirty || !settingsView.writable || directoryStatus === 'saving'} onClick={saveDirectory}>{t('saveDirectory')}</button>
              <button type="button" disabled={!settingsView.writable || directoryStatus === 'saving'} onClick={resetDirectory}>{t('resetDirectory')}</button>
              {directoryStatus === 'saved' ? <span className={css.status}>{t('directorySaved')}</span> : null}
              {directoryStatus === 'error' ? <span className={css.error}>{t('directoryError')}</span> : null}
            </div>
          </div>

          <div className={css.heading}>
            <h3>{t('games')}</h3>
            <div className={css.toolbar}>
              <button type="button" onClick={startCreate}>{t('newGame')}</button>
              <button type="button" onClick={reload}>{t('retry')}</button>
            </div>
          </div>
          {catalog.status === 'loading' ? <p className={css.status}>{t('loading')}</p> : null}
          {catalog.status === 'error' ? <p className={css.error}>{t('loadError')}</p> : null}
          {catalog.status === 'ready' && catalog.inventory === undefined ? <p className={css.inventoryWarning}>{t('inventoryUnavailable')}</p> : null}
          {openId === '__new__' ? <div className={css.cardBody}>{renderEditor()}</div> : null}
          {catalog.status === 'ready' && catalog.games.length === 0 && openId !== '__new__' ? <p className={css.status}>{t('empty')}</p> : null}
          {catalog.status === 'ready' && catalog.games.length > 0 ? (
            <ul className={css.cards}>
              {catalog.games.map(game => {
                const open = openId === game.id
                return (
                  <li className={css.card} key={game.id} data-open={open ? 'true' : undefined}>
                    <button className={css.cardButton} type="button" aria-expanded={open} onClick={() => { openGame(game) }}>
                      <strong>{game.name}</strong>
                      <span className={css.cardMeta}>
                        <code>{game.id}.md</code>
                        {game.requires.map(requirement => {
                          const ready = dependencyReady(requirement, catalog.inventory)
                          return (
                            <span className={css.badge} data-warning={ready === false ? '' : undefined} key={requirement}>
                              {dependencyLabel(requirement, catalog.inventory, t)}
                            </span>
                          )
                        })}
                      </span>
                    </button>
                    {open ? <div className={css.cardBody}>{renderEditor()}</div> : null}
                  </li>
                )
              })}
            </ul>
          ) : null}
        </section>
      </Modal>
    </>
  )
}
