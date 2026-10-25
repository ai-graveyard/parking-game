# 加长大卡车 — 2026-10-25

> Release cleanup (2026-10-26): historical screenshots and previews were archived. Old image paths below record provenance only; see [cleanup record](../ASSET_CLEANUP.md).

用户反馈上一版大卡车不够长。用内置 ImageGen 延长货厢，驾驶室相对缩小为车身约四分之一，保留三条绑带、大明暗、浅色前风挡与简洁粗轮廓。四套配色同步重绘，无程序横向拉伸。

运行素材：`src/assets/vehicles/truck-long.png`、`truck-long-coral.png`、`truck-long-sage.png`、`truck-long-ochre.png`。原图、裁切和独立车体校准记录在 `trucks-long.json`。运行图片均768像素宽，透明裁切后等比缩小，保留alpha。

真实车长从110改为128，车宽参数仍40，轴距比例0.73及其他动力参数不变；可见车体从约102×40改为128×36.8，同一世界比例下长约25%。碰撞范围同步128×40，车身等比绘制。大卡车车长是小货车1.6倍、小轿车约2.8倍。

配套调整卡车车位、侧方邻位和护栏、绕柱起点及随机倒库起点。侧方改为一辆完整邻车加护栏，避免三辆加长车挤出地图。第13–16关各完成连续转向模型路线搜索并验证倒车入位；随机倒库/侧方三种难度各抽查一组场景，六组路线均存在。现有16关×3视口、720随机布局、资源与格式检查通过。

## 实际生成提示词

### long-truck-prompt

```text
Use case: precise-object-edit. Edit target: exact blue cab/green tarp mobile parking-game truck. LENGTHEN THE GREEN CARGO BED substantially while keeping cab WIDTH and cab LENGTH the same. This truck currently looks too short, with the cab too large a fraction of total length. Extend the tarp section LEFTWARDS by about50 percent. Desired main painted chassis length:width around3.2:1, e.g.1280px long by400px wide EXCLUDING tire/mirror protrusions. Cab should now occupy aboutone quarter total length, long cargo three quarters. Preserve clean rounded bold mobile illustration, thick near-black contours, blue opaque cab, pale mint front glass at RIGHT with one cream reflection and black wiper, cream headlightsRIGHT/red taillightsLEFT. Tarp olive green with two broad tonal folds and THREE thick black straps, reposition straps naturally along the longer cargo. Three simple axle wheel tabs, no tread or realistic detail. Strict orthographic TOP DOWN roof view, frontRIGHT, symmetry across horizontal axis, no perspective/sidewalls. Natural REDRAW of longer cargo, DO NOT stretch windshield/cab/lamps or make body narrower. One whole truck on genuine transparent alpha, no text/logo/badge/shadow/glow/halo. Landscape canvas1536x768 with margins. Critical: visibly longer cargo with smaller relative cab than supplied compact truck.
```

### long-truck-final-prompt

```text
Use case: precise-object-edit. Keep this SAME long cargo truck, all colors and simple bold shapes, with cargo about70-75percent of length and cab25-30percent. Make the entire painted chassis WIDER BY20percent from top to bottom while keeping bumper-to-bumper length and relative cab length unchanged. Current long image body is too narrow, about3.8:1. Correct painted body aspect to3.2:1 (1280px length by400px WIDTH EXCLUDING tires/mirrors). This is a natural redraw, not blind pixel stretching. Broaden cargo roof and cab together; widen windshield naturally but preserve its single reflection and wiper. Keep blue cabRIGHT, green tarpLEFT, THREE black straps, two broad tonal folds, rounded black outlines, plain wheel tabs, cream headlightsRIGHT/red tail lightsLEFT. Strict top-down roof view, no perspective or side faces. Whole vehicle silhouette including mirrors should be approx2.75:1. Do NOT shorten green cargo relative to cab; do NOT enlarge cab fraction. One truck, genuine alpha transparent background, crisp mobile-game illustration, no text, badge, logo, shadow, halo or glow.1536x768 landscape canvas with transparent margins.
```

### long-truck-coral-prompt

```text
Use case: precise-object-edit. ONE paint variant of this EXACT LONG blue/green tarp truck: change ONLY blue cab/mirrors to muted CORAL RED #d66b56 and green tarp to warm SAND BEIGE #c8b48b with darker tan broad folds. Preserve EXACT long silhouette, cargo75percent/cab25percent length, body width, three black straps, broad folds, rounded contours, pale mint front windshield, single cream reflection and wiper, cream headlightsRIGHT/red taillightsLEFT, simple black wheel tabs. Do not shorten cargo or enlarge cab. Same orthographic top-down frontRIGHT, simple bold mobile illustration, genuine transparent alpha. Same canvas/framing/aspect as target. No added detail, text, logo, shadow, halo or glow.
```

### long-truck-sage-prompt

```text
Use case: precise-object-edit. ONE paint variant of this EXACT LONG tarp truck. Change ONLY blue cab/mirrors to muted SAGE GREEN #91a77c and olive tarp to warm IVORY CREAM #e6dcc3 with slightly deeper beige broad folds. Preserve EXACT long chassis, cargo75percent/cab25percent length, body width, three black straps, broad folds, rounded thick contours, pale mint glass with single cream reflection and wiper, cream front lightsRIGHT/red tail lightsLEFT, simple wheel tabs. Do NOT shorten cargo or change cab proportions. Same orthographic top-down frontRIGHT, sparse bold mobile-game illustration, identical canvas/framing/aspect. One truck with genuine transparent alpha. No new detail, text/logo/badge/ground shadow/halo/glow.
```

### long-truck-ochre-prompt

```text
Use case: precise-object-edit. ONE paint variant of this EXACT LONG tarp truck: change ONLY blue cab/mirrors to warm MUSTARD OCHRE #d6ae55 and olive tarp to muted SLATE BLUE GRAY #8297ab with darker slate broad folds. Preserve EXACT long body silhouette, cargo75percent/cab25percent length, body width, three bold black straps, two broad folds, rounded outlines, mint windshield and single cream reflection/wiper, cream headlightsRIGHT/red taillightsLEFT, simple tires. No shortening or new detail. Same orthographic overhead frontRIGHT, clean bold mobile illustration and exact source canvas/framing/aspect. Whole truck on genuine transparent alpha, no text/logo/badge/shadow/halo/glow.
```
