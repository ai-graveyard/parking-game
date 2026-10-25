# 小轿车同色车漆修正

> Release cleanup (2026-10-26): historical screenshots and previews were archived. Old image paths below record provenance only; see [cleanup record](../ASSET_CLEANUP.md).

> 图片清理说明（2026-10-25）：本文保留历史方案与提示词；已淘汰的车辆图片和旧对比图已删除，文内旧路径仅作历史记录。当前资源见[车辆素材索引](README.md)。

用户要求车顶贴近原车漆，只做轻微的颜色层次。使用内置 ImageGen 编辑已批准的 `src/assets/vehicles/car-angular-refined.png`：车顶保持橙红同色系，中心轻微提亮、边缘略深；保留原车轮廓、车窗、车灯和引擎盖细节。

运行素材：`src/assets/vehicles/car-roof-tonal.png`，640×320 RGBA。源文件、裁切及等比校准数据：`roof-tonal.json`。玩家、邻车和目标预览共用此图，已去掉上一版的三色分配逻辑。车辆尺寸和手感未改。

本地实机图：`roof-tonal-in-game.png`。`npm run check`、`node scripts/test-game.cjs`、`git diff --check` 通过；浏览器无错误日志。此为本地修正，未打包发布。

## 实际生成提示词

```text
Precise-object-edit. The attached transparent PNG is the exact approved orange-red car sprite. Correct ONLY the central roof paint finish. It must remain the SAME orange-red PAINT HUE as its hood, trunk and side rails: an ordinary single-color painted car, NOT a two-tone car. The roof should differ from adjacent original orange-red body by only a very subtle 4-7 percent brightness shift: slightly lighter warm orange-red center plane, with a narrow slightly darker orange-red edge suggesting a roof seam. Keep saturation and hue essentially identical to original paint. Avoid any cream, white, blue, green, brown or pastel roof. Avoid a large contrast patch; at thumbnail size the whole body must read ONE coherent orange-red color. Keep roof center clear and quiet for the game label. Preserve exact silhouette, proportions, original thick black outline, mint windows, diagonal cream reflection on front windshield, original lamps, mirrors, tires, hood creases, handles and grille. Strict overhead front pointing RIGHT, no new objects or text, no camera changes, no added stripe or sunroof. Preserve the selected sparse neo-brutalist flat graphic illustration; gentle paint tone difference only, no added 3D gloss or realistic texture. Single complete car with true alpha transparency, original compact2:1 image aspect and tight margins. The change should look like light on matching car paint, NOT customization with contrasting roof paint.
```
