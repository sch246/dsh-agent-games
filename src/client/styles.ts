/** Plugin-owned styles with stable names for the dynamic browser bundle. */

const classes = Object.freeze({
  actions: 'dsh-agent-games-actions',
  badge: 'dsh-agent-games-badge',
  card: 'dsh-agent-games-card',
  cardBody: 'dsh-agent-games-cardBody',
  cardButton: 'dsh-agent-games-cardButton',
  cardMeta: 'dsh-agent-games-cardMeta',
  cards: 'dsh-agent-games-cards',
  directory: 'dsh-agent-games-directory',
  editor: 'dsh-agent-games-editor',
  editorHeader: 'dsh-agent-games-editorHeader',
  error: 'dsh-agent-games-error',
  field: 'dsh-agent-games-field',
  fieldGrid: 'dsh-agent-games-fieldGrid',
  footer: 'dsh-agent-games-footer',
  heading: 'dsh-agent-games-heading',
  hint: 'dsh-agent-games-hint',
  inventoryWarning: 'dsh-agent-games-inventoryWarning',
  markdownEditor: 'dsh-agent-games-markdownEditor',
  managerModal: 'dsh-agent-games-managerModal',
  managerModalContent: 'dsh-agent-games-managerModalContent',
  openManager: 'dsh-agent-games-openManager',
  preview: 'dsh-agent-games-preview',
  section: 'dsh-agent-games-section',
  status: 'dsh-agent-games-status',
  summaryCard: 'dsh-agent-games-summaryCard',
  summaryDescription: 'dsh-agent-games-summaryDescription',
  summaryName: 'dsh-agent-games-summaryName',
  summaryText: 'dsh-agent-games-summaryText',
  tabs: 'dsh-agent-games-tabs',
  toolbar: 'dsh-agent-games-toolbar',
  warning: 'dsh-agent-games-warning',
})

const css = `.dsh-agent-games-summaryCard {
  list-style: none;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-3);
}
.dsh-agent-games-summaryText {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dsh-agent-games-summaryName {
  color: var(--dsw-alias-label-primary);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
}
.dsh-agent-games-summaryDescription {
  color: var(--dsw-alias-label-tertiary);
  font-size: 13px;
  line-height: 1.5;
}
.dsh-agent-games-openManager {
  flex: none;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  padding: 6px 12px;
  background: var(--dsw-alias-label-primary);
  color: var(--dsw-alias-bg-layer-3);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.dsh-agent-games-managerModal.dsh-agent-games-managerModal {
  width: min(1120px, 100%);
  height: min(900px, calc(100vh - 48px));
  max-height: calc(100vh - 48px);
}
.dsh-agent-games-managerModalContent {
  min-height: 0;
  overflow-y: auto;
}
.dsh-agent-games-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  box-sizing: border-box;
  color: var(--dsw-alias-label-primary);
}
.dsh-agent-games-heading,
.dsh-agent-games-toolbar,
.dsh-agent-games-editorHeader,
.dsh-agent-games-footer,
.dsh-agent-games-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.dsh-agent-games-heading,
.dsh-agent-games-editorHeader { justify-content: space-between; }
.dsh-agent-games-heading h3,
.dsh-agent-games-editorHeader h4,
.dsh-agent-games-status,
.dsh-agent-games-error,
.dsh-agent-games-hint { margin: 0; }
.dsh-agent-games-hint,
.dsh-agent-games-cardMeta,
.dsh-agent-games-status { color: var(--dsw-alias-label-tertiary); font: var(--dsw-font-s-12); }
.dsh-agent-games-directory,
.dsh-agent-games-editor { display: flex; flex-direction: column; gap: 12px; }
.dsh-agent-games-field { display: flex; flex-direction: column; gap: 6px; font: var(--dsw-font-s-13); }
.dsh-agent-games-fieldGrid { display: grid; grid-template-columns: minmax(160px, 0.8fr) minmax(220px, 1.2fr); gap: 12px; }
.dsh-agent-games-field input,
.dsh-agent-games-field textarea {
  box-sizing: border-box;
  width: 100%;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  padding: 9px 11px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font: inherit;
}
.dsh-agent-games-field input:focus,
.dsh-agent-games-field textarea:focus { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.dsh-agent-games-actions button,
.dsh-agent-games-toolbar button,
.dsh-agent-games-footer button,
.dsh-agent-games-tabs button {
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 7px;
  padding: 6px 11px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  cursor: pointer;
}
.dsh-agent-games-actions button[data-primary],
.dsh-agent-games-footer button[data-primary] {
  border-color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-label-primary);
  color: var(--dsw-alias-bg-layer-3);
}
.dsh-agent-games-actions button:disabled,
.dsh-agent-games-toolbar button:disabled,
.dsh-agent-games-footer button:disabled { cursor: default; opacity: .5; }
.dsh-agent-games-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; padding: 0; margin: 0; list-style: none; }
.dsh-agent-games-card { border: 1px solid var(--dsw-alias-border-l2); border-radius: 9px; background: var(--dsw-alias-bg-layer-1); overflow: hidden; }
.dsh-agent-games-card[data-open="true"] { grid-column: 1 / -1; }
.dsh-agent-games-cardButton { display: flex; flex-direction: column; gap: 7px; width: 100%; border: 0; padding: 12px; background: transparent; color: inherit; text-align: left; cursor: pointer; }
.dsh-agent-games-cardButton strong { font: var(--dsw-font-s-14); }
.dsh-agent-games-cardBody { border-top: 1px solid var(--dsw-alias-border-l2); padding: 12px; }
.dsh-agent-games-cardMeta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.dsh-agent-games-badge { display: inline-flex; align-items: center; min-height: 19px; border-radius: 999px; padding: 0 7px; background: var(--dsw-alias-bg-module-platform); color: var(--dsw-alias-label-secondary); font-size: 11px; }
.dsh-agent-games-badge[data-warning] { background: var(--dsw-alias-state-warn-tertiary); color: var(--dsw-alias-state-warn-label); }
.dsh-agent-games-warning,
.dsh-agent-games-inventoryWarning { padding: 8px 10px; border-radius: 7px; background: var(--dsw-alias-state-warn-tertiary); color: var(--dsw-alias-state-warn-label); font: var(--dsw-font-s-12); }
.dsh-agent-games-error { color: var(--dsw-alias-state-error-primary); font: var(--dsw-font-s-12); }
.dsh-agent-games-tabs { display: flex; gap: 4px; }
.dsh-agent-games-tabs button[aria-selected="true"] { background: var(--dsw-alias-bg-module-platform); }
.dsh-agent-games-markdownEditor { min-height: 320px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; line-height: 1.55; tab-size: 2; }
.dsh-agent-games-preview { min-height: 320px; overflow: auto; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; padding: 14px; background: var(--dsw-alias-bg-layer-1); }
.dsh-agent-games-footer { justify-content: flex-end; }
.dsh-agent-games-footer button[data-danger] { color: var(--dsw-alias-state-error-primary); margin-right: auto; }
@media (max-width: 680px) {
  .dsh-agent-games-summaryCard { align-items: flex-start; flex-direction: column; }
  .dsh-agent-games-managerModal.dsh-agent-games-managerModal {
    width: 100%;
    height: calc(100vh - 48px);
    max-height: calc(100vh - 48px);
  }
  .dsh-agent-games-fieldGrid { grid-template-columns: 1fr; }
  .dsh-agent-games-heading { align-items: flex-start; flex-direction: column; }
}
`

/** Install the plugin stylesheet once and return its lifecycle disposer. */
export function installStyles(): () => void {
  if (typeof document === 'undefined') return () => undefined
  const existing = document.querySelector('style[data-plugin="dsh-agent-games"]')
  if (existing !== null) return () => undefined
  const tag = document.createElement('style')
  tag.dataset.plugin = 'dsh-agent-games'
  tag.textContent = css
  document.head.append(tag)
  return () => { tag.remove() }
}

export default classes
