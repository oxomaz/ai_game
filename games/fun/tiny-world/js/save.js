/* ===========================================================
   Tiny World - js/save.js
   LocalStorage 자동 저장. 저장이 막혀 있어도 게임은 계속된다.
   =========================================================== */
window.TW = window.TW || {};
TW.Save = (function () {
  var KEY = 'tinyWorld_v1';
  var mem = null;          /* localStorage 가 막혔을 때 쓰는 메모리 저장소 */
  var okStorage = null;

  function storage() {
    if (okStorage !== null) return okStorage;
    try {
      window.localStorage.setItem('__tw_test', '1');
      window.localStorage.removeItem('__tw_test');
      okStorage = true;
    } catch (e) { okStorage = false; }
    return okStorage;
  }

  function write(str) {
    if (storage()) {
      try { window.localStorage.setItem(KEY, str); return true; }
      catch (e) { mem = str; return false; }
    }
    mem = str;
    return false;
  }
  function read() {
    if (storage()) {
      try { return window.localStorage.getItem(KEY); } catch (e) { return mem; }
    }
    return mem;
  }

  return {
    save: function (state) {
      try {
        state.lastSave = Date.now();
        return write(JSON.stringify(state));
      } catch (e) { return false; }
    },
    load: function () {
      try {
        var raw = read();
        if (!raw) return null;
        var s = JSON.parse(raw);
        if (!s || !s.pos || !s.inv) return null;
        return s;
      } catch (e) { return null; }
    },
    has: function () { return !!read(); },
    clear: function () {
      if (storage()) { try { window.localStorage.removeItem(KEY); } catch (e) { } }
      mem = null;
    },
    canStore: function () { return storage(); }
  };
})();
