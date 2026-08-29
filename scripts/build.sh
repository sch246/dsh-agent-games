#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -z "${DSH_CHECKOUT:-}" ]; then
  echo "build: set DSH_CHECKOUT to a DeepSeek Harness source checkout" >&2
  exit 1
fi
CHECKOUT="$DSH_CHECKOUT"

if [ ! -d "$CHECKOUT/packages" ]; then
  echo "build: cannot locate Harness checkout at $CHECKOUT" >&2
  exit 1
fi
if [ ! -x "$CHECKOUT/node_modules/.bin/tsc" ] || [ ! -x "$CHECKOUT/node_modules/.bin/tsdown" ]; then
  echo "build: Harness TypeScript build tools are unavailable" >&2
  exit 1
fi

ensure_link() {
  local link="$1"
  local target="$2"
  if [ -L "$link" ]; then
    rm "$link"
  elif [ -e "$link" ]; then
    echo "build: refusing to replace non-symlink $link" >&2
    exit 1
  fi
  ln -s "$target" "$link"
}

link_pkg() {
  local name="$1"
  local target="$CHECKOUT/$2"
  if [ ! -e "$target" ]; then
    echo "build: dependency target missing: $target" >&2
    exit 1
  fi
  local link="$ROOT/node_modules/$name"
  mkdir -p "$(dirname "$link")"
  if [ -L "$link" ]; then
    rm "$link"
  elif [ -e "$link" ]; then
    rm -rf "$link"
  fi
  ln -s "$target" "$link"
}

if [ -L "$ROOT/harness" ]; then rm "$ROOT/harness"; fi
if [ -e "$ROOT/harness" ]; then
  echo "build: refusing to replace non-symlink $ROOT/harness" >&2
  exit 1
fi
ln -s "$CHECKOUT" "$ROOT/harness"

mkdir -p "$ROOT/node_modules/@deepseek-ai" "$ROOT/node_modules/@types"
link_pkg @deepseek-ai/cordis vendor/cordis
link_pkg @deepseek-ai/cosmokit vendor/cosmokit
link_pkg @deepseek-ai/schemastery vendor/schemastery
link_pkg @deepseek-ai/dsh-atomic-write packages/util/atomic-write
link_pkg @deepseek-ai/dsh-tools packages/core/tools
link_pkg @deepseek-ai/dsh-settings packages/settings/settings
link_pkg @deepseek-ai/dsh-client-connection packages/client/connection
link_pkg @deepseek-ai/dsh-host-apiproxy packages/host/apiproxy
link_pkg @deepseek-ai/dsh-host-webserver packages/host/webserver
link_pkg @deepseek-ai/dsh-brand packages/util/brand
link_pkg @deepseek-ai/dsh-llm packages/llm/llm
link_pkg @deepseek-ai/dsh-session packages/core/session
link_pkg @deepseek-ai/dsh-api-remotes packages/api/remotes
link_pkg @deepseek-ai/dsh-client-runtime packages/client/runtime
link_pkg @deepseek-ai/dsh-client-locale packages/client/locale
link_pkg @deepseek-ai/dsh-client-ui-settings packages/client/ui-settings
link_pkg @deepseek-ai/dsh-client-ui-settings-plugins packages/client/ui-settings-plugins
link_pkg @deepseek-ai/dsh-client-ui-slots packages/client/ui-slots
link_pkg @deepseek-ai/dsh-client-ui-primitives packages/client/ui-primitives
link_pkg @types/node node_modules/@types/node
link_pkg @types/react packages/client/ui-renderer/node_modules/@types/react
link_pkg react packages/client/ui-renderer/node_modules/react
link_pkg react-dom packages/client/ui-renderer/node_modules/react-dom
link_pkg zod packages/api/gateway/node_modules/zod
link_pkg tsdown node_modules/tsdown

STD_SCHEMA=$(find "$CHECKOUT/node_modules/.pnpm" -maxdepth 1 -type d -iname '@standard-schema+spec@*' 2>/dev/null | head -1)
if [ -n "$STD_SCHEMA" ]; then
  mkdir -p "$ROOT/node_modules/@standard-schema"
  ensure_link "$ROOT/node_modules/@standard-schema/spec" "$STD_SCHEMA/node_modules/@standard-schema/spec"
fi

rm -rf "$ROOT/lib"
echo "building Host declarations and management RPC..."
"$CHECKOUT/node_modules/.bin/tsc" -p "$ROOT/tsconfig.json"
(cd "$ROOT" && "$CHECKOUT/node_modules/.bin/tsdown" --config tsdown.host.config.ts)

echo "building browser declarations and contribution..."
"$CHECKOUT/node_modules/.bin/tsc" -p "$ROOT/tsconfig.client.json"
(cd "$ROOT" && "$CHECKOUT/node_modules/.bin/tsdown" --config tsdown.client.config.ts)
echo "build: complete"
