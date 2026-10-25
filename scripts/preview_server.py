#!/usr/bin/env python3
"""Loopback dev server. Simulation assets / hooks never enter the offline package."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
import re

SCRIPTS = Path(__file__).resolve().parent
BOOT_MARKER = '  progress = cleanProgress(progress);'
# Inserted only into the simulated HTTP response, never the shipping app.js.
SIMULATION_HOOK = r'''
  if (window.ParkingLocalPreview) window.ParkingLocalPreview.attach({
    screenShare: function (levelId, success) {
      if (!this.screenScene(levelId, "play")) return null;
      const rules = currentRules();
      game.elapsed = success ? 42 : rules.time;
      game.timeLeft = success ? Math.max(0, rules.time - 42) : 0;
      game.state = success ? "success" : "failed";
      game.successFx = success ? 1 : 0;
      if (success) {
        const target = game.layout.parkingTarget;
        game.car.x = target.cx; game.car.y = target.cy; game.car.angle = target.angle;
        game.stage = "park";
      } else {
        game.car.destroyed = true;
        game.failureFx = {age:ASSESSMENT_DURATION, impacted:true, hitStop:0};
      }
      const run = {levelId:game.levelId, vehicle:game.vehicle, mode:game.mode,
        difficulty:game.difficulty, timeLimit:rules.time, bonusTime:0,
        success:success, netTime:game.elapsed, penalty:0, hits:0, scrapes:0,
        stars:success ? 3 : 0, almostIn:false, seed:game.map.seed, beat:0};
      const verdict = runVerdict(run); run.title = verdict.title; run.quip = verdict.quip;
      const image = buildShareImage(run);
      const frame = shareSceneFrame(648, success ? 420 : 476);
      return {image:image, width:720, height:960, sourceWidth:frame.sourceWidth,
        sourceHeight:frame.sourceHeight, drawWidth:frame.drawWidth, drawHeight:frame.drawHeight};
    },
    screenScene: function (levelId, scene) {
      if (!growthReady || shareBusy || rescueBusy || followBusy) return false;
      growth.unlocked = true;
      soundEnabled = false; syncSoundToggle();
      game.journey = "campaign"; applyLevel(levelId);
      selectedChapter = Math.floor((game.levelId - 1) / 4);
      suspendedRun = null;
      switchLevelOverlay.classList.remove("is-visible");
      resetGame(scene !== "select");
      if (game.guide.active) finishGuide();
      startOverlay.classList.toggle("is-visible", scene === "select");
      if (scene === "pause") pauseGame();
      updateHud(); draw(); return true;
    },
    state: function () { return { state: game.state, seconds: game.timeLeft, bonus: game.bonusTime, ready: growthReady, following: followStatus, used: dailyGrowth().used, earned: dailyGrowth().earned }; },
    setFollowing: async function (value) {
      if (shareBusy || rescueBusy || followBusy || followChecking || !growthReady || game.state === "resuming" || (game.state === "success" && !game.resultRecorded)) return false;
      await storageQueue;
      window.ParkingLocalPreview.setFollowing(value);
      growth.unlocked = value;
      if (!value) BONUS_LEVELS.forEach(function (id) { delete progress[id]; });
      saveData(PROGRESS_KEY, progress);
      await persistGrowth();
      await refreshFollowStatus();
      game.journey = "campaign"; applyLevel(4); selectedChapter = 0;
      resetGame(false); startOverlay.classList.add("is-visible");
      return true;
    },
    resetDay: async function () {
      if (shareBusy || rescueBusy || followBusy || !growthReady || game.state === "resuming" || (game.state === "success" && !game.resultRecorded)) return false;
      await storageQueue;
      growth = cleanGrowth({ unlocked: growth.unlocked });
      await persistGrowth();
      resetGame(false); startOverlay.classList.add("is-visible");
      renderGrowthActions(); return true;
    },
    crushPreview: async function (age) {
      if (shareBusy || rescueBusy || followBusy || !growthReady) return false;
      if (currentLevel() && !canPlayLevel(game.levelId)) { game.journey = "campaign"; applyLevel(1); }
      startOverlay.classList.remove("is-visible");
      resetGame(true, true);
      if (game.guide.active) finishGuide();
      failAssessment();
      window.ParkingLocalPreview.holdAssessment = typeof age === "number";
      if (typeof age === "number") {
        game.failureFx.age = age;
        game.failureFx.impacted = age >= ASSESSMENT_IMPACT;
        game.car.destroyed = game.failureFx.impacted;
      }
      updateHud(); draw(); return true;
    },
    timeout: async function () {
      if (shareBusy || rescueBusy || followBusy || followChecking || !growthReady || game.state === "resuming" || (game.state === "success" && !game.resultRecorded)) return false;
      if (currentLevel() && !canPlayLevel(game.levelId)) { game.journey = "campaign"; applyLevel(1); selectedChapter = 0; }
      if (game.state !== "playing" && game.state !== "paused") {
        startOverlay.classList.remove("is-visible"); resetGame(true, true);
      }
      if (game.guide.active) finishGuide();
      window.ParkingLocalPreview.holdAssessment = false;
      game.state = "playing"; pauseOverlay.classList.remove("is-visible");
      game.elapsed = Math.max(game.elapsed, (game.rescueUsed ? game.rescueDeadline : game.timeLimit) - game.penalty);
      game.timeLeft = 0; handleTimeout(); updateHud(); draw(); return true;
    }
  });
'''

class PreviewHandler(SimpleHTTPRequestHandler):
    def send_content(self, text, content_type):
        body = text.encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', content_type + '; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(body)

    def do_GET(self):
        url = urlsplit(self.path)
        simulate = parse_qs(url.query).get('simulate') == ['1']
        preview_files = {
            '/preview': ('device-preview.html', 'text/html'),
            '/preview/': ('device-preview.html', 'text/html'),
            '/__device_preview.css': ('device-preview.css', 'text/css'),
            '/__device_preview.js': ('device-preview.js', 'text/javascript'),
        }
        if url.path in preview_files:
            filename, content_type = preview_files[url.path]
            self.send_content((SCRIPTS / filename).read_text(), content_type)
            return
        if url.path == '/__local_preview.js':
            self.send_content((SCRIPTS / 'local-preview.js').read_text(), 'text/javascript')
            return
        if url.path in ('/', '/index.html'):
            source = (Path(self.directory) / 'index.html').read_text()
            source = source.replace('    <script src=', '    <script src="./__local_preview.js"></script>\n    <script src=', 1)
            if simulate:
                source = re.sub(r'(<script src="\./app\.js[^"\n]*)', lambda match: match.group(1) + ('&' if '?' in match.group(1) else '?') + 'simulate=1', source)
            self.send_content(source, 'text/html')
            return
        if url.path == '/app.js' and simulate:
            source = (Path(self.directory) / 'app.js').read_text()
            if source.count(BOOT_MARKER) != 1:
                self.send_error(500, 'Simulation hook marker changed; update preview_server.py')
                return
            source = source.replace('window.localStorage', '(window.ParkingLocalPreview ? window.ParkingLocalPreview.storage : window.localStorage)')
            source = source.replace('  function updateAssessment(dt) {', '  function updateAssessment(dt) {\n    if (window.ParkingLocalPreview.holdAssessment) return;')
            source = source.replace('  function resetGame(autostart = true, reuseMap = false) {', '  function resetGame(autostart = true, reuseMap = false) {\n    window.ParkingLocalPreview.holdAssessment = false;')
            self.send_content(source.replace(BOOT_MARKER, SIMULATION_HOOK + BOOT_MARKER), 'text/javascript')
            return
        super().do_GET()

    def do_HEAD(self):
        self.do_GET()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=4173)
    parser.add_argument('--directory', required=True)
    args = parser.parse_args()
    root = Path(args.directory).resolve()
    with ThreadingHTTPServer(('127.0.0.1', args.port), partial(PreviewHandler, directory=str(root))) as server:
        print('Preview: http://127.0.0.1:%d/?simulate=1' % args.port, flush=True)
        print('Multi-screen: http://127.0.0.1:%d/preview' % args.port, flush=True)
        server.serve_forever()
