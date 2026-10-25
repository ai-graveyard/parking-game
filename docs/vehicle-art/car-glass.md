# 小轿车车窗细化

> Release cleanup (2026-10-26): historical screenshots and previews were archived. Old image paths below record provenance only; see [cleanup record](../ASSET_CLEANUP.md).

> 图片清理说明（2026-10-25）：本文保留历史方案与提示词；已淘汰的车辆图片和旧对比图已删除，文内旧路径仅作历史记录。当前资源见[车辆素材索引](README.md)。

使用内置 ImageGen 编辑当前同色车顶小轿车：后窗压暗为烟熏蓝绿色；两侧各加入前后两块窄玻璃，用黑色窗柱分隔。前风挡保留浅色玻璃、高光和雨刷，车顶仍为原车漆的橙红同色系。

运行素材：`src/assets/vehicles/car-glass-refined.png`，640×309 RGBA。原始生成图、裁切与等比校准参数：`car-glass.json`。玩家、邻车和目标位预览共用此图；尺寸和手感未改。本地实际效果：`car-glass-in-game.png`。

`npm run check`、`node scripts/test-game.cjs`、`git diff --check` 通过；浏览器无控制台错误。此为本地更新，未打包发布。

## 实际生成提示词

```text
Precise-object-edit of this exact approved neo-brutalist orange-red compact car sprite. Make ONLY two requested glass updates, preserve all other paint, shape, original contour, lighting, details and strict orthographic overhead view. Nose/front points RIGHT, rear/tail LEFT. (1) Darken the REAR WINDSHIELD at the LEFT end of the cabin from pale mint to a noticeably darker smoky blue-green approx #3f5c62. It must read tinted glass, not an opaque black panel. Keep a very restrained muted lighter reflection, much quieter than the front windshield. The front windshield at RIGHT must remain pale mint with its existing cream diagonal reflection and black wiper. (2) Add SIDE WINDOW GLASS to the TOP and BOTTOM edges of the cabin, visible as narrow symmetric bands from this top-down plan view. Each side has TWO slim trapezoid panes (rear-door pane toward LEFT, front-door pane toward RIGHT) separated by a single black B pillar. Fit these glass bands INSIDE the existing orange-red silhouette, running between rear windshield and front windshield. Side glass smoky blue-green #54747a with small restrained pale highlights, black rubber outlines matching the current illustration. Make them wide enough to read at tiny game size, but keep them narrow: do not turn the roof into a large glass canopy, do not cut the outer shape or reveal side-wall faces. Leave a large opaque orange-red central roof panel for the game's player marker. Roof paint stays the same orange-red hue as the original body with only its existing slight tonal change. Preserve orange-red hood/trunk/mirrors, headlights/tail lights, tires, seam lines, hood creases, door handles and nose grille. No new sunroof, stripes, decals, badges, text or scene, no new3D shading, perspective or camera angle. One complete car, true alpha transparent background, original compact 2:1 canvas aspect, tight transparent margins. Same bold clean neo-brutalist graphic style.
```
