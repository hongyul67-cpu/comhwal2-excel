/* 컴활 2급 실기 스프레드시트 - 함수 연습소 엔진 */
'use strict';

var PROBS = window.XL_PROBLEMS || [];
var $ = function (id) { return document.getElementById(id); };
function show(id) { $(id).classList.remove('hidden'); }
function hide(id) { $(id).classList.add('hidden'); }
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

var state = { cat: '전체', queue: [], idx: 0, correct: 0, answered: false, done: 0, startTime: 0 };

/* ---------- 셀 주소 도우미 ---------- */
function colLetter(c) { var s = ''; c++; while (c > 0) { var m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); } return s; }
function parseRef(ref) { var m = /^\$?([A-Za-z]{1,3})\$?([0-9]+)$/.exec(ref); var col = 0, L = m[1].toUpperCase(); for (var i = 0; i < L.length; i++) col = col * 26 + (L.charCodeAt(i) - 64); return { c: col - 1, r: parseInt(m[2], 10) - 1 }; }

/* ---------- 시작 화면 ---------- */
function categories() {
  var set = {}; PROBS.forEach(function (p) { set[p.cat] = 1; });
  return ['전체'].concat(Object.keys(set));
}
function renderStart() {
  hide('practice'); hide('result'); show('start');
  var box = $('catChips'); box.innerHTML = '';
  categories().forEach(function (c) {
    var el = document.createElement('div');
    el.className = 'chip' + (c === state.cat ? ' on' : '');
    el.textContent = c === '전체' ? ('전체 (' + PROBS.length + ')') : c;
    el.onclick = function () { state.cat = c; renderStart(); };
    box.appendChild(el);
  });
}

/* ---------- 연습 진행 ---------- */
function startPractice() {
  var pool = state.cat === '전체' ? PROBS : PROBS.filter(function (p) { return p.cat === state.cat; });
  state.queue = shuffle(pool);
  state.idx = 0; state.correct = 0; state.done = 0; state.startTime = Date.now();
  if (!state.queue.length) return;
  hide('start'); hide('result'); show('practice');
  renderProblem();
}
function quitPractice() { renderStart(); }

function renderProblem() {
  var p = state.queue[state.idx];
  state.answered = false;
  $('progLabel').textContent = (state.idx + 1) + ' / ' + state.queue.length;
  $('pgFill').style.width = (state.idx / state.queue.length * 100) + '%';
  $('scoreLabel').textContent = state.correct + '점';
  $('catTag').textContent = p.cat;
  $('pTitle').textContent = p.title;
  $('pPrompt').innerHTML = p.prompt;
  $('fb').innerHTML = '';
  renderSheet(p);
  var fx = $('fx'); fx.value = ''; fx.disabled = false;
  setTimeout(function () { fx.focus(); }, 40);
}

function renderSheet(p) {
  var g = p.grid;
  var cols = 0; g.forEach(function (row) { cols = Math.max(cols, row.length); });
  var tgt = parseRef(p.target);
  var html = '<tr><th></th>';
  for (var c = 0; c < cols; c++) html += '<th>' + colLetter(c) + '</th>';
  html += '</tr>';
  for (var r = 0; r < g.length; r++) {
    html += '<tr><td class="rowh">' + (r + 1) + '</td>';
    for (var c2 = 0; c2 < cols; c2++) {
      var v = g[r][c2];
      var isT = (r === tgt.r && c2 === tgt.c);
      var isNum = (typeof v === 'number');
      var cls = isT ? 'tcell' : (isNum ? 'num' : '');
      var disp = isT ? '?' : (v === null || v === undefined ? '' : v);
      html += '<td class="' + cls + '">' + disp + '</td>';
    }
    html += '</tr>';
  }
  $('sheet').innerHTML = html;
}

/* ---------- 채점 ---------- */
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
  var stu = XLEngine.evaluate(raw, p.grid);
  var model = XLEngine.evaluate(p.answer, p.grid);
  if ('error' in stu) {
    flash('<b>❌ 수식 오류:</b> ' + stu.error + '<br>괄호·따옴표·쉼표를 확인해 보세요.', 'no');
    return;
  }
  var ok = !('error' in model) && valEqual(stu.value, model.value);
  state.answered = true;
  state.done++;
  var fx = $('fx'); fx.disabled = true;
  if (ok) {
    state.correct++;
    $('scoreLabel').textContent = state.correct + '점';
    finish('<b>✅ 정답!</b> 계산 결과: <b>' + fmt(stu.value) + '</b>', 'ok', p);
  } else {
    finish('<b>❌ 오답</b> · 내 결과: <b>' + fmt(stu.value) + '</b> (정답 결과: <b>' + fmt(model.value) + '</b>)', 'no', p);
  }
}
function fmt(v) { return (v === '' ? '(빈 문자열)' : String(v)); }
function flash(msg, cls) { $('fb').innerHTML = '<div class="feedback ' + cls + '">' + msg + '</div>'; }
function finish(msg, cls, p) {
  var last = state.idx === state.queue.length - 1;
  $('fb').innerHTML = '<div class="feedback ' + cls + '">' + msg +
    '<div style="margin-top:8px">모범답안 <span class="ansline">' + p.answer + '</span></div>' +
    (p.hint ? '<div style="margin-top:6px;color:var(--tx2)">💡 ' + p.hint + '</div>' : '') +
    '<div class="row" style="margin-top:12px"><button class="btn" onclick="nextProblem()">' +
    (last ? '결과 보기 →' : '다음 문제 →') + '</button></div></div>';
}
function nextProblem() {
  if (state.idx < state.queue.length - 1) { state.idx++; renderProblem(); }
  else showResult();
}
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
  $('fb').innerHTML = '<div class="feedback ok">모범답안 <span class="ansline">' + p.answer + '</span>' +
    (p.hint ? '<div style="margin-top:6px;color:var(--tx2)">💡 ' + p.hint + '</div>' : '') +
    '<div style="margin-top:6px;color:var(--tx2);font-size:13px">입력줄에 직접 따라 쳐 보고 [확인]을 눌러 보세요.</div></div>';
}

/* ---------- 결과 ---------- */
function showResult() {
  hide('practice'); show('result');
  var n = state.queue.length, c = state.correct;
  var pct = Math.round(c / n * 100);
  var emoji = pct >= 90 ? '🏆' : pct >= 70 ? '🎉' : pct >= 40 ? '👍' : '💪';
  var msg = pct >= 90 ? '완벽해요!' : pct >= 70 ? '잘했어요!' : pct >= 40 ? '조금만 더!' : '연습이 필요해요';
  state.durationSec = Math.round((Date.now() - state.startTime) / 1000);
  $('result').innerHTML =
    '<div class="result pcard">' +
      '<div class="big">' + emoji + '</div>' +
      '<div class="score">' + c + ' / ' + n + '</div>' +
      '<div style="color:var(--tx2);margin-top:4px">정답률 ' + pct + '% · ' + msg + '</div>' +
      submitBtnHtml() +
      '<div class="rbtns">' +
        '<button class="btn sec" onclick="renderStart()">범위 다시 선택</button>' +
        '<button class="btn" onclick="startPractice()">다시 풀기</button>' +
      '</div>' +
    '</div>';
}

/* ---------- 결과 제출(collector) ---------- */
function submitEnabled() { return !!(window.ResultCollector && ResultCollector.config && ResultCollector.config.endpoint); }
function submitBtnHtml() {
  if (!submitEnabled()) return '';
  return '<div class="row" style="justify-content:center;margin:14px 0 4px">' +
    '<button class="btn green" id="xlSubmit" onclick="submitResult()">📤 선생님께 결과 제출</button></div>';
}
function submitResult() {
  if (!submitEnabled()) return;
  var n = state.queue.length, c = state.correct;
  ResultCollector.config.tool = '컴활2급 실기-스프레드시트' + (state.cat !== '전체' ? (' · ' + state.cat) : '');
  ResultCollector.open({
    score: Math.round(c / n * 100),
    correct: c, total: n,
    durationSec: state.durationSec,
    labels: { score: '정답률', correct: '맞힘', total: '문항수' },
  });
}

/* ---------- Enter 키 ---------- */
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && !$('practice').classList.contains('hidden')) {
    if (document.activeElement === $('fx')) { e.preventDefault(); checkAnswer(); }
  }
});

/* ---------- init ---------- */
renderStart();
