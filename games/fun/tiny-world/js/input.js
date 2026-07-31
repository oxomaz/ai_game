/* ===========================================================
   Tiny World - js/input.js
   키보드 · 마우스 · 터치(가상 패드) 입력
   =========================================================== */
window.TW = window.TW || {};
TW.Input = (function () {
  var keys = {};
  var padDir = { up: false, down: false, left: false, right: false };
  var actionHeld = false;

  var KEYMAP = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right',
    W: 'up', S: 'down', A: 'left', D: 'right'
  };

  function init() {
    /* ---------- 키보드 ---------- */
    window.addEventListener('keydown', function (e) {
      var code = e.code || e.key;
      var dir = KEYMAP[code] || KEYMAP[e.key];
      if (dir) { keys[dir] = true; e.preventDefault(); return; }
      if (code === 'Space' || code === 'KeyE' || e.key === 'e' || e.key === 'E' || e.key === ' ') {
        e.preventDefault();
        if (!actionHeld) { actionHeld = true; doAction(); }
        return;
      }
      if (code === 'Escape') {
        if (TW.Building.placing) TW.Building.cancelPlace();
        else if (TW.UI.currentPanel()) TW.UI.closePanel();
      }
    });
    window.addEventListener('keyup', function (e) {
      var code = e.code || e.key;
      var dir = KEYMAP[code] || KEYMAP[e.key];
      if (dir) keys[dir] = false;
      if (code === 'Space' || code === 'KeyE' || e.key === 'e' || e.key === 'E' || e.key === ' ') actionHeld = false;
    });
    window.addEventListener('blur', function () {
      keys = {}; padDir = { up: false, down: false, left: false, right: false }; actionHeld = false;
    });

    /* ---------- 가상 패드 ---------- */
    var pad = document.getElementById('pad');
    Array.prototype.forEach.call(pad.querySelectorAll('.pk'), function (btn) {
      var dir = btn.getAttribute('data-dir');
      function on(e) { e.preventDefault(); padDir[dir] = true; btn.classList.add('on'); TW.Audio.unlock(); }
      function off(e) { if (e) e.preventDefault(); padDir[dir] = false; btn.classList.remove('on'); }
      btn.addEventListener('pointerdown', on);
      btn.addEventListener('pointerup', off);
      btn.addEventListener('pointercancel', off);
      btn.addEventListener('pointerleave', off);
      btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    });

    /* ---------- 행동 버튼 ---------- */
    var act = document.getElementById('btnAction');
    act.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      TW.Audio.unlock();
      actionHeld = true;
      doAction();
    });
    act.addEventListener('pointerup', function (e) { e.preventDefault(); actionHeld = false; });
    act.addEventListener('pointercancel', function () { actionHeld = false; });
    act.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    /* ---------- 맵 클릭/터치 ---------- */
    var cv = document.getElementById('cv');
    cv.addEventListener('pointerdown', function (e) {
      TW.Audio.unlock();
      var tile = TW.Map.screenToTile(e.clientX, e.clientY);
      if (TW.Building.placing) { TW.Building.place(tile.x, tile.y); return; }
      /* 가까운 곳을 누르면 바로 상호작용 */
      var p = TW.state.pos;
      var d = Math.sqrt(Math.pow(tile.x + 0.5 - p.x, 2) + Math.pow(tile.y + 0.5 - p.y, 2));
      if (d <= 1.7) doAction(tile);
    });
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  /* 이동 입력을 -1..1 벡터로 */
  function moveVector() {
    var x = 0, y = 0;
    if (keys.left || padDir.left) x -= 1;
    if (keys.right || padDir.right) x += 1;
    if (keys.up || padDir.up) y -= 1;
    if (keys.down || padDir.down) y += 1;
    return { x: x, y: y };
  }

  /* 상호작용: 특정 타일을 지정하면 그 타일을 우선한다 */
  function doAction(tile) {
    if (!TW.state || TW.Game.paused) return;
    if (TW.Building.placing) {
      /* 키보드로는 바라보는 칸에 놓는다 */
      var p0 = TW.state.pos, d0 = TW.state.dir;
      var tx = Math.floor(p0.x) + (d0 === 2 ? -1 : d0 === 3 ? 1 : 0);
      var ty = Math.floor(p0.y) + (d0 === 0 ? 1 : d0 === 1 ? -1 : 0);
      TW.Building.place(tile ? tile.x : tx, tile ? tile.y : ty);
      return;
    }
    var t = null;
    /* 안개 너머(아직 안 열린 지역)를 누르면 아무것도 하지 않는다 */
    if (tile) {
      var lockR = TW.Map.regionLocked(tile.x, tile.y);
      if (lockR) {
        TW.Audio.play('error');
        TW.UI.toast(TW.REGIONS[lockR].name + '은 세계수가 ' + TW.REGIONS[lockR].lock +
          '단계가 되면 열려!', '🔒');
        return;
      }
    }
    if (tile) {
      /* 누른 칸에 무엇이 있는지 확인 */
      var n = TW.Map.nodeAt(tile.x, tile.y);
      var b = TW.Map.buildingAt(tile.x, tile.y);
      if (n) t = { kind: 'node', x: tile.x, y: tile.y, extra: n };
      else if (b) t = { kind: 'building', x: tile.x, y: tile.y, extra: b };
      else if (TW.Map.isWorldTree(tile.x, tile.y)) t = { kind: 'tree', x: tile.x, y: tile.y };
      else if (TW.Map.isPortal(tile.x, tile.y)) t = { kind: 'portal', x: tile.x, y: tile.y };
    }
    if (!t) t = TW.Map.nearestTarget();
    if (!t) {
      TW.UI.toast('가까이 다가가서 눌러 봐!', '👀');
      return;
    }
    TW.Game.interact(t);
  }

  return {
    init: init, moveVector: moveVector, doAction: doAction,
    isActionHeld: function () { return actionHeld; }
  };
})();
