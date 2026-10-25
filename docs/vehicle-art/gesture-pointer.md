# 操作手势参考与改版 — 2026-10-25

> Release cleanup (2026-10-26): historical screenshots and previews were archived. Old image paths below record provenance only; see [cleanup record](../ASSET_CLEANUP.md).

> 图片清理说明（2026-10-25）：本文保留历史方案与提示词；已淘汰的车辆图片和旧对比图已删除，文内旧路径仅作历史记录。当前资源见[车辆素材索引](README.md)。

本轮使用 Product Design 的局部截图核对流程，直接检查当前操作区域并参考两个实际游戏教学画面。源项目与操作逻辑保留，修改范围限于引导手形、触点、文字和动效。

## 参考

- 《皇室战争》早期教学的白色手套指示手：原报道 https://gnn.gamer.com.tw/detail.php?sn=126084 ，实际截图 https://p2.bahamut.com.tw/B/2KU/66/0001308466.JPG 。本轮浏览器截图为 `gesture-reference-clash-royale.png`。观察：手形是概括的白色指示符，指尖直接对着目标。
- 双手操作游戏教程：页面 https://news.16p.com/859134.html ，实际图 https://di.gameres.com/attachment/forum/201912/13/092559zvewlwm1lu14mlev.jpg 。页面正文无法通过网页读取器取得，但图片可在浏览器打开；本轮截图为 `gesture-reference-dual-controls.png`。观察：左/右手分别对应摇杆和按钮，触点是视觉重点。未推断截图中的具体游戏名称。

参考截图只作为设计依据保存在文档目录，不作为产品运行素材。采用的是“明确触点 + 小手势演示”这一方式；没有把参考游戏的图片直接裁进产品。

## 局部审视与修正

1. 入场：旧版 `gesture-audit-before.png` 中，两只手的形状缺少成熟游戏图标的概括，指甲/掌纹显得突兀，位置靠下，左指尖落在方向盘外，右指尖落在后退按钮边缘。新版 `gesture-pointer-opening.png` 使用58px高的白色卡通指示手，左触点落在轮缘，右触点落在前进踏板。左侧沿圆周小幅移动，右侧以按压和淡触点圈示意动作，说明文字仍明确为左/右拇指。
2. 方向盘操作：`gesture-pointer-left-used.png`。通过实际页面点击方向盘，DOM显示左侧隐藏、右侧可见，截图确认只有右提示保留，状态正常。
3. 踏板操作：`gesture-pointer-dismissed.png`。继续点击前进按钮，DOM显示两侧均隐藏，截图确认控件恢复正常，状态正常。

`gesture-pointer-comparison.png` 为本轮旧/新页面同一操作区域的实际尺寸对比，每列520×231，没有放大手势。`gesture-reference-comparison.png` 将参考局部和新版操作区域置于同一输入中检查。`gesture-pointer-flow.png` 按入场→左侧已用→两侧已用排列三个实际状态。截图均在本轮采集，开场/已用状态均处于真实运行状态；有一次等待过长导致倒计时结束的抓图已被拒绝并覆盖，不作为证据。

## 实现与素材

新版指示手由内置 ImageGen 原创生成，参考《皇室战争》截图中的符号化白色手套表达。运行素材：`src/assets/ui/tutorial-hand.png`（192px高，RGBA），仅裁去透明留白并等比缩小。原始输出、裁切和指尖校准点见 `tutorial-hand.json`。左右共用同一PNG，通过UI变换适配方向；触点圈和动作由CSS绘制。旧的手绘SVG手形、指甲和掌纹已移除。

沿用上一轮行为：本次页面访问中，左右分别在第一次操作时隐藏；重试不重复，暂停/结果隐藏，恢复后仅显示未操作侧；键盘同样会消除对应引导。新增 `prefers-reduced-motion` 支持，关闭循环动效但保留静态手势和文字；装饰图层不拦截点击。

检查通过：`npm run check`、现有玩法检查和左右引导的输入/生命周期测试、`git diff --check`。真实浏览器按顺序点击验证三种状态。默认窗口1029×863；尝试320×568视口覆盖后，返回的截图和DOM尺寸仍为默认窗口，因此未把该尝试记为手机视觉验证，临时覆盖已重置。未做真实手机双指、屏幕阅读器或完整无障碍认证；未打包发布。

## 完整生成提示词

```text
Create an original compact mobile-game tutorial POINTER HAND icon, inspired only by the white cartoon glove clarity of the hand visible in the reference screenshot. The screenshot is a style/function reference, NOT an image to reproduce, and none of its game artwork, UI, lettering or environment should remain. Isolate ONE original elegant white/ivory cartoon glove hand on genuine transparent alpha. Index finger extended vertically UP to a softly rounded tip, other fingers naturally folded into a simple compact fist, short wrist/cuff at bottom-right; a friendly traditional video-game instruction cursor, clear readable anatomical silhouette. Rounded broad forms, 2D vector-like game illustration with a consistent charcoal outline, pale warm ivory fill, tiny cool gray shade along lower-right edge and only 2 or 3 short rounded knuckle seams. No skin, fingernails, wrinkles, veins, realistic anatomy, chunky sausage shape, long straight finger, extra fingers or details. No emoji/thumbs-up pose, no detached shapes. Overall icon slender compact near 0.8:1 width:height, full icon centered with transparent margin; fingertip is the uppermost point, palm occupies lower-right of finger. Clean crisp contour readable at 50px tall in an existing flat outlined parking-game UI. No contact rings, glow, text, arrow, labels, background or drop shadow; these are UI code layers added separately. Produce exactly one hand. The hand should be polished and understated, not a crude sketch.
```
