# 小货车接缝过渡：已确认稿

> Release cleanup (2026-10-26): historical screenshots and previews were archived. Old image paths below record provenance only; see [cleanup record](../ASSET_CLEANUP.md).

> 图片清理说明（2026-10-25）：本文保留历史方案与提示词；已淘汰的车辆图片和旧对比图已删除，文内旧路径仅作历史记录。当前资源见[车辆素材索引](README.md)。

2026-10-25，内置 ImageGen 编辑。先生成单张橙色小货车预览供用户确认。用户随后明确“就按照这个来”，已将该确认稿接入游戏，并以同一稿生成三种邻车配色；详见 `van-seams.md`。

预览：`van-seam-review.png`。编辑目标：`../../src/assets/vehicles/short-cab-van.png`；原版 `mirror-van.png` 仅用于参考连接段。

用户同时要求大卡车恢复，本地运行已恢复四款 `mirror-truck*.png`、对应原定位框和备用绘图比例，静态检查通过。

## 完整提示词

```text
Use case: precise-object-edit. Generate exactly ONE review candidate of the orange/ivory SMALL DELIVERY TRUCK, no other color variants or vehicles. Image 1 is the EDIT TARGET: our existing shorter-cab/longer-cargo sprite. Image 2 is a supporting reference ONLY for the subtle recessed connector seam between cargo and cab; do NOT copy its longer cab or shorter cargo. Primary request: at the junction between the LEFT ivory cargo box and RIGHT orange cab, preserve a small visible transition instead of joining both blocks completely flush. Add a narrow recessed charcoal/dark-gray chassis connector gap, about 1.5-2 percent of total truck length, bounded by the existing bold black outlines; slightly inset at top and bottom so cargo and cab read as two separate connected parts. A single restrained gray highlight on this connector is enough, no machinery or new panel details. This should be a subtle short transition, NOT a long exposed chassis or trailer joint. Keep Image 1's shorter cab and longer cargo, exact overall bumper-to-bumper length and width and silhouette aspect. Accommodate this tiny connector inside the existing total length. Preserve existing square cargo rear, warm ivory box, orange cab, pale mint windshield with one cream reflection and wiper, cream front lights RIGHT, red tail lights LEFT, simple dark wheel tabs, and tiny orange mirrors INSIDE outermost tire edges. Same crisp simple top-down mobile game illustration, thick consistent black contour, sparse broad colors, front RIGHT, bilateral symmetry, no perspective or sidewalls. Genuine alpha TRANSPARENT background, one whole truck only, landscape framing with margins. No text, logo, badge, ground shadow, glow, halo, comparison layout, extra objects, or other variants. Change only the small cargo-to-cab transition; preserve the selected short cab proportions.
```
