# 小货车和大卡车车尾收方 — 2026-10-25

> Release cleanup (2026-10-26): historical screenshots and previews were archived. Old image paths below record provenance only; see [cleanup record](../ASSET_CLEANUP.md).

> 图片清理说明（2026-10-25）：本文保留历史方案与提示词；已淘汰的车辆图片和旧对比图已删除，文内旧路径仅作历史记录。当前资源见[车辆素材索引](README.md)。

使用内置 ImageGen，分别编辑现有两种车型的四套配色。只收方车尾：后边缘改为平直竖线，后角只留小圆角，尾灯改为竖直小矩形。保留圆润驾驶室、前风挡、车长、车宽与全部配色。

运行素材保存在 `src/assets/vehicles/`：`van-square.png`及其blue/sage/lavender三款，`truck-square.png`及其coral/sage/ochre三款。小货车512像素宽、大卡车768像素宽，只做透明裁切和等比缩小；源图路径、裁切与独立车体定位框见 `square-rear.json`。车辆仍以单一等比系数绘制；物理尺寸、驾驶、关卡和配色分配规则不变。可见尺寸与上一版差异均小于5%，车长仍精确为80和128。

资源检查、现有16关×3视口及720随机布局检查、格式检查通过。`square-rear-van.png`和`square-rear-truck.png`为390×844的实际手机视口截图，合并实机图为`square-rear-preview.png`。`square-rear-comparison.png`按同一世界比例展示旧/新素材，供检查车尾几何。所有图片均保留原alpha，无程序改色或横纵拉伸。

## 完整生成提示词

### square-van

```text
Use case: precise-object-edit. Production mobile parking-game small delivery truck sprite. Change ONLY the LEFT REAR END of the supplied orange/ivory truck to be SQUARER. Flatten the rear cargo outline into a straight vertical edge from top-left to bottom-left, with near90-degree corners and only a tiny corner radius, about2percent of body width. Current ivory cargo rear corners are too round. Ivory box should read as a rigid rectangular cargo box, not a rounded capsule. Rear bumper also straight and square; make the two LEFT red tail lights small vertical rounded-RECTANGLES aligned with the flat rear, not slanted ovals. Preserve EXACT orange cab on RIGHT, pale mint windshield, reflection, wiper, headlights, wheels, mirrors, every color, full vehicle length and width, cargo/cab proportions, thick black contour weight and clean sparse shading. Do not shorten or lengthen the vehicle. All changes confined to leftmost15percent of vehicle; keep the entire rest pixel-faithful. Strict orthographic TOP DOWN, front RIGHT, bilateral symmetry, no perspective or side walls. Single whole sprite on genuine transparent alpha, same aspect/framing as reference512x279. No text/logo/badge/shadow/halo/glow. Crisp simple shape correction, no extra hardware or details.
```

### square-van-blue

```text
Use case: precise-object-edit. Production mobile parking-game small delivery truck sprite. Change ONLY the LEFT REAR END of the supplied blue/ivory truck to be SQUARER. Flatten the rear cargo outline into a straight vertical edge from top-left to bottom-left, with near90-degree corners and only a tiny corner radius, about2percent of body width. Current ivory cargo rear corners are too round. Ivory box should read as a rigid rectangular cargo box, not a rounded capsule. Rear bumper also straight and square; make the two LEFT red tail lights small vertical rounded-RECTANGLES aligned with the flat rear, not slanted ovals. Preserve EXACT muted blue cab on RIGHT, pale mint windshield, reflection, wiper, headlights, wheels, mirrors, every color, full vehicle length and width, cargo/cab proportions, thick black contour weight and clean sparse shading. Do not shorten or lengthen the vehicle. All changes confined to leftmost15percent of vehicle; keep the entire rest pixel-faithful. Strict orthographic TOP DOWN, front RIGHT, bilateral symmetry, no perspective or side walls. Single whole sprite on genuine transparent alpha, same aspect/framing as reference512x279. No text/logo/badge/shadow/halo/glow. Crisp simple shape correction, no extra hardware or details.
```

### square-van-sage

```text
Use case: precise-object-edit. Production mobile parking-game small delivery truck sprite. Change ONLY the LEFT REAR END of the supplied sage green/ivory truck to be SQUARER. Flatten the rear cargo outline into a straight vertical edge from top-left to bottom-left, with near90-degree corners and only a tiny corner radius, about2percent of body width. Current ivory cargo rear corners are too round. Ivory box should read as a rigid rectangular cargo box, not a rounded capsule. Rear bumper also straight and square; make the two LEFT red tail lights small vertical rounded-RECTANGLES aligned with the flat rear, not slanted ovals. Preserve EXACT sage green cab on RIGHT, pale mint windshield, reflection, wiper, headlights, wheels, mirrors, every color, full vehicle length and width, cargo/cab proportions, thick black contour weight and clean sparse shading. Do not shorten or lengthen the vehicle. All changes confined to leftmost15percent of vehicle; keep the entire rest pixel-faithful. Strict orthographic TOP DOWN, front RIGHT, bilateral symmetry, no perspective or side walls. Single whole sprite on genuine transparent alpha, same aspect/framing as reference512x279. No text/logo/badge/shadow/halo/glow. Crisp simple shape correction, no extra hardware or details.
```

### square-van-lavender

```text
Use case: precise-object-edit. Production mobile parking-game small delivery truck sprite. Change ONLY the LEFT REAR END of the supplied lavender/ivory truck to be SQUARER. Flatten the rear cargo outline into a straight vertical edge from top-left to bottom-left, with near90-degree corners and only a tiny corner radius, about2percent of body width. Current ivory cargo rear corners are too round. Ivory box should read as a rigid rectangular cargo box, not a rounded capsule. Rear bumper also straight and square; make the two LEFT red tail lights small vertical rounded-RECTANGLES aligned with the flat rear, not slanted ovals. Preserve EXACT lavender cab on RIGHT, pale mint windshield, reflection, wiper, headlights, wheels, mirrors, every color, full vehicle length and width, cargo/cab proportions, thick black contour weight and clean sparse shading. Do not shorten or lengthen the vehicle. All changes confined to leftmost15percent of vehicle; keep the entire rest pixel-faithful. Strict orthographic TOP DOWN, front RIGHT, bilateral symmetry, no perspective or side walls. Single whole sprite on genuine transparent alpha, same aspect/framing as reference512x279. No text/logo/badge/shadow/halo/glow. Crisp simple shape correction, no extra hardware or details.
```

### square-truck

```text
Use case: precise-object-edit. Exact selected LONG blue-cab/olive-tarp truck sprite for a mobile parking game. Change ONLY the LEFT REAR END to be SQUARE and rigid. Replace the large rounded/slanted LEFT cargo corners with a straight vertical rear bumper/back edge, near90-degree top-left/bottom-left corners, tiny corner radius about2percent body width. The olive tarp over a rigid rectangular bed should terminate in a flat square rear, not a rounded or tapered capsule. Two red LEFT tail lights should be vertical narrow rounded-RECTANGLES standing parallel to the flat rear edge, NOT angled oval lights. Keep rear overall position and maximum body dimensions unchanged. Preserve EXACT long cargo body, body length/width ratio around3.48:1, blue cabRIGHT, cab quarter/cargo three-quarters, THREE black straps, sparse broad green folds, big mint windshield/reflection/wiper, cream headlights, wheel tabs and mirrors, clean mobile-game style and thick consistent outlines. Changes confined to leftmost15percent, all remaining truck unchanged. Do NOT shorten cargo, enlarge cab, round the rear again, change paint, add detail, alter proportions or stretch pixels. Strict orthographic TOP DOWN, frontRIGHT, bilateral symmetry. Whole complete truck on genuine transparent alpha, same wide aspect/framing as reference768x288, no text/logo/badge/shadow/halo/glow.
```

### square-truck-coral

```text
Use case: precise-object-edit. Exact selected LONG coral-red-cab/sand-tarp truck sprite for a mobile parking game. Change ONLY the LEFT REAR END to be SQUARE and rigid. Replace the large rounded/slanted LEFT cargo corners with a straight vertical rear bumper/back edge, near90-degree top-left/bottom-left corners, tiny corner radius about2percent body width. The sand beige tarp over a rigid rectangular bed should terminate in a flat square rear, not a rounded or tapered capsule. Two red LEFT tail lights should be vertical narrow rounded-RECTANGLES standing parallel to the flat rear edge, NOT angled oval lights. Keep rear overall position and maximum body dimensions unchanged. Preserve EXACT long cargo body, body length/width ratio around3.48:1, coral red cabRIGHT, cab quarter/cargo three-quarters, THREE black straps, sparse broad tan folds, big mint windshield/reflection/wiper, cream headlights, wheel tabs and mirrors, clean mobile-game style and thick consistent outlines. Changes confined to leftmost15percent, all remaining truck unchanged. Do NOT shorten cargo, enlarge cab, round the rear again, change paint, add detail, alter proportions or stretch pixels. Strict orthographic TOP DOWN, frontRIGHT, bilateral symmetry. Whole complete truck on genuine transparent alpha, same wide aspect/framing as reference768x288, no text/logo/badge/shadow/halo/glow.
```

### square-truck-sage

```text
Use case: precise-object-edit. Exact selected LONG sage-green-cab/ivory-tarp truck sprite for a mobile parking game. Change ONLY the LEFT REAR END to be SQUARE and rigid. Replace the large rounded/slanted LEFT cargo corners with a straight vertical rear bumper/back edge, near90-degree top-left/bottom-left corners, tiny corner radius about2percent body width. The ivory tarp over a rigid rectangular bed should terminate in a flat square rear, not a rounded or tapered capsule. Two red LEFT tail lights should be vertical narrow rounded-RECTANGLES standing parallel to the flat rear edge, NOT angled oval lights. Keep rear overall position and maximum body dimensions unchanged. Preserve EXACT long cargo body, body length/width ratio around3.48:1, sage green cabRIGHT, cab quarter/cargo three-quarters, THREE black straps, sparse broad beige folds, big mint windshield/reflection/wiper, cream headlights, wheel tabs and mirrors, clean mobile-game style and thick consistent outlines. Changes confined to leftmost15percent, all remaining truck unchanged. Do NOT shorten cargo, enlarge cab, round the rear again, change paint, add detail, alter proportions or stretch pixels. Strict orthographic TOP DOWN, frontRIGHT, bilateral symmetry. Whole complete truck on genuine transparent alpha, same wide aspect/framing as reference768x288, no text/logo/badge/shadow/halo/glow.
```

### square-truck-ochre

```text
Use case: precise-object-edit. Exact selected LONG ochre-cab/slate-blue-tarp truck sprite for a mobile parking game. Change ONLY the LEFT REAR END to be SQUARE and rigid. Replace the large rounded/slanted LEFT cargo corners with a straight vertical rear bumper/back edge, near90-degree top-left/bottom-left corners, tiny corner radius about2percent body width. The slate blue gray tarp over a rigid rectangular bed should terminate in a flat square rear, not a rounded or tapered capsule. Two red LEFT tail lights should be vertical narrow rounded-RECTANGLES standing parallel to the flat rear edge, NOT angled oval lights. Keep rear overall position and maximum body dimensions unchanged. Preserve EXACT long cargo body, body length/width ratio around3.48:1, ochre yellow cabRIGHT, cab quarter/cargo three-quarters, THREE black straps, sparse broad slate folds, big mint windshield/reflection/wiper, cream headlights, wheel tabs and mirrors, clean mobile-game style and thick consistent outlines. Changes confined to leftmost15percent, all remaining truck unchanged. Do NOT shorten cargo, enlarge cab, round the rear again, change paint, add detail, alter proportions or stretch pixels. Strict orthographic TOP DOWN, frontRIGHT, bilateral symmetry. Whole complete truck on genuine transparent alpha, same wide aspect/framing as reference768x288, no text/logo/badge/shadow/halo/glow.
```
