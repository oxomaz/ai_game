/* ══════════════════════════════════════════════════════════════
   카드팩 : 악기 나라 (서양 악기 22 + 국악기 6 = 28가지)

   악기는 쓸 수 있는 이모지가 🎹🎸🎺🎻🥁 정도뿐이고 국악기는 아예 없어서,
   모든 악기를 SVG 로 직접 그렸습니다. (그라디언트 id 충돌을 피하려고
   한 판에 여러 장이 함께 놓여도 안전하도록 단색만 씁니다.)
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function svg(inner) {
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>';
  }

  var ART = {};

  /* ── 건반 ── */
  ART['피아노'] = svg(
    '<rect x="6" y="24" width="88" height="52" rx="7" fill="#33324a"/>' +
    '<rect x="11" y="37" width="78" height="34" rx="3" fill="#fdfdfd"/>' +
    '<path d="M20.8 37v34M30.5 37v34M40.3 37v34M50 37v34M59.8 37v34M69.5 37v34M79.3 37v34" ' +
    'stroke="#c9c7d6" stroke-width="1.4"/>' +
    '<g fill="#22212f"><rect x="17.8" y="37" width="6" height="20" rx="1.2"/>' +
    '<rect x="27.5" y="37" width="6" height="20" rx="1.2"/><rect x="47" y="37" width="6" height="20" rx="1.2"/>' +
    '<rect x="56.8" y="37" width="6" height="20" rx="1.2"/><rect x="66.5" y="37" width="6" height="20" rx="1.2"/></g>'
  );

  ART['아코디언'] = svg(
    '<rect x="26" y="26" width="48" height="50" fill="#f1f3f5"/>' +
    '<g stroke="#adb5bd" stroke-width="2.2"><path d="M32 26v50M38 26v50M44 26v50M50 26v50' +
    'M56 26v50M62 26v50M68 26v50"/></g>' +
    '<rect x="7" y="22" width="20" height="58" rx="5" fill="#c92a2a"/>' +
    '<rect x="73" y="22" width="20" height="58" rx="5" fill="#c92a2a"/>' +
    '<g fill="#ffe3e3"><circle cx="13" cy="34" r="3"/><circle cx="21" cy="34" r="3"/>' +
    '<circle cx="13" cy="46" r="3"/><circle cx="21" cy="46" r="3"/>' +
    '<circle cx="13" cy="58" r="3"/><circle cx="21" cy="58" r="3"/></g>' +
    '<g fill="#fff"><rect x="77" y="28" width="12" height="6" rx="2"/><rect x="77" y="38" width="12" height="6" rx="2"/>' +
    '<rect x="77" y="48" width="12" height="6" rx="2"/><rect x="77" y="58" width="12" height="6" rx="2"/>' +
    '<rect x="77" y="68" width="12" height="6" rx="2"/></g>'
  );

  /* ── 현악기 ── */
  ART['기타'] = svg(
    '<rect x="46" y="10" width="8" height="46" rx="1.5" fill="#6b4423"/>' +
    '<rect x="41" y="4" width="18" height="12" rx="2.5" fill="#4a2f16"/>' +
    '<g fill="#e9d8a6"><circle cx="44.5" cy="8" r="1.7"/><circle cx="44.5" cy="12.5" r="1.7"/>' +
    '<circle cx="55.5" cy="8" r="1.7"/><circle cx="55.5" cy="12.5" r="1.7"/></g>' +
    '<ellipse cx="50" cy="58" rx="19" ry="15" fill="#e0a458"/>' +
    '<ellipse cx="50" cy="78" rx="25" ry="18" fill="#e0a458"/>' +
    '<circle cx="50" cy="60" r="7.5" fill="#3d2410"/>' +
    '<rect x="40" y="84" width="20" height="4.5" rx="1.6" fill="#3d2410"/>' +
    '<path d="M47 20v66M50 20v66M53 20v66" stroke="#fff8e7" stroke-width=".9" opacity=".75"/>'
  );

  ART['우쿨렐레'] = svg(
    '<rect x="47" y="14" width="6" height="40" rx="1.2" fill="#8b5e3c"/>' +
    '<rect x="43" y="8" width="14" height="10" rx="2" fill="#5d3a1a"/>' +
    '<ellipse cx="50" cy="56" rx="15" ry="12" fill="#f2c894"/>' +
    '<ellipse cx="50" cy="74" rx="20" ry="15" fill="#f2c894"/>' +
    '<circle cx="50" cy="58" r="6" fill="#4b2e12"/>' +
    '<rect x="42" y="80" width="16" height="3.6" rx="1.3" fill="#4b2e12"/>' +
    '<path d="M48 22v58M52 22v58" stroke="#fff8e7" stroke-width=".9" opacity=".75"/>'
  );

  ART['바이올린'] = svg(
    '<path d="M12 74L88 32" stroke="#7a4a21" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M13 77L88 35" stroke="#f3ead3" stroke-width="1.8"/>' +
    '<rect x="47" y="8" width="6" height="24" rx="1.5" fill="#4a2f16"/>' +
    '<path d="M50 4c4 0 6 3 5 6" fill="none" stroke="#4a2f16" stroke-width="3.4" stroke-linecap="round"/>' +
    '<path d="M50 28c8 0 13 4 13 10 0 4-3 7-3 10s4 5 4 11c0 9-6 15-14 15s-14-6-14-15c0-6 4-8 4-11s-3-6-3-10' +
    'c0-6 5-10 13-10z" fill="#a0522d"/>' +
    '<path d="M41 52q-2 6 0 12M59 52q2 6 0 12" stroke="#3a1f0c" stroke-width="2" fill="none"/>' +
    '<path d="M48 32v38M50 32v38M52 32v38" stroke="#f5f0e1" stroke-width=".8"/>' +
    '<rect x="45" y="66" width="10" height="9" rx="2" fill="#3a1f0c"/>'
  );

  ART['첼로'] = svg(
    '<rect x="47" y="2" width="6" height="22" rx="1.5" fill="#4a2f16"/>' +
    '<path d="M50 20c11 0 18 6 18 14 0 6-4 9-4 13s6 7 6 15c0 13-9 21-20 21s-20-8-20-21c0-8 6-11 6-15s-4-7-4-13' +
    'c0-8 7-14 18-14z" fill="#8b4513"/>' +
    '<path d="M38 48q-3 8 0 16M62 48q3 8 0 16" stroke="#331b08" stroke-width="2.2" fill="none"/>' +
    '<path d="M47 24v46M50 24v46M53 24v46" stroke="#f5f0e1" stroke-width=".9"/>' +
    '<rect x="44" y="64" width="12" height="11" rx="2.5" fill="#331b08"/>' +
    '<rect x="48.5" y="82" width="3" height="16" rx="1.5" fill="#95a0ad"/>'
  );

  ART['하프'] = svg(
    '<path d="M70 22l12 2 6 64H74z" fill="#a9743f"/>' +
    '<path d="M20 88l6-64 8 2-4 62z" fill="#8b5e34"/>' +
    '<path d="M28 23q22-11 45 4" fill="none" stroke="#8b5e34" stroke-width="8" stroke-linecap="round"/>' +
    '<g stroke="#f3e5c0" stroke-width="1.4">' +
    '<path d="M30 22L80 86M37 20L79 77M44 18L78 68M51 18L76 59M58 20L75 50M65 22L74 41M72 26l1 6"/></g>' +
    '<rect x="14" y="85" width="76" height="10" rx="5" fill="#6b4423"/>'
  );

  ART['가야금'] = svg(
    '<rect x="3" y="32" width="94" height="36" rx="10" fill="#c98f3c"/>' +
    '<rect x="3" y="32" width="94" height="8" rx="4" fill="#e0ab5c"/>' +
    '<rect x="3" y="63" width="94" height="5" rx="2.5" fill="#8a5a1e"/>' +
    '<g fill="#7a4a1a"><path d="M12 62l5-13 5 13z"/><path d="M26 62l5-16 5 16z"/><path d="M40 62l5-13 5 13z"/>' +
    '<path d="M54 62l5-16 5 16z"/><path d="M68 62l5-13 5 13z"/><path d="M82 62l5-16 5 16z"/></g>' +
    '<g stroke="#fff6e0" stroke-width="1.3" opacity=".95">' +
    '<path d="M5 43h90M5 46h90M5 49h90M5 52h90M5 55h90M5 58h90"/></g>'
  );

  ART['해금'] = svg(
    '<path d="M14 42q36 18 72 4" fill="none" stroke="#7a4a21" stroke-width="3.4" stroke-linecap="round"/>' +
    '<path d="M15 45q35 17 70 3" fill="none" stroke="#f3ead3" stroke-width="1.6"/>' +
    '<rect x="47" y="8" width="6" height="60" rx="3" fill="#7a4a21"/>' +
    '<rect x="32" y="15" width="18" height="4.5" rx="2.2" fill="#4a2f16"/>' +
    '<rect x="50" y="25" width="18" height="4.5" rx="2.2" fill="#4a2f16"/>' +
    '<ellipse cx="50" cy="76" rx="18" ry="15" fill="#b5651d"/>' +
    '<ellipse cx="50" cy="76" rx="11.5" ry="9.5" fill="#f0dcb8"/>' +
    '<path d="M48 12v64M52 12v64" stroke="#f5f0e1" stroke-width="1"/>'
  );

  /* ── 금관 ── */
  ART['트럼펫'] = svg(
    '<path d="M64 32L94 18v64L64 68z" fill="#f2b705"/>' +
    '<rect x="20" y="44" width="48" height="12" rx="6" fill="#f2b705"/>' +
    '<rect x="6" y="45" width="16" height="10" rx="5" fill="#c9a227"/>' +
    '<g fill="#d19a00"><rect x="30" y="26" width="8" height="20" rx="2"/>' +
    '<rect x="42" y="26" width="8" height="20" rx="2"/><rect x="54" y="26" width="8" height="20" rx="2"/></g>' +
    '<g fill="#a87c00"><rect x="29" y="21" width="10" height="6" rx="3"/>' +
    '<rect x="41" y="21" width="10" height="6" rx="3"/><rect x="53" y="21" width="10" height="6" rx="3"/></g>'
  );

  ART['트롬본'] = svg(
    '<path d="M66 30L96 16v68L66 70z" fill="#f2b705"/>' +
    '<rect x="12" y="40" width="58" height="9" rx="4.5" fill="#f2b705"/>' +
    '<rect x="12" y="57" width="52" height="9" rx="4.5" fill="#e0a800"/>' +
    '<path d="M16 40v26" stroke="#d19a00" stroke-width="9" stroke-linecap="round"/>' +
    '<rect x="60" y="55" width="10" height="13" rx="5" fill="#c9a227"/>' +
    '<rect x="26" y="36" width="9" height="34" rx="4.5" fill="#c9a227" opacity=".85"/>'
  );

  ART['튜바'] = svg(
    '<path d="M58 68h24a6 6 0 016 6v8" fill="none" stroke="#e0a800" stroke-width="6" stroke-linecap="round"/>' +
    '<g fill="#a87c00"><rect x="64" y="50" width="8" height="20" rx="2.5"/>' +
    '<rect x="75" y="50" width="8" height="20" rx="2.5"/><rect x="86" y="50" width="8" height="20" rx="2.5"/></g>' +
    '<path d="M20 29q10 26 24 30v22a8 8 0 0016 0V59q14-4 24-30z" fill="#f2b705"/>' +
    '<ellipse cx="50" cy="29" rx="30" ry="9" fill="#ffd43b"/>' +
    '<ellipse cx="50" cy="29" rx="20" ry="6" fill="#c9920a"/>' +
    '<rect x="43" y="84" width="14" height="12" rx="5" fill="#d19a00"/>'
  );

  ART['프렌치호른'] = svg(
    '<circle cx="42" cy="52" r="27" fill="none" stroke="#f2b705" stroke-width="8"/>' +
    '<circle cx="42" cy="52" r="14" fill="none" stroke="#e0a800" stroke-width="6"/>' +
    '<ellipse cx="79" cy="66" rx="17" ry="21" fill="#f2b705"/>' +
    '<ellipse cx="79" cy="66" rx="9" ry="12" fill="#a87c00"/>' +
    '<path d="M42 25V12h-18" fill="none" stroke="#c9a227" stroke-width="6" stroke-linecap="round"/>'
  );

  /* ── 목관 ── */
  ART['플루트'] = svg(
    '<rect x="4" y="41" width="92" height="17" rx="8.5" fill="#cfd6de"/>' +
    '<rect x="4" y="41" width="92" height="6" rx="3" fill="#eef2f6"/>' +
    '<rect x="6" y="37" width="15" height="25" rx="7" fill="#aeb8c4"/>' +
    '<ellipse cx="28" cy="49" rx="5" ry="3.4" fill="#5b6672"/>' +
    '<g fill="#8b96a5"><circle cx="42" cy="50" r="5"/><circle cx="54" cy="50" r="5"/>' +
    '<circle cx="66" cy="50" r="5"/><circle cx="78" cy="50" r="5"/></g>' +
    '<rect x="86" y="38" width="9" height="23" rx="4.5" fill="#aeb8c4"/>'
  );

  ART['클라리넷'] = svg(
    '<rect x="43" y="10" width="14" height="64" rx="6" fill="#1f1f27"/>' +
    '<path d="M40 72h20l11 24H29z" fill="#1f1f27"/>' +
    '<rect x="45" y="3" width="10" height="10" rx="4" fill="#3a3a48"/>' +
    '<g fill="#c9ced6"><circle cx="50" cy="26" r="3.6"/><circle cx="50" cy="37" r="3.6"/>' +
    '<circle cx="50" cy="48" r="3.6"/><circle cx="50" cy="59" r="3.6"/>' +
    '<rect x="57" y="18" width="10" height="4.5" rx="2.2"/><rect x="33" y="63" width="10" height="4.5" rx="2.2"/></g>'
  );

  ART['색소폰'] = svg(
    '<path d="M38 18v38c0 21 11 30 25 28" fill="none" stroke="#f2b705" stroke-width="12" stroke-linecap="round"/>' +
    '<path d="M38 18q-3-10 7-11" fill="none" stroke="#e0a800" stroke-width="8" stroke-linecap="round"/>' +
    '<ellipse cx="76" cy="66" rx="16" ry="12" transform="rotate(-32 76 66)" fill="#f2b705"/>' +
    '<ellipse cx="80" cy="60" rx="8" ry="6" transform="rotate(-32 80 60)" fill="#a87c00"/>' +
    '<rect x="40" y="2" width="14" height="9" rx="4" fill="#26262f"/>' +
    '<g fill="#d19a00"><circle cx="46" cy="30" r="3.4"/><circle cx="46" cy="42" r="3.4"/>' +
    '<circle cx="46" cy="54" r="3.4"/><circle cx="52" cy="66" r="3.4"/></g>'
  );

  ART['리코더'] = svg(
    '<path d="M44 6h12l3 12v62a9 9 0 01-18 0V18z" fill="#e8c9a0"/>' +
    '<path d="M43.6 6h12.8l.8 7H42.8z" fill="#b98f5e"/>' +
    '<rect x="45.5" y="17" width="9" height="6" rx="1.5" fill="#7a5a35"/>' +
    '<g fill="#7a5a35"><circle cx="50" cy="32" r="3.2"/><circle cx="50" cy="42" r="3.2"/>' +
    '<circle cx="50" cy="52" r="3.2"/><circle cx="50" cy="62" r="3.2"/><circle cx="50" cy="72" r="3.2"/></g>' +
    '<rect x="41" y="84" width="18" height="5" rx="2.5" fill="#b98f5e"/>'
  );

  ART['하모니카'] = svg(
    '<rect x="8" y="36" width="84" height="28" rx="6" fill="#cfd6de"/>' +
    '<rect x="8" y="36" width="84" height="8" rx="4" fill="#e9edf2"/>' +
    '<rect x="8" y="56" width="84" height="8" rx="4" fill="#aeb8c4"/>' +
    '<rect x="12" y="45" width="76" height="11" rx="2" fill="#2f3540"/>' +
    '<g fill="#e9edf2"><rect x="15" y="47" width="5" height="7" rx="1"/><rect x="23" y="47" width="5" height="7" rx="1"/>' +
    '<rect x="31" y="47" width="5" height="7" rx="1"/><rect x="39" y="47" width="5" height="7" rx="1"/>' +
    '<rect x="47" y="47" width="5" height="7" rx="1"/><rect x="55" y="47" width="5" height="7" rx="1"/>' +
    '<rect x="63" y="47" width="5" height="7" rx="1"/><rect x="71" y="47" width="5" height="7" rx="1"/>' +
    '<rect x="79" y="47" width="5" height="7" rx="1"/></g>'
  );

  ART['단소'] = svg(
    '<rect x="43" y="5" width="14" height="90" rx="6" fill="#cbb27a"/>' +
    '<path d="M43 5h14v7l-7-3.4L43 12z" fill="#8a7238"/>' +
    '<g fill="#9c8447"><rect x="42" y="28" width="16" height="4.5" rx="2"/>' +
    '<rect x="42" y="56" width="16" height="4.5" rx="2"/><rect x="42" y="82" width="16" height="4.5" rx="2"/></g>' +
    '<g fill="#5a4a22"><circle cx="50" cy="40" r="3.2"/><circle cx="50" cy="48" r="3.2"/>' +
    '<circle cx="50" cy="68" r="3.2"/><circle cx="50" cy="76" r="3.2"/></g>'
  );

  /* ── 타악기 ── */
  ART['드럼'] = svg(
    '<path d="M60 20l30-12" stroke="#c9a173" stroke-width="4.5" stroke-linecap="round"/>' +
    '<path d="M68 24l28-12" stroke="#c9a173" stroke-width="4.5" stroke-linecap="round"/>' +
    '<rect x="16" y="38" width="68" height="32" fill="#e03131"/>' +
    '<ellipse cx="50" cy="70" rx="34" ry="11" fill="#c92a2a"/>' +
    '<path d="M18 42l64 24M82 42L18 66" stroke="#ffd8a8" stroke-width="2" opacity=".6"/>' +
    '<ellipse cx="50" cy="38" rx="34" ry="11" fill="#f8f0e3" stroke="#c92a2a" stroke-width="3"/>'
  );

  ART['팀파니'] = svg(
    '<path d="M30 76l-8 20M70 76l8 20M50 82v14" stroke="#8a6520" stroke-width="4.5" stroke-linecap="round"/>' +
    '<path d="M18 42q0 40 32 40t32-40z" fill="#d9a441"/>' +
    '<ellipse cx="50" cy="42" rx="32" ry="11" fill="#f1e3c8" stroke="#a87c2a" stroke-width="3"/>' +
    '<path d="M66 22l16-10" stroke="#c9a173" stroke-width="4" stroke-linecap="round"/>' +
    '<circle cx="64" cy="24" r="6.5" fill="#f1e3c8" stroke="#b09055" stroke-width="1.5"/>'
  );

  ART['실로폰'] = svg(
    '<path d="M12 22h76l-9 62H21z" fill="#b08968"/>' +
    '<g>' +
    '<rect x="19" y="26" width="62" height="5.4" rx="2.7" fill="#e03131"/>' +
    '<rect x="21" y="34" width="58" height="5.4" rx="2.7" fill="#f76707"/>' +
    '<rect x="23" y="42" width="54" height="5.4" rx="2.7" fill="#f59f00"/>' +
    '<rect x="25" y="50" width="50" height="5.4" rx="2.7" fill="#82c91e"/>' +
    '<rect x="27" y="58" width="46" height="5.4" rx="2.7" fill="#12b886"/>' +
    '<rect x="29" y="66" width="42" height="5.4" rx="2.7" fill="#228be6"/>' +
    '<rect x="31" y="74" width="38" height="5.4" rx="2.7" fill="#7048e8"/></g>' +
    '<path d="M74 92l10-16" stroke="#c9a173" stroke-width="4" stroke-linecap="round"/>' +
    '<circle cx="85" cy="74" r="6" fill="#4a2f16"/>'
  );

  ART['심벌즈'] = svg(
    '<path d="M32 22V8h-9M68 22V8h9" fill="none" stroke="#8b5e3c" stroke-width="4" stroke-linecap="round"/>' +
    '<ellipse cx="31" cy="54" rx="20" ry="30" transform="rotate(-8 31 54)" fill="#f2b705"/>' +
    '<ellipse cx="69" cy="54" rx="20" ry="30" transform="rotate(8 69 54)" fill="#e0a800"/>' +
    '<ellipse cx="31" cy="54" rx="12" ry="18" transform="rotate(-8 31 54)" fill="none" stroke="#d9a300" stroke-width="1.6"/>' +
    '<ellipse cx="69" cy="54" rx="12" ry="18" transform="rotate(8 69 54)" fill="none" stroke="#c08a00" stroke-width="1.6"/>' +
    '<ellipse cx="31" cy="54" rx="6" ry="9" fill="#c9a227"/>' +
    '<ellipse cx="69" cy="54" rx="6" ry="9" fill="#a87c00"/>'
  );

  ART['트라이앵글'] = svg(
    '<path d="M50 6v10" stroke="#9aa3ad" stroke-width="2.2"/>' +
    '<path d="M50 16L86 80H24" fill="none" stroke="#cfd6de" stroke-width="7" ' +
    'stroke-linejoin="round" stroke-linecap="round"/>' +
    '<path d="M50 16L15 74" fill="none" stroke="#cfd6de" stroke-width="7" stroke-linecap="round"/>' +
    '<path d="M94 46L62 70" stroke="#aeb8c4" stroke-width="5" stroke-linecap="round"/>'
  );

  ART['탬버린'] = svg(
    '<circle cx="50" cy="52" r="33" fill="none" stroke="#b3733a" stroke-width="10"/>' +
    '<circle cx="50" cy="52" r="28" fill="#f6ead6"/>' +
    '<g fill="#dfe3e8" stroke="#9aa3ad" stroke-width="1.4">' +
    '<circle cx="83" cy="52" r="6"/><circle cx="66.5" cy="23.4" r="6"/><circle cx="33.5" cy="23.4" r="6"/>' +
    '<circle cx="17" cy="52" r="6"/><circle cx="33.5" cy="80.6" r="6"/><circle cx="66.5" cy="80.6" r="6"/></g>'
  );

  ART['마라카스'] = svg(
    '<g transform="rotate(-15 32 50)"><rect x="28.5" y="52" width="7" height="36" rx="3.5" fill="#8b5e3c"/>' +
    '<ellipse cx="32" cy="38" rx="15" ry="18" fill="#f59f00"/>' +
    '<ellipse cx="27" cy="31" rx="4" ry="5" fill="#fff" opacity=".45"/></g>' +
    '<g transform="rotate(15 68 50)"><rect x="64.5" y="52" width="7" height="36" rx="3.5" fill="#8b5e3c"/>' +
    '<ellipse cx="68" cy="38" rx="15" ry="18" fill="#e8590c"/>' +
    '<ellipse cx="63" cy="31" rx="4" ry="5" fill="#fff" opacity=".4"/></g>'
  );

  ART['꽹과리'] = svg(
    '<path d="M46 20V10" stroke="#c92a2a" stroke-width="3.4"/>' +
    '<circle cx="46" cy="52" r="32" fill="#e0a800"/>' +
    '<circle cx="46" cy="52" r="24" fill="none" stroke="#c08a00" stroke-width="2"/>' +
    '<circle cx="46" cy="52" r="11" fill="#c9a227"/>' +
    '<path d="M88 20l-14 22" stroke="#c9a173" stroke-width="4.5" stroke-linecap="round"/>' +
    '<circle cx="90" cy="17" r="7" fill="#8b5e3c"/>'
  );

  ART['장구'] = svg(
    '<path d="M22 22c0 16 14 22 14 28s-14 12-14 28h56c0-16-14-22-14-28s14-12 14-28z" fill="#b5651d"/>' +
    '<path d="M28 30l44 40M28 70l44-40" stroke="#e03131" stroke-width="2.2" opacity=".75"/>' +
    '<ellipse cx="22" cy="50" rx="5.5" ry="28" fill="#f6e7c9" stroke="#8a4b12" stroke-width="2.2"/>' +
    '<ellipse cx="78" cy="50" rx="5.5" ry="28" fill="#f6e7c9" stroke="#8a4b12" stroke-width="2.2"/>' +
    '<path d="M60 12l26-6" stroke="#c9a173" stroke-width="3.6" stroke-linecap="round"/>'
  );

  /* ══════════ 데이터 ══════════
     [이름, 갈래, 짝맞추기용 특징(짧게), 설명] */
  var DATA = [
    ['피아노', '건반악기', '건반 88개로 소리내기', '건반을 누르면 안에서 작은 망치가 줄을 두드려요'],
    ['아코디언', '건반악기', '주름상자를 접었다 폈다', '바람통을 밀고 당기며 건반과 단추를 눌러요'],
    ['기타', '현악기', '줄 여섯 개를 손가락으로', '손가락으로 줄을 눌러 음의 높낮이를 바꿔요'],
    ['우쿨렐레', '현악기', '줄 네 개의 작은 기타', '하와이에서 태어난 작은 악기예요'],
    ['바이올린', '현악기', '활로 켜는 가장 높은 소리', '현악기 가족 가운데 가장 높은 소리를 내요'],
    ['첼로', '현악기', '앉아서 안고 켜는 낮은 소리', '사람 목소리와 가장 비슷하다고 해요'],
    ['하프', '현악기', '47줄을 손으로 뜯기', '줄이 47개, 발판도 7개나 있어요'],
    ['가야금', '국악기', '열두 줄을 뜯는 우리 악기', '1,500년 전 가야에서 만들어졌어요'],
    ['해금', '국악기', '두 줄을 활로 켜는 우리 악기', '줄이 단 두 개인데 모든 음을 낼 수 있어요'],
    ['트럼펫', '금관악기', '단추 세 개와 밝은 나팔', '밸브 세 개를 눌러 음을 바꿔요'],
    ['트롬본', '금관악기', '관을 밀고 당겨 음 바꾸기', '슬라이드를 밀었다 당겼다 하며 연주해요'],
    ['튜바', '금관악기', '가장 크고 낮은 금관', '금관악기 가운데 가장 크고 낮은 소리를 내요'],
    ['프렌치호른', '금관악기', '둥글게 감긴 관과 나팔', '관을 쭉 펴면 4m 가까이 돼요'],
    ['플루트', '목관악기', '옆으로 불어 부는 은빛 관', '입술로 구멍에 바람을 스치듯 불어요'],
    ['클라리넷', '목관악기', '검은 관에 리드 한 장', '얇은 갈대 조각(리드)이 떨려서 소리가 나요'],
    ['색소폰', '목관악기', '금색인데 목관악기', '금속이지만 리드로 소리를 내서 목관이에요'],
    ['리코더', '목관악기', '학교에서 처음 배우는 피리', '구멍을 손가락으로 막아 음을 바꿔요'],
    ['하모니카', '목관악기', '입에 물고 들이쉬고 내쉬고', '불 때와 들이쉴 때 다른 음이 나와요'],
    ['단소', '국악기', '세로로 부는 대나무 피리', '대나무로 만든 우리나라의 세로 피리예요'],
    ['드럼', '타악기', '북 가죽을 채로 두드리기', '밴드에서 박자를 책임지는 악기예요'],
    ['팀파니', '타악기', '솥 모양에 발판이 달린 북', '발판을 밟아 음의 높낮이를 바꿀 수 있어요'],
    ['실로폰', '타악기', '길이가 다른 나무판 두드리기', '판이 짧을수록 높은 소리가 나요'],
    ['심벌즈', '타악기', '접시 두 장을 맞부딪치기', '가장 큰 소리를 내는 순간을 맡아요'],
    ['트라이앵글', '타악기', '세모난 쇠막대를 치기', '한 곳이 끊겨 있어야 맑게 울려요'],
    ['탬버린', '타악기', '테두리에 달린 작은 방울', '흔들어도 되고 두드려도 되는 악기'],
    ['마라카스', '타악기', '흔들면 사각사각 나는 씨앗', '안에 든 작은 알갱이가 부딪혀 소리 나요'],
    ['꽹과리', '국악기', '사물놀이의 가장 높은 쇳소리', '사물놀이에서 가장 높고 날카로운 소리를 맡아요'],
    ['장구', '국악기', '모래시계 모양의 우리 북', '양쪽 가죽이 달라서 소리도 서로 달라요']
  ];

  window.MemoryPacks.add({
    id: 'instruments',
    title: '악기 나라',
    emoji: '🎻',
    desc: '서양 악기와 국악기 28가지를 그림으로',
    back: ['#ffec99', '#d0bfff'],
    modes: [
      { id: 'same', title: '그림 ↔ 그림', a: 'art', b: 'art', hint: '같은 악기 두 장 찾기' },
      { id: 'name', title: '그림 ↔ 이름', a: 'art', b: 'name', hint: '악기와 이름 짝 맞추기' },
      { id: 'trait', title: '이름 ↔ 특징', a: 'name', b: 'trait', hint: '악기와 그 특징 짝 맞추기' }
    ],
    picField: 'art',
    fields: {
      art: { style: 'art' },
      name: { style: 'text' },
      trait: { style: 'sub' }
    },
    info: function (c) {
      return { head: c.name, rows: [['갈래', c.kind], ['특징', c.trait]], note: c.note };
    },
    cards: DATA.map(function (r) {
      return { key: r[0], name: r[0], art: ART[r[0]], kind: r[1], trait: r[2], note: r[3] };
    })
  });
})();
