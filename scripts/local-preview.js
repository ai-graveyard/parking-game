/* Development server only. This file is not part of the offline game. */
(function () {
  "use strict";
  var host = window.location.hostname;
  if (["127.0.0.1", "localhost", "[::1]"].indexOf(host) < 0 || window.xhs) return;
  var active = new URLSearchParams(window.location.search).get("simulate") === "1";
  var previewParams = new URLSearchParams(window.location.search);
  var embedded = active && previewParams.get("embed") === "1";
  var root = document.createElement("div");
  root.id = "localPreview";
  root.hidden = embedded;
  document.body.appendChild(root);
  var shadow = root.attachShadow({ mode: "open" });
  shadow.innerHTML = '<style>' +
    ':host{position:fixed;z-index:1000000;bottom:8px;right:8px;font:13px/1.5 -apple-system,"PingFang SC",sans-serif;color:#172126;max-width:calc(100% - 16px)}' +
    '*{box-sizing:border-box}button{font:inherit;cursor:pointer;border:1px solid #a9b7bb;border-radius:7px;padding:8px 10px;background:#fff;color:#172126}button:disabled{opacity:.45;cursor:default}button:focus{outline:2px solid #16706a;outline-offset:2px}' +
    '[hidden]{display:none!important}.badge{background:#183e3a;color:#fff;border:1px solid #a2c5ba;box-shadow:0 2px 10px #0003;font-size:12px}.panel{width:290px;max-width:100%;background:#f5faf8;border:1px solid #9eb9ad;border-radius:12px;padding:14px;margin-bottom:7px;box-shadow:0 5px 25px #0003;max-height:65vh;overflow-y:auto}' +
    'h3{margin:0 0 8px;font-size:15px}p{margin:7px 0;font-size:12px}small{display:block;color:#536a63} .actions{display:flex;flex-wrap:wrap;margin:6px -3px}.actions button{margin:3px;flex:1 1 43%}.notice{color:#326958}a{color:#075d52}' +
    '.dialog{position:fixed;top:0;right:0;bottom:0;left:0;background:#071b1bbd;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto}.dialog-card{width:340px;max-width:100%;max-height:90vh;overflow-y:auto;background:#fffdf5;border-radius:14px;padding:18px;box-shadow:0 5px 30px #0005}.dialog-card h3{font-size:20px}.dialog-card img{display:block;width:auto;height:auto;max-width:100%;max-height:32vh;margin:10px auto;object-fit:contain}.dialog-card textarea{width:100%;min-height:76px;resize:vertical;font:12px/1.5 inherit;padding:8px;border:1px solid #bacac3;border-radius:6px}.confirm{background:#1f7468;color:white}.dialog-card .actions{margin-top:12px}' +
    '.panel,.dialog-card{position:relative}.panel h3,.dialog-card>small,.dialog-card h3{padding-right:38px}.close{position:absolute;top:6px;right:6px;width:44px;height:44px;padding:0;font-size:25px;line-height:1;background:transparent;border-color:transparent}' +
    '</style>' +
    '<section class="panel" id="panel" hidden><h3>本地模拟 · 不会实际关注或发布</h3><p id="summary">正在准备…</p><div class="actions"><button id="unfollowed">预览未关注</button><button id="followed">预览已关注</button><button id="timeout">立即超时</button><button id="resetDay">重置今日额度</button><button id="crushReplay">重播秤砣</button><button id="crushImpact">秤砣落地定格</button><button id="crushSettled">压扁车辆定格</button></div><p class="notice" id="notice">先看第 04 关的关注锁，再开始一关点“立即超时”。</p><small>模拟存档独立保存；“预览未关注”会重置模拟福利权益。刷新保留模拟状态。</small><p><a id="normal">退出模拟模式</a></p></section>' +
    '<button class="badge" id="toggle">本地模拟</button>' +
    '<section class="dialog" id="dialog" role="dialog" aria-modal="true" aria-labelledby="dialogTitle" hidden><div class="dialog-card"><small>本地模拟 · 不会执行真实平台操作</small><h3 id="dialogTitle"></h3><p id="dialogCopy"></p><img id="noteImage" alt="本次分享图片预览" hidden><textarea id="noteText" aria-label="模拟笔记正文" hidden></textarea><div class="actions"><button class="confirm" id="confirm">模拟成功</button><button id="cancel">取消</button><button id="fail">模拟失败</button></div></div></section>';
  var $ = function (id) { return shadow.getElementById(id); };
  function addClose(parent, id, label) {
    var button = document.createElement("button");
    button.id = id; button.className = "close"; button.type = "button";
    button.textContent = "×"; button.setAttribute("aria-label", label); button.title = label;
    parent.insertBefore(button, parent.firstChild);
    return button;
  }
  addClose($("panel"), "panelClose", "收起本地模拟").onclick = function () { $("panel").hidden = true; $("toggle").focus(); };
  addClose($("dialog").querySelector(".dialog-card"), "dialogClose", "取消并关闭模拟弹框").onclick = function () { settle("cancel"); };
  var url = new URL(window.location.href);
  url.searchParams.delete("simulate");
  $("normal").href = url.href;
  if (!active) {
    $("toggle").textContent = "开启本地模拟";
    $("toggle").onclick = function () { url.searchParams.set("simulate", "1"); window.location.href = url.href; };
    return;
  }
  $("toggle").onclick = function () { $("panel").hidden = !$("panel").hidden; };
  document.addEventListener("pointerdown", function (event) {
    if (event.composedPath().indexOf(root) < 0) $("panel").hidden = true;
  });
  var prefix = "parking-game.local-simulation.v1.";
  if (embedded) prefix = "parking-game.screen-preview.v1." + (previewParams.get("device") || "default").replace(/[^a-z0-9-]/gi, "") + ".";
  var memory = {};
  var storage = {
    getItem: function (key) { try { return window.localStorage.getItem(prefix + key); } catch (_) { return memory[key] || null; } },
    setItem: function (key, value) { memory[key] = String(value); try { window.localStorage.setItem(prefix + key, String(value)); } catch (_) {} }
  };
  var following = storage.getItem("following") === "1";
  var controller = null;
  var pending = null;
  storage.setItem("parking-game.intro.v1", "true");
  function setFollowing(value) { following = value; storage.setItem("following", value ? "1" : "0"); }
  function deliver(options, name, data) {
    var value = Object.assign({ errMsg: name + ":ok" }, data);
    if (options && typeof options.success === "function") { options.success(value); return; }
    return Promise.resolve(value);
  }
  function dialog(name, options) {
    if (pending) { if (options.fail) options.fail({errCode:10003,errMsg:name+":fail pending"}); return; }
    pending = { name: name, options: options, returnFocus: shadow.activeElement || document.activeElement };
    $("panel").hidden = true;
    $("dialogTitle").textContent = name === "followAuthor" ? "模拟关注作者" : "模拟笔记发布";
    $("dialogCopy").textContent = name === "followAuthor" ? "确认后走游戏真实的关注成功流程，一次解锁四个福利关。" : (options.title || "分享战绩") + " · 点击模拟发布成功后，再手动使用续时。";
    $("confirm").textContent = name === "followAuthor" ? "模拟关注成功" : "模拟发布成功";
    var media = options.mediaInfo && options.mediaInfo.image_resources;
    $("noteImage").hidden = !media;
    $("noteImage").src = media && media[0] ? media[0].url : "";
    $("noteText").hidden = !media;
    $("noteText").value = options.content || "";
    $("dialog").hidden = false;
    $("confirm").focus();
  }
  function settle(outcome) {
    if (!pending) return;
    var request = pending; pending = null;
    $("dialog").hidden = true;
    $("noteImage").removeAttribute("src");
    if (outcome === "success") {
      if (request.name === "followAuthor") setFollowing(true);
      deliver(request.options, request.name, request.name === "followAuthor" ? {follow_status:1} : {});
    } else if (request.options.fail) request.options.fail({errCode:outcome === "cancel" ? 20002 : 10002,errMsg:request.name+":fail simulated " + outcome});
    $("notice").textContent = outcome === "success" ? "模拟成功回调已送达游戏，可继续查看解锁或续时。" : "已模拟取消 / 失败，可重试；续时机会不会扣除。";
    if (request.returnFocus && typeof request.returnFocus.focus === "function") request.returnFocus.focus();
  }
  $("confirm").onclick = function () { settle("success"); };
  $("cancel").onclick = function () { settle("cancel"); };
  $("fail").onclick = function () { settle("fail"); };
  shadow.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && (pending || !$("panel").hidden)) {
      event.preventDefault(); event.stopPropagation();
      if (pending) settle("cancel");
      else { $("panel").hidden = true; $("toggle").focus(); }
      return;
    }
    if (pending && event.key === "Tab") {
      var buttons = [$("dialogClose"), $("noteText"), $("confirm"), $("cancel"), $("fail")].filter(function (el) { return !el.hidden; });
      var index = buttons.indexOf(shadow.activeElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); buttons[buttons.length - 1].focus(); }
      else if (!event.shiftKey && index === buttons.length - 1) { event.preventDefault(); buttons[0].focus(); }
    }
  });
  window.xhs = { launchOptions: { miniToolEnv: { buildVersion: 9510000 } }, miniTool: {
    getStorage: function (o) { return deliver(o,"getStorage",{data:storage.getItem(o.key)}); },
    setStorage: function (o) { storage.setItem(o.key,o.data); return deliver(o,"setStorage",{}); },
    getFollowStatus: function (o) { return deliver(o,"getFollowStatus",{follow_status:following ? 1 : 0}); },
    followAuthor: function (o) { dialog("followAuthor",o); },
    writeTempFile: function (o) { return deliver(o,"writeTempFile",{filePath:o.data}); },
    postNote: function (o) { dialog("postNote",o); }
  }};
  window.ParkingLocalPreview = { storage: storage, setFollowing: setFollowing,
    screenShare: function (levelId, success) { return embedded && controller ? controller.screenShare(levelId, success) : null; },
    screenScene: function (levelId, scene) { return embedded && controller ? controller.screenScene(levelId, scene) : false; },
    attach: function (value) { controller = value; } };
  if (embedded) window.xhs.miniTool.getWindowInfo = function (options) {
    var top = Math.max(0, Math.min(100, Number(previewParams.get("safeTop")) || 0));
    var bottom = Math.max(0, Math.min(100, Number(previewParams.get("safeBottom")) || 0));
    return deliver(options, "getWindowInfo", {windowWidth:innerWidth, windowHeight:innerHeight,
      safeArea:{top:top, bottom:innerHeight-bottom}, menuButtons:{back:null, me:null, share:null}});
  };
  async function action(name, value) {
    if (!controller || pending) return;
    var ok = await controller[name](value);
    $("notice").textContent = ok ? "场景已切换；可收起面板，继续体验游戏。" : "请等当前流程完成后再切换。";
    if (ok && (name === "timeout" || name === "crushPreview")) $("panel").hidden = true;
    updatePanel();
  }
  $("unfollowed").onclick = function () { action("setFollowing",false); };
  $("followed").onclick = function () { action("setFollowing",true); };
  $("resetDay").onclick = function () { action("resetDay"); };
  $("timeout").onclick = function () { action("timeout"); };
  $("crushReplay").onclick = function () { action("crushPreview", null); };
  $("crushImpact").onclick = function () { action("crushPreview", .96); };
  $("crushSettled").onclick = function () { action("crushPreview", 2.6); };
  function updatePanel() {
    var state = controller && controller.state();
    var busy = !state || !state.ready || Boolean(pending);
    ["unfollowed","followed","resetDay","timeout","crushReplay","crushImpact","crushSettled"].forEach(function (id) { $(id).disabled = busy; });
    if (!state) return;
    var labels = { ready:"选关中",playing:"驾驶中",paused:"已暂停",rescue:"等待救场",resuming:"准备继续",assessment:"秤砣重砸中",tank:"坦克碾压中",success:"已通关",failed:"挑战失败" };
    $("summary").textContent = (following ? "已关注" : "未关注") + " · " + (state.used ? "今日续时已使用" : state.earned ? "今日续时待使用" : "今日尚未分享") + " · " + (labels[state.state] || state.state);
    $("toggle").textContent = "模拟 · " + (following ? "已关注" : "未关注") + ( $("panel").hidden ? " ▴" : " ▾");
  }
  window.setInterval(updatePanel, 300);
  updatePanel();
})();
