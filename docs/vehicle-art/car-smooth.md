# 小轿车轮廓圆润化 — 2026-10-25

> Release cleanup (2026-10-26): historical screenshots and previews were archived. Old image paths below record provenance only; see [cleanup record](../ASSET_CLEANUP.md).

> 图片清理说明（2026-10-25）：本文保留历史方案与提示词；已淘汰的车辆图片和旧对比图已删除，文内旧路径仅作历史记录。当前资源见[车辆素材索引](README.md)。

按用户要求，将橙红玩家车和蓝、鼠尾草绿、奶油黄、浅紫邻车全部改为圆润轮廓。车头/车尾、前后车窗、后视镜和车灯的硬折角改成连续曲线，减少车身折线。保留紧凑车身、粗黑描边、同色系车顶、深后窗/浅前风挡和车灯方向。

使用内置 ImageGen，分别编辑原有五张 `car-compact*.png`，透明背景。每张输出均为1604×981 RGBA，仅用Sharp等比缩小至768×470，不做模糊、非等比拉伸或程序改色。运行文件为：

- `src/assets/vehicles/car-smooth.png`
- `src/assets/vehicles/car-smooth-blue.png`
- `src/assets/vehicles/car-smooth-sage.png`
- `src/assets/vehicles/car-smooth-cream.png`
- `src/assets/vehicles/car-smooth-lavender.png`

原始输出路径、独立车身定位框与实际显示尺寸见 `car-smooth.json`。车身边界取图像中央行/列的 alpha>10 主体范围，排除轮胎和后视镜。所有图片沿用现有等比绘制逻辑，实际车身长46、宽约22～23。邻车配色分配、碰撞尺寸、驾驶参数和关卡几何不变。原生Canvas回退车形同步圆滑车尾。

## 验证

`npm run check`、`node scripts/test-game.cjs` 与 `git diff --check` 通过；现有玩法检查涵盖16关×3种视口、720组随机布局和玩家箭头时机。几何与驾驶参数未改变，本轮未重复求解全部路线。

`car-smooth-comparison.png` 为旧橙红车和圆润版的等比缩小对比。`car-smooth-reverse.png` 与 `car-smooth-parallel.png` 为1280×720的实机全屏截图，分别覆盖绿/蓝邻车与黄/紫邻车，橙红玩家与黄色目标预览同步更新。`car-smooth-preview.png` 裁去浏览器两侧空白后并排展示，两列各520×720，未放大车辆。检查了完整场景：车窗轮廓、车头/尾方向和各配色可辨，透明边缘、停车标线与控制区正常。刷新后的浏览器错误日志为空。未打包发布或做设备验收。

## 完整生成提示词

橙红车以 `car-compact.png` 为唯一编辑目标：

```text
Use case: precise-object-edit. Asset: production 2D parking-game sprite. Edit target: the supplied orange-red compact car. Smooth this SAME compact car's angular silhouette and BOTH glass shapes substantially. Make the main body a friendly compact rounded rectangle: soft continuously curved front nose and rear corners, smoothly rounded shoulders, no sharp polygon bevels. Replace the polygonal pale mint front windshield RIGHT and dark smoky teal rear windshield LEFT with clean gently curved glass panels, generous rounded corners, flowing edges, no pointed vertices or jagged folds. Smooth mirror housings and headlights too. Reduce sharp zigzag body seams and angular hood creases into a few subtle curved accents. Keep short wide body length:width near 2:1, NOT a long sedan. Retain orange-red matching roof/body paint, subtle tonal roof highlight, simple dark side recess shadows, thick consistent black outline, pale front windshield with one cream reflection and simple black wiper, dark rear windshield, cream headlights on RIGHT and red taillights LEFT, black small tire slivers. Strict orthographic overhead view, front points RIGHT, bilateral symmetry. Single entire car, centered on genuine transparent alpha background with complete mirrors and wheels, no ground shadow. Preserve existing simple bold game illustration style and same framing/aspect ratio as source. Smooth CURVE GEOMETRY rather than blurring the bitmap: edges remain crisp, no blur, no soft focus. No logos, text, extra features, racing stripes, sunroof, photorealism, visible side faces or perspective. Output one orange-red car only.
```

四色邻车分别以对应 `car-compact-<color>.png` 为唯一编辑目标，使用下列完整模板，依次将 `COLOR` 替换为 `muted cornflower BLUE`、`soft SAGE GREEN`、`warm CREAM YELLOW`、`muted LAVENDER PURPLE`：

```text
Use case: precise-object-edit. Asset: production 2D parking-game sprite. Edit target: the supplied compact car. Smooth this SAME compact car's angular silhouette and BOTH glass shapes substantially. Make the main body a friendly compact rounded rectangle: soft continuously curved front nose and rear corners, smoothly rounded shoulders, no sharp polygon bevels. Replace the polygonal pale mint front windshield RIGHT and dark smoky teal rear windshield LEFT with clean gently curved glass panels, generous rounded corners, flowing edges, no pointed vertices or jagged folds. Smooth mirror housings and headlights too. Reduce sharp zigzag body seams and angular hood creases into a few subtle curved accents. Keep short wide body length:width near 2:1, NOT a long sedan. Retain COLOR painted body and matching roof, subtle tonal roof highlight, simple dark side recess shadows, thick consistent black outline, pale front windshield with one cream reflection and simple black wiper, dark rear windshield, cream headlights on RIGHT and red taillights LEFT, black small tire slivers. Strict orthographic overhead view, front points RIGHT, bilateral symmetry. Single entire car, centered on genuine transparent alpha background with complete mirrors and wheels, no ground shadow. Preserve existing simple bold game illustration style and same framing/aspect ratio as source. Smooth CURVE GEOMETRY rather than blurring the bitmap: edges remain crisp, no blur, no soft focus. No logos, text, extra features, racing stripes, sunroof, photorealism, visible side faces or perspective. Output one COLOR car only.
```
