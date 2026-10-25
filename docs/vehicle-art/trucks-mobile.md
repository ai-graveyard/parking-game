# 手机小尺寸货车与多配色 — 2026-10-25

> Release cleanup (2026-10-26): historical screenshots and previews were archived. Old image paths below record provenance only; see [cleanup record](../ASSET_CLEANUP.md).

用内置 ImageGen 编辑现有货车素材，并以 `car-smooth.png` 为风格参考。简化为圆角大色块、统一粗黑边、浅薄荷前风挡、单条玻璃高光和车灯方向。小货车去掉货箱细筋、五金和驾驶室凹槽；大卡车去掉细碎褶皱、扣件、车顶凸台和轮胎纹路，篷布保留三条粗绑带和两道大明暗。

运行素材在 `src/assets/vehicles/`：小货车 `van-mobile.png`、`van-mobile-blue.png`、`van-mobile-sage.png`、`van-mobile-lavender.png`；大卡车 `truck-mobile.png`、`truck-mobile-coral.png`、`truck-mobile-sage.png`、`truck-mobile-ochre.png`。每款源图、透明裁切、取样位置和独立车体定位框见 `trucks-mobile.json`。仅做透明裁切及等比缩小，小货车512像素宽、大卡车640像素宽，保留生成的alpha，不做程序改色。

玩家与目标位分别为橙白小货车、蓝头绿篷卡车。邻车各三款：小货车蓝/绿/紫驾驶室加浅色货箱；大卡车珊瑚红头配沙色篷、绿头配奶油篷、芥黄头配灰蓝篷。按场地种子加邻车序号分配，不消耗场地几何的随机数，重试和窗口变化保持配色。轿车的四套邻车配色继续保留。

所有车辆仍等比绘制。小货车可见车体约80×33.1，大卡车约102×40，保留明确的尺寸递进；对应碰撞尺寸80×34、110×40及驾驶参数不变。

## 完整提示词

### mobile-van-prompt

```text
Use case: style-transfer. Asset: transparent top-down mobile parking-game sprite, often only80px long. IMAGE1 is EDIT TARGET orange cab/white box small delivery truck. IMAGE2 is STYLE REFERENCE ONLY our existing orange passenger car. Redraw IMAGE1 in IMAGE2's simple clean friendly bold game illustration style. Keep small delivery truck identity, orange cab on RIGHT, ivory cargo box on LEFT, short wide chassis aspect length:width near2.35:1 excluding mirrors/tires. Same overhead orientation, body/cab proportion and complete truck silhouette. Major visible change: replace photoreal gradients, metallic trim, panel hardware, tiny hinges, screws, tread texture, roof corrugations and seams with broad opaque color blocks, soft rounded corners and thick consistent near-black contours matching car. Cargo top one warm ivory rounded rectangle with at most one broad simple inset shadow; no ribs, locks or hinges on top. Cab top opaque orange with subtle same-hue flat shading, NO four grooves. One large pale mint front windshield near RIGHT nose with a SINGLE cream reflection and small black wiper, no tiny glass partitions. Two cream headlights at RIGHT front, two red tail lights at LEFT rear; simple charcoal wheel tabs without tread, small round-edged mirrors. Glass and lights must read at tiny mobile size. Flat 2D neo-brutalist illustrated quality, sparse details, smoothly rounded chassis corners, no painterly brushwork, no3D lighting. Strict ORTHOGRAPHIC TOP DOWN roof view, horizontal long axis, front RIGHT, bilateral symmetry, no sidewalls/perspective. Genuine transparent alpha background, one whole vehicle only, no text, logo, number, badge, ground shadow or scene. Vehicle centered with transparent margin on landscape1536x1024 composition. Body ratio2.35:1 critical; don't lengthen the truck.
```

### mobile-van-final-prompt

```text
Use case: precise-object-edit. Keep this EXACT simple orange cab / ivory box delivery truck design and its clean thick outlined mobile-game illustration. ONLY correct proportions: significantly shorten the white cargo compartment from left to right, and broaden BOTH cargo and cab so the painted main chassis is a SHORT WIDE rectangle near2.1:1 (example 1050px long and500px wide). Current image is too long/slender around2.85:1. This edit must visibly make it much stockier. The white box should be HALF the total length, the orange cab HALF. Do not make the white cargo box longer than half. Main body from rear bumper to front bumper should be about2.1:1 excluding outside mirrors/tires. Keep big pale mint windshield at RIGHT front, single cream glass reflection, black wiper, cream front lights RIGHT, red tail lights LEFT, plain warm ivory box top, plain orange cab roof, simple black wheels, same rounded shapes, same colors, same consistent thick black line. No new detail. Redraw naturally into wider proportions, no pixel stretching, no perspective. Strict orthographic overhead roof view, horizontal, front RIGHT, bilateral symmetry. Single whole compact truck on genuine transparent alpha, centered on a1536x1024 canvas with transparent margins. No text, logo, badge or ground shadow. The important change is compactness, shorter cargo box and much wider painted body.
```

### mobile-truck-prompt

```text
Use case: style-transfer. Asset: transparent top-down mobile parking-game sprite often110px long. IMAGE1 is EDIT TARGET blue cab/olive tarp large rigid truck. IMAGE2 is STYLE REFERENCE ONLY existing orange passenger car. Redraw IMAGE1 in IMAGE2's simple clean friendly bold illustration style, matching thick near-black outlines, sparse broad color shading and smooth round corners. Keep blue cab RIGHT, olive green tarp cargo LEFT, main body length:width near2.75:1 excluding mirrors/tires. Cab occupies approxone quarter length, tarp three quarters. Strongly SIMPLIFY for tiny mobile display: remove small metallic buckles, hardware, roof ventilation grooves, cargo hooks, tire tread, tiny repetitive wrinkles and realistic3D lighting. Tarp is one large olive rounded rectangle with TWO broad tonal folds and ONLY THREE thick clean dark straps, no busy triangulated cloth texture. Cab top one opaque blue panel with slight same-hue shading, no raised rectangles, vents, or microseams. One big pale mint front windshield at RIGHT nose, single cream reflection and black wiper matching reference car glass. Simple black tire tabs (three axles, no tread), small rounded mirrors, cream headlights at RIGHT, red taillights at LEFT. Flat2D neo-brutalist game illustration, clean painted shapes and consistent bold outline, no brush texture. Strict orthographic TOP DOWN, front RIGHT, bilateral symmetry, no perspective or visible sidewalls. Genuine transparent alpha, one complete truck centered with transparent margin on1536x1024 landscape canvas. No text, logo, number, badge, ground shadow, road or scene. Keep main body around2.75:1, clearly a broader heavy truck not a long thin tractor trailer.
```

### mobile-truck-final-prompt

```text
Use case: precise-object-edit. Keep EXACT simple blue cab / green tarp truck design and clean bold mobile-game style. Change ONLY the long narrow body proportions. Current chassis is far too skinny. REDRAW as a MUCH SHORTER WIDER truck: painted main chassis should be2.2:1 (e.g.1100px long and500px wide), excluding outward wheels/mirrors. Whole silhouette should be around1.85:1. Shorten green cargo section byone third and greatly broaden both green cargo and blue cab. Green cargo occupies HALF to60percent total length and blue cab40percent, NOT a long trailer. This must look visibly broad and stocky. Keep only three bold tarp straps and two broad simple olive tonal folds, no buckles, no texture. Same plain blue rounded cab roof, large pale mint front glass on RIGHT with a SINGLE cream reflection and black wiper, cream headlightsRIGHT/red taillightsLEFT. Black simple tire tabs, three axles, no tread, rounded small blue mirrors. Strict symmetric orthographic top-down roof view, front RIGHT, no perspective. Thick consistent black outlines, flat broad shading exactly like current sprite, no new details. Natural redraw into wider body, not pixel stretching or padding trick. One entire vehicle on transparent alpha, centered on1536x1024 canvas with generous margins. No text/logo/badge/ground shadow. Critical change is much broader painted panels and a shorter cargo, not a slender truck.
```

### mobile-van-blue-prompt

```text
Use case: precise-object-edit. Create ONE BLUE color variant of this exact simple top-down delivery truck sprite. Change ONLY the orange cab paint and orange mirror paint to muted cornflower/denim blue #658fc0 with slightly darker blue shading. Keep warm IVORY cargo box exactly unchanged, keep all black outlines, large pale mint windshield, cream reflection, black wiper, headlights and red taillights, tires, proportions and geometry EXACTLY as reference. Do not add details or extend the white box. Same short wide body, cab HALF length and ivory cargo HALF, front RIGHT, orthographic overhead. Rounded flat game illustration, crisp thick contours, sparse broad shading. No pixel noise, texture, text, logo, ground shadow, glow or halo. One whole truck on genuine transparent alpha. Keep identical framing/aspect as reference1536x1024; this is a paint edit only.
```

### mobile-van-sage-prompt

```text
Use case: precise-object-edit. Create ONE SAGE GREEN color variant of this exact simple top-down delivery truck sprite. Change ONLY orange cab and orange mirror paint to soft sage green #91a77c with slightly darker olive shading. Warm IVORY cargo box stays unchanged. Preserve all outlines, large pale mint windshield with cream reflection and black wiper, cream headlights, red taillights, tire tabs, short wide chassis proportions and geometry EXACTLY. Cab HALF total length and ivory box HALF, front RIGHT, true orthographic overhead. Same rounded clean bold game illustration and sparse broad shading. Do not add panel seams, corrugations, hardware or tread. One whole truck on genuine transparent alpha, identical1536x1024 framing/aspect. No text/logo/badge/scene/ground shadow/glow/halo. Paint-only edit.
```

### mobile-van-lavender-prompt

```text
Use case: precise-object-edit. ONE LAVENDER PURPLE cab color variant of this exact simple top-down delivery truck. Change ONLY orange cab paint and orange mirrors to muted lavender #a58cbb with deeper mauve shadows. Keep warm IVORY cargo top unchanged, all black contours, pale mint windshield, single cream reflection, wiper, cream front lights RIGHT, red tail lights LEFT, tire tabs, body proportions, rounding and all positions EXACTLY same. Cab HALF total length and ivory cargo HALF, no elongation. Sparse simple bold mobile game illustration, strict orthographic overhead, front RIGHT. Genuine transparent alpha background; whole truck only, keep same1536x1024 framing/aspect. No new texture, detail, text, logo, ground shadow, glow or halo. This is paint-only recoloring.
```

### mobile-truck-coral-prompt

```text
Use case: precise-object-edit. Make ONE new paint combination of this EXACT simple overhead tarp truck. Change blue cab and blue mirrors to muted brick CORAL RED #d66b56, change olive tarp top to warm SAND BEIGE #c8b48b with slightly deeper tan folds. Preserve EXACT current short broad chassis shape, body/cab lengths, thick rounded black contours, THREE straps, TWO broad folds, simple three-axle wheel tabs, large pale mint front windshield and its single cream reflection/wiper, cream headlightsRIGHT/red taillightsLEFT. Recolor only, no new detail, no realistic texture, no hardware, no roof seams or tire tread. Same flat clean bold mobile-game style and strict orthographic TOP DOWN, front RIGHT, bilateral symmetry. Whole vehicle isolated on genuine transparent alpha, same1536x1024 framing/aspect, no text/logo/badge/road/ground shadow/halo/glow.
```

### mobile-truck-sage-prompt

```text
Use case: precise-object-edit. Make ONE new paint combination of this EXACT simple overhead tarp truck. Change blue cab and mirrors to muted SAGE GREEN #91a77c, and olive tarp to warm IVORY CREAM #e6dcc3 with deeper beige broad folds. Keep EXACT chassis proportions and silhouette, cab/cargo length, thick rounded black outlines, THREE dark tarp straps and TWO broad folds, all simple wheel tabs, large pale mint windshield, single cream reflection and black wiper. Cream headlightsRIGHT and red taillightsLEFT stay unchanged. Paint-only edit, no added details, no seams, hinges, hardware, tread, texture or photoreal lighting. Same clean bold flat mobile-game illustration, front RIGHT, strict orthographic overhead symmetry. One whole truck on genuine transparent alpha, preserve same1536x1024 canvas framing/aspect, no text/logo/badge/ground shadow/halo/glow.
```

### mobile-truck-ochre-prompt

```text
Use case: precise-object-edit. Make ONE new paint combination of this EXACT simple overhead tarp truck. Change blue cab and mirrors to warm MUSTARD OCHRE #d6ae55, change olive tarp to muted SLATE BLUE GRAY #8297ab with darker slate broad folds. Preserve EXACT short broad body proportions, rounded black contours, cab/cargo length, THREE bold dark straps, TWO broad folds, three-axle simple black wheel tabs, pale mint windshield with one cream reflection and wiper, cream headlightsRIGHT, red taillightsLEFT. Change colors only. No texture, no extra hardware, no vents, no tiny details or tread. Match existing clean flat bold mobile game illustration. Strict symmetric orthographic top-down view, front RIGHT. One whole truck on genuine transparent alpha with same1536x1024 framing/aspect as reference. No text/logo/badge/scene/ground shadow/halo/glow.
```
