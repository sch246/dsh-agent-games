import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../', import.meta.url)

test('published client artifact declares the complete dynamic injection graph', async () => {
  const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'))
  assert.deepEqual(pkg.dsh.client.inject, [
    '@deepseek-ai/dsh-api-remotes',
    '@deepseek-ai/dsh-client-connection',
    '@deepseek-ai/dsh-client-locale',
    '@deepseek-ai/dsh-client-ui-renderer',
    '@deepseek-ai/dsh-client-ui-settings',
    '@deepseek-ai/dsh-client-ui-settings-plugins',
  ])

  const artifact = new URL(pkg.exports['./client'].default, root)
  assert.equal((await stat(artifact)).isFile(), true)
  const bundle = await readFile(artifact, 'utf8')
  assert.match(bundle, /window\.__ModuleLoader__\.load\(/u)
  assert.doesNotMatch(bundle, /dsh-client-runtime/u)
  const runtimeImports = [...new Set([...bundle.matchAll(/require\("([^"]+)"\)/gu)].map(match => match[1]))]
  assert.deepEqual(runtimeImports.sort(), [
    '@deepseek-ai/dsh-client-ui-primitives',
    'react',
    'react/jsx-runtime',
  ])
})
