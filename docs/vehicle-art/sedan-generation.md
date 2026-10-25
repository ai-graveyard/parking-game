# 小轿车画风统一

> Release cleanup (2026-10-26): historical screenshots and previews were archived. Old image paths below record provenance only; see [cleanup record](../ASSET_CLEANUP.md).

> 图片清理说明（2026-10-25）：本文保留历史方案与提示词；已淘汰的车辆图片和旧对比图已删除，文内旧路径仅作历史记录。当前资源见[车辆素材索引](README.md)。

生成方式：内置 ImageGen。使用当前已安装的小货车与大卡车 PNG 作为画风参考，生成红色小轿车。

参考图：

- `src/assets/vehicles/van-box.png`
- `src/assets/vehicles/truck-tarp.png`

原始图：`/Users/ailln/.codex/generated_images/01a16723-91d5-7520-8094-b0ef486d308f/exec-ddb9f96e-07f7-4884-a1fa-498427b2006d.png`，1733×907，RGBA 真透明。

游戏素材：`src/assets/vehicles/car-sedan.png`，640×313。透明留白裁切范围 (49,48)-(1689,851)，等比缩小；保留原始 alpha。车身基准矩形 x=1.171, y=27.317, width=637.659, height=261.463，绘制时对应既有 46×24 游戏车身，轮胎与后视镜自然突出。无碰撞、速度或转向参数修改。

玩家、邻车与车位预览统一由 `drawVehicleArt()` 绘制，图片尚未就绪时保留原绘制回退。“你”的标记位于小轿车车顶中央。

## 实际生成提示词

```text
Use case: stylized-concept. Asset type: transparent 2D overhead parking-game sprite. The attached images are STYLE REFERENCES ONLY: match their polished cartoon vehicle illustration, dark outline weight, clean painted panels, restrained highlights, dark blue-gray glass, detailed black tires and readable lights. Generate ONE compact small passenger SEDAN, coral RED painted body (slightly redder than the reference orange cab). Absolutely strict orthographic TOP DOWN overhead roof view, bilateral symmetry across horizontal centerline, front/nose points RIGHT, rear/tail LEFT. Compact rounded body, main body length:width exactly 1.92:1 to fit a 46x24 game footprint. Four narrow black tread tire slivers, two small symmetric side mirrors, front hood at right, cabin roof around center, front windshield and rear windshield clearly separate, subtle door seams. White headlights only at right front corners, red tail lights only at left rear corners; front direction immediately obvious. A simple recognizable everyday compact sedan, not truck, not sports car, no spoiler. Roof opaque red, no sunroof so player marker remains legible. Match the reference trucks' clean thick black contour and dimensional panel shading without adding photorealistic texture. Single complete car isolated on genuine alpha transparent background, centered with tight margins. No visible side walls, no circular wheel faces, no perspective, no tilt, no ground shadow, no glow, no haze, no text, no letters, no logos, no road. Delivered raster should stay crisp at small game sizes.
```

## 本地验证

`npm run check`、`npm test`、`git diff --check` 通过。浏览器检查第 01 关正向玩家、90° 邻车、半透明目标预览、前进、转向与暂停，未见控制台错误。三车并排实机效果见 `unified-vehicles-preview.png`；局部画风核对见 `unified-vehicles-detail.png`。

此为本地画风更新，未打包发布；不构成小红书容器或真机验收。
