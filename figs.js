/* ══════════════════════════════════════════════════════════════
   컴활 2급 실기 · 함수 연습소 — 그림 모음 (보조03 · 2026-10-01)
   공용 그리기 도우미 links/fig.js 를 쓴다. index.html(📖 먼저 배우기) · 수업 슬라이드가 함께 부른다.

   한 칸의 모양
     키: { cap:'캡션 한 줄', cards:['lesson.js 의 제목(t)'…], slide:true|'q', draw:function(){ … } }
       cards — lesson.js LESSON 의 제목과 **똑같이**. 그 배우기 카드 안에 그림이 나온다
       slide — 그 슬라이드의 그림 칸에도 이 그림을 쓴다. 'q' 면 정답 이름표(ans)를 ? 로 가린다
               (슬라이드는 끝에 퀴즈가 나오는데 그림 칸이 계속 떠 있다 — 그림 글자가 퀴즈 답이면 안 된다)
     순서 = 화면에 나오는 순서.

   주제는 「함수가 표를 어떻게 바꾸나」 — 미니 시트로 **전과 후**를 그린다.
   그림 속 계산 결과는 이 저장소의 engine.js 로 실제 계산해 맞춰 봤다(날짜 요일은 달력으로 확인).
   예시 표는 연습문제(data/*.js)와 **겹치지 않게** 새로 짰다 — 배우기 그림이 문제의 답이 되지 않도록.
   ══════════════════════════════════════════════════════════════ */
var FIGS = (function () {
  var F = window.FIG;
  if (!F) return {};
  var C = F.C;
  var t = F.t, box = F.box, line = F.line, arrow = F.arrow;

  /* ═════ 시트 그리기 도우미 (1급 엑셀 figs.js 와 같은 코드) ═════ */
  var MONO = "Consolas,'D2Coding','Malgun Gothic',monospace";
  var FILL = { y: C.yellowL, g: C.greenL, b: C.blueL, r: C.redL, o: C.orangeL, p: C.purpleL, h: C.grayL };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function rect(x, y, w, h, fill, st, sw) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill +
      '" stroke="' + (st || C.grayM) + '" stroke-width="' + (sw || 1) + '"/>';
  }
  /* 고정폭 글자 (수식) */
  function mono(x, y, s, o) { o = o || {}; o.halo = o.halo || false; return '<g font-family="' + MONO + '">' + t(x, y, s, o) + '</g>'; }
  /* 여러 색 글자 한 줄 — parts: [['=A3*'], ['$B$1', C.orange, 1]] (글자, 색, 굵게) */
  function rich(x, y, parts, o) {
    o = o || {};
    var sp = parts.map(function (p) {
      return '<tspan fill="' + (p[1] || C.ink) + '"' + (p[2] ? ' font-weight="700"' : '') + '>' + esc(p[0]) + '</tspan>';
    }).join('');
    return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 15) + '" text-anchor="' +
      (o.a === 'm' ? 'middle' : (o.a === 'e' ? 'end' : 'start')) + '" dominant-baseline="middle"' +
      (o.mono === false ? '' : ' font-family="' + MONO + '"') + '>' + sp + '</text>';
  }
  /* {'r,c':v} · {'r,c:r2,c2':v} → 칸마다 찾는 함수 */
  function spread(map) {
    var L = [];
    Object.keys(map || {}).forEach(function (k) {
      var m = k.split(':'), a = m[0].split(','), b = (m[1] || m[0]).split(',');
      L.push([+a[0], +a[1], +b[0], +b[1], map[k]]);
    });
    return function (r, c) {
      var v; L.forEach(function (q) { if (r >= q[0] && r <= q[2] && c >= q[1] && c <= q[3]) v = q[4]; }); return v;
    };
  }
  /* 미니 시트
     o.rows 칸 내용(2차원, null·'' = 빈칸) · o.cols 열 머리글(['A','B'…]) 없으면 머리글·행 번호 없이 표만
     o.cw 열 너비(수 또는 배열) · o.rh 행 높이 · o.r0 첫 행 번호 · o.fs 글자 크기
     o.fill {'r,c':'y'} (y 노랑 · g 초록 · b 파랑 · r 빨강 · o 주황 · p 보라 · h 회색)
     o.bold · o.tc(글자색) · o.ans(정답 이름표) — 같은 꼴 · o.head 첫 행을 필드 이름으로 · o.sel [r,c] 선택 칸 */
  function sheet(x, y, o) {
    var rows = o.rows, nc = rows[0].length, cw = o.cw || 56, rh = o.rh || 26, fs = o.fs || 14, r0 = o.r0 == null ? 1 : o.r0;
    var hh = o.cols ? 20 : 0, hw = o.cols ? (o.hw || 24) : 0, i, r, c;
    var W = [], X = [x + hw];
    for (i = 0; i < nc; i++) { W.push(typeof cw === 'number' ? cw : cw[i]); X.push(X[i] + W[i]); }
    var Y0 = y + hh, fill = spread(o.fill), bold = spread(o.bold), tc = spread(o.tc), ans = spread(o.ans), s = '';
    if (o.cols) {
      s += rect(x, y, hw, hh, C.grayL);
      for (i = 0; i < nc; i++) s += rect(X[i], y, W[i], hh, C.grayL) + t(X[i] + W[i] / 2, y + hh / 2 + 0.5, o.cols[i], { a: 'm', size: 13, c: C.sub, halo: false });
      for (r = 0; r < rows.length; r++) s += rect(x, Y0 + r * rh, hw, rh, C.grayL) + t(x + hw / 2, Y0 + r * rh + rh / 2 + 0.5, String(r0 + r), { a: 'm', size: 13, c: C.sub, halo: false });
    }
    for (r = 0; r < rows.length; r++) for (c = 0; c < nc; c++) {
      var hd = o.head && r === 0, f = fill(r, c), v = rows[r][c];
      s += rect(X[c], Y0 + r * rh, W[c], rh, f ? (FILL[f] || f) : (hd ? C.grayL : C.paper));
      if (v != null && v !== '') s += t(X[c] + W[c] / 2, Y0 + r * rh + rh / 2 + 0.5, String(v),
        { a: 'm', size: fs, b: hd || bold(r, c), c: tc(r, c) || C.ink, halo: false, ans: ans(r, c) });
    }
    if (o.sel) s += rect(X[o.sel[1]], Y0 + o.sel[0] * rh, W[o.sel[1]], rh, 'none', C.green, 2.6);
    return {
      s: s, x: function (c) { return X[c]; }, cx: function (c) { return X[c] + W[c] / 2; },
      y: function (r) { return Y0 + r * rh; }, cy: function (r) { return Y0 + r * rh + rh / 2; },
      w: function (c) { return W[c]; }, left: x, top: y, right: X[nc], bottom: Y0 + rows.length * rh, rh: rh
    };
  }
  /* 시트 위 범위 테두리 */
  function frame(sh, r1, c1, r2, c2, col, o) {
    o = o || {};
    var x = sh.x(c1) - 2, y = sh.y(r1) - 2, w = sh.x(c2) + sh.w(c2) - sh.x(c1) + 4, h = sh.y(r2) + sh.rh - sh.y(r1) + 4;
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" fill="none" stroke="' + col +
      '" stroke-width="' + (o.w || 2.4) + '"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + '/>';
  }
  /* 수식 입력줄 — [칸 이름] fx 수식 */
  function fxbar(x, y, w, s, o) {
    o = o || {};
    var nb = o.cell ? 46 : 0, out = '';
    if (o.cell) out += box(x, y, nb - 4, 28, { fill: C.paper, c: C.line, w: 1.2, r: 4 }) + t(x + (nb - 4) / 2, y + 14.5, o.cell, { a: 'm', size: 13, c: C.sub, halo: false });
    out += box(x + nb, y, w - nb, 28, { fill: C.paper, c: C.line, w: 1.2, r: 4 }) +
      t(x + nb + 15, y + 14.5, 'fx', { a: 'm', size: 13, b: 1, c: C.sub, halo: false }) + line(x + nb + 30, y + 5, x + nb + 30, y + 23, { c: C.grayM, w: 1 });
    out += Array.isArray(s) ? rich(x + nb + 38, y + 15, s, { size: o.size || 14 }) :
      mono(x + nb + 38, y + 15, s, { size: o.size || 14, ans: o.ans, c: o.c });
    return out;
  }
  /* 둥근 알약 이름표 */
  function pill(x, y, w, s, col, o) {
    o = o || {};
    return box(x, y, w, o.h || 28, { fill: o.fill || C.paper, c: col, w: 1.6, r: (o.h || 28) / 2 }) +
      t(x + w / 2, y + (o.h || 28) / 2 + 0.5, s, { a: 'm', size: o.size || 14, b: o.b == null ? 1 : o.b, c: o.tc || col, halo: false, ans: o.ans });
  }
  function divider(x, y1, y2) { return line(x, y1, x, y2, { c: C.grayM, w: 1.4, dash: '6 5' }); }
  function hdiv(y, x1, x2) { return line(x1 || 14, y, x2 || 466, y, { c: C.grayM, w: 1.4, dash: '6 5' }); }
  function check(x, y, c) { return F.path('M' + (x - 6) + ',' + y + ' l4,5 l9,-10', { c: c || C.green, w: 2.6 }); }
  function cross(x, y, c) { return line(x - 6, y - 6, x + 6, y + 6, { c: c || C.red, w: 2.6 }) + line(x + 6, y - 6, x - 6, y + 6, { c: c || C.red, w: 2.6 }); }

  return {

  /* ─────────── Ⅰ. 수식의 기본과 참조 ─────────── */
  ref: { cards: ['수식의 기본과 참조 — 여기서 제일 많이 틀린다'], slide: true,
    cap: '아래로 채우면 A3 → A4 → A5 는 따라 내려가고, $B$1 은 꿈쩍하지 않는다',
    draw: function () {
      var sh = sheet(16, 30, { cols: ['A', 'B'], cw: [64, 150],
        rows: [['단가', '500'], ['수량', '금액'], ['10', ''], ['20', ''], ['30', '']],
        fill: { '0,1': 'o', '2,0:4,0': 'b' }, bold: { '1,0:1,1': 1, '0,0': 1 } });
      var s = sh.s;
      for (var i = 0; i < 3; i++) {
        s += rich(sh.x(1) + 10, sh.cy(2 + i), [['='], ['A' + (3 + i), C.blue, 1], ['*'], ['$B$1', C.orange, 1]], { size: 15 });
      }
      s += box(sh.right - 6, sh.y(3) - 6, 8, 8, { fill: C.green, c: C.green, r: 1, w: 1 });
      s += arrow(sh.right + 12, sh.cy(2), sh.right + 12, sh.cy(4) + 6, { c: C.green, w: 2 });
      s += t(sh.right + 22, sh.cy(3), '채우기', { size: 13, c: C.green, b: 1 });
      s += t(16, 212, '● A3 → A4 → A5  따라 내려간다 (상대 참조)', { size: 14, c: C.blue, b: 1 });
      s += t(16, 238, '● $B$1  꿈쩍하지 않는다 (절대 참조)', { size: 14, c: C.orange, b: 1 });
      /* F4 로 도는 네 모양 */
      var cx = 398, cy = 112, P = [[cx, cy - 64, 'A1', '상대'], [cx + 44, cy, '$A$1', '절대'], [cx, cy + 64, 'A$1', '행만 고정'], [cx - 44, cy, '$A1', '열만 고정']];
      P.forEach(function (p, k) {
        s += box(p[0] - 33, p[1] - 22, 66, 44, { fill: k === 1 ? C.orangeL : C.paper, c: k === 1 ? C.orange : C.line, w: 1.6 });
        s += mono(p[0], p[1] - 7, p[2], { a: 'm', size: 15, b: 1 }) + t(p[0], p[1] + 12, p[3], { a: 'm', size: 13, c: C.sub, halo: false });
      });
      s += arrow(cx + 24, cy - 42, cx + 36, cy - 24, { c: C.sub, w: 1.6, head: 8 }) + arrow(cx + 36, cy + 24, cx + 24, cy + 42, { c: C.sub, w: 1.6, head: 8 }) +
        arrow(cx - 24, cy + 42, cx - 36, cy + 24, { c: C.sub, w: 1.6, head: 8 }) + arrow(cx - 36, cy - 24, cx - 24, cy - 42, { c: C.sub, w: 1.6, head: 8 });
      s += box(cx - 17, cy - 14, 34, 28, { fill: C.grayL, c: C.ink, w: 1.6, r: 5, label: 'F4', size: 15 });
      s += t(cx, 212, 'F4 를 누를 때마다', { a: 'm', size: 13, c: C.sub }) + t(cx, 232, '이 차례로 돈다', { a: 'm', size: 13, c: C.sub });
      return F.svg(480, 256, s);
    } },

  /* ─────────── Ⅱ. 기본작업 ─────────── */
  adv: { cards: ['고급 필터 — 조건 범위부터 만든다'], slide: 'q',
    cap: '고급 필터 — 조건을 같은 행에 쓰면 그리고(AND), 다른 행에 쓰면 또는(OR)',
    draw: function () {
      var sh = sheet(14, 14, { head: 1, cw: [56, 72, 56, 50, 50],
        rows: [['이름', '부서', '실적', 'AND', 'OR'], ['김도윤', '영업부', '350', '', ''], ['이서준', '생산부', '420', '', ''],
               ['박하은', '영업부', '250', '', ''], ['최지안', '생산부', '180', '', ''], ['정우진', '영업부', '300', '', '']],
        fill: { '0,3': 'b', '0,4': 'o' } });
      var s = sh.s, andR = [1, 5], orR = [1, 2, 3, 5];
      andR.forEach(function (r) { s += check(sh.cx(3), sh.cy(r), C.blue); });
      orR.forEach(function (r) { s += check(sh.cx(4), sh.cy(r), C.orange); });
      s += t(sh.right + 10, sh.cy(0), '✓ = 뽑힌 행', { size: 13, c: C.sub });
      /* 조건 범위 두 가지 */
      var y = 200;
      s += t(14, y - 14, '같은 행 → 그리고(AND)', { size: 15, b: 1, c: C.blue });
      var a = sheet(14, y, { head: 1, cw: [72, 66], rows: [['부서', '실적'], ['영업부', '>=300']], fill: { '1,0:1,1': 'b' } });
      s += a.s + t(14, a.bottom + 16, '둘 다 맞아야 → 2명', { size: 13, c: C.sub });
      s += t(250, y - 14, '다른 행 → 또는(OR)', { size: 15, b: 1, c: C.orange });
      var o = sheet(250, y, { head: 1, cw: [72, 66], rows: [['부서', '실적'], ['영업부', ''], ['', '>=300']], fill: { '1,0': 'o', '2,1': 'o' } });
      s += o.s + t(392, o.cy(1), '하나만', { size: 13, c: C.sub }) + t(392, o.cy(2), '맞아도 → 4명', { size: 13, c: C.sub });
      s += t(14, 306, '첫 줄 필드 이름은 원본과 글자까지 똑같이', { size: 14, b: 1, ans: true });
      return F.svg(480, 322, s);
    } },

  cf: { cards: ['조건부 서식 — 행 전체 칠하기'], slide: true,
    cap: '조건부 서식 — =$F4>=90 : 열만 고정해서 어느 칸이든 F열을 보고, 행 전체가 칠해진다',
    draw: function () {
      var sh = sheet(14, 20, { cols: ['A', 'B', 'C', 'D', 'E', 'F'], r0: 3, cw: [58, 40, 40, 40, 40, 56],
        rows: [['설비', '1주', '2주', '3주', '4주', '가동률'], ['프레스', '92', '95', '90', '95', '93'], ['선반', '80', '88', '84', '88', '85'],
               ['밀링', '96', '98', '97', '97', '97'], ['용접기', '86', '90', '88', '88', '88']],
        head: 1, fill: { '1,0:1,5': 'b', '3,0:3,5': 'b' } });
      var s = sh.s;
      s += frame(sh, 1, 0, 4, 5, C.green, { dash: '5 4', w: 2 });
      s += t(sh.left + 24, sh.bottom + 16, '① 범위 A4:F7 을 먼저 선택', { size: 13, c: C.green, b: 1 });
      [1, 3].forEach(function (r) { s += check(sh.right + 16, sh.cy(r), C.blue); });
      [2, 4].forEach(function (r) { s += t(sh.right + 16, sh.cy(r), '–', { a: 'm', c: C.sub }); });
      var y = 212;
      s += t(14, y, '② 규칙 수식', { size: 14, b: 1 });
      s += box(110, y - 18, 130, 36, { fill: C.paper, c: C.ink, w: 1.6, r: 6 }) +
        rich(175, y + 1, [['='], ['$F', C.red, 1], ['4', C.blue, 1], ['>=90']], { a: 'm', size: 17 });
      s += rich(256, y - 10, [['$F', C.red, 1], [' 열은 늘 F (고정)', C.red]], { size: 14, mono: false });
      s += rich(256, y + 14, [['4', C.blue, 1], [' 행은 따라 내려간다', C.blue]], { size: 14, mono: false });
      s += t(14, 254, '$F$4 로 쓰면 모든 행이 4행만 보고 한꺼번에 칠해지거나 안 칠해진다', { size: 13, c: C.sub });
      return F.svg(480, 272, s);
    } },

  fmt: { cards: ['사용자 지정 표시 형식'], slide: 'q',
    cap: '표시 형식은 보이는 모양만 바꾼다 — 칸 속 값은 그대로라 계산도 원래 값으로',
    draw: function () {
      var s = t(20, 22, '입력한 값', { size: 13, c: C.sub, b: 1 }) + t(172, 22, '표시 형식 코드', { size: 13, c: C.sub, b: 1 }) +
        t(350, 22, '셀에 보이는 모습', { size: 13, c: C.sub, b: 1 });
      var R = [['1234567', '#,##0', '1,234,567'], ['1234567', '#,##0,', '1,235'], ['85', '0"점"', '85점'], ['가방', '"제품-"@', '제품-가방']];
      R.forEach(function (r, i) {
        var y = 50 + i * 40;
        s += box(20, y - 14, 110, 28, { fill: C.grayL, c: C.line, w: 1.2, r: 4 }) + mono(75, y, r[0], { a: 'm', size: 15 });
        s += arrow(134, y, 164, y, { c: C.sub, w: 1.6, head: 8 });
        s += box(168, y - 14, 130, 28, { fill: C.orangeL, c: C.orange, w: 1.4, r: 4 }) + mono(233, y, r[1], { a: 'm', size: 15, b: 1, c: C.orange, ans: i === 1 });
        s += arrow(302, y, 332, y, { c: C.sub, w: 1.6, head: 8 });
        s += box(336, y - 14, 124, 28, { fill: C.paper, c: C.ink, w: 1.4, r: 0 }) + t(454, y, r[2], { a: 'e', size: 15, b: 1, halo: false });
      });
      s += hdiv(210);
      var sh = sheet(20, 226, { cols: ['A'], cw: [96], rows: [['85점'], ['90점'], ['175']], fill: { '2,0': 'g' }, sel: [2, 0] });
      s += sh.s;
      s += fxbar(150, 250, 310, [['=SUM(A1:A2)']], { cell: 'A3' });
      s += t(150, 296, '«85점»으로 보여도 칸 속은 85 — 그래서 더해진다', { size: 14, b: 1, c: C.green });
      return F.svg(480, 318, s);
    } },

  merge: { cards: ['제목 만들기와 셀 다루기'], slide: 'q',
    cap: '병합하고 가운데 맞춤 — 여러 칸을 합치면 왼쪽 위 칸의 글자만 남는다',
    draw: function () {
      var a = sheet(14, 44, { cols: ['A', 'B', 'C'], cw: [56, 56, 56], rows: [['생산', '일보', '9월'], ['', '', '']], fill: { '0,0:0,2': 'b' } });
      var s = t(14, 24, '병합 전 — A1:C1 선택', { size: 14, b: 1 }) + a.s;
      s += arrow(212, 76, 248, 76, { c: C.ink });
      /* 병합 후 */
      var x = 258, y = 44;
      s += rect(x, y, 24, 20, C.grayL) + t(x + 12, y + 10.5, '', {});
      ['A', 'B', 'C'].forEach(function (L, i) { s += rect(x + 24 + i * 56, y, 56, 20, C.grayL) + t(x + 52 + i * 56, y + 10.5, L, { a: 'm', size: 13, c: C.sub, halo: false }); });
      s += rect(x, y + 20, 24, 26, C.grayL) + t(x + 12, y + 33.5, '1', { a: 'm', size: 13, c: C.sub, halo: false }) +
        rect(x, y + 46, 24, 26, C.grayL) + t(x + 12, y + 59.5, '2', { a: 'm', size: 13, c: C.sub, halo: false });
      s += rect(x + 24, y + 20, 168, 26, C.greenL) + t(x + 108, y + 33.5, '생산', { a: 'm', size: 15, b: 1, halo: false, ans: true });
      for (var i = 0; i < 3; i++) s += rect(x + 24 + i * 56, y + 46, 56, 26, C.paper);
      s += t(x, 24, '병합 후 — 한 칸', { size: 14, b: 1, c: C.green });
      s += box(14, 142, 452, 64, { fill: C.redL, c: C.red, w: 1.4 });
      s += t(30, 162, '«일보» «9월» 은 지워진다', { size: 15, b: 1, c: C.red, halo: false });
      s += t(30, 188, '→ 합칠 글자는 먼저 왼쪽 위 칸(A1)에 모아 두고 병합', { size: 14, halo: false });
      return F.svg(480, 222, s);
    } },

  valid: { cards: ['데이터 유효성 검사'], slide: 'q',
    cap: '데이터 유효성 검사 — 제한 대상을 «목록»으로 하면 ▼ 에서 고르고, 목록에 없는 값은 막힌다',
    draw: function () {
      var sh = sheet(14, 40, { cols: ['A', 'B'], cw: [66, 86], rows: [['이름', '부서'], ['김도윤', '생산부'], ['박하은', '총무부'], ['이서준', '']], head: 1, sel: [3, 1] });
      var s = t(14, 20, '제한 대상 = 목록 · 원본 = 생산부,품질부,설비부', { size: 13, b: 1, c: C.blue, ans: true }) + sh.s;
      /* ▼ 단추와 펼친 목록 */
      var bx = sh.right - 1, by = sh.y(3);
      s += box(bx, by + 2, 20, 22, { fill: C.grayL, c: C.line, w: 1, r: 2 }) + F.poly([[bx + 5, by + 10], [bx + 15, by + 10], [bx + 10, by + 16]], { close: 1, fill: C.ink, c: C.ink, w: 1 });
      var lx = sh.x(1), ly = sh.bottom;
      s += box(lx, ly, 106, 84, { fill: C.paper, c: C.blue, w: 1.6, r: 2 });
      ['생산부', '품질부', '설비부'].forEach(function (v, i) {
        if (i === 1) s += rect(lx + 2, ly + 3 + i * 26, 102, 26, C.blueL, 'none', 0);
        s += t(lx + 12, ly + 16 + i * 26, v, { size: 14, halo: false });
      });
      s += F.callout(sh.x(1) + sh.w(1) - 10, sh.cy(2), 222, 66, '이미 있던 «총무부» 는\n검사하지 않는다', { c: C.sub, size: 13 });
      s += F.callout(bx + 18, by + 13, 222, 126, '▼ 누르면 목록이 펼쳐진다', { c: C.blue, tc: C.blue, b: 1, size: 13 });
      /* 어긋난 값 */
      var x = 216, y = 156;
      s += box(x, y, 250, 80, { fill: C.paper, c: C.red, w: 1.8 });
      s += box(x, y, 250, 26, { fill: C.redL, c: C.red, w: 1.8, r: 8 }) + t(x + 12, y + 13, '오류 메시지', { size: 14, b: 1, c: C.red, halo: false });
      s += t(x + 14, y + 44, '목록에 없는 «영업부» 를 넣으면', { size: 13, halo: false }) + t(x + 14, y + 64, '입력이 거부된다', { size: 14, b: 1, c: C.red, halo: false });
      return F.svg(480, 276, s);
    } },

  /* ─────────── Ⅲ. 계산작업 ─────────── */
  if: { cards: ['IF — 조건에 따라 갈라 쓰기'], slide: 'q',
    cap: 'IF — 조건이 참이면 앞의 값, 거짓이면 뒤의 값. 문자는 "큰따옴표"',
    draw: function () {
      var s = '';
      s += box(170, 14, 140, 40, { fill: C.yellowL, c: C.orange, w: 1.8, r: 20 }) + mono(240, 34, 'D2>=160 ?', { a: 'm', size: 16, b: 1 });
      s += arrow(200, 54, 120, 92, { c: C.green }) + arrow(280, 54, 360, 92, { c: C.red });
      s += t(142, 64, '참', { size: 14, b: 1, c: C.green, a: 'e' }) + t(338, 64, '거짓', { size: 14, b: 1, c: C.red });
      s += box(60, 94, 120, 34, { fill: C.greenL, c: C.green, w: 1.6 }) + mono(120, 111, '"합격"', { a: 'm', size: 16, b: 1, c: C.green });
      s += box(300, 94, 120, 34, { fill: C.redL, c: C.red, w: 1.6 }) + mono(360, 111, '"불합격"', { a: 'm', size: 16, b: 1, c: C.red });
      s += fxbar(14, 146, 452, '=IF(D2>=160,"합격","불합격")', { cell: 'E2', ans: true, size: 15 });
      var sh = sheet(14, 186, { cols: ['A', 'D', 'E'], cw: [80, 70, 86], r0: 2, rows: [['김도윤', '175', '합격'], ['이서준', '160', '합격'], ['박하은', '142', '불합격']],
        tc: { '0,2:1,2': C.green, '2,2': C.red }, bold: { '0,2:2,2': 1 }, fill: { '0,2:1,2': 'g', '2,2': 'r' } });
      s += sh.s;
      s += F.callout(sh.right, sh.cy(1), sh.right + 20, sh.cy(1), '딱 160 도 합격', { c: C.orange, tc: C.orange, b: 1, size: 14 });
      s += t(sh.right + 26, sh.cy(1) + 22, '(«이상» = >=)', { size: 13, c: C.orange });
      return F.svg(480, 298, s);
    } },

  nestif: { cards: ['조건이 둘 이상일 때 — AND · OR · 중첩 IF'], slide: 'q',
    cap: '중첩 IF — 큰 조건부터 차례로 거른다. 80 을 먼저 물으면 95점도 B 가 된다',
    draw: function () {
      var s = mono(240, 22, '=IF(B2>=90,"A",IF(B2>=80,"B","C"))', { a: 'm', size: 15, b: 1 });
      function dia(x, y, txt) { return box(x - 60, y - 18, 120, 36, { fill: C.yellowL, c: C.orange, w: 1.6, r: 18 }) + mono(x, y + 1, txt, { a: 'm', size: 15, b: 1 }); }
      function out(x, y, v, col, fill) { return box(x - 26, y - 17, 52, 34, { fill: fill, c: col, w: 1.6 }) + t(x, y + 1, v, { a: 'm', size: 18, b: 1, c: col, halo: false }); }
      s += dia(120, 70, '>=90 ?') + arrow(180, 70, 222, 70, { c: C.green }) + t(200, 58, '예', { a: 'm', size: 13, c: C.green, b: 1 }) + out(250, 70, 'A', C.green, C.greenL);
      s += arrow(120, 88, 120, 118, { c: C.red }) + t(128, 104, '아니오', { size: 13, c: C.red, b: 1 });
      s += dia(120, 138, '>=80 ?') + arrow(180, 138, 222, 138, { c: C.green }) + t(200, 126, '예', { a: 'm', size: 13, c: C.green, b: 1 }) + out(250, 138, 'B', C.blue, C.blueL);
      s += arrow(120, 156, 120, 186, { c: C.red }) + t(128, 172, '아니오', { size: 13, c: C.red, b: 1 }) + out(120, 204, 'C', C.sub, C.grayL);
      s += divider(300, 48, 226);
      s += t(316, 60, '95점 → A', { size: 15, b: 1, c: C.green }) + t(316, 88, '84점 → B', { size: 15, b: 1, c: C.blue }) + t(316, 116, '72점 → C', { size: 15, b: 1, c: C.sub });
      s += box(312, 142, 156, 76, { fill: C.redL, c: C.red, w: 1.4 });
      s += t(322, 162, '거꾸로 쓰면', { size: 14, b: 1, c: C.red, halo: false }) + mono(322, 184, 'IF(B2>=80,"B",…', { size: 13, halo: false }) +
        t(322, 206, '95점도 «B» 로 끝난다', { size: 14, c: C.red, halo: false });
      s += hdiv(240);
      s += t(20, 262, 'AND(조건1,조건2) — 모두 참이어야', { size: 14, b: 1, ans: true }) + t(20, 288, 'OR(조건1,조건2) — 하나만 참이어도', { size: 14, b: 1 });
      s += rich(330, 262, [['TRUE', C.green, 1], [' 둘 다', C.sub]], { size: 14 }) + rich(330, 288, [['TRUE', C.green, 1], [' 하나만', C.sub]], { size: 14 });
      return F.svg(480, 306, s);
    } },

  count: { cards: ['개수를 세는 함수'], slide: true,
    cap: '같은 범위 B2:B6 인데 세는 것이 다르다 — 숫자 · 비지 않은 칸 · 빈 칸 · 조건',
    draw: function () {
      var sh = sheet(14, 24, { cols: ['A', 'B'], cw: [70, 70], rows: [['설비', '점검'], ['프레스', '85'], ['선반', '결시'], ['밀링', ''], ['용접기', '92'], ['연삭기', '78']], head: 1,
        fill: { '1,1:5,1': 'h' } });
      var s = sh.s;
      var F4 = [['COUNT', '숫자', [1, 0, 0, 1, 1], '3'], ['COUNTA', '비지 않은 칸', [1, 1, 0, 1, 1], '4'], ['COUNTBLANK', '빈 칸', [0, 0, 1, 0, 0], '1'], ['COUNTIF(,">=80")', '80 이상', [1, 0, 0, 1, 0], '2']];
      F4.forEach(function (f, i) {
        var y = 42 + i * 52;
        s += mono(200, y, f[0], { size: 14, b: 1, c: C.blue }) + t(200, y + 20, f[1], { size: 13, c: C.sub });
        for (var k = 0; k < 5; k++) s += F.circle(344 + k * 16, y + 8, 6, { fill: f[2][k] ? C.blue : C.paper, c: f[2][k] ? C.blue : C.grayM, w: 1.4 });
        s += t(440, y + 8, '→ ' + f[3], { size: 16, b: 1 });
      });
      s += t(200, 252, '동그라미 = B2 ~ B6 차례 · ● 세어진 칸', { size: 13, c: C.sub });
      return F.svg(480, 270, s);
    } },

  rank: { cards: ['순위와 큰 값 · 작은 값'], slide: 'q',
    cap: 'RANK.EQ — 큰 값이 1등(순서 0·생략). 같은 점수는 같은 등수, 그다음 등수는 건너뛴다',
    draw: function () {
      var sh = sheet(14, 26, { cols: ['A', 'B', 'C'], cw: [70, 56, 56], rows: [['이름', '점수', '순위'], ['김한별', '85', '3'], ['이가람', '92', '1'], ['박누리', '78', '4'], ['최다솜', '92', '1']],
        head: 1, fill: { '1,2:4,2': 'g' }, ans: { '1,2:4,2': 1 }, bold: { '1,2:4,2': 1 } });
      var s = sh.s;
      s += fxbar(14, sh.bottom + 12, 250, '=RANK.EQ(B2,$B$2:$B$5)', { size: 13 });
      /* 줄 세우기 */
      var x = 280, top = 40;
      s += t(x, 24, '높은 점수부터 줄 세우면', { size: 13, c: C.sub, b: 1 });
      var L = [['1등', '92', '92'], ['2등', '(없음)', ''], ['3등', '85', ''], ['4등', '78', '']];
      L.forEach(function (r, i) {
        var y = top + 14 + i * 36;
        s += t(x, y, r[0], { size: 15, b: 1, c: i === 1 ? C.red : C.ink, ans: i !== 1 && i !== 0 });
        if (i === 0) s += box(x + 44, y - 14, 50, 28, { fill: C.blueL, c: C.blue, w: 1.4, label: '92', size: 15 }) + box(x + 102, y - 14, 50, 28, { fill: C.blueL, c: C.blue, w: 1.4, label: '92', size: 15 });
        else if (i === 1) s += t(x + 44, y, '1등이 둘 → 건너뜀', { size: 14, c: C.red });
        else s += box(x + 44, y - 14, 50, 28, { fill: C.grayL, c: C.line, w: 1.4, label: r[1], size: 15 });
      });
      s += hdiv(206, 280, 466);
      s += mono(280, 226, 'LARGE(B2:B5,2) → 92', { size: 13 }) + mono(280, 250, 'SMALL(B2:B5,1) → 78', { size: 13 });
      return F.svg(480, 270, s);
    } },

  sumif: { cards: ['합계 · 평균과 조건부 집계'], slide: 'q',
    cap: 'SUMIF — 조건 범위에서 «1라인» 을 찾고, 같은 행의 합계 범위 값만 더한다',
    draw: function () {
      var sh = sheet(14, 50, { cols: ['A', 'B', 'C'], cw: [66, 70, 66], rows: [['라인', '품목', '생산량'], ['1라인', '기어', '120'], ['2라인', '축', '90'], ['1라인', '베어링', '150'], ['3라인', '기어', '80'], ['1라인', '축', '110']],
        head: 1, fill: { '1,0': 'b', '3,0': 'b', '5,0': 'b', '1,2': 'g', '3,2': 'g', '5,2': 'g' } });
      var s = fxbar(14, 10, 452, [['=SUMIF('], ['A2:A6', C.blue, 1], [',"1라인",'], ['C2:C6', C.green, 1], [')']], { size: 15 }) + sh.s;
      s += frame(sh, 1, 0, 5, 0, C.blue) + frame(sh, 1, 2, 5, 2, C.green);
      var x = 256;
      s += t(x, 78, '① 조건 범위', { size: 15, b: 1, c: C.blue }) + t(x, 100, '여기서 «1라인» 을 찾는다', { size: 14, c: C.sub });
      s += t(x, 136, '② 합계 범위', { size: 15, b: 1, c: C.green, ans: true }) + t(x, 158, '같은 행의 값을 더한다', { size: 14, c: C.sub });
      s += box(x, 184, 200, 44, { fill: C.greenL, c: C.green, w: 1.6 }) + t(x + 100, 206, '120+150+110 = 380', { a: 'm', size: 16, b: 1, halo: false });
      s += t(14, 250, 'AVERAGEIF 도 같은 모양 · 조건이 비교식이면 ">=100" 처럼 따옴표 안에', { size: 13, c: C.sub });
      return F.svg(480, 268, s);
    } },

  round: { cards: ['반올림과 나머지'],
    cap: '자릿수 — 0 이면 정수, 양수면 소수점 아래, 음수면 정수 왼쪽 자리까지 남긴다',
    draw: function () {
      var dg = ['3', '4', '5', '6', '.', '7', '8'], pos = ['-3', '-2', '-1', '0', '', '1', '2'], s = '';
      var x0 = 110;
      dg.forEach(function (d, i) {
        var x = x0 + i * 40;
        if (d === '.') { s += t(x + 20, 50, '.', { a: 'm', size: 28, b: 1 }); return; }
        s += box(x + 2, 30, 36, 40, { fill: i === 1 ? C.orangeL : C.paper, c: i === 1 ? C.orange : C.line, w: 1.4, r: 4 }) + t(x + 20, 51, d, { a: 'm', size: 22, b: 1, halo: false });
        s += t(x + 20, 88, pos[i], { a: 'm', size: 14, b: 1, c: i === 1 ? C.orange : C.sub });
      });
      s += t(20, 51, '3456.78', { size: 15, b: 1 }) + t(20, 88, '자릿수', { size: 13, c: C.sub, b: 1 });
      var R = [['ROUND(3456.78, 1)', '3456.8'], ['ROUND(3456.78, 0)', '3457'], ['ROUND(3456.78, -2)', '3500'], ['ROUNDUP(3456.78, -2)', '3500'], ['ROUNDDOWN(3456.78, -2)', '3400']];
      R.forEach(function (r, i) {
        var y = 124 + i * 30;
        s += mono(40, y, r[0], { size: 15, c: i >= 2 ? C.orange : C.ink, b: i >= 2 });
        s += t(300, y, '→', { a: 'm', size: 15, c: C.sub }) + t(330, y, r[1], { size: 16, b: 1 });
      });
      s += t(40, 282, '-2 = 백의 자리까지 남긴다 (십의 자리에서 처리)', { size: 14, c: C.orange, b: 1 });
      return F.svg(480, 300, s);
    } },

  inttrunc: { cards: ['반올림과 나머지'], slide: 'q',
    cap: '음수에서 갈린다 — INT 는 작아지는 쪽(왼쪽)으로, TRUNC 는 소수점만 잘라 0 쪽으로',
    draw: function () {
      var x0 = 60, u = 72, y = 110, s = '';   /* -5 … 1 */
      function X(v) { return x0 + (v + 5) * u; }
      s += arrow(x0 - 20, y, 470, y, { c: C.ink, w: 1.8 });
      for (var v = -5; v <= 0; v++) s += line(X(v), y - 7, X(v), y + 7, { c: C.ink, w: 1.6 }) + t(X(v), y + 24, String(v), { a: 'm', size: 15, b: v === 0 });
      s += line(X(-3.5), y - 10, X(-3.5), y + 10, { c: C.purple, w: 2.4 }) + F.circle(X(-3.5), y, 6, { fill: C.purple, c: C.purple });
      s += t(X(-3.5), y - 28, '-3.5', { a: 'm', size: 17, b: 1, c: C.purple });
      s += F.route([[X(-3.5), y + 10], [X(-3.5), y + 52], [X(-4), y + 52], [X(-4), y + 38]], { c: C.red, w: 2 });
      s += t(X(-4) - 8, y + 72, 'INT(-3.5) → -4', { size: 16, b: 1, c: C.red, a: 'm', ans: true }) + t(X(-4) - 8, y + 94, '작아지는 쪽', { size: 13, c: C.red, a: 'm' });
      s += F.route([[X(-3.5), y + 52], [X(-3), y + 52], [X(-3), y + 38]], { c: C.blue, w: 2 });
      s += t(X(-3) + 60, y + 72, 'TRUNC(-3.5) → -3', { size: 16, b: 1, c: C.blue, a: 'm' }) + t(X(-3) + 60, y + 94, '소수점만 잘라 냄', { size: 13, c: C.blue, a: 'm' });
      s += t(20, 28, '양수 3.5 는 둘 다 3 — 음수에서만 달라진다', { size: 14, b: 1, c: C.sub });
      s += hdiv(228);
      s += mono(20, 250, 'MOD(17,5) → 2', { size: 15, b: 1 }) + t(160, 250, '17 = 5×3 + 2  (나머지)', { size: 14, c: C.sub });
      return F.svg(480, 270, s);
    } },

  mid: { cards: ['문자열 자르기'], slide: 'q',
    cap: 'LEFT · MID · RIGHT — 몇 번째 글자부터 몇 글자를 가져가는지 칸으로 보기',
    draw: function () {
      var ch = ['2', '0', '2', '6', '학', '년', '도'], s = '', x0 = 110, w = 46, y = 40;
      ch.forEach(function (c, i) {
        s += box(x0 + i * w, y, w - 4, 42, { fill: C.paper, c: C.line, w: 1.4, r: 4 }) + t(x0 + i * w + 21, y + 22, c, { a: 'm', size: 21, b: 1, halo: false });
        s += t(x0 + i * w + 21, y - 12, String(i + 1), { a: 'm', size: 13, c: C.sub, b: 1 });
      });
      s += t(20, y + 22, '"2026학년도"', { size: 14, b: 1 }) + t(20, y - 12, '글자 번호', { size: 13, c: C.sub });
      function br(i1, i2, yy, col) { var a = x0 + i1 * w, b = x0 + i2 * w + w - 4; return F.path('M' + a + ',' + (yy - 8) + ' V' + yy + ' H' + b + ' V' + (yy - 8), { c: col, w: 2.4 }); }
      s += br(0, 3, 100, C.blue) + mono(20, 122, 'LEFT(A1,4)', { size: 15, b: 1, c: C.blue }) + t(x0 + 3 * w, 122, '→ 2026', { size: 15, b: 1, c: C.blue });
      s += br(4, 6, 150, C.green) + mono(20, 172, 'MID(A1,5,3)', { size: 15, b: 1, c: C.green }) + t(x0 + 3 * w, 172, '5번째부터 3글자', { size: 14, c: C.green }) +
        t(x0 + 6 * w + 38, 172, '→ 학년도', { size: 15, b: 1, c: C.green, a: 'e', ans: true });
      s += br(5, 6, 200, C.orange) + mono(20, 222, 'RIGHT(A1,2)', { size: 15, b: 1, c: C.orange }) + t(x0 + 3 * w, 222, '→ 년도', { size: 15, b: 1, c: C.orange });
      s += hdiv(246);
      s += mono(20, 266, 'LEN(A1) → 7', { size: 14 }) + mono(200, 266, 'A1 & "과정"  → 이어 붙이기', { size: 14 });
      return F.svg(480, 284, s);
    } },

  vlookup: { cards: ['VLOOKUP — 표에서 찾아오기'], slide: 'q',
    cap: 'VLOOKUP — 범위의 첫 열에서 찾고, 그 행에서 범위 안 세 번째 열의 값을 가져온다',
    draw: function () {
      var s = fxbar(14, 8, 452, '=VLOOKUP(E2,$A$2:$C$5,3,0)', { cell: 'F2', size: 14 });
      s += box(38, 46, 64, 28, { fill: C.yellowL, c: C.orange, w: 1.6, r: 4 }) + mono(70, 60.5, 'B-03', { a: 'm', size: 15, b: 1 });
      s += t(110, 60, '← 찾을 값 (E2)', { size: 13, c: C.orange, b: 1 });
      var sh = sheet(14, 90, { cols: ['A', 'B', 'C'], cw: [64, 80, 64],
        rows: [['코드', '부품명', '단가'], ['B-01', '볼트', '120'], ['B-02', '너트', '60'], ['B-03', '와셔', '85'], ['B-04', '핀', '40']],
        head: 1, fill: { '3,0': 'b', '3,1': 'h', '3,2': 'g' }, bold: { '3,0:3,2': 1 } });
      s += sh.s + frame(sh, 1, 0, 4, 2, C.ink, { dash: '5 4', w: 1.8 });
      s += arrow(sh.x(0) + 8, 76, sh.x(0) + 8, sh.cy(3) + 4, { c: C.blue, w: 2.2, head: 9 });
      ['1열', '2열', '3열'].forEach(function (v, i) { s += t(sh.cx(i), sh.bottom + 14, v, { a: 'm', size: 14, b: 1, c: i === 2 ? C.green : C.sub, ans: i === 2 }); });
      s += arrow(sh.cx(0), sh.bottom + 34, sh.cx(2), sh.bottom + 34, { c: C.green, w: 2 });
      s += F.num(sh.cx(1), sh.bottom + 34, '2', { c: C.green, r: 10, size: 12 });
      s += arrow(sh.right + 2, sh.cy(3), 280, sh.cy(3), { c: C.green, w: 2 });
      var x = 270;
      s += F.num(x + 10, 104, '1', { c: C.blue, r: 10, size: 12 }) + t(x + 26, 104, '첫 열에서 B-03 을 찾고', { size: 14 });
      s += F.num(x + 10, 132, '2', { c: C.green, r: 10, size: 12 }) + t(x + 26, 132, '그 행에서 범위 안 3열로', { size: 14 });
      s += F.num(x + 10, 160, '3', { c: C.green, r: 10, size: 12 }) + t(x + 26, 160, '값을 가져온다', { size: 14 });
      s += box(282, sh.cy(3) - 20, 150, 40, { fill: C.greenL, c: C.green, w: 1.6 }) + t(357, sh.cy(3), 'F2 = 85', { a: 'm', size: 17, b: 1, halo: false });
      s += t(14, 302, '0 = 정확히 일치 · 열 번호는 시트가 아니라 범위 안에서 센다', { size: 14, c: C.sub, b: 1, ans: true });
      return F.svg(480, 320, s);
    } },

  hlookup: { cards: ['HLOOKUP · CHOOSE · INDEX · MATCH'], slide: 'q',
    cap: 'HLOOKUP — 범위의 첫 행에서 찾고, 그 열에서 아래로 몇 번째 행의 값을 가져온다',
    draw: function () {
      var s = fxbar(14, 10, 452, '=HLOOKUP("연삭",A1:D3,3,0)  →  45', { size: 14 });
      var sh = sheet(14, 88, { cols: ['A', 'B', 'C', 'D'], cw: [70, 80, 80, 80],
        rows: [['공정', '절삭', '연삭', '조립'], ['담당', '1조', '2조', '3조'], ['시간(분)', '30', '45', '20']],
        bold: { '0,0:2,0': 1 }, fill: { '0,0:2,0': 'h', '0,2': 'b', '2,2': 'g' } });
      s += sh.s + frame(sh, 0, 0, 2, 3, C.ink, { dash: '5 4', w: 1.6 });
      s += t(sh.x(1) + 4, 58, '① 첫 행에서 가로로 찾는다', { size: 14, c: C.blue, b: 1 });
      s += arrow(sh.x(1) + 8, 76, sh.cx(2) + 10, 76, { c: C.blue, w: 2 });
      s += arrow(sh.cx(2) + 30, sh.cy(0) + 6, sh.cx(2) + 30, sh.cy(2) - 6, { c: C.green, w: 2 });
      ['1행', '2행', '3행'].forEach(function (v, i) { s += t(sh.right + 10, sh.cy(i), v, { size: 13, b: 1, c: i === 2 ? C.green : C.sub }); });
      s += t(14, sh.bottom + 22, '② 그 열에서 아래로 3번째 행 → 45', { size: 14, b: 1, c: C.green });
      s += hdiv(sh.bottom + 42);
      var y = sh.bottom + 64;
      s += t(14, y, 'CHOOSE — 번호로 고른다', { size: 14, b: 1 });
      s += mono(14, y + 26, 'CHOOSE(2,"월","화","수") → "화"', { size: 14 });
      return F.svg(480, y + 44, s);
    } },

  indexmatch: { cards: ['HLOOKUP · CHOOSE · INDEX · MATCH'],
    cap: 'MATCH 는 «몇 번째인가», INDEX 는 «그 번째의 값» — 찾는 열보다 왼쪽에 있는 값도 가져온다',
    draw: function () {
      var sh = sheet(14, 30, { cols: ['A', 'B', 'C'], cw: [58, 66, 50], rows: [['코드', '부품', '재고'], ['P-11', '기어', '40'], ['P-12', '축', '25'], ['P-13', '볼트', '310'], ['P-14', '베어링', '18']], head: 1,
        fill: { '3,1': 'b', '3,0': 'g' }, bold: { '3,0': 1 } });
      var s = sh.s + frame(sh, 1, 1, 4, 1, C.blue) + frame(sh, 1, 0, 4, 0, C.green);
      ['1', '2', '3', '4'].forEach(function (v, i) { s += t(sh.right + 8, sh.cy(i + 1), v + '번째', { size: 13, c: i === 2 ? C.blue : C.sub, b: i === 2 }); });
      var x = 262;
      s += box(x, 36, 204, 64, { fill: C.blueL, c: C.blue, w: 1.6 });
      s += mono(x + 10, 56, 'MATCH("볼트",B2:B5,0)', { size: 14, b: 1, c: C.blue }) + t(x + 10, 82, '→ 3  (세 번째에 있다)', { size: 15, b: 1, halo: false });
      s += arrow(x + 102, 102, x + 102, 124, { c: C.ink });
      s += box(x, 126, 204, 64, { fill: C.greenL, c: C.green, w: 1.6 });
      s += mono(x + 10, 146, 'INDEX(A2:A5, 3)', { size: 14, b: 1, c: C.green }) + t(x + 10, 172, '→ P-13  (세 번째 칸)', { size: 15, b: 1, halo: false });
      s += hdiv(212);
      s += mono(14, 234, '=INDEX(A2:A5,MATCH("볼트",B2:B5,0))', { size: 14, b: 1 });
      s += t(14, 260, '부품(B열)으로 찾아 왼쪽 코드(A열)를 가져왔다 — VLOOKUP 으로는 안 된다', { size: 13, c: C.sub });
      return F.svg(480, 280, s);
    } },

  dsum: { cards: ['데이터베이스 함수(D 함수)'], slide: 'q',
    cap: 'DSUM — ① 목록 전체(머리글 포함) ② 계산할 필드 ③ 조건 범위, 세 인수',
    draw: function () {
      var sh = sheet(14, 50, { cols: ['A', 'B', 'C', 'D', 'E'], cw: [66, 60, 62, 14, 66],
        rows: [['품목', '라인', '생산량', '', '라인'], ['기어', '1라인', '120', '', '2라인'], ['축', '2라인', '90', '', ''], ['볼트', '2라인', '300', '', ''], ['핀', '1라인', '70', '', ''], ['너트', '2라인', '150', '', '']],
        head: 1, fill: { '2,0:3,2': 'b', '5,0:5,2': 'b', '0,4:1,4': 'r' }, bold: { '2,2': 1, '3,2': 1, '5,2': 1 } });
      var s = fxbar(14, 10, 452, [['=DSUM('], ['A1:C6', C.blue, 1], [','], ['C1', C.green, 1], [','], ['E1:E2', C.red, 1], [')  → 540']], { size: 14 }) + sh.s;
      s += frame(sh, 0, 0, 5, 2, C.blue) + frame(sh, 0, 2, 0, 2, C.green, { w: 3 }) + frame(sh, 0, 4, 1, 4, C.red);
      var x = sh.right + 14;
      s += F.num(x, 70, '1', { c: C.blue }) + t(x + 18, 70, '목록 (머리글까지)', { size: 13, b: 1, c: C.blue });
      s += F.num(x, 100, '2', { c: C.green }) + t(x + 18, 100, '필드 "생산량"·C1·3', { size: 13, b: 1, c: C.green });
      s += F.num(x, 130, '3', { c: C.red }) + t(x + 18, 130, '조건 범위', { size: 13, b: 1, c: C.red, ans: true });
      s += t(x, 162, '2라인 행만', { size: 13, c: C.sub }) + t(x, 182, '90+300+150', { size: 13, c: C.sub });
      s += t(14, 250, '조건 범위는 고급 필터와 같은 방식 · DAVERAGE·DCOUNT 도 같은 꼴', { size: 13, c: C.sub });
      return F.svg(480, 268, s);
    } },

  weekday: { cards: ['날짜와 시간 함수'], slide: 'q',
    cap: 'WEEKDAY — 옵션을 생략(1)하면 일요일이 1, 옵션 2 면 월요일이 1',
    draw: function () {
      var d = ['일', '월', '화', '수', '목', '금', '토'], s = '', x0 = 116, w = 50;
      d.forEach(function (v, i) {
        s += box(x0 + i * w, 34, w - 6, 34, { fill: i === 0 ? C.redL : (i === 6 ? C.blueL : C.grayL), c: C.line, w: 1.2, label: v, size: 16 });
        s += t(x0 + i * w + 22, 92, String(i + 1), { a: 'm', size: 17, b: 1, c: C.sub });
        s += t(x0 + i * w + 22, 128, String(i === 0 ? 7 : i), { a: 'm', size: 17, b: 1, c: C.blue, ans: i === 1 });
      });
      s += t(14, 51, '요일', { size: 14, b: 1 });
      s += mono(14, 92, '옵션 1·생략', { size: 13, b: 1, c: C.sub }) + mono(14, 128, '옵션 2', { size: 13, b: 1, c: C.blue });
      s += box(x0 + 50 - 3, 110, 50, 34, { fill: 'none', c: C.blue, w: 2, r: 6 });
      s += hdiv(160);
      s += mono(14, 186, 'WEEKDAY("2026-09-30",2) → 3', { size: 15, b: 1 }) + t(330, 186, '(수요일)', { size: 14, c: C.sub });
      s += t(14, 214, '옵션 2 로 두면 6·7 이 곧 토·일 → 주말 판정이 쉽다', { size: 14, c: C.sub });
      return F.svg(480, 232, s);
    } },

  datefn: { cards: ['날짜와 시간 함수'],
    cap: 'YEAR · MONTH · DAY 는 날짜를 나누고, DATE 는 숫자 셋을 모아 날짜로. 날짜끼리 빼면 일수',
    draw: function () {
      var s = '';
      s += box(170, 20, 140, 38, { fill: C.yellowL, c: C.orange, w: 1.6, label: '2026-09-30', size: 17 });
      var P = [[60, 'YEAR', '2026'], [240, 'MONTH', '9'], [420, 'DAY', '30']];
      P.forEach(function (p) {
        s += arrow(240, 58, p[0], 98, { c: C.blue, w: 1.8 });
        s += mono(p[0], 112, p[1], { a: 'm', size: 14, b: 1, c: C.blue }) + t(p[0], 136, p[2], { a: 'm', size: 17, b: 1 });
      });
      s += F.route([[20, 136], [8, 136], [8, 39], [166, 39]], { c: C.green, w: 1.6, dash: '5 4' });
      s += t(24, 160, 'DATE(2026,9,30) — 모아서 다시 날짜로', { size: 14, b: 1, c: C.green });
      s += hdiv(180);
      s += t(14, 204, '날짜는 사실 숫자라 뺄 수 있다', { size: 14, b: 1 });
      s += mono(14, 232, '="2026-12-25"-"2026-09-30" → 86', { size: 14 });
      s += mono(14, 258, 'DAYS("2026-12-25","2026-09-30") → 86', { size: 14 });
      return F.svg(480, 276, s);
    } },

  errors: { cards: ['오류가 났을 때 어디를 보나'], slide: 'q',
    cap: '오류 값을 보면 원인이 보인다 — 칸에 뜬 글자와 먼저 볼 곳',
    draw: function () {
      var R = [['#NAME?', '=SUMM(B2:B5)', '함수 이름 · 따옴표 오타'], ['#VALUE!', '=B2+C2', 'C2 에 «없음» 같은 문자'], ['#N/A', '=VLOOKUP("P-09",…,2,0)', '첫 열에 P-09 가 없다'],
               ['#DIV/0!', '=C2/B2', 'B2 가 비었거나 0'], ['#REF!', '=A1+D5', '참조하던 D열을 지웠다']];
      var s = t(20, 20, '칸에 보이는 것', { size: 13, c: C.sub, b: 1 }) + t(140, 20, '들어 있던 수식', { size: 13, c: C.sub, b: 1 }) + t(330, 20, '먼저 볼 곳', { size: 13, c: C.sub, b: 1 });
      R.forEach(function (r, i) {
        var y = 50 + i * 42;
        s += box(20, y - 15, 106, 30, { fill: C.redL, c: C.red, w: 1.4, r: 2 }) + mono(73, y, r[0], { a: 'm', size: 15, b: 1, c: C.red });
        s += mono(140, y, r[1], { size: 13 });
        s += t(330, y, r[2], { size: 13, b: 1, ans: i === 2 });
      });
      return F.svg(480, 262, s);
    } },

  /* ─────────── Ⅳ. 분석작업 ─────────── */
  subtotal: { cards: ['부분합 — 정렬이 먼저다'], slide: 'q',
    cap: '부분합 — 그룹 기준(라인)으로 먼저 정렬하면, 그룹마다 요약 행이 한 번씩 끼워진다',
    draw: function () {
      var a = sheet(14, 44, { head: 1, cw: [58, 52], rows: [['라인', '생산'], ['2라인', '90'], ['1라인', '120'], ['2라인', '60'], ['1라인', '80']] });
      var s = t(14, 24, '① 라인으로 정렬', { size: 14, b: 1, c: C.blue }) + a.s;
      var b = sheet(14, 196, { head: 1, cw: [58, 52], rows: [['라인', '생산'], ['1라인', '120'], ['1라인', '80'], ['2라인', '90'], ['2라인', '60']], fill: { '1,0:2,1': 'b', '3,0:4,1': 'p' } });
      s += arrow(69, a.bottom + 6, 69, 188, { c: C.blue, w: 2 }) + b.s;
      s += divider(150, 20, 340);
      /* 부분합 결과 */
      var x = 204;
      s += t(170, 24, '② [데이터]-[부분합] — 합계', { size: 14, b: 1, c: C.green });
      var c = sheet(x, 44, { head: 1, cw: [98, 56], rows: [['라인', '생산'], ['1라인', '120'], ['1라인', '80'], ['1라인 요약', '200'], ['2라인', '90'], ['2라인', '60'], ['2라인 요약', '150'], ['총합계', '350']],
        fill: { '3,0:3,1': 'g', '6,0:6,1': 'g', '7,0:7,1': 'o' }, bold: { '3,0:3,1': 1, '6,0:6,1': 1, '7,0:7,1': 1 } });
      s += c.s;
      ['1', '2', '3'].forEach(function (v, i) { s += box(172 + i * 0, 60 + i * 30, 22, 22, { fill: C.grayL, c: C.line, w: 1.2, r: 3, label: v, size: 13 }); });
      s += t(172, 160, '요약', { size: 13, c: C.sub }) + t(172, 178, '단추', { size: 13, c: C.sub });
      s += t(170, 318, '정렬을 빼먹으면 1라인 요약이 여러 번 생긴다', { size: 13, b: 1, c: C.red });
      return F.svg(480, 336, s);
    } },

  pivot: { cards: ['피벗 테이블'], slide: 'q',
    cap: '피벗 테이블 — 필드를 행 · 열 · 값 영역에 끌어다 놓으면 요약표가 된다',
    draw: function () {
      var a = sheet(14, 34, { head: 1, cw: [50, 40, 48], rows: [['라인', '월', '생산'], ['1라인', '9월', '120'], ['2라인', '9월', '90'], ['1라인', '10월', '150'], ['2라인', '10월', '80'], ['1라인', '9월', '30']], fs: 13 });
      var s = t(14, 18, '원본', { size: 14, b: 1 }) + a.s;
      var x = 180, A = [['필터', '', C.sub], ['열', '월', C.purple], ['행', '라인', C.blue], ['값', '합계:생산', C.green]];
      s += t(x, 18, '필드를 끌어다 놓는 곳', { size: 13, b: 1, c: C.sub });
      A.forEach(function (v, i) {
        var bx = x + (i % 2) * 144, by = 34 + Math.floor(i / 2) * 64;
        s += box(bx, by, 136, 54, { fill: C.paper, c: v[2], w: 1.6 }) + t(bx + 8, by + 14, v[0], { size: 13, b: 1, c: v[2], halo: false, ans: i === 3 });
        if (v[1]) s += pill(bx + 12, by + 22, 112, v[1], v[2], { h: 26, size: 13 });
      });
      s += arrow(240, 170, 240, 188, { c: C.ink });
      var p = sheet(160, 194, { cw: [96, 64, 64, 64], rows: [['합계:생산', '9월', '10월', '총합계'], ['1라인', '150', '150', '300'], ['2라인', '90', '80', '170'], ['총합계', '240', '230', '470']],
        fill: { '0,1:0,2': 'p', '1,0:2,0': 'b', '1,1:2,2': 'g', '0,0': 'h', '0,3': 'h', '3,0:3,3': 'h' }, bold: { '0,0:0,3': 1, '3,0:3,3': 1, '1,3:2,3': 1 }, fs: 14 });
      s += p.s;
      s += t(14, 250, '원본을 고치면', { size: 13, c: C.red, b: 1 }) + t(14, 270, '[새로 고침] 해야', { size: 13, c: C.red, b: 1 }) + t(14, 290, '반영된다', { size: 13, c: C.red, b: 1 });
      return F.svg(480, 310, s);
    } },

  goalseek: { cards: ['목표값 찾기와 시나리오'], slide: 'q',
    cap: '목표값 찾기 — 결과(평균 78)를 정해 두고, 그렇게 되는 입력값을 거꾸로 찾는다',
    draw: function () {
      var a = sheet(14, 40, { cols: ['A', 'B'], cw: [72, 60], rows: [['1회', '70'], ['2회', '80'], ['3회', '60'], ['평균', '70']], fill: { '2,1': 'o', '3,1': 'b' } });
      var s = t(14, 22, '찾기 전', { size: 14, b: 1 }) + a.s;
      /* 대화상자 */
      var x = 186, y = 26;
      s += box(x, y, 140, 132, { fill: C.grayL, c: C.line, w: 1.4, r: 6 }) + t(x + 10, y + 16, '목표값 찾기', { size: 13, b: 1, halo: false });
      var R = [['수식 셀', 'B4', C.blue], ['찾는 값', '78', C.green], ['값을 바꿀 셀', 'B3', C.orange]];
      R.forEach(function (r, i) {
        var yy = y + 40 + i * 32;
        s += t(x + 10, yy, r[0], { size: 13, halo: false, c: r[2], b: 1, ans: i === 0 }) + box(x + 88, yy - 11, 44, 22, { fill: C.paper, c: r[2], w: 1.4, r: 3 }) + mono(x + 110, yy, r[1], { a: 'm', size: 13, b: 1 });
      });
      var b = sheet(354, 40, { cols: ['A', 'B'], hw: 20, cw: [44, 50], rows: [['1회', '70'], ['2회', '80'], ['3회', '84'], ['평균', '78']], fill: { '2,1': 'o', '3,1': 'g' }, bold: { '2,1': 1, '3,1': 1 } });
      s += t(354, 22, '찾은 뒤', { size: 14, b: 1, c: C.green }) + b.s;
      s += arrow(328, 92, 350, 92, { c: C.ink });
      s += t(14, 190, '수식 셀 B4 = AVERAGE(B1:B3) — 반드시 수식이 든 칸', { size: 14, c: C.blue, b: 1, ans: true });
      s += t(14, 214, '값을 바꿀 셀 B3 — 수식이 아닌 값이 든 칸 하나', { size: 14, c: C.orange, b: 1 });
      s += t(14, 242, '시나리오는 여러 가정을 저장해 두고 요약 보고서로 견준다', { size: 13, c: C.sub });
      return F.svg(480, 260, s);
    } },

  sort2: { cards: ['정렬 — 기준이 둘일 때'], slide: 'q',
    cap: '정렬 기준 둘 — 위 기준(부서 오름차순)이 먼저, 부서가 같을 때만 아래 기준(실적 내림차순)',
    draw: function () {
      var a = sheet(14, 40, { head: 1, cw: [70, 56], rows: [['부서', '실적'], ['생산부', '300'], ['품질부', '200'], ['생산부', '450'], ['설비부', '350'], ['품질부', '280']] });
      var s = t(14, 22, '정렬 전', { size: 14, b: 1 }) + a.s;
      var x = 160;
      s += box(x, 50, 154, 96, { fill: C.grayL, c: C.line, w: 1.4, r: 6 }) + t(x + 10, 66, '[데이터]-[정렬]', { size: 13, b: 1, halo: false });
      s += box(x + 8, 80, 138, 26, { fill: C.blueL, c: C.blue, w: 1.2, r: 4 }) + t(x + 16, 93, '① 부서 · 오름차순', { size: 13, b: 1, halo: false, c: C.blue });
      s += box(x + 8, 112, 138, 26, { fill: C.orangeL, c: C.orange, w: 1.2, r: 4 }) + t(x + 16, 125, '② 실적 · 내림차순', { size: 13, b: 1, halo: false, c: C.orange });
      s += t(x + 8, 164, '[기준 추가] 로 ②', { size: 13, c: C.sub });
      var b = sheet(330, 40, { head: 1, cw: [70, 56], rows: [['부서', '실적'], ['생산부', '450'], ['생산부', '300'], ['설비부', '350'], ['품질부', '280'], ['품질부', '200']],
        fill: { '1,0:2,0': 'b', '3,0': 'b', '4,0:5,0': 'b', '1,1:2,1': 'o', '4,1:5,1': 'o' } });
      s += t(330, 22, '정렬 후', { size: 14, b: 1, c: C.green }) + b.s;
      s += t(14, 230, '가나다 순: 생산부 → 설비부 → 품질부', { size: 13, c: C.sub }) + t(14, 250, '같은 부서 안에서는 큰 실적이 위 · 빈 셀은 늘 맨 뒤', { size: 13, c: C.sub, ans: true });
      return F.svg(480, 272, s);
    } },

  /* ─────────── Ⅴ. 기타작업 ─────────── */
  chartparts: { cards: ['차트 만들고 다듬기'],
    cap: '차트 요소 — 제목 · 축 · 범례 · 데이터 레이블 · 눈금선은 [차트 요소 추가] 에서',
    draw: function () {
      var s = '', ox = 70, oy = 214, k, P = C.purple;
      function bd(x, y, n) { return F.num(x, y, n, { c: P, r: 10, size: 12 }); }
      s += t(180, 28, '라인별 생산량', { a: 'm', size: 17, b: 1 });
      for (k = 0; k <= 3; k++) {
        var yy = oy - k * 40;
        s += line(ox, yy, 320, yy, { c: k ? C.grayM : C.ink, w: k ? 1 : 1.6 }) + t(ox - 8, yy, String(k * 50), { a: 'e', size: 13, c: C.sub });
      }
      [[120, 150], [90, 80]].forEach(function (g, i) {
        var gx = 104 + i * 112;
        g.forEach(function (v, j) {
          var h = v * 0.8, bx = gx + j * 40;
          s += box(bx, oy - h, 34, h, { fill: j ? C.orangeL : C.blueL, c: j ? C.orange : C.blue, w: 1.4, r: 0 });
          s += t(bx + 17, oy - h - 10, String(v), { a: 'm', size: 13, b: 1 });
        });
        s += t(gx + 37, oy + 16, i ? '2라인' : '1라인', { a: 'm', size: 13 });
      });
      s += box(118, 240, 150, 26, { fill: C.paper, c: C.line, w: 1 }) +
        box(130, 248, 10, 10, { fill: C.blueL, c: C.blue, w: 1, r: 0 }) + t(145, 253, '9월', { size: 13 }) +
        box(196, 248, 10, 10, { fill: C.orangeL, c: C.orange, w: 1, r: 0 }) + t(211, 253, '10월', { size: 13 });
      s += '<g transform="rotate(-90 24 150)">' + t(24, 150, '생산량(개)', { a: 'm', size: 13, b: 1 }) + '</g>';
      s += bd(268, 28, '1') + bd(44, 154, '2') + bd(300, 230, '3') + bd(284, 253, '4') + bd(90, 104, '5') + bd(330, 134, '6') + bd(24, 96, '7');
      s += divider(348, 20, 268);
      ['차트 제목', '세로(값) 축', '가로(항목) 축', '범례', '데이터 레이블', '눈금선', '축 제목'].forEach(function (v, i) {
        s += bd(368, 44 + i * 30, String(i + 1)) + t(384, 44 + i * 30, v, { size: 14, b: 1 });
      });
      return F.svg(480, 282, s);
    } },

  macrorec: { cards: ['매크로 기록하고 단추에 연결하기'], slide: 'q',
    cap: '매크로 기록 — [기록]과 [기록 중지] 사이에 한 동작이 전부 그대로 저장된다',
    draw: function () {
      var s = '', y = 96;
      s += box(14, y - 22, 80, 44, { fill: C.redL, c: C.red, w: 1.6, r: 22 }) + F.circle(34, y, 7, { fill: C.red, c: C.red }) + t(48, y, '기록', { size: 14, b: 1, c: C.red, halo: false });
      ['A1:D1 선택', '굵게', '채우기 색'].forEach(function (v, i) {
        var x = 104 + i * 82;
        s += box(x, y - 20, 76, 40, { fill: C.blueL, c: C.blue, w: 1.4, r: 6 }) + t(x + 38, y, v, { a: 'm', size: 13, b: 1, halo: false });
      });
      s += box(350, y - 22, 58, 44, { fill: C.ink, c: C.ink, w: 1.6, r: 6 }) + box(358, y - 6, 12, 12, { fill: C.paper, c: C.paper, r: 1, w: 1 }) + t(376, y, '중지', { size: 13, b: 1, c: C.paper, halo: false });
      s += box(414, y - 20, 54, 40, { fill: C.grayL, c: C.line, w: 1.4, r: 6 }) + t(441, y, '열 너비', { a: 'm', size: 13, halo: false, c: C.sub });
      s += t(441, y + 36, '저장 안 됨', { a: 'm', size: 13, c: C.sub });
      s += line(104, 56, 344, 56, { c: C.blue, w: 2 }) + line(104, 50, 104, 62, { c: C.blue, w: 2 }) + line(344, 50, 344, 62, { c: C.blue, w: 2 });
      s += t(224, 38, '이 사이가 매크로에 저장된다', { a: 'm', size: 14, b: 1, c: C.blue });
      s += hdiv(150);
      s += box(14, 164, 452, 44, { fill: C.redL, c: C.red, w: 1.4 });
      s += t(26, 186, '[기록 중지]를 잊으면 뒤의 동작까지 들어간다', { size: 14, b: 1, c: C.red, halo: false, ans: true });
      s += t(14, 232, '이름 첫 글자는 문자 · 공백 없이 · 바로 가기 키 Ctrl+영문 소문자', { size: 13, c: C.sub, ans: true });
      s += t(14, 256, '단추: [삽입]-[도형] 그리기 → 오른쪽 단추 [매크로 지정]', { size: 13, c: C.sub });
      return F.svg(480, 274, s);
    } },

  fit1page: { cards: ['한 장에 인쇄되게 하기'], slide: 'q',
    cap: '페이지 설정 — [페이지] 탭 자동 맞춤으로 한 장에, [시트] 탭 반복할 행으로 쪽마다 제목 행',
    draw: function () {
      function page(x, y, w, h) { return box(x, y, w, h, { fill: C.paper, c: C.line, w: 1.4, r: 3 }); }
      function rows(x, y, w, n, head) { var o = ''; for (var i = 0; i < n; i++) o += box(x, y + i * 12, w, 8, { fill: i === 0 && head ? C.orangeL : C.grayL, c: i === 0 && head ? C.orange : C.grayL, w: 1, r: 1 }); return o; }
      var s = t(14, 22, '잘려 두 장', { size: 14, b: 1, c: C.red });
      s += page(14, 34, 80, 104) + rows(22, 44, 64, 7, true) + page(102, 34, 80, 104) + rows(110, 44, 30, 7, false);
      s += t(98, 156, '오른쪽 열이 2쪽으로 넘어감', { a: 'm', size: 13, c: C.sub });
      s += arrow(192, 86, 238, 86, { c: C.ink });
      s += t(252, 22, '[페이지] 자동 맞춤 1 × 1', { size: 14, b: 1, c: C.green });
      s += page(262, 34, 104, 104) + rows(270, 44, 88, 7, true);
      s += t(314, 156, '한 장에 들어간다', { a: 'm', size: 13, c: C.green, b: 1 });
      s += hdiv(176);
      s += t(14, 198, '행이 많아 여러 쪽일 때 — [시트] 탭 «반복할 행» $1:$1', { size: 14, b: 1, c: C.orange, ans: true });
      [0, 1, 2].forEach(function (i) { var x = 60 + i * 130; s += page(x, 214, 90, 80) + rows(x + 8, 222, 74, 5, true) + t(x + 45, 306, (i + 1) + '쪽', { a: 'm', size: 13, c: C.sub }); });
      return F.svg(480, 322, s);
    } },

  freeze: { cards: ['틀 고정과 창 나누기'], slide: 'q',
    cap: '틀 고정 — 고정할 행 바로 아래 칸(A4)을 고르고 [보기]-[틀 고정]. 스크롤해도 1~3행은 남는다',
    draw: function () {
      var a = sheet(14, 34, { cols: ['A', 'B', 'C'], cw: [50, 50, 50], rows: [['일보', '', ''], ['9월', '', ''], ['설비', '수량', '불량'], ['프레스', '120', '2'], ['선반', '90', '1']],
        fill: { '0,0:2,2': 'h' }, bold: { '0,0:2,2': 1 }, sel: [3, 0], fs: 13 });
      var s = t(14, 18, 'A4 를 고르고 틀 고정', { size: 14, b: 1, ans: true }) + a.s;
      s += line(a.left, a.y(3), a.right + 8, a.y(3), { c: C.ink, w: 2.6 });
      s += t(a.right + 12, a.y(3) + 14, '고정선', { size: 13, c: C.sub, b: 1 });
      s += arrow(230, 96, 258, 96, { c: C.ink });
      var b = sheet(266, 34, { cols: ['A', 'B', 'C'], cw: [50, 50, 50], r0: 1, rows: [['일보', '', ''], ['9월', '', ''], ['설비', '수량', '불량'], ['연삭기', '70', '0'], ['밀링', '85', '3']],
        fill: { '0,0:2,2': 'h' }, bold: { '0,0:2,2': 1 }, fs: 13 });
      s += b.s + rect(266, b.y(3), 24, 52, C.grayL) + t(278, b.cy(3), '41', { a: 'm', size: 13, c: C.sub, halo: false }) + t(278, b.cy(4), '42', { a: 'm', size: 13, c: C.sub, halo: false });
      s += line(b.left, b.y(3), b.right, b.y(3), { c: C.ink, w: 2.6 });
      s += t(266, 18, '아래로 내려도 1~3행은 그대로', { size: 14, b: 1, c: C.green });
      s += t(14, 222, '틀 고정은 화면에서만 — 인쇄할 때 제목 행은 «반복할 행»', { size: 13, c: C.sub });
      return F.svg(480, 240, s);
    } }

  };
})();
