# 发布前素材清理记录

2026-10-26 已将历史设计截图、录屏及独立压扁预览归档后移出项目；运行素材未改动。

- 删除 182 个历史文件（其中 180 个图片/视频），释放 40,590,590 字节。
- 压扁效果[已选参考图](assets/assessment-selected-reference.png)从 `docs/crush-preview/assets/selected-reference.png` 搬入 `docs/assets/`，保留生成来源。
- 保留 README 的四张图片、[当前车辆索引](vehicle-art/README.md)列出的六张确认稿/截图、全部运行素材。
- 历史 Markdown / JSON 的提示词、尺寸、生成路径与验证记录继续保留；其中旧图片路径不代表当前文件存在。
- 完整清理清单、大小和 SHA-256 见 [manifest](material-cleanup-20261026.json)。

本机完整归档：`/private/tmp/parking-game-materials-backup-20261026.zip`。归档包含清理前全部 `docs/` 与完整 `design-qa.md`，共 237 个文件；写入后已逐个核验 SHA-256 和 ZIP 完整性。该路径位于系统临时目录，需要长期保存时应另存。

归档 SHA-256：`48da1b9159a18b59e1e50b48e70104768aa6e7491c1e34822600fac019bb3603`。

历史浏览器截图仅用于开发检查，不能代替创服平台模拟器及 Android / iOS 真机验收。
