# 小轿车车顶配色

> Release cleanup (2026-10-26): historical screenshots and previews were archived. Old image paths below record provenance only; see [cleanup record](../ASSET_CLEANUP.md).

> 图片清理说明（2026-10-25）：本文保留历史方案与提示词；已淘汰的车辆图片和旧对比图已删除，文内旧路径仅作历史记录。当前资源见[车辆素材索引](README.md)。

此为已撤回的拼色方案。用户要求车顶贴近原车漆后，游戏已改用 `car-roof-tonal.png` 的橙红同色明暗，详见 `roof-tonal.md`；下文保留生成记录。

使用内置 ImageGen 对现有 `src/assets/vehicles/car-angular-refined.png` 分别做三次定向编辑。三张均保留橙红车身、浅薄荷车窗、前窗高光、折线引擎盖和粗黑轮廓，只改变中央车顶的颜色。源图、透明裁切范围、运行图尺寸和等比校准参数见 `roof-colors.json`。

生成提示共同约束：只编辑前后风挡之间的中央车顶面；保留车头朝右的严格正俯视画面、原车轮廓、车头与车尾、后视镜、轮胎、车灯、雨刷、格栅和门缝。不得把整个车身改色，不增加条纹、文字、标志、天窗或场景，使用真正透明的 PNG 背景。三次指定车顶色分别为奶油白 #f5f1df、雾蓝 #7c8eae、浅绿 #99b88b。

游戏已接入：

- `src/assets/vehicles/car-roof-cream.png`：玩家及目标预览默认配色。
- `src/assets/vehicles/car-roof-blue.png`：邻车配色。
- `src/assets/vehicles/car-roof-sage.png`：邻车配色。

邻车按固定位置顺序循环使用雾蓝、浅绿、奶油白；重试同一主线不会改变配色。车辆尺寸、碰撞与手感不变。图片在加载时预载，沿用现有绘制回退；`scripts/package.sh` 已有 assets 目录收录规则。

本地实机截图：`roof-colors-in-game.png`。`npm run check`、`npm test` 和 `git diff --check` 通过，浏览器无控制台错误。此为本地更新，未打包发布。
