# 小轿车方案对比 — 2026-10-24

> Release cleanup (2026-10-26): historical screenshots and previews were archived. Old image paths below record provenance only; see [cleanup record](../../ASSET_CLEANUP.md).

> 图片清理说明（2026-10-25）：本文保留历史方案与提示词；已淘汰的车辆图片和旧对比图已删除，文内旧路径仅作历史记录。当前资源见[车辆素材索引](../README.md)。

本次仅生成视觉方案，未替换游戏素材或改动运行代码。使用内置 ImageGen，每个方向单独生成，参考原版实机截图 `docs/assets/screenshot-play.png` 和当前实机截图 `docs/vehicle-art/car-in-game.png`。

旧版图为真实历史截图中 (138,506)-(205,545) 区域的最近邻放大，未重新绘制。`comparison.png` 横向排列旧版、当前版与三个候选，并附缩小预览；旧版带有历史场景背景，其余是透明图片。它用于比较视觉，尚不是候选方案的游戏运行截图。

以下顺序对应聊天中实际显示的三个新 ImageGen 结果，而非包含旧版或当前版参考图的顺序：

| 新方案编号 | 文件 | 方向 | 原图 |
| --- | --- | --- | --- |
| 1 | option-1-boxy-commuter.png | 方盒通勤车 | exec-5fb21b13-02dc-43e7-89f2-7272dfd63d23.png |
| 2 | option-2-retro-compact.png | 短圆复古车 | exec-a3f47e5c-d4a9-4e2c-a98f-3c57b33b2c16.png |
| 3 | option-3-angular-hatch.png | 折线小钢炮 | exec-0783f672-37d6-4277-a3c2-1ea586f4caf3.png |

共同提示约束：单辆透明背景小轿车、严格正俯视、车头朝右、车尾朝左；贴合游戏新粗野主义界面，强调粗黑描边、大色块、低细节、橙红车身、浅薄荷色车窗、右侧米白前灯与左侧红尾灯。保持小车短车身，面向 46×24 游戏尺寸设计；不添加 UI、文字、徽标、场景或新玩法。方盒方案强调直边和削角；复古方案强调短圆车头和圆灯；折线方案强调多边形车身和梯形风挡。工具输出保留少量明暗过渡，选定后可按反馈进一步压平。

原始 PNG 直接复制进本目录，alpha 保留。精确源文件路径、像素尺寸及显示编号见 `options.json`。后续用户选定 1/2/3 时，以这份映射和对应已显示图片为准。
