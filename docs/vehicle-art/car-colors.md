# 小轿车多色邻车 — 2026-10-25

> Release cleanup (2026-10-26): historical screenshots and previews were archived. Old image paths below record provenance only; see [cleanup record](../ASSET_CLEANUP.md).

> 图片清理说明（2026-10-25）：本文保留历史方案与提示词；已淘汰的车辆图片和旧对比图已删除，文内旧路径仅作历史记录。当前资源见[车辆素材索引](README.md)。

按用户确认，同一停车区域混合停放不同颜色的小轿车。玩家和黄色目标位预览保留橙红车；邻车使用蓝、鼠尾草绿、奶油黄、浅紫色。车顶与各自车身保持同色系，沿用当前紧凑造型、深后窗、浅前风挡和粗黑轮廓。

使用内置 ImageGen 对 `src/assets/vehicles/car-compact.png` 分别做四次配色编辑。每个输出为1604×981 RGBA，运行素材经 Sharp 等比缩小至768×470，保留透明背景。车身定位依据图片中央行/列 alpha>10 的主体边界，排除镜子和轮胎突起；四款均等比绘制，约46×22.7～22.9。运行文件、颜色和独立定位框见 `src/app.js` 的 `CAR_PAINTS`。

| 颜色 | 运行文件 | 原始 ImageGen 输出 |
| --- | --- | --- |
| 蓝色 | `src/assets/vehicles/car-compact-blue.png` | `exec-4fb44d9c-51fe-4f29-bd46-02332085b1a3.png` |
| 鼠尾草绿 | `src/assets/vehicles/car-compact-sage.png` | `exec-d3c69a07-89d6-4d64-b1c9-6fc67f52e4f7.png` |
| 奶油黄 | `src/assets/vehicles/car-compact-cream.png` | `exec-71f8064e-b14e-4605-a633-89d85295c745.png` |
| 浅紫色 | `src/assets/vehicles/car-compact-lavender.png` | `exec-46643525-f976-4dc3-b1cd-3ef70e2871f1.png` |

原始输出目录：`/Users/ailln/.codex/generated_images/01a16fbb-16dc-7152-99a0-8958fbc2c2c4/`。

## 提示词

四次都以当前 `car-compact.png` 作为唯一编辑目标，要求透明背景，使用下列完整模板，逐次替换 `COLOR_REPLACE`。

```text
Use case: precise-object-edit. Edit target: the provided production game sprite. Create ONE single color variant of this exact compact top-down car. Change ONLY painted orange-red body panels, roof, hood, edge shadows and mirror paint to COLOR_REPLACE. Preserve EXACT short broad compact silhouette and proportions, all contour positions, black outlines, wheels, windows, headlights and red taillights. Smoky dark teal rear windshield LEFT; pale mint front windshield with cream reflection and wiper RIGHT. Thick black outlines and sparse angular detail, front points RIGHT. Same orthographic top-down camera and bilateral symmetry, no perspective, no new detail, no text, no shadow. Whole car centered with all mirrors and wheels inside image, genuine transparent alpha background. Production sprite variant intended to sit beside the original in the same parking game. Roof must match body hue with only subtle tonal variation. Do not make a contrasting roof. Target same 768x470 aspect ratio/canvas as input, and same body geometry.
```

替换词依次为：

- 蓝：`muted cornflower / denim BLUE (#658fc0), with deeper blue edge shadows`
- 绿：`soft SAGE GREEN (#91a77c), with deeper olive-green edge shadows`
- 黄：`warm CREAM YELLOW (#e8cf86), with ochre edge shadows`
- 紫：`muted LAVENDER PURPLE (#a58cbb), with deeper mauve edge shadows`

## 接入与验证

配色通过场地种子加邻车序号选取，不消耗生成几何的随机数；同场邻车用不同颜色，重试和窗口变化保持配色。玩家、目标位和货车继续使用各自原素材。PNG加载失败时，原生车形回退使用对应配色。

`npm run check`、现有 `node scripts/test-game.cjs`、`git diff --check` 通过。额外一次性检查覆盖主线全部八个小轿车关卡：四种配色都有使用，同一区域不重复，重试和改尺寸稳定，小货车/大卡车不使用轿车配色。

实机证据：`car-colors-reverse.png` 与 `car-colors-parallel.png` 为1280×720浏览器全屏截图，分别显示蓝绿竖停与黄紫横停；`car-colors-preview.png` 仅裁去两侧空白并并排展示，单列520×720，未放大车辆。浏览器刷新后的控制台错误为空。停车位、玩家提示、透明轮廓和车头方向正常。未打包、发布或做设备验收。
