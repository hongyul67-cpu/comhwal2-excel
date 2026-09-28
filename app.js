/* 컴활 2급 실기 스프레드시트 - 함수 연습소 엔진 */
'use strict';

var PROBS = window.XL_PROBLEMS || [];
var $ = function (id) { return document.getElementById(id); };
function show(id) { $(id).classList.remove('hidden'); }
function hide(id) { $(id).classList.add('hidden'); }
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

/* fixed=true  → 수업용 '함께 풀기'. 문제 순서를 절대 섞지 않아 모든 PC에서 N번 문제가 같다.
   fixed=false → 학생 개인 연습. 매번 섞어서 출제. */
var state = { cat: '전체', queue: [], idx: 0, correct: 0, answered: false, done: 0, startTime: 0, fixed: false, uiMode: 'class' };

/* ---------- 셀 주소 도우미 ---------- */
function colLetter(c) { var s = ''; c++; while (c > 0) { var m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); } return s; }

/* ---------- 범위별 엑셀 파일 ----------
 * 웹은 한 문제씩, 여러 문제는 엑셀로. 범위(논리·통계…)마다 파일이 하나씩 있고
 * 파일 안의 번호·표·칸 주소가 웹과 똑같다 (_src/xlsx-gen/gen_fx.py 가 이 데이터로 굽는다).
 * 학생이 한 사람씩 내려받아 각자 쓴다. */
var FX_FILES = [
  ['논리(IF)', 'logic', '논리'], ['통계', 'stat', '통계'], ['조건부 집계', 'cond', '조건부집계'],
  ['수학·반올림', 'math', '수학반올림'], ['문자열', 'text', '문자열'], ['찾기·참조', 'lookup', '찾기참조'],
  ['데이터베이스', 'db', 'DB함수'], ['날짜', 'date', '날짜'],
];
/* 같은 유형을 더 풀 곳 — 예제파일 ① 생산일보 */
var FX_MORE = {
  '논리(IF)': '생산일보 시트 1~4번', '통계': '생산일보 시트 5~16번', '조건부 집계': '생산일보 시트 17~21번',
  '수학·반올림': '생산일보 시트 22~25번', '문자열': '생산일보 시트 26~31번', '찾기·참조': '생산일보 시트 32~35번',
  '데이터베이스': 'DB함수 시트 1~10번', '날짜': '생산일보 시트 36~39번',
};
function fxFile(cat) {
  for (var i = 0; i < FX_FILES.length; i++) if (FX_FILES[i][0] === cat) {
    var n = ('0' + (i + 1)).slice(-2);
    return { href: 'files/fx/g2-fx-' + n + '-' + FX_FILES[i][1] + '.xlsx',
             dl: '2급_함수연습_' + n + '_' + FX_FILES[i][2] + '_v1.xlsx', short: FX_FILES[i][2] };
  }
  return null;
}
function fxNo(p) {   // 엑셀 파일 안의 번호 = 그 범위 안에서 몇 번째 문제인가 (데이터 순서)
  var same = PROBS.filter(function (x) { return x.cat === p.cat; });
  return same.indexOf(p) + 1;
}
function xlRowHtml(cat) {
  if (cat === '전체')
    return '<a class="xldl" href="excel-files.html#fx">📗 범위별 엑셀 8개 보러 가기 <span>여러 문제는 엑셀로 · 한 사람씩 내려받기</span></a>';
  var f = fxFile(cat); if (!f) return '';
  var n = PROBS.filter(function (p) { return p.cat === cat; }).length;
  return '<a class="xldl" href="' + f.href + '" download="' + f.dl + '">⬇ [' + escapeHtml(f.short) + '] 엑셀 받기 <span>' +
    n + '문제 · 웹과 같은 번호·같은 칸</span></a>';
}
function xlBoxHtml(p) {
  var f = fxFile(p.cat); if (!f) return '';
  var no = ('0' + fxNo(p)).slice(-2);
  return '<div class="xlbox">📗 <b>엑셀로도 풀어 보기</b> — <a href="' + f.href + '" download="' + f.dl + '">[' + escapeHtml(f.short) +
    '] 파일</a>의 <b>' + no + '번 시트</b> (같은 표 · 같은 칸 주소)' +
    (FX_MORE[p.cat] ? '<br>같은 유형 더 많이 — <a href="excel-files.html">예제파일 ① ' + FX_MORE[p.cat] + '</a>' : '') + '</div>';
}

/* ---------- 시작 화면 ---------- */
function categories() {
  var set = {}; PROBS.forEach(function (p) { set[p.cat] = 1; });
  return ['전체'].concat(Object.keys(set));
}
function renderStart() {
  state.rp = null; state.durationSec = 0;
  renderRank();
  hide('practice'); hide('result'); show('start');
  ['catChipsC', 'catChips'].forEach(function (boxId) {
    var box = $(boxId); if (!box) return;
    box.innerHTML = '';
    categories().forEach(function (c) {
      var n = c === '전체' ? PROBS.length : PROBS.filter(function (p) { return p.cat === c; }).length;
      var el = document.createElement('div');
      el.className = 'chip' + (c === state.cat ? ' on' : '');
      el.textContent = c + ' (' + n + ')';
      el.onclick = function () { state.cat = c; renderStart(); };
      box.appendChild(el);
    });
  });
  ['xlRowC', 'xlRowP'].forEach(function (id) { var el = $(id); if (el) el.innerHTML = xlRowHtml(state.cat); });
  // 작업 순서 모드의 범위 칩 (계산작업과 유형이 달라 따로 그린다)
  var sBox = $('catChipsS');
  if (sBox && window.STEPS) {
    sBox.innerHTML = '';
    STEPS.categories().forEach(function (c) {
      var el = document.createElement('div');
      el.className = 'chip' + (c === STEPS.cat() ? ' on' : '');
      el.textContent = c + ' (' + STEPS.count(c) + ')';
      el.onclick = function () { STEPS.setCat(c); renderStart(); };
      sBox.appendChild(el);
    });
  }
}
function pickMode(m) {
  state.uiMode = m;
  [['mcClass', 'class'], ['mcPractice', 'practice'], ['mcSteps', 'steps']].forEach(function (x) {
    var el = $(x[0]); if (el) el.classList.toggle('on', m === x[1]);
  });
  [['classPanel', 'class'], ['practicePanel', 'practice'], ['stepsPanel', 'steps']].forEach(function (x) {
    if ($(x[0])) (m === x[1] ? show : hide)(x[0]);
  });
}

/* ---------- 연습 진행 ---------- */
/* 수업용: 교재(데이터) 순서 그대로 — 섞지 않는다 */
function startClass() { startPractice(true); }
function startPractice(fixed) {
  state.fixed = (fixed === true);
  var pool = state.cat === '전체' ? PROBS : PROBS.filter(function (p) { return p.cat === state.cat; });
  state.queue = state.fixed ? pool.slice() : shuffle(pool);
  state.idx = 0; state.correct = 0; state.done = 0; state.marked = {}; state.startTime = Date.now();
  if (!state.queue.length) return;
  hide('start'); hide('result'); show('practice');
  renderProblem();
}
function quitPractice() { renderStart(); }

function renderProblem() {
  var p = state.queue[state.idx];
  var total = state.queue.length;
  state.answered = false;
  state.tr = XLShift.range(p.target);          // 채울 칸 — 한 칸이면 r0 === r1
  state.fillTo = state.tr.r0;                  // 지금 수식이 들어가 있는 마지막 행
  state.sel = state.tr.r0;                     // 아래에 수식을 보여 줄 칸
  $('progLabel').textContent = (state.idx + 1) + ' / ' + total;
  $('pgFill').style.width = (state.idx / total * 100) + '%';
  $('catTag').textContent = p.cat;
  $('pTitle').textContent = p.title;
  $('pPrompt').innerHTML = p.prompt + (isMulti() ?
    '<div class="fillnote">⬇ <b>' + firstAddr() + '</b> 에 수식을 넣고 <b>채우기 핸들</b>(노란 칸 오른쪽 아래 ■)을 <b>' +
    lastAddr() + '</b> 까지 끌어내리세요. 사람마다 결과가 다르게 나와야 합니다.</div>' : '');
  $('fb').innerHTML = '';
  renderSheet(p);

  var fx = $('fx');
  fx.disabled = false;
  fx.value = '';
  $('scoreLabel').textContent = state.correct + '점';
  $('toolBtns').innerHTML =
    (state.fixed ? '<button class="btn ghost" onclick="prevProblem()"' + (state.idx === 0 ? ' disabled' : '') + '>← 이전</button>' : '') +
    '<button class="btn green" onclick="checkAnswer()">확인</button>' +
    (isMulti() ? '<button class="btn sec" id="fillAllBtn" onclick="fillAll()">⬇ 끝까지 채우기</button>' : '') +
    '<button class="btn sec" onclick="showHint()">💡 힌트</button>' +
    '<button class="btn ghost" onclick="showModel()">모범답안</button>' +
    '<button class="btn ghost" onclick="skipProblem()">' + (state.fixed ? '다음 →' : '건너뛰기 →') + '</button>' +
    (state.fixed ? jumpSelectHtml() : '');
  updateLive();
  setTimeout(function () { fx.focus(); }, 40);
}

/* 수업용 — 원하는 문제 번호로 바로 이동 (선생님이 "12번 볼게요" 할 때) */
function jumpSelectHtml() {
  var opts = state.queue.map(function (p, i) {
    return '<option value="' + i + '"' + (i === state.idx ? ' selected' : '') + '>' +
      (i + 1) + '. ' + escapeHtml(p.title) + '</option>';
  }).join('');
  return '<div class="spacer"></div><select class="jump" onchange="jumpTo(this.value)">' + opts + '</select>';
}
function jumpTo(i) {
  i = parseInt(i, 10);
  if (isNaN(i) || i < 0 || i >= state.queue.length) return;
  state.idx = i;
  renderProblem();
}
function prevProblem() {
  if (state.idx > 0) { state.idx--; renderProblem(); }
}

function isMulti() { return !!state.tr && state.tr.r1 > state.tr.r0; }
function addrOf(r) { return state.tr.col + (r + 1); }
function firstAddr() { return addrOf(state.tr.r0); }
function lastAddr() { return addrOf(state.tr.r1); }
function inTarget(r, c) { return !!state.tr && c === state.tr.c && r >= state.tr.r0 && r <= state.tr.r1; }

function renderSheet(p) {
  var g = p.grid;
  var cols = 0; g.forEach(function (row) { cols = Math.max(cols, row.length); });
  var html = '<tr><th></th>';
  for (var c = 0; c < cols; c++) html += '<th>' + colLetter(c) + '</th>';
  html += '</tr>';
  for (var r = 0; r < g.length; r++) {
    html += '<tr><td class="rowh">' + (r + 1) + '</td>';
    for (var c2 = 0; c2 < cols; c2++) {
      var v = g[r][c2];
      if (inTarget(r, c2)) {
        html += '<td class="tcell" id="tc' + r + '" onclick="selectCell(' + r + ')"></td>';
        continue;
      }
      var disp = (v === null || v === undefined) ? '' : escapeHtml(v);
      html += '<td class="' + (typeof v === 'number' ? 'num' : '') + '">' + disp + '</td>';
    }
    html += '</tr>';
  }
  $('sheet').innerHTML = html;
  var cf = $('cellfx');
  if (cf) cf.innerHTML = '';
}

/* ---------- 노란 칸 실시간 결과 ----------
 * 학생이 입력줄에 치는 동안 그 수식을 실제로 계산해 노란 셀에 그대로 보여준다.
 * 여러 칸짜리 문제는 끌어내린 칸까지 «그 칸으로 옮겨진 수식»으로 각각 계산한다
 * — 엑셀과 똑같이 $ 없는 주소는 한 줄씩 내려간다.
 * 괄호·따옴표가 아직 안 닫혔으면 오류 대신 '…'으로 조용히 넘어간다. */
function looksIncomplete(f) {
  var depth = 0, q = false;
  for (var i = 0; i < f.length; i++) {
    var ch = f.charAt(i);
    if (ch === '"') { q = !q; continue; }
    if (q) continue;
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
  }
  if (q || depth > 0) return true;
  if (/[,(+\-*/^&<>=:]$/.test(f)) return true;
  // 함수 이름을 치는 중(=IF, =SUM …). 셀 주소(=B2)는 완성으로 본다.
  if (/[A-Za-z_.]$/.test(f) && !/\$?[A-Za-z]{1,3}\$?[0-9]+$/.test(f)) return true;
  return false;
}
function setCellAt(r, cls, html) {
  var td = $('tc' + r);
  if (!td) return;
  td.className = 'tcell' + (cls ? ' ' + cls : '') + (r === state.sel && isMulti() && r <= state.fillTo ? ' sel' : '');
  td.innerHTML = html;
}
function setCell(cls, html) { setCellAt(state.tr.r0, cls, html); }
function errHtml(msg) {
  return '<div class="cv">⚠ 오류</div>' + (msg ? '<div class="cv2 errcode">' + escapeHtml(msg) + '</div>' : '');
}
/* 계산이 안 되면 값 대신 '오류'라고 분명히 보여 준다 — 숫자가 왜 안 나오는지 바로 알게 */
function cellError(msg) { setCell('err', errHtml(msg)); }
function formulaAt(raw, r) { return XLShift.shift(raw, r - state.tr.r0); }
function updateLive() {
  if (state.answered) return;                 // 채점 뒤에는 결과를 고정해 둔다
  var p = state.queue[state.idx];
  if (!p || !state.tr) return;
  var raw = ($('fx').value || '').trim();
  var r0 = state.tr.r0, r1 = state.tr.r1;
  if (!raw) { state.fillTo = r0; state.sel = r0; }   // 수식을 지우면 끌어내린 것도 없어진다
  for (var r = r0; r <= r1; r++) {
    if (r > state.fillTo) { setCellAt(r, 'empty', ''); continue; }
    if (!raw) { setCellAt(r, '', '?'); continue; }
    if (raw.charAt(0) !== '=') { setCellAt(r, 'lit', escapeHtml(raw)); continue; }
    if (raw.length === 1) { setCellAt(r, 'typing', '…'); continue; }
    var res = XLEngine.evaluate(formulaAt(raw, r), p.grid);
    if ('error' in res) {
      if (looksIncomplete(raw)) setCellAt(r, 'typing', '…');
      else setCellAt(r, 'err', errHtml(res.error));
      continue;
    }
    setCellAt(r, 'live', escapeHtml(fmt(res.value)));
  }
  paintHandle();
  showCellFx();
}

/* ---------- 채우기 핸들 ----------
 * 수식이 든 마지막 칸 오른쪽 아래에 작은 네모(■)가 붙는다.
 * 끌어서 아래 칸에 놓으면 그 칸까지 채워지고, 두 번 누르면 끝까지 채워진다(엑셀과 같다). */
function paintHandle() {
  var old = document.querySelector('#sheet .fh');
  if (old) old.parentNode.removeChild(old);
  var raw = ($('fx').value || '').trim();
  if (!isMulti() || state.answered || raw.charAt(0) !== '=' || raw.length < 2) return;
  var td = $('tc' + state.fillTo);
  if (!td) return;
  var h = document.createElement('i');
  h.className = 'fh';
  h.title = '끌어내려 채우기 (두 번 누르면 끝까지)';
  h.addEventListener('pointerdown', startFillDrag);
  h.addEventListener('click', function (e) { e.stopPropagation(); });
  h.addEventListener('dblclick', function (e) { e.stopPropagation(); fillAll(); });
  td.appendChild(h);
}
function rowFromPoint(x, y) {
  var el = document.elementFromPoint(x, y);
  var tr = el && el.closest ? el.closest('#sheet tr') : null;
  if (!tr) return null;
  return tr.rowIndex - 1;                      // 머리글 줄(A B C…) 한 줄을 뺀다
}
function previewFill(to) {
  for (var r = state.tr.r0; r <= state.tr.r1; r++) {
    var td = $('tc' + r); if (!td) continue;
    td.classList.toggle('fillprev', r > state.fillTo && r <= to);
  }
}
function startFillDrag(e) {
  e.preventDefault(); e.stopPropagation();
  var to = state.fillTo;
  var h = e.currentTarget;
  try { h.setPointerCapture(e.pointerId); } catch (x) {}
  function move(ev) {
    var r = rowFromPoint(ev.clientX, ev.clientY);
    if (r === null) return;
    to = Math.max(state.tr.r0, Math.min(state.tr.r1, r));
    previewFill(to);
  }
  function up() {
    h.removeEventListener('pointermove', move);
    h.removeEventListener('pointerup', up);
    h.removeEventListener('pointercancel', up);
    previewFill(-1);
    if (to !== state.fillTo) { state.fillTo = to; state.sel = to; updateLive(); }
  }
  h.addEventListener('pointermove', move);
  h.addEventListener('pointerup', up);
  h.addEventListener('pointercancel', up);
}
function fillAll() {
  if (state.answered || !isMulti()) return;
  var raw = ($('fx').value || '').trim();
  if (raw.charAt(0) !== '=' || raw.length < 2) { flash('먼저 <b>' + firstAddr() + '</b> 에 들어갈 수식을 입력하세요.', 'no'); return; }
  state.fillTo = state.tr.r1;
  updateLive();
}
/* 칸을 누르면 그 칸에 실제로 들어간 수식을 보여 준다 — $ 가 왜 필요한지 여기서 보인다 */
function selectCell(r) {
  if (!isMulti() || r > state.fillTo) return;
  state.sel = r;
  for (var i = state.tr.r0; i <= state.tr.r1; i++) { var td = $('tc' + i); if (td) td.classList.toggle('sel', i === r); }
  showCellFx();
}
function showCellFx() {
  var cf = $('cellfx'); if (!cf) return;
  var raw = ($('fx').value || '').trim();
  if (!isMulti() || raw.charAt(0) !== '=' || raw.length < 2) { cf.innerHTML = ''; return; }
  var r = Math.min(state.sel, state.fillTo);
  cf.innerHTML = '<span class="cfaddr">' + addrOf(r) + '</span> 칸의 수식 <code>' + escapeHtml(formulaAt(raw, r)) + '</code>' +
    (state.fillTo < state.tr.r1 ? ' <span class="cfhint">· 채운 칸 ' + firstAddr() + '~' + addrOf(state.fillTo) + '</span>'
                                : ' <span class="cfhint">· 다른 칸을 누르면 그 칸의 수식이 보여요</span>');
}

/* ---------- 채점 ---------- */
/* 값만 같으면 정답으로 쳐서 ="우수" · =95 처럼 상수를 적어도 통과했다.
   이 도구는 «함수를 직접 입력»하는 연습이므로, 모범답안이 쓰는 함수와
   셀 참조를 실제로 썼는지까지 본다.

   표가 한 줄뿐이라 조건을 덜 쓴 수식도 값이 같아 통과하는 문제도 있었다.
   («모두 80 이상» 인데 =IF(B2>=80,…) 처럼 한쪽만 봐도 통과)
   그래서 바깥 함수만이 아니라 모범답안이 쓰는 함수를 전부 요구한다.
   틀렸다고 채점하지 않고 «다시 쳐 보세요» 로만 알려 주므로,
   다른 방법으로 푼 학생이 점수를 잃지는 않는다. */
function stripText(f) { return String(f == null ? '' : f).replace(/"[^"]*"/g, '""'); }
function funcsIn(f) {
  var out = [], re = /([A-Za-z][A-Za-z0-9.]*)\s*\(/g, m, src = stripText(f);
  while ((m = re.exec(src))) { var n = m[1].toUpperCase(); if (out.indexOf(n) < 0) out.push(n); }
  return out;
}
function hasCellRef(f) { return /\$?[A-Za-z]{1,3}\$?[0-9]+/.test(stripText(f).replace(/([A-Za-z][A-Za-z0-9.]*)\s*\(/g, '(')); }
function shapeHint(raw, answer) {
  if (!hasCellRef(raw)) return '값을 직접 적지 말고 <b>셀 주소</b>로 계산하세요. (예: B2)';
  var need = funcsIn(answer), used = funcsIn(raw), miss = [];
  for (var i = 0; i < need.length; i++) if (used.indexOf(need[i]) < 0) miss.push(need[i]);
  if (miss.length) return '<b>' + miss.join('</b>, <b>') + '</b> 함수를 써서 풀어 보세요.';
  return null;
}
function valEqual(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 1e-9;
  // 숫자 문자열 허용
  var na = Number(a), nb = Number(b);
  if (!isNaN(na) && !isNaN(nb) && String(a).trim() !== '' && String(b).trim() !== '') return Math.abs(na - nb) < 1e-9;
  return String(a).trim() === String(b).trim();
}
function checkAnswer() {
  if (state.answered) { nextProblem(); return; }
  var p = state.queue[state.idx];
  var raw = $('fx').value.trim();
  if (!raw) { flash('수식을 입력하세요. (예: =IF(...))', 'no'); return; }
  var shape = shapeHint(raw, p.answer);
  if (shape) { flash('<b>✋ 잠깐요</b> · ' + shape, 'no'); return; }
  var r0 = state.tr.r0, r1 = state.tr.r1;
  var first = XLEngine.evaluate(raw, p.grid);
  if ('error' in first && (!isMulti() || looksIncomplete(raw))) {
    cellError(first.error);
    flash('<b>❌ 수식 오류:</b> ' + first.error + '<br>괄호·따옴표·쉼표를 확인해 보세요. (노란 칸에도 오류가 그대로 나옵니다)', 'no');
    return;
  }
  if (isMulti() && state.fillTo < r1) {
    flash('<b>✋ 아직 다 안 채웠어요</b> · ' + addrOf(state.fillTo + 1) + '~' + lastAddr() + ' 칸이 비어 있습니다.<br>' +
      '노란 칸 오른쪽 아래 <b>■ 채우기 핸들</b>을 ' + lastAddr() + ' 까지 끌어내리거나, [⬇ 끝까지 채우기]를 누르세요.', 'no');
    return;
  }
  // 칸마다 — 그 칸으로 옮겨진 내 수식 vs 그 칸으로 옮겨진 모범답안
  var rows = [], okN = 0;
  for (var r = r0; r <= r1; r++) {
    var mine = XLEngine.evaluate(formulaAt(raw, r), p.grid);
    var model = XLEngine.evaluate(XLShift.shift(p.answer, r - r0), p.grid);
    var mv = ('error' in model) ? '-' : model.value;
    var ok = !('error' in mine) && !('error' in model) && valEqual(mine.value, model.value);
    if (ok) okN++;
    rows.push({ r: r, ok: ok, mine: mine, mv: mv });
  }
  var allOk = okN === rows.length;
  state.answered = true;
  state.done++;
  $('fx').disabled = true;
  rows.forEach(function (x) {
    var my = ('error' in x.mine) ? errHtml(x.mine.error) : '<div class="cv">' + escapeHtml(fmt(x.mine.value)) + '</div>';
    setCellAt(x.r, x.ok ? 'good' : 'bad', my + (x.ok ? '' : '<div class="cv2">정답 ' + escapeHtml(fmt(x.mv)) + '</div>'));
  });
  paintHandle();
  var myFirst = ('error' in rows[0].mine) ? '오류' : fmt(rows[0].mine.value);
  if (allOk) {
    /* 수업용은 앞뒤로 오갈 수 있어 같은 문제를 두 번 맞혀도 점수가 중복되지 않게 한다 */
    if (!state.marked[state.idx]) { state.marked[state.idx] = 1; state.correct++; }
    $('scoreLabel').textContent = state.correct + '점';
    finish(isMulti() ? '<b>✅ 정답!</b> ' + rows.length + '칸 모두 맞았어요. 사람마다 다른 결과가 제대로 나왔습니다.'
                     : '<b>✅ 정답!</b> 노란 칸에 나온 계산 결과: <b>' + escapeHtml(myFirst) + '</b>', 'ok', p);
    return;
  }
  if (!isMulti()) {
    finish('<b>❌ 오답</b> · 내 결과: <b>' + escapeHtml(myFirst) + '</b> (정답 결과: <b>' + escapeHtml(fmt(rows[0].mv)) + '</b>)', 'no', p);
    return;
  }
  // 여러 칸 — 어느 칸이 틀렸는지, 그 칸에 실제로 들어간 수식까지 보여 준다
  var wrong = rows.filter(function (x) { return !x.ok; });
  var w = wrong[0];
  var msg = '<b>❌ ' + rows.length + '칸 중 ' + okN + '칸 맞음</b> · 틀린 칸: ' +
    wrong.map(function (x) { return addrOf(x.r); }).join(', ') +
    '<div style="margin-top:8px">' + addrOf(w.r) + ' 칸에 실제로 들어간 수식 <span class="ansline">' + escapeHtml(formulaAt(raw, w.r)) + '</span>' +
    ' → ' + (('error' in w.mine) ? '오류' : '<b>' + escapeHtml(fmt(w.mine.value)) + '</b>') +
    ' (정답 <b>' + escapeHtml(fmt(w.mv)) + '</b>)</div>';
  var tip = fillTip(raw, p.answer, rows);
  if (tip) msg += '<div style="margin-top:6px">💡 ' + tip + '</div>';
  state.sel = w.r; showCellFx();
  finish(msg, 'no', p);
}
/* 틀린 까닭 짐작 — 가장 흔한 두 가지 */
function fillTip(raw, answer, rows) {
  if (rows[0].ok && answer.indexOf('$') >= 0 && raw.indexOf('$') < 0)
    return '첫 칸은 맞았는데 아래 칸이 틀렸다면 — <b>끌어내리면서 범위(또는 기준 칸)도 같이 내려간 것</b>입니다. ' +
           '움직이면 안 되는 주소에 <b>F4</b> 로 <b>$</b> 를 붙이세요.';
  if (/>=|<=/.test(answer) && !/>=|<=/.test(raw) && /[<>]/.test(raw))
    return '딱 기준값인 사람(경계)이 틀렸다면 <b>&gt;</b>(초과)와 <b>&gt;=</b>(이상)을 확인하세요.';
  if (!rows[0].ok) return '첫 칸부터 틀렸어요. 문제의 조건을 다시 읽어 보세요.';
  return '맞은 칸과 틀린 칸의 자료를 비교해 보세요 — 어떤 경우를 놓쳤는지 보입니다.';
}
/* 셀에 보여 줄 값 — 엑셀처럼 깔끔한 숫자로 만든다.
   자바스크립트 계산은 0.1*0.2 가 0.020000000000000004 처럼 나오는데,
   학생 눈에는 "숫자가 이상하게 나온다"로 보이므로 찌꺼기를 잘라 낸다.
   채점(valEqual)은 원래 값으로 하므로 여기서 반올림해도 정답 판정은 달라지지 않는다. */
function fmt(v) {
  if (v === '' || v === null || v === undefined) return '(빈 문자열)';
  if (v === true) return 'TRUE';
  if (v === false) return 'FALSE';
  if (typeof v === 'number') {
    if (!isFinite(v)) return String(v);
    if (Math.floor(v) === v && Math.abs(v) < 1e15) return String(v);
    var r = Number(v.toPrecision(12));                 // 부동소수점 찌꺼기 제거
    var dec = (String(r).split('.')[1] || '').length;
    if (dec > 6) r = Number(r.toFixed(6));             // 너무 긴 소수는 6자리까지만 보여 준다
    return String(r);
  }
  return String(v);
}
function flash(msg, cls) { $('fb').innerHTML = '<div class="feedback ' + cls + '">' + msg + '</div>'; }
function finish(msg, cls, p) {
  var last = state.idx === state.queue.length - 1;
  $('fb').innerHTML = '<div class="feedback ' + cls + '">' + msg +
    '<div style="margin-top:8px">모범답안 <span class="ansline">' + p.answer + '</span></div>' +
    (p.hint ? '<div style="margin-top:6px;color:var(--tx2)">💡 ' + p.hint + '</div>' : '') +
    xlBoxHtml(p) +
    '<div class="row" style="margin-top:12px"><button class="btn" onclick="nextProblem()">' +
    (last ? '결과 보기 →' : '다음 문제 →') + '</button></div></div>';
}
function nextProblem() {
  if (state.idx < state.queue.length - 1) { state.idx++; renderProblem(); }
  else finishPractice();
}
function finishPractice() {
  state.durationSec = Math.round((Date.now() - state.startTime) / 1000);
  // 연습도 RP 적립 (정답 +3 / 오답 -1) — 개념게임과 같은 계급이 오른다
  state.rp = hasRank() ? CH2Rank.award(state.correct, state.queue.length - state.correct, 1) : null;
  showResult();
}
function hasRank() { return !!window.CH2Rank; }
function rankBanner(r) { return hasRank() ? CH2Rank.bannerHtml(r) : ''; }
function rankRegister() { return hasRank() ? CH2Rank.registerBtnHtml() : ''; }
function renderRank() { if (hasRank()) CH2Rank.renderCard('rankCard'); }
function skipProblem() {
  if (state.answered) { nextProblem(); return; }
  state.done++;
  nextProblem();
}
function showHint() {
  var p = state.queue[state.idx];
  flash('💡 ' + (p.hint || '힌트가 없습니다.'), 'ok');
}
function showModel() {
  var p = state.queue[state.idx];
  var m = XLEngine.evaluate(p.answer, p.grid);
  var mv = ('error' in m) ? '-' : fmt(m.value);
  $('fb').innerHTML = '<div class="feedback ok">모범답안 <span class="ansline">' + p.answer + '</span>' +
    '<div style="margin-top:6px">이 수식을 ' + (isMulti() ? '<b>' + firstAddr() + '</b> 에 넣으면' : '넣으면 노란 칸에') + ' <b>' + escapeHtml(mv) + '</b> 이(가) 나옵니다.' +
    (isMulti() ? ' 그다음 ' + lastAddr() + ' 까지 끌어내립니다.' : '') + '</div>' +
    (p.hint ? '<div style="margin-top:6px;color:var(--tx2)">💡 ' + p.hint + '</div>' : '') +
    '<div style="margin-top:6px;color:var(--tx2);font-size:13px">입력줄에 직접 따라 쳐 보고' +
    (isMulti() ? ' 끝까지 끌어내린 뒤' : '') + ' [확인]을 눌러 보세요.</div>' + xlBoxHtml(p) + '</div>';
}

/* ---------- 결과 ---------- */
function showResult() {
  hide('practice'); show('result');
  var n = state.queue.length, c = state.correct;
  var pct = Math.round(c / n * 100);
  var emoji = pct >= 90 ? '🏆' : pct >= 70 ? '🎉' : pct >= 40 ? '👍' : '💪';
  var msg = pct >= 90 ? '완벽해요!' : pct >= 70 ? '잘했어요!' : pct >= 40 ? '조금만 더!' : '연습이 필요해요';
  if (!state.durationSec) state.durationSec = Math.round((Date.now() - state.startTime) / 1000);
  $('result').innerHTML =
    '<div class="result pcard">' +
      '<div class="big">' + emoji + '</div>' +
      '<div class="score">' + c + ' / ' + n + '</div>' +
      '<div style="color:var(--tx2);margin-top:4px">정답률 ' + pct + '% · ' + msg + '</div>' +
      rankBanner(state.rp) +
      rankRegister() +
      submitBtnHtml() +
      '<div class="rbtns">' +
        '<button class="btn sec" onclick="renderStart()">범위 다시 선택</button>' +
        '<button class="btn" onclick="startPractice(' + (state.fixed ? 'true' : 'false') + ')">다시 풀기</button>' +
      '</div>' +
    '</div>';
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ---------- 결과 제출(collector) ---------- */
function submitEnabled() { return !!(window.ResultCollector && ResultCollector.config && ResultCollector.config.endpoint); }
function submitBtnHtml() {
  return '<div class="row" style="justify-content:center;margin:14px 0 4px">' +
    '<button class="btn green" id="xlSubmit" onclick="submitResult()">📤 선생님께 결과 제출</button></div>';
}
function submitGuide() {
  alert(['이 링크로는 제출이 되지 않아요.', '',
    '선생님이 나눠 준 제출용 링크(주소 뒤에 ?rc=... 가 붙은 링크)로',
    '들어와야 반·번호를 입력하고 결과를 보낼 수 있습니다.', '',
    '연습은 지금 이대로 계속 하셔도 됩니다.'].join(String.fromCharCode(10)));
}
function submitResult() {
  if (!submitEnabled()) { submitGuide(); return; }
  // 작업 순서 모드의 결과는 따로 담아 둔다
  if (window.__stepsResult) {
    var st = window.__stepsResult;
    ResultCollector.config.tool = '컴활 2급 실기-스프레드시트';
    ResultCollector.open({
      score: st.score, correct: st.correct, total: st.total, durationSec: st.durationSec,
      labels: { score: '정답률', correct: '맞힘', total: '문항수' },
      mode: '스프레드시트 실기 — 작업 순서(' + (st.fixed ? '수업' : '개인') + ') · ' + st.cat,
      tier: hasRank() ? CH2Rank.tierOf(CH2Rank.rp()).name : undefined,
      extra: ['기본·분석·기타 작업 절차'],
    });
    return;
  }
  var n = state.queue.length, c = state.correct, score = Math.round(c / n * 100);
  var tier = hasRank() ? (' · ' + CH2Rank.tierOf(CH2Rank.rp()).name + '(' + CH2Rank.rp() + 'RP)') : '';
  ResultCollector.config.tool = '컴활 2급 실기-스프레드시트';
  ResultCollector.open({
    score: score,
    correct: c, total: n,
    durationSec: state.durationSec,
    labels: { score: '정답률', correct: '맞힘', total: '문항수' },
    mode: '스프레드시트 실기 — ' + (state.fixed ? '함께 풀기(수업)' : '랜덤 연습') + ' · ' + (state.cat || '전체'),
    tier: hasRank() ? CH2Rank.tierOf(CH2Rank.rp()).name : undefined,
    extra: ['함수·수식 작성'],
  });
}

/* ---------- 입력할 때마다 노란 칸 갱신 ---------- */
document.addEventListener('DOMContentLoaded', bindLive);
function bindLive() {
  var fx = $('fx');
  if (fx && !fx.__live) { fx.__live = 1; fx.addEventListener('input', updateLive); }
}
bindLive();

/* ---------- Enter 키 ---------- */
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && !$('practice').classList.contains('hidden')) {
    if (document.activeElement === $('fx')) {
      e.preventDefault();
      checkAnswer();
    }
  }
});

/* ---------- init ---------- */
renderStart();
