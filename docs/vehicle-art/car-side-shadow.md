# 小尺寸侧窗简化

> Release cleanup (2026-10-26): historical screenshots and previews were archived. Old image paths below record provenance only; see [cleanup record](../ASSET_CLEANUP.md).

> 图片清理说明（2026-10-25）：本文保留历史方案与提示词；已淘汰的车辆图片和旧对比图已删除，文内旧路径仅作历史记录。当前资源见[车辆素材索引](README.md)。

使用内置 ImageGen 编辑当前小轿车，把侧窗窗格、窗柱和碎高光简化为两条连续的深橙棕色凹陷阴影。保留较暗的后窗、浅色前风挡及原车漆。此调整以实际约60px长的游戏小车为验收尺寸，重点是轮廓与车头方向识别。

运行素材：`src/assets/vehicles/car-side-shadow.png`。源图、透明裁切和等比定位参数见 `car-side-shadow.json`。玩家、邻车、车位预览同步更新；车身尺寸及驾驶参数未改。

本地实机图：`car-side-shadow-in-game.png`。`npm run check`、`node scripts/test-game.cjs`、`git diff --check` 通过；浏览器无错误。未打包发布。

## 实际生成提示词

```text
Precise-object-edit of this EXACT orange-red compact car game sprite, for readability at a tiny60px-long on-screen size. ONLY simplify the two SIDE WINDOW BANDS along the TOP and BOTTOM cabin edges. REMOVE their separate glass panes, B-pillars, black window frames and tiny reflection flecks. Replace EACH band with ONE single narrow, continuous muted deep burnt-orange/slightly smoky brown shadow strip inside the orange-red body edge, approximately5 percent of car body width thick. This is a subtle graphic shadow implying recessed side glass, NOT detailed windows, NOT racing stripes or large black borders. No subdivisions, tiny dots or highlights in those strips. Keep their silhouette simple tapered ends aligned to the roof. Simplify tiny door-handle details into the strip if needed, so the side reads one clean coherent line when small. Keep EVERYTHING ELSE: the dark smoky blue-green REAR windshield LEFT, the pale mint FRONT windshield RIGHT with cream reflection, original orange-red same-paint slightly lighter roof center, hood, trunk, lamps, mirrors, tire blocks, thick black outer silhouette, hood crease strokes and grille. Do not brighten the rear window, recolor the roof, add a sunroof, change camera, distort proportions, add shadows on the ground or add text. Strict orthographic top-down, front points RIGHT. Same sparse bold neo-brutalist flat illustration, genuine alpha transparent background, original compact~2:1 image aspect and original tight margins. One complete vehicle sprite only. Prioritize clear silhouette, front/rear glass contrast and large paint blocks over microdetails.
```
