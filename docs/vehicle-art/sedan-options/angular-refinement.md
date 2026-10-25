# 3 号折线小轿车细化稿

> Release cleanup (2026-10-26): historical screenshots and previews were archived. Old image paths below record provenance only; see [cleanup record](../../ASSET_CLEANUP.md).

> 图片清理说明（2026-10-25）：本文保留历史方案与提示词；已淘汰的车辆图片和旧对比图已删除，文内旧路径仅作历史记录。当前资源见[车辆素材索引](../README.md)。

用户确认细化最后一张 3 号折线小车，并随后选定此细化稿接入游戏。生成方式：内置 ImageGen，单张定向编辑。

输入目标：`option-3-angular-hatch.png`，对应原始生成结果 `exec-0783f672-37d6-4277-a3c2-1ea586f4caf3.png`。参考界面：`docs/vehicle-art/car-in-game.png`。

细化输出：`option-3-angular-hatch-refined.png`。原始结果：`/Users/ailln/.codex/generated_images/01a16723-91d5-7520-8094-b0ef486d308f/exec-52fca527-111a-4dff-a962-b42511bef187.png`。

保留折线车身、粗黑外轮廓、橙红车身、浅薄荷车窗及正俯视方向。新增引擎盖折线、简洁前格栅、风挡高光及雨刷、尾部和车门分缝、门把手、后视镜高光。中央车顶留空，供游戏叠加玩家标记。图稿仍有轻微明暗过渡，整体以大色块为主。

`angular-refinement-comparison.png` 为透明图片叠在同色预览底上的前后对比及小尺寸对比，属于素材预览，不是游戏运行截图。

现已接入 `src/assets/vehicles/car-angular-refined.png`，640×322 RGBA。透明留白裁切后等比缩小，使用 46:24 的校准范围等比绘制，不拉伸画稿。玩家小轿车、同类邻车及目标位预览共用此素材，驾驶模型、碰撞尺寸与手感均未更改。完整实机图：`docs/vehicle-art/car-angular-refined-in-game.png`；图稿与实机核对：`docs/vehicle-art/refined-car-source-vs-game.png`。本地检查及现有 16 关测试通过。

## 实际生成提示词

```text
Use case: precise-object-edit. Image1 is the EXACT EDIT TARGET: the selected angular orange-red neo-brutalist compact car. Image2 is SUPPORTING STYLE CONTEXT ONLY, a screenshot of the real parking game interface. Refine the FIRST image, one single car, do not redesign it or depict the UI. Target output1024x768 with genuine transparent background. Preserve the selected strict orthographic top-down view, nose pointing RIGHT, tail LEFT, clipped angular hatchback silhouette, coral orange-red body, thick black contour, pale mint trapezoid windows, cream front lamps and red rear lamps. Keep main body compact to fit a46x24game footprint; no perspective, no side walls. Add only purposeful graphic details readable at tiny game size: (1) two short subtle angular crease strokes on the FRONT hood, a tiny simple black nose grille/bumper mark at far RIGHT to clarify direction; (2) one restrained cream diagonal reflection shape in the front windshield, ONE simple short dark windshield wiper at its frontmost edge; (3) fine dark red/black roof seam framing the roof perimeter, but keep roof CENTER completely plain for a future player marker; (4) simple short door separation strokes and two small geometric door-handle marks along the upper and lower body edges, NO visible side faces; (5) distinct dark backing behind the red tail lamps, squared rear bumper at LEFT, small simple mirror highlights, thick black rectangular tires without detailed tread. Every detail must be sparse and graphically intentional, not realistic mechanisms. Strong consistent outer black outline; interior lines thinner and calmer. Body surface large FLAT orange-red color blocks with at most ONE crisp darker lower-edge facet; remove the existing soft gradients and airbrush look. No glossy3D shading, no photorealistic texture, no glow, no ground shadow, no haze. Keep mirror/tire silhouette and exact bilateral shape coherence. No stripes, sports decals, spoiler, sunroof, text, numbers, logos, badge, road, UI or other objects. ONE isolated finished car sprite only with modest transparent margins. The result should feel like the same selected drawing carefully finished, not a new style.
```
