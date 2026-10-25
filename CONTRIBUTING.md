# 参与贡献

感谢你愿意改进「会停车吗你」。这是一个无构建步骤的离线 H5 项目，请尽量保持改动小、可读且不引入依赖。

## 开发流程

1. Fork 仓库并从 `main` 创建分支。
2. 运行 `npm run dev`，在手机竖屏尺寸下验证修改。
3. 运行 `npm run check`。
4. 如果修改了发布内容，运行 `npm run package` 并检查生成的 ZIP。
5. 提交 Pull Request，说明改动目的和验证方式；界面改动请附截图。

## 项目约束

- 游戏源码与运行素材统一放在 `src/`，仓库只保留最新版本，不创建版本目录。
- 运行文件是 `index.html`、`app.js`、`challenges.js`、`style.css`、`favicon.svg`，入口必须是 `index.html`。
- 运行时不得依赖网络、外部 CDN、模块脚本或动态代码执行。
- `src/` 里不放截图、封面等非运行资源，这类文件放在 `docs/assets/`。
- 不提交 `dist/`、本地工具配置或系统生成文件。
- 玩法数值修改应同步更新 `docs/GAMEPLAY.md`。
- 改动小红书 Native 能力时，只使用已有的 `window.xhs.miniTool.*` 接口，并保留普通浏览器降级路径。

## 发布新版本

1. 直接在 `src/` 中开发，仓库不保留旧版本副本。
2. 同步更新 `VERSION` 和 `package.json` 里的版本号（当前为 `1.2.0`）。
3. 运行校验、玩法测试与打包，检查 `dist/parking-game-v<版本号>.zip`。

## 提交建议

提交信息使用简短的动词开头，例如：

```text
fix: 修复窄屏结算页溢出
feat: 增加斜列车位科目
docs: 补充打包说明
```
