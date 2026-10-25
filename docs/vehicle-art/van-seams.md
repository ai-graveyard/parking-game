# 已确认的小货车接缝过渡 — 2026-10-25

用户确认 `van-seam-review.png` 后，将该原图等比缩小作为橙色小货车；蓝、绿、紫三款使用内置 ImageGen 基于同一确认稿生成，仅改变驾驶室和小后视镜配色。

运行素材：`src/assets/vehicles/seam-van.png`、`seam-van-blue.png`、`seam-van-sage.png`、`seam-van-lavender.png`。玩家、目标预览及邻车均接入对应素材。

四款均保留短车头、长货厢、窄的深灰连接段、方车尾与轮胎外沿以内的小后视镜。透明裁切后等比缩小为512像素宽，保持alpha；没有程序改色或局部拉伸。独立定位框保证可见车体总长仍精确为世界尺寸80，碰撞尺寸80×34未变。定位、裁切、源图、边界检查见 `van-seams.json`。

大卡车四款继续使用原 `mirror-truck*.png` 与对应原车体框，所有卡车PNG的SHA-256在本次接入前后完全相同；备用绘图仅给小货车添加深灰接缝连接段。

验证：`npm run check`、`node scripts/test-game.cjs`、静态审计与 `git diff --check` 通过；主线16关×3视口、720随机布局及驾驶/停车回归通过。本地浏览器320×568、390×844检查四款小货车和原版大卡车加载，报告 `van-seams-browser.json`；本次未打包发布，平台与真机未验收。

## ImageGen 完整提示词

### van

源图：`/Users/ailln/Workspace/my/github/parking-game/docs/vehicle-art/van-seam-review.png`

```text
Use case: precise-object-edit. Generate exactly ONE review candidate of the orange/ivory SMALL DELIVERY TRUCK, no other color variants or vehicles. Image 1 is the EDIT TARGET: our existing shorter-cab/longer-cargo sprite. Image 2 is a supporting reference ONLY for the subtle recessed connector seam between cargo and cab; do NOT copy its longer cab or shorter cargo. Primary request: at the junction between the LEFT ivory cargo box and RIGHT orange cab, preserve a small visible transition instead of joining both blocks completely flush. Add a narrow recessed charcoal/dark-gray chassis connector gap, about 1.5-2 percent of total truck length, bounded by the existing bold black outlines; slightly inset at top and bottom so cargo and cab read as two separate connected parts. A single restrained gray highlight on this connector is enough, no machinery or new panel details. This should be a subtle short transition, NOT a long exposed chassis or trailer joint. Keep Image 1's shorter cab and longer cargo, exact overall bumper-to-bumper length and width and silhouette aspect. Accommodate this tiny connector inside the existing total length. Preserve existing square cargo rear, warm ivory box, orange cab, pale mint windshield with one cream reflection and wiper, cream front lights RIGHT, red tail lights LEFT, simple dark wheel tabs, and tiny orange mirrors INSIDE outermost tire edges. Same crisp simple top-down mobile game illustration, thick consistent black contour, sparse broad colors, front RIGHT, bilateral symmetry, no perspective or sidewalls. Genuine alpha TRANSPARENT background, one whole truck only, landscape framing with margins. No text, logo, badge, ground shadow, glow, halo, comparison layout, extra objects, or other variants. Change only the small cargo-to-cab transition; preserve the selected short cab proportions.
```

### van-blue

源图：`/Users/ailln/.codex/generated_images/01a172eb-ba88-72b0-bca2-c070296b8402/exec-6fba852f-b1d3-411a-bb12-a968e1b7e1ac.png`

```text
Use case: precise-object-edit. Image 1 is the APPROVED production small delivery truck edit target. Image 2 is a color reference ONLY for the blue cab paint. Make ONE paint variant of Image 1: change ONLY the orange CAB and tiny orange mirror paint to muted denim blue #658fc0, with subtle tonal shading matching Image 2. Keep the warm ivory cargo box unchanged. CRITICAL: preserve EXACT Image 1 geometry, short cab/long cargo proportions, body length and width, flat square cargo rear, narrow recessed dark gray connector between cargo and cab with its restrained gray highlight, all wheel positions, pale mint windshield/single cream reflection/wiper, cream right headlights, red left taillights, thick black contours, tiny mirrors INSIDE tire outer edges, and transparent alpha. Do not close or widen the connector gap. Do not copy Image 2 geometry. No cargo/cab resizing, no longer cab, no new hardware, no perspective or sidewalls, no texture/detail, no text/logo/shadow/glow/halo. Strict symmetric orthographic top-down, front RIGHT. A single whole vehicle, exact same framing and silhouette as Image 1; only orange paint changes to muted denim blue #658fc0.
```

### van-sage

源图：`/Users/ailln/.codex/generated_images/01a172eb-ba88-72b0-bca2-c070296b8402/exec-578ccc0f-049a-4af7-975b-394b944ed259.png`

```text
Use case: precise-object-edit. Image 1 is the APPROVED production small delivery truck edit target. Image 2 is a color reference ONLY for the sage cab paint. Make ONE paint variant of Image 1: change ONLY the orange CAB and tiny orange mirror paint to soft sage green #91a77c, with subtle tonal shading matching Image 2. Keep the warm ivory cargo box unchanged. CRITICAL: preserve EXACT Image 1 geometry, short cab/long cargo proportions, body length and width, flat square cargo rear, narrow recessed dark gray connector between cargo and cab with its restrained gray highlight, all wheel positions, pale mint windshield/single cream reflection/wiper, cream right headlights, red left taillights, thick black contours, tiny mirrors INSIDE tire outer edges, and transparent alpha. Do not close or widen the connector gap. Do not copy Image 2 geometry. No cargo/cab resizing, no longer cab, no new hardware, no perspective or sidewalls, no texture/detail, no text/logo/shadow/glow/halo. Strict symmetric orthographic top-down, front RIGHT. A single whole vehicle, exact same framing and silhouette as Image 1; only orange paint changes to soft sage green #91a77c.
```

### van-lavender

源图：`/Users/ailln/.codex/generated_images/01a172eb-ba88-72b0-bca2-c070296b8402/exec-9a4065e2-9b03-43a5-820d-f2d5ff57df72.png`

```text
Use case: precise-object-edit. Image 1 is the APPROVED production small delivery truck edit target. Image 2 is a color reference ONLY for the lavender cab paint. Make ONE paint variant of Image 1: change ONLY the orange CAB and tiny orange mirror paint to muted lavender purple #a58cbb, with subtle tonal shading matching Image 2. Keep the warm ivory cargo box unchanged. CRITICAL: preserve EXACT Image 1 geometry, short cab/long cargo proportions, body length and width, flat square cargo rear, narrow recessed dark gray connector between cargo and cab with its restrained gray highlight, all wheel positions, pale mint windshield/single cream reflection/wiper, cream right headlights, red left taillights, thick black contours, tiny mirrors INSIDE tire outer edges, and transparent alpha. Do not close or widen the connector gap. Do not copy Image 2 geometry. No cargo/cab resizing, no longer cab, no new hardware, no perspective or sidewalls, no texture/detail, no text/logo/shadow/glow/halo. Strict symmetric orthographic top-down, front RIGHT. A single whole vehicle, exact same framing and silhouette as Image 1; only orange paint changes to muted lavender purple #a58cbb.
```
