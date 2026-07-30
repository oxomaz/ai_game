/* 문제 생성기 자동 검사기
 * 사용법:  node tools/check-gen.js js/gen/arith.js [반복수]
 * 모든 파일 검사:  node tools/check-gen.js
 */
var fs = require('fs'), path = require('path'), vm = require('vm');
var ROOT = path.resolve(__dirname, '..');

var sandbox = { window: {}, console: console, Math: Math, String: String, Number: Number, Array: Array, JSON: JSON, parseInt: parseInt, parseFloat: parseFloat, isNaN: isNaN, isFinite: isFinite, Date: Date, Object: Object, RegExp: RegExp };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
function load(f) { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, { filename: f }); }

load('js/generator.js');
var MQ = sandbox.window.MQ;

var files = process.argv[2] ? [process.argv[2]] : fs.readdirSync(path.join(ROOT, 'js/gen')).filter(function (f) { return /\.js$/.test(f); }).map(function (f) { return 'js/gen/' + f; });
var N = parseInt(process.argv[3] || '200', 10);

var before = MQ.Gen.order.length;
files.forEach(load);
var ids = MQ.Gen.order.slice(before);

var BAD = /undefined|NaN|null|Infinity|\[object/;
var errors = [], count = 0;
function err(id, lv, msg, p) {
  if (errors.length < 40) errors.push('  ✗ [' + id + ' lv' + lv + '] ' + msg + '  ' + JSON.stringify({ text: p && p.text, answer: p && p.answer, choices: p && p.choices }).slice(0, 260));
}

ids.forEach(function (id) {
  var t = MQ.Gen.types[id];
  for (var k = 0; k < N; k++) {
    var lv = t.minLv + Math.floor(Math.random() * (t.maxLv - t.minLv + 1));
    var p;
    try { p = t.fn(lv, MQ.R); } catch (e) { err(id, lv, '예외: ' + e.message); continue; }
    count++;
    if (!p) { err(id, lv, '반환 없음'); continue; }
    if (!p.text || !String(p.text).trim()) err(id, lv, 'text 비었음', p);
    if (p.answer === undefined || p.answer === null || String(p.answer).trim() === '') err(id, lv, 'answer 비었음', p);
    if (!p.explain || !String(p.explain).trim()) err(id, lv, 'explain 비었음', p);
    if (!p.choices || p.choices.length !== 4) { err(id, lv, 'choices 4개 아님', p); continue; }
    var seen = {}, dup = false;
    p.choices.forEach(function (c) { if (seen[String(c)]) dup = true; seen[String(c)] = 1; });
    if (dup) err(id, lv, 'choices 중복', p);
    if (!seen[String(p.answer)]) err(id, lv, 'choices 에 answer 없음', p);
    var blob = [p.text, p.sub || '', p.answer, p.explain].join(' | ');
    if (BAD.test(blob)) err(id, lv, '나쁜 문자열(undefined/NaN 등)', p);
    if (p.svg && (/\s(width|height)=/.test(p.svg) || !/viewBox/.test(p.svg))) err(id, lv, 'svg 규칙 위반(viewBox 필수, width/height 금지)', p);
    if (String(p.text).length > 200) err(id, lv, 'text 너무 김', p);
  }
});

console.log('유형 ' + ids.length + '종: ' + ids.join(', '));
console.log('검사 ' + count + '문제, 오류 ' + errors.length + '건');
if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
console.log('✅ 통과');

// 샘플 3개 출력
ids.forEach(function (id) {
  var t = MQ.Gen.types[id];
  [t.minLv, Math.round((t.minLv + t.maxLv) / 2), t.maxLv].forEach(function (lv) {
    var p = t.fn(lv, MQ.R);
    console.log('[' + id + ' lv' + lv + '] ' + String(p.text).replace(/<[^>]+>/g, '') + ' → ' + p.answer + '  (' + p.choices.join(' / ') + ')');
  });
});
