import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const releaseVersion = readFileSync(resolve(projectDir, "VERSION"), "utf8").trim();
const versionDir = releaseVersion.replaceAll(".", "_");
const gameDir = resolve(projectDir, versionDir);
const failures = [];

const requiredFiles = ["index.html", "app.js", "style.css", "favicon.svg"];
const supportedExtensions = new Set([
  ".html",
  ".css",
  ".js",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".woff",
  ".woff2",
  ".json",
]);

function fail(message) {
  failures.push(message);
}

function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const absolutePath = resolve(directory, entry);
    return statSync(absolutePath).isDirectory() ? walk(absolutePath) : [absolutePath];
  });
}

if (!existsSync(gameDir)) {
  console.error(`校验失败：VERSION 指向的目录不存在：${versionDir}/`);
  process.exit(1);
}

for (const file of requiredFiles) {
  if (!existsSync(resolve(gameDir, file))) {
    fail(`缺少运行文件：${versionDir}/${file}`);
  }
}

const runtimeFiles = walk(gameDir);
for (const file of runtimeFiles) {
  if (!supportedExtensions.has(extname(file).toLowerCase())) {
    fail(`不支持的运行文件类型：${file.slice(gameDir.length + 1)}`);
  }
}

const htmlFiles = runtimeFiles.filter((file) => extname(file) === ".html");
if (htmlFiles.length !== 1 || htmlFiles[0] !== resolve(gameDir, "index.html")) {
  fail(`${versionDir}/ 中必须有且只有一个 index.html`);
}

const indexHtml = readFileSync(resolve(gameDir, "index.html"), "utf8");
const appJs = readFileSync(resolve(gameDir, "app.js"), "utf8");
const styleCss = readFileSync(resolve(gameDir, "style.css"), "utf8");
const packageJson = JSON.parse(readFileSync(resolve(projectDir, "package.json"), "utf8"));

if (packageJson.version !== releaseVersion) {
  fail(`package.json 版本 ${packageJson.version} 与 VERSION ${releaseVersion} 不一致`);
}

const syntaxCheck = spawnSync(process.execPath, ["--check", resolve(gameDir, "app.js")], {
  encoding: "utf8",
});
if (syntaxCheck.status !== 0) {
  fail(`app.js 语法检查失败：${syntaxCheck.stderr.trim()}`);
}

const htmlRequirements = [
  [/<!doctype html>/i, "index.html 缺少 DOCTYPE"],
  [/<html[^>]+lang=["']zh-CN["']/i, "index.html 缺少 lang=zh-CN"],
  [/<meta[^>]+charset=["']?UTF-8/i, "index.html 缺少 UTF-8 charset"],
  [/name=["']viewport["'][^>]+width=device-width/i, "viewport 缺少 width=device-width"],
  [/name=["']viewport["'][^>]+viewport-fit=cover/i, "viewport 缺少 viewport-fit=cover"],
];

for (const [pattern, message] of htmlRequirements) {
  if (!pattern.test(indexHtml)) fail(message);
}

const htmlIds = [...indexHtml.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1]);
const duplicateIds = [...new Set(htmlIds.filter((id, index) => htmlIds.indexOf(id) !== index))];
for (const id of duplicateIds) fail(`index.html 含重复 id：${id}`);

const htmlIdSet = new Set(htmlIds);
const requiredDomIds = [...appJs.matchAll(/querySelector\(\s*["']#([A-Za-z0-9_-]+)["']\s*\)/g)].map(
  (match) => match[1],
);
for (const id of requiredDomIds) {
  if (!htmlIdSet.has(id)) fail(`app.js 引用了不存在的页面元素：#${id}`);
}

if (/<script\b(?![^>]*\bsrc=)[^>]*>/i.test(indexHtml)) {
  fail("index.html 含内联脚本");
}
if (/\son[a-z]+\s*=/i.test(indexHtml)) {
  fail("index.html 含行内事件处理器");
}
if (/<script[^>]+type=["']module["']/i.test(indexHtml)) {
  fail("index.html 使用了模块脚本");
}
if (/<(?:base|iframe|object)\b/i.test(indexHtml)) {
  fail("index.html 含 base、iframe 或 object");
}

const prohibitedPatterns = [
  [/\bfetch\s*\(/, "fetch 网络请求"],
  [/\bXMLHttpRequest\b/, "XMLHttpRequest 网络请求"],
  [/\b(?:WebSocket|EventSource|RTCPeerConnection)\s*\(/, "实时通信 API"],
  [/navigator\.(?:geolocation|bluetooth|usb|hid|serial)\b/, "受限 navigator API"],
  [/navigator\.(?:serviceWorker|storage\.persist|credentials|locks)\b/, "受限后台或存储 API"],
  [/\b(?:Worker|SharedWorker|Accelerometer|Gyroscope|Magnetometer)\s*\(/, "Worker 或传感器 API"],
  [/\b(?:eval|Function)\s*\(/, "动态代码执行"],
  [/\bWebAssembly\b/, "WebAssembly"],
  [/\bwindow\.(?:open|prompt)\s*\(/, "新窗口或 prompt"],
  [/\brequestFullscreen\s*\(/, "全屏 API"],
];

for (const [pattern, label] of prohibitedPatterns) {
  if (pattern.test(appJs) || pattern.test(indexHtml)) {
    fail(`命中不可用能力：${label}`);
  }
}

const bridgeCalls = [
  ...appJs.matchAll(/window\.xhs\.miniTool\.([A-Za-z0-9_]+)/g),
  ...appJs.matchAll(/(?:callMiniTool|xhsCan)\(\s*["']([A-Za-z0-9_]+)["']/g),
].map((match) => match[1]);
const allowedBridgeCalls = new Set([
  "postNote",
  "saveImageToPhotosAlbum",
  "writeTempFile",
  "openRedPage",
]);
for (const call of bridgeCalls) {
  if (!allowedBridgeCalls.has(call)) fail(`使用了未记录的 Native Bridge：${call}`);
}

const resourceReferences = [];
for (const match of indexHtml.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
  resourceReferences.push(match[1]);
}
// 引号内允许出现 ")"，data: URI 里的嵌套 url() 才不会被截断
for (const source of [indexHtml, styleCss]) {
  for (const match of source.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"]*))\s*\)/gi)) {
    resourceReferences.push(match[1] ?? match[2] ?? match[3]);
  }
}

for (const reference of resourceReferences) {
  if (!reference || /^(?:data:|blob:|#)/i.test(reference)) continue;
  if (/^(?:https?:)?\/\//i.test(reference)) {
    fail(`外部资源引用：${reference}`);
    continue;
  }

  const cleanReference = reference.split(/[?#]/, 1)[0];
  const resourcePath = resolve(gameDir, cleanReference);
  if (resourcePath !== gameDir && !resourcePath.startsWith(`${gameDir}${sep}`)) {
    fail(`资源路径越出 ${versionDir}/：${reference}`);
  } else if (!existsSync(resourcePath)) {
    fail(`资源不存在：${reference}`);
  }
}

if (failures.length > 0) {
  console.error("校验失败：");
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log(
  `校验通过：${versionDir}/ 共 ${runtimeFiles.length} 个运行文件，${resourceReferences.length} 个资源引用。`,
);
