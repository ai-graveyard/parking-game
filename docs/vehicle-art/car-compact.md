# 小轿车比例修正

> Release cleanup (2026-10-26): historical screenshots and previews were archived. Old image paths below record provenance only; see [cleanup record](../ASSET_CLEANUP.md).

> 图片清理说明（2026-10-25）：本文保留历史方案与提示词；已淘汰的车辆图片和旧对比图已删除，文内旧路径仅作历史记录。当前资源见[车辆素材索引](README.md)。

用户指出小车看着偏小、偏长。检查确认旧版不是横纵拉伸，而是原画车身偏窄，且定位范围把后视镜、轮胎和空白算入，实际车体约17.32宽，低于24的碰撞宽度。

本次使用内置 ImageGen 修正同款车的比例，保留粗黑轮廓、橙红同色车漆、暗后窗、浅前风挡和简化侧面阴影。车身更紧凑，按实际车体边界校准，后视镜和轮胎自然留在外侧。

运行素材：`src/assets/vehicles/car-compact.png`，768×470 RGBA。源图、裁切和定位参数：`car-compact.json`。绘制强制使用单一等比缩放系数，校准车体约46×22.75，碰撞尺寸仍是46×24；车体显示宽度比旧版增加约31%。驾驶参数、关卡与箭头提示规则未变。玩家、邻车和目标预览同步更新。

实机前后对比：`car-proportion-comparison.png`；相同位置、相同倍率局部对比：`car-proportion-detail.png`，下方另附实际尺寸小图。静态校验、现有玩法检查、格式检查及浏览器核对通过；本次未打包发布。

## 实际生成提示词

```text
Precise proportion correction of a production top-down neo-brutalist parking-game car sprite. IMAGE1 is the exact selected car style/identity to preserve: orange-red matching roof/body paint, thick black outline, dark smoky blue-green rear windshield LEFT, pale mint front windshield RIGHT with cream reflection and wiper, two simple burnt-orange side recess shadows, cream headlights RIGHT, red taillights LEFT, black tire slivers and mirrors. IMAGE2 is ONLY a compactness/proportion reference from the old game car, NOT a style or pixel-art reference. The current selected car's actual painted body is TOO LONG AND NARROW. REDRAW its body as a SHORT WIDE compact city hatchback. This must be a substantial visible proportion fix, not a change in canvas cropping or transparent padding. The MAIN PAINTED BODY from rear bumper LEFT to front bumper RIGHT must have length:width approximately 1.9:1 (example body rectangle 800px long x420px wide). Including the outward mirrors and tire slivers, the whole vehicle silhouette should be approx1.55-1.65:1, emphatically NOT a long 2.5:1 sedan. Broaden the actual painted roof/cabin and hood, shorten the body length relative to width by about25% compared to first image. Redraw wheel placement and window shapes naturally to match the compact body; don't blindly squash an existing raster. Small short hood and short rear overhang; roomy broad opaque roof, clean rounded/chamfered corners retaining selected angular character. Preserve all selected simple styling cues and front/rear contrast, no detailed side window panes or pillars, no player badge. Strict ORTHOGRAPHIC TOP DOWN, bilateral symmetry, front points RIGHT, no perspective or visible side faces. Original body/roof are one coherent orange-red paint hue with slight subtle roof tone, no contrasting roof. Keep sparse black-contour graphic quality and broad color blocks, no photorealism, extra3D texture, racing stripes, sunroof, text, decals, logos or ground shadow. Genuine transparent alpha background, single whole car only. Output target1024x768, vehicle about850px long and540px overall width incl mirrors, centered with transparent margin. The critical acceptance requirement is short wide painted-body proportions near1.9:1 and whole silhouette near1.6:1.
```
