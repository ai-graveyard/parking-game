# 货车短车头与长货厢 — 2026-10-25

> Release cleanup (2026-10-26): historical screenshots and previews were archived. Old image paths below record provenance only; see [cleanup record](../ASSET_CLEANUP.md).

> 图片清理说明（2026-10-25）：本文保留历史方案与提示词；已淘汰的车辆图片和旧对比图已删除，文内旧路径仅作历史记录。当前资源见[车辆素材索引](README.md)。

> 后续用户修正：大卡车四款已恢复为 `mirror-truck*.png` 与原车体定位框、备用绘图比例；下文卡车短车头记录仅为历史方案，不再用于运行。小货车的接缝过渡先做单张橙色预览，待用户确认，未批量生成或接入。

按用户要求修改当前小货车四款、大卡车四款：缩短驾驶室，增加货厢长度，整车总长不变。内置 ImageGen 分别编辑八款现有 PNG，保留配色、方车尾、前后灯、玻璃和小后视镜；没有程序改色或局部拉伸。

## 接入与验证

- 新运行素材：`src/assets/vehicles/short-cab-van*.png`、`short-cab-truck*.png`。原 `mirror-*` 素材保留。玩家、目标位与邻车共用更新后的素材入口；加载失败时的备用绘图也缩短车头并延长货厢。
- 透明裁切后仅等比缩小。小货车 512 像素宽，大卡车 768 像素宽；透明度保留。
- 每款独立校准车体定位框，按现有 `min(length / body.width, width / body.height)` 等比绘制；八款可见车体长度分别精确为世界尺寸 80 / 128。碰撞尺寸 80×34 / 128×40、驾驶与关卡参数未改。
- 生成重绘后的可见宽度约为小货车 30.45–32.47、大卡车 34.24–36.04；相较原图略窄。没有为恢复宽度而做横纵独立拉伸。
- 八款源图及运行图按 alpha > 64 检查，前部后视镜的整个列区间均未超出轮胎上下外沿。详细原图、裁切、尺寸、定位框和边界检查见 `short-cabs.json`。
- `npm run check` 与技能静态审计通过；完整玩法回归结果记录于 `design-qa.md`。
- 普通本地浏览器 320×568、390×844 检查八款加载成功，页面错误为 0、无横向溢出，报告见 `short-cabs-browser.json`。截图为 `short-cabs-van-320.png`、`short-cabs-van-390.png`、`short-cabs-truck-320.png`、`short-cabs-truck-390.png`。
- `short-cabs-comparison.png` 左旧右新，每一行使用同一世界倍率展示；总长相同。

上述浏览器检查只验证本地显示，不等同小红书容器验收。本次未打包、上传或发布，Chrome 61、创服平台模拟器、Android 和 iOS 真机仍未验证。

## 完整 ImageGen 提示词

### van

编辑目标：`src/assets/vehicles/mirror-van.png`

```text
Use case: precise-object-edit. EDIT TARGET: supplied existing small box delivery truck sprite for a top-down mobile parking game. Primary request: shorten the RIGHT colored driver's CAB length by 20 percent and extend LEFT cargo compartment into the freed space, keeping EXACT overall bumper-to-bumper LENGTH and body WIDTH and chassis aspect ratio. Move the cab/cargo junction RIGHT; keep leftmost rear and rightmost front positions unchanged. Current cab is nearly half the vehicle: make cab 38-40 percent and ivory rigid box 60-62 percent of total length. Naturally redraw shorter cab roof and windshield within the new shorter cab, do not just crop away windshield or lights. Preserve exact paint colors of this reference, thick near-black contour style, square straight LEFT rear with small red rectangular taillights, cream RIGHT headlights, large pale mint front windshield with one reflection and wiper, simple dark tire tabs, and TINY compact mirrors tucked INSIDE outermost tire edges. Do NOT enlarge mirrors. Retain number of axles; front wheels can move right naturally with the shorter cab. Preserve strict symmetric orthographic top-down view, front RIGHT, no perspective or sidewalls. Exact same complete vehicle length:width ratio as reference. Crisp sparse mobile game illustration, no new details/hardware/texture/text/logo/shadow/glow/halo. One single whole vehicle, genuine alpha TRANSPARENT background, centered with margins. Main change is a visibly SHORTER CAB and LONGER CARGO inside unchanged vehicle dimensions.
```

### van-blue

编辑目标：`src/assets/vehicles/mirror-van-blue.png`

```text
Use case: precise-object-edit. EDIT TARGET: supplied existing small box delivery truck sprite for a top-down mobile parking game. Primary request: shorten the RIGHT colored driver's CAB length by 20 percent and extend LEFT cargo compartment into the freed space, keeping EXACT overall bumper-to-bumper LENGTH and body WIDTH and chassis aspect ratio. Move the cab/cargo junction RIGHT; keep leftmost rear and rightmost front positions unchanged. Current cab is nearly half the vehicle: make cab 38-40 percent and ivory rigid box 60-62 percent of total length. Naturally redraw shorter cab roof and windshield within the new shorter cab, do not just crop away windshield or lights. Preserve exact paint colors of this reference, thick near-black contour style, square straight LEFT rear with small red rectangular taillights, cream RIGHT headlights, large pale mint front windshield with one reflection and wiper, simple dark tire tabs, and TINY compact mirrors tucked INSIDE outermost tire edges. Do NOT enlarge mirrors. Retain number of axles; front wheels can move right naturally with the shorter cab. Preserve strict symmetric orthographic top-down view, front RIGHT, no perspective or sidewalls. Exact same complete vehicle length:width ratio as reference. Crisp sparse mobile game illustration, no new details/hardware/texture/text/logo/shadow/glow/halo. One single whole vehicle, genuine alpha TRANSPARENT background, centered with margins. Main change is a visibly SHORTER CAB and LONGER CARGO inside unchanged vehicle dimensions.
```

### van-sage

编辑目标：`src/assets/vehicles/mirror-van-sage.png`

```text
Use case: precise-object-edit. EDIT TARGET: supplied existing small box delivery truck sprite for a top-down mobile parking game. Primary request: shorten the RIGHT colored driver's CAB length by 20 percent and extend LEFT cargo compartment into the freed space, keeping EXACT overall bumper-to-bumper LENGTH and body WIDTH and chassis aspect ratio. Move the cab/cargo junction RIGHT; keep leftmost rear and rightmost front positions unchanged. Current cab is nearly half the vehicle: make cab 38-40 percent and ivory rigid box 60-62 percent of total length. Naturally redraw shorter cab roof and windshield within the new shorter cab, do not just crop away windshield or lights. Preserve exact paint colors of this reference, thick near-black contour style, square straight LEFT rear with small red rectangular taillights, cream RIGHT headlights, large pale mint front windshield with one reflection and wiper, simple dark tire tabs, and TINY compact mirrors tucked INSIDE outermost tire edges. Do NOT enlarge mirrors. Retain number of axles; front wheels can move right naturally with the shorter cab. Preserve strict symmetric orthographic top-down view, front RIGHT, no perspective or sidewalls. Exact same complete vehicle length:width ratio as reference. Crisp sparse mobile game illustration, no new details/hardware/texture/text/logo/shadow/glow/halo. One single whole vehicle, genuine alpha TRANSPARENT background, centered with margins. Main change is a visibly SHORTER CAB and LONGER CARGO inside unchanged vehicle dimensions.
```

### van-lavender

编辑目标：`src/assets/vehicles/mirror-van-lavender.png`

```text
Use case: precise-object-edit. EDIT TARGET: supplied existing small box delivery truck sprite for a top-down mobile parking game. Primary request: shorten the RIGHT colored driver's CAB length by 20 percent and extend LEFT cargo compartment into the freed space, keeping EXACT overall bumper-to-bumper LENGTH and body WIDTH and chassis aspect ratio. Move the cab/cargo junction RIGHT; keep leftmost rear and rightmost front positions unchanged. Current cab is nearly half the vehicle: make cab 38-40 percent and ivory rigid box 60-62 percent of total length. Naturally redraw shorter cab roof and windshield within the new shorter cab, do not just crop away windshield or lights. Preserve exact paint colors of this reference, thick near-black contour style, square straight LEFT rear with small red rectangular taillights, cream RIGHT headlights, large pale mint front windshield with one reflection and wiper, simple dark tire tabs, and TINY compact mirrors tucked INSIDE outermost tire edges. Do NOT enlarge mirrors. Retain number of axles; front wheels can move right naturally with the shorter cab. Preserve strict symmetric orthographic top-down view, front RIGHT, no perspective or sidewalls. Exact same complete vehicle length:width ratio as reference. Crisp sparse mobile game illustration, no new details/hardware/texture/text/logo/shadow/glow/halo. One single whole vehicle, genuine alpha TRANSPARENT background, centered with margins. Main change is a visibly SHORTER CAB and LONGER CARGO inside unchanged vehicle dimensions.
```

### truck

编辑目标：`src/assets/vehicles/mirror-truck.png`

```text
Use case: precise-object-edit. EDIT TARGET: supplied existing long tarp cargo truck sprite for a top-down mobile parking game. Primary request: shorten the RIGHT colored driver's CAB length by 20 percent and extend LEFT cargo compartment into the freed space, keeping EXACT overall bumper-to-bumper LENGTH and body WIDTH and chassis aspect ratio. Move the cab/cargo junction RIGHT; keep leftmost rear and rightmost front positions unchanged. Current cab is about 27 percent: make it 21-22 percent and tarp cargo 78-79 percent of total length. Keep THREE dark tarp straps and broad tonal folds. Naturally redraw shorter cab roof and windshield within the new shorter cab, do not just crop away windshield or lights. Preserve exact paint colors of this reference, thick near-black contour style, square straight LEFT rear with small red rectangular taillights, cream RIGHT headlights, large pale mint front windshield with one reflection and wiper, simple dark tire tabs, and TINY compact mirrors tucked INSIDE outermost tire edges. Do NOT enlarge mirrors. Retain number of axles; front wheels can move right naturally with the shorter cab. Preserve strict symmetric orthographic top-down view, front RIGHT, no perspective or sidewalls. Exact same complete vehicle length:width ratio as reference. Crisp sparse mobile game illustration, no new details/hardware/texture/text/logo/shadow/glow/halo. One single whole vehicle, genuine alpha TRANSPARENT background, centered with margins. Main change is a visibly SHORTER CAB and LONGER CARGO inside unchanged vehicle dimensions.
```

### truck-coral

编辑目标：`src/assets/vehicles/mirror-truck-coral.png`

```text
Use case: precise-object-edit. EDIT TARGET: supplied existing long tarp cargo truck sprite for a top-down mobile parking game. Primary request: shorten the RIGHT colored driver's CAB length by 20 percent and extend LEFT cargo compartment into the freed space, keeping EXACT overall bumper-to-bumper LENGTH and body WIDTH and chassis aspect ratio. Move the cab/cargo junction RIGHT; keep leftmost rear and rightmost front positions unchanged. Current cab is about 27 percent: make it 21-22 percent and tarp cargo 78-79 percent of total length. Keep THREE dark tarp straps and broad tonal folds. Naturally redraw shorter cab roof and windshield within the new shorter cab, do not just crop away windshield or lights. Preserve exact paint colors of this reference, thick near-black contour style, square straight LEFT rear with small red rectangular taillights, cream RIGHT headlights, large pale mint front windshield with one reflection and wiper, simple dark tire tabs, and TINY compact mirrors tucked INSIDE outermost tire edges. Do NOT enlarge mirrors. Retain number of axles; front wheels can move right naturally with the shorter cab. Preserve strict symmetric orthographic top-down view, front RIGHT, no perspective or sidewalls. Exact same complete vehicle length:width ratio as reference. Crisp sparse mobile game illustration, no new details/hardware/texture/text/logo/shadow/glow/halo. One single whole vehicle, genuine alpha TRANSPARENT background, centered with margins. Main change is a visibly SHORTER CAB and LONGER CARGO inside unchanged vehicle dimensions.
```

### truck-sage

编辑目标：`src/assets/vehicles/mirror-truck-sage.png`

```text
Use case: precise-object-edit. EDIT TARGET: supplied existing long tarp cargo truck sprite for a top-down mobile parking game. Primary request: shorten the RIGHT colored driver's CAB length by 20 percent and extend LEFT cargo compartment into the freed space, keeping EXACT overall bumper-to-bumper LENGTH and body WIDTH and chassis aspect ratio. Move the cab/cargo junction RIGHT; keep leftmost rear and rightmost front positions unchanged. Current cab is about 27 percent: make it 21-22 percent and tarp cargo 78-79 percent of total length. Keep THREE dark tarp straps and broad tonal folds. Naturally redraw shorter cab roof and windshield within the new shorter cab, do not just crop away windshield or lights. Preserve exact paint colors of this reference, thick near-black contour style, square straight LEFT rear with small red rectangular taillights, cream RIGHT headlights, large pale mint front windshield with one reflection and wiper, simple dark tire tabs, and TINY compact mirrors tucked INSIDE outermost tire edges. Do NOT enlarge mirrors. Retain number of axles; front wheels can move right naturally with the shorter cab. Preserve strict symmetric orthographic top-down view, front RIGHT, no perspective or sidewalls. Exact same complete vehicle length:width ratio as reference. Crisp sparse mobile game illustration, no new details/hardware/texture/text/logo/shadow/glow/halo. One single whole vehicle, genuine alpha TRANSPARENT background, centered with margins. Main change is a visibly SHORTER CAB and LONGER CARGO inside unchanged vehicle dimensions.
```

### truck-ochre

编辑目标：`src/assets/vehicles/mirror-truck-ochre.png`

```text
Use case: precise-object-edit. EDIT TARGET: supplied existing long tarp cargo truck sprite for a top-down mobile parking game. Primary request: shorten the RIGHT colored driver's CAB length by 20 percent and extend LEFT cargo compartment into the freed space, keeping EXACT overall bumper-to-bumper LENGTH and body WIDTH and chassis aspect ratio. Move the cab/cargo junction RIGHT; keep leftmost rear and rightmost front positions unchanged. Current cab is about 27 percent: make it 21-22 percent and tarp cargo 78-79 percent of total length. Keep THREE dark tarp straps and broad tonal folds. Naturally redraw shorter cab roof and windshield within the new shorter cab, do not just crop away windshield or lights. Preserve exact paint colors of this reference, thick near-black contour style, square straight LEFT rear with small red rectangular taillights, cream RIGHT headlights, large pale mint front windshield with one reflection and wiper, simple dark tire tabs, and TINY compact mirrors tucked INSIDE outermost tire edges. Do NOT enlarge mirrors. Retain number of axles; front wheels can move right naturally with the shorter cab. Preserve strict symmetric orthographic top-down view, front RIGHT, no perspective or sidewalls. Exact same complete vehicle length:width ratio as reference. Crisp sparse mobile game illustration, no new details/hardware/texture/text/logo/shadow/glow/halo. One single whole vehicle, genuine alpha TRANSPARENT background, centered with margins. Main change is a visibly SHORTER CAB and LONGER CARGO inside unchanged vehicle dimensions.
```
