# 货车比例修复

> Release cleanup (2026-10-26): historical screenshots and previews were archived. Old image paths below record provenance only; see [cleanup record](../ASSET_CLEANUP.md).

原小货车横纵缩放相差15.6%，大卡车36.6%。旧原画的车体偏长窄，通过非等比加宽适配80×34、110×40碰撞范围。

使用内置 ImageGen 编辑原素材，保留橙白厢式货车、蓝头绿篷卡车的设计，按实际车体校准。所有车辆统一等比绘制，镜子和轮胎留在主体外。驾驶、碰撞和关卡尺寸不变。

运行素材：`src/assets/vehicles/van-box-proportioned.png`（768×393）、`src/assets/vehicles/truck-tarp-proportioned.png`（1024×456）。源图、透明裁切和定位框见 `van-proportion.json`、`truck-proportion.json`。实际车体分别80×32.96、110×36.76，车长准确对应原碰撞范围，侧面留有少量余量。大卡车定位取车轴之间的车厢边缘，避免把中央轮胎算进车宽。

## 小货车实际采用提示词

```text
Use case: precise-object-edit. The supplied reference is our exact selected orange cab and ivory box delivery truck. PROPORTION CORRECTION ONLY. Its existing body is WAY TOO LONG and thin (2.74:1). REDRAW as a conspicuously SHORTER WIDER truck, body length-to-width around2.30:1, target painted body1150px long by500px wide. Make white cargo box shorter length, make cab/cargo both significantly broader. Cab still about one-third total vehicle length. DO NOT reproduce the reference's long thin silhouette. New sprite should look stockier and noticeably more compact than reference, such that fitting its main painted body80x34 requires zero anisotropic stretching. Body ends LEFT rear and RIGHT nose, width measured across painted panels, excluding mirrors/tires. Same orange cab, white box roof with only two long shallow recessed ribs, dark blue-gray front windshield RIGHT, small cream headlights at right nose, red rear lights at left tail, thick black contours and restrained shading. Natural redraw of windows and panels to match wider dimensions. Strict orthographic TOP DOWN, exact overhead roof view, no perspective, no sidewalls. Use a 1536x1024 landscape canvas with adequate transparent margin, whole vehicle silhouette approx2:1 overall (including mirror protrusions), painted body2.30:1. Symmetrical across horizontal centerline. Genuine transparent alpha, single truck only, no text, no logo, no ground shadow, no badge, no decorations. Critical required change from reference: visibly widen body AND shorten cargo length; keep identity and paint unchanged.
```

## 大卡车实际采用提示词

```text
Use case: precise-object-edit. IMAGE1 is the EDIT TARGET blue cab olive tarp truck, preserve its colors and illustration style. IMAGE2 is a PROPORTION REFERENCE ONLY, ignore its orange/white colors and box materials. REDRAW IMAGE1 to have the SHORT WIDE body silhouette of IMAGE2, while still slightly longer than IMAGE2. This requires shortening the green cargo body substantially and greatly widening its blue cab. Main painted body length:width approximately2.6:1, similar to IMAGE2 compact delivery truck reference. Do NOT reproduce IMAGE1's original long skinny proportions. Blue cab remains aboutone third of total length, green tarp bed two thirds. Keep olive tarp, several black straps, blue cabin, dark windshield and headlights RIGHT, taillights LEFT. Retain three axles, but place them naturally closer together along shortened chassis. This is a single rigid delivery truck, not semi-trailer. Strict symmetric orthographic top-down roof view, no perspective, no sidewalls, thick black outline, clean restrained shading, front points RIGHT. Important: the purpose of this edit is to remove the long narrow silhouette, by using IMAGE2 as the structural length/width guide. Wider painted chassis and shorter cargo bed, NOT transparent cropping or blindly stretching pixels. Actual painted body should be approx1200px long x460px wide EXCLUDING tires/mirrors. Genuine transparent alpha, one whole truck, no text/logo/badge/ground shadow. Landscape1536x1024 composition with generous margins.
```
