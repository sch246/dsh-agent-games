# @dsh-external/dsh-agent-games

把游戏提示词放在独立 Markdown 中，只在明确调用时送进模型上下文。这个插件不拥有房间、玩家、消息或游戏状态。

`agentgame_game` 提供完整 CRUD：

- `list`：列出游戏。
- `get`：读取规则。
- `create`：用 `gameId + name + rules` 新建 Markdown，可选 `requires`。
- `update`：只传需要修改的 `name / rules / requires`。
- `remove`：删除游戏。

工具负责 Markdown front matter，代理无需查看插件源码或文件格式。`requires` 只是提示该游戏通常会组合哪些独立插件，不在这里产生运行时耦合。

共享增量消息由独立的 `@dsh-external/dsh-shared-room` 提供。以《谁是卧底》为例，调用方读取游戏提示词、创建通用房间，再把规则和房间号发给子代理；两个插件互不依赖。

## 配置

Web 部署会把精简的 **Agent 游戏** 卡片放在 **设置 → 插件 → 插件配置**。点击 **打开游戏管理器** 会进入接近全屏的大弹窗，页面提供：

- 修改当前游戏目录；保存后模型工具和页面同时切换到新目录。
- 以卡片查看目录中的游戏定义。
- 新建、删除，以及编辑游戏名称、依赖和 Markdown 规则。
- 在源码与渲染预览之间切换；源码使用页面内置的多行文本编辑器。
- 对照本部署的插件列表显示依赖状态。

每张卡片对应 `<gameId>.md`。文件使用一段 JSON front matter 保存名称和依赖，正文是 Markdown；页面和模型工具都会封装这一格式，不要求调用者直接编辑文件。

依赖状态只是提示。例如《谁是卧底》声明 `@dsh-external/dsh-shared-room` 后，页面会在它未启用时显示警告，但 Agent Games 插件仍会启动，游戏仍可查看、修改和交给代理运行。

Host 配置仍可直接指定目录：

```yaml
config:
  gamesDir: /path/to/game-prompts
```

默认目录是插件的 `games/`。

浏览器贡献由 Cordis 动态装配，依赖设置、插件配置、Remote、连接、locale 和提供 slots 服务的 UI renderer 客户端行。包必须携带 `lib/client.js`；Host 从 `package.json` 的 `exports["./client"]` 定位该产物。

## 构建与验证

```bash
DSH_CHECKOUT=/path/to/deepseek-harness npm test
```

`DSH_CHECKOUT` 必须指向已经安装依赖的 DeepSeek Harness 源码目录。构建脚本只在本仓库生成 `lib/`，并通过本地软链接复用 Harness 的构建工具和 peer dependencies；这些生成物和链接不会提交到 Git。
