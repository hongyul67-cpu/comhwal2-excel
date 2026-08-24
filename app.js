/* 컴활 2급 실기 스프레드시트 - 함수 연습소 엔진 */
'use strict';

var PROBS = window.XL_PROBLEMS || [];
var $ = function (id) { return document.getElementById(id); };
function show(id) { $(id).classList.remove('hidden'); }
function hide(id) { $(id).classList.add('hidden'); }
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

/* fixed=true  → 수업용 '함께 풀기'. 문제 순서를 절대 섞지 않아 모든 PC에서 N번 문제가 같다.
   fixed=false → 학생 개인 연습. 매번 섞어서 출제. */
var state = { cat: '전체', queue: [], idx: 0, correct: 0, answered: false, done: 0, startTime: 0, exam: null, fixed: false, uiMode: 'class' };

/* ---------- 실전 모드 설정 ---------- */
var EXAM_MODES = [
  { key: 'real', nm: '실전 시험', n: 20, min: 40, ds: '20문항 · 40분 (실제 시험과 같은 시간)' },
  { key: 'mini', nm: '미니 시험', n: 10, min: 20, ds: '10문항 · 20분 (짧게 점검)' },
];
var PASS_SCORE = 70;          // 실기 합격 기준 70점
var examTimer = null;
function pad2(n) { return (n < 10 ? '0' : '') + n; }
function clearExamTimer() { if (examTimer) { clearInterval(examTimer); examTimer = null; } }
function isExam() { return !!state.exam; }

/* ---------- 셀 주소 도우미 ---------- */
function colLetter(c) { var s = ''; c++; while (c > 0) { var m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); } return s; }
function parseRef(ref) { var m = /^\$?([A-Za-z]{1,3})\$?([0-9]+)$/.exec(ref); var col = 0, L = m[1].toUpperCase(); for (var i = 0; i < L.length; i++) col = col * 26 + (L.charCodeAt(i) - 64); return { c: col - 1, r: parseInt(m[2], 10) - 1 }; }

/* ---------- 시작 화면 ---------- */
function categories() {
  var set = {}; PROBS.forEach(function (p) { set[p.cat] = 1; });
  return ['전체'].concat(Object.keys(set));
}
function renderStart() {
  clearExamTimer();
  state.exam = null; state.rp = null; state.durationSec = 0;
  renderRank();
  var tl = $('timerLabel'); if (tl) { tl.classList.add('hidden'); tl.classList.remove('warn'); }
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
  var ex = $('examOpts');
  if (ex) {
    ex.innerHTML = EXAM_MODES.map(function (m, i) {
      var n = Math.min(m.n, PROBS.length);
      return '<button class="exbtn" onclick="startExam(EXAM_MODES[' + i + '])">' +
        '<b>' + m.nm + ' ▶</b><span>' + m.ds.replace(String(m.n) + '문항', n + '문항') + '</span></button>';
    }).join('');
  }
}
function pickMode(m) {
  state.uiMode = m;
  [['mcClass', 'class'], ['mcPractice', 'practice'], ['mcExam', 'exam']].forEach(function (x) {
    var el = $(x[0]); if (el) el.classList.toggle('on', m === x[1]);
  });
  [['classPanel', 'class'], ['practicePanel', 'practice'], ['examPanel', 'exam']].forEach(function (x) {
    if ($(x[0])) (m === x[1] ? show : hide)(x[0]);
  });
}

/* ---------- 연습 진행 ---------- */
/* 수업용: 교재(데이터) 순서 그대로 — 섞지 않는다 */
function startClass() { startPractice(true); }
function startPractice(fixed) {
  clearExamTimer();
  state.exam = null;
  state.fixed = (fixed === true);
  var tl = $('timerLabel'); if (tl) { tl.classList.add('hidden'); tl.classList.remove('warn'); }
  var pool = state.cat === '전체' ? PROBS : PROBS.filter(function (p) { return p.cat === state.cat; });
  state.queue = state.fixed ? pool.slice() : shuffle(pool);
  state.idx = 0; state.correct = 0; state.done = 0; state.marked = {}; state.startTime = Date.now();
  if (!state.queue.length) return;
  hide('start'); hide('result'); show('practice');
  renderProblem();
}
function quitPractice() {
  if (isExam() && !confirm('시험을 그만둘까요?\n지금까지 입력한 답안은 채점되지 않아요.')) return;
  renderStart();
}

function renderProblem() {
  var p = state.queue[state.idx];
  var total = state.queue.length, last = state.idx === total - 1;
  state.answered = false;
  $('progLabel').textContent = (state.idx + 1) + ' / ' + total;
  $('pgFill').style.width = (state.idx / total * 100) + '%';
  $('catTag').textContent = p.cat;
  $('pTitle').textContent = p.title;
  $('pPrompt').innerHTML = p.prompt;
  $('fb').innerHTML = '';
  renderSheet(p);

  var fx = $('fx');
  fx.disabled = false;
  if (isExam()) {
    // 실전: 정답·점수 숨김, 입력만 저장하고 이동
    $('scoreLabel').classList.add('hidden');
    fx.value = state.exam.raw[state.idx] || '';
    $('toolBtns').innerHTML =
      '<button class="btn ghost" onclick="examNav(-1)"' + (state.idx === 0 ? ' disabled' : '') + '>← 이전</button>' +
      '<button class="btn green" onclick="examNav(1)">' + (last ? '제출하기 ✓' : '다음 →') + '</button>' +
      '<div class="spacer"></div>' +
      '<div class="chip2" style="align-self:center">응답 ' + examAnsweredCount() + ' / ' + total + '</div>';
  } else {
    $('scoreLabel').classList.remove('hidden');
    $('scoreLabel').textContent = state.correct + '점';
    fx.value = '';
    $('toolBtns').innerHTML =
      (state.fixed ? '<button class="btn ghost" onclick="prevProblem()"' + (state.idx === 0 ? ' disabled' : '') + '>← 이전</button>' : '') +
      '<button class="btn green" onclick="checkAnswer()">확인</button>' +
      '<button class="btn sec" onclick="showHint()">💡 힌트</button>' +
      '<button class="btn ghost" onclick="showModel()">모범답안</button>' +
      '<button class="btn ghost" onclick="skipProblem()">' + (state.fixed ? '다음 →' : '건너뛰기 →') + '</button>' +
      (state.fixed ? jumpSelectHtml() : '');
  }
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
      html += '<td class="' + cls + '"' + (isT ? ' id="tcell"' : '') + '>' + disp + '</td>';
    }
    html += '</tr>';
  }
  $('sheet').innerHTML = html;
}

/* ---------- 노란 칸 실시간 결과 ----------
 * 학생이 입력줄에 치는 동안 그 수식을 실제로 계산해 노란 셀에 그대로 보여준다.
 * (아래 정답만 뜨면 "진짜 작동하는지" 알 수 없다는 피드백 → 엑셀처럼 셀에 값이 뜨게)
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
function setCell(cls, html) {
  var td = $('tcell');
  if (!td) return;
  td.className = 'tcell' + (cls ? ' ' + cls : '');
  td.innerHTML = html;
}
function updateLive() {
  if (state.answered) return;                 // 채점 뒤에는 결과를 고정해 둔다
  var p = state.queue[state.idx];
  if (!p || !$('tcell')) return;
  var raw = ($('fx').value || '').trim();
  if (!raw) { setCell('', '?'); return; }
  if (raw.charAt(0) !== '=') { setCell('lit', escapeHtml(raw)); return; }
  if (raw.length === 1) { setCell('typing', '…'); return; }
  var r = XLEngine.evaluate(raw, p.grid);
  if ('error' in r) {
    if (looksIncomplete(raw)) setCell('typing', '…');
    else setCell('err', escapeHtml(r.error));
    return;
  }
  setCell('live', escapeHtml(fmt(r.value)));
}
/* 채점 결과를 셀에 남긴다 — 틀리면 내 값 아래에 정답 값도 같이 */
function paintGraded(myVal, modelVal, ok) {
  var my = '<div class="cv">' + escapeHtml(fmt(myVal)) + '</div>';
  if (ok) { setCell('good', my); return; }
  setCell('bad', my + '<div class="cv2">정답 ' + escapeHtml(fmt(modelVal)) + '</div>');
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
    setCell('err', escapeHtml(stu.error));
    flash('<b>❌ 수식 오류:</b> ' + stu.error + '<br>괄호·따옴표·쉼표를 확인해 보세요. (노란 칸에도 오류가 그대로 나옵니다)', 'no');
    return;
  }
  var ok = !('error' in model) && valEqual(stu.value, model.value);
  state.answered = true;
  state.done++;
  var fx = $('fx'); fx.disabled = true;
  var modelVal = ('error' in model) ? '-' : model.value;
  paintGraded(stu.value, modelVal, ok);
  if (ok) {
    /* 수업용은 앞뒤로 오갈 수 있어 같은 문제를 두 번 맞혀도 점수가 중복되지 않게 한다 */
    if (!state.marked[state.idx]) { state.marked[state.idx] = 1; state.correct++; }
    $('scoreLabel').textContent = state.correct + '점';
    finish('<b>✅ 정답!</b> 노란 칸에 나온 계산 결과: <b>' + fmt(stu.value) + '</b>', 'ok', p);
  } else {
    finish('<b>❌ 오답</b> · 내 결과: <b>' + fmt(stu.value) + '</b> (정답 결과: <b>' + fmt(modelVal) + '</b>)', 'no', p);
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
    '<div style="margin-top:6px">이 수식을 넣으면 노란 칸에 <b>' + escapeHtml(mv) + '</b> 이(가) 나옵니다.</div>' +
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

/* ============ 실전 모드 ============ */
function startExam(mode) {
  var n = Math.min(mode.n, PROBS.length);
  if (!n) { alert('문제를 준비하지 못했어요.'); return; }
  state.queue = shuffle(PROBS).slice(0, n);
  state.fixed = false;
  state.idx = 0; state.correct = 0; state.done = 0; state.marked = {}; state.startTime = Date.now();
  state.exam = { mode: mode, raw: new Array(n).fill(''), deadline: Date.now() + mode.min * 60000, timeUp: false };
  hide('start'); hide('result'); show('practice');
  var tl = $('timerLabel'); if (tl) tl.classList.remove('hidden');
  examTick();
  examTimer = setInterval(examTick, 1000);
  renderProblem();
}
function examTick() {
  if (!isExam()) { clearExamTimer(); return; }
  var left = Math.max(0, Math.round((state.exam.deadline - Date.now()) / 1000));
  var tl = $('timerLabel');
  if (tl) {
    tl.textContent = '⏱ ' + pad2(Math.floor(left / 60)) + ':' + pad2(left % 60);
    tl.classList.toggle('warn', left <= 300);   // 5분 이하 경고
  }
  if (left <= 0) { clearExamTimer(); saveExamInput(); finishExamXL(true); }
}
function examAnsweredCount() {
  if (!isExam()) return 0;
  return state.exam.raw.filter(function (s) { return s && s.trim(); }).length;
}
function saveExamInput() {
  if (!isExam()) return;
  var fx = $('fx');
  if (fx) state.exam.raw[state.idx] = fx.value.trim();
}
function examNav(d) {
  saveExamInput();
  if (d > 0 && state.idx === state.queue.length - 1) { confirmSubmitExam(); return; }
  state.idx = Math.min(state.queue.length - 1, Math.max(0, state.idx + d));
  renderProblem();
}
function confirmSubmitExam() {
  var un = state.queue.length - examAnsweredCount();
  var msg = un > 0 ? ('아직 입력하지 않은 문제가 ' + un + '개 있어요.\n제출할까요?') : '답안을 제출할까요?';
  if (confirm(msg)) finishExamXL(false);
}
// 채점: 학생 수식을 실제로 계산해 모범답안 결과와 비교
function gradeOne(p, raw) {
  var model = XLEngine.evaluate(p.answer, p.grid);
  var modelVal = ('error' in model) ? null : model.value;
  if (!raw || !raw.trim()) return { ok: false, my: '(미응답)', model: modelVal === null ? '-' : fmt(modelVal) };
  var stu = XLEngine.evaluate(raw, p.grid);
  if ('error' in stu) return { ok: false, my: '수식 오류 ' + stu.error, model: modelVal === null ? '-' : fmt(modelVal) };
  var ok = (modelVal !== null) && valEqual(stu.value, modelVal);
  return { ok: ok, my: fmt(stu.value), model: modelVal === null ? '-' : fmt(modelVal) };
}
function finishExamXL(timeUp) {
  clearExamTimer();
  var tl = $('timerLabel'); if (tl) { tl.classList.add('hidden'); tl.classList.remove('warn'); }
  state.exam.timeUp = !!timeUp;
  state.exam.marks = state.queue.map(function (p, i) { return gradeOne(p, state.exam.raw[i]); });
  state.correct = state.exam.marks.filter(function (m) { return m.ok; }).length;
  state.durationSec = Math.round((Date.now() - state.startTime) / 1000);
  // 실전은 RP 2배 + 합격(70점) 보너스 30
  var n = state.queue.length, passed = Math.round(state.correct / n * 100) >= PASS_SCORE;
  state.rp = hasRank() ? CH2Rank.award(state.correct, n - state.correct, 2, passed ? 30 : 0) : null;
  showExamResult();
}
function showExamResult() {
  hide('practice'); show('result');
  var n = state.queue.length, c = state.correct;
  var score = Math.round(c / n * 100);
  var pass = score >= PASS_SCORE;
  var e = state.exam;
  $('result').innerHTML =
    '<div class="result pcard">' +
      (e.timeUp ? '<div style="color:var(--no);font-weight:700;font-size:13px">⏰ 시간 종료로 자동 제출됐어요</div>' : '') +
      '<div style="color:var(--tx2);font-size:13px;font-weight:700">' + e.mode.nm + '</div>' +
      '<div class="big">' + (pass ? '🎉' : '💪') + '</div>' +
      '<div class="verdict ' + (pass ? 'pass' : 'fail') + '">' + (pass ? '합격' : '불합격') + '</div>' +
      '<div class="score" style="font-size:30px">' + score + '점</div>' +
      '<div style="color:var(--tx2);margin-top:4px">정답 ' + c + ' / ' + n +
        ' · 소요 ' + Math.floor(state.durationSec / 60) + '분 ' + (state.durationSec % 60) + '초</div>' +
      '<div style="color:var(--tx2);font-size:13px;margin-top:6px">실기는 <b style="color:var(--tx)">70점 이상</b>이면 합격이에요.</div>' +
      rankBanner(state.rp) +
      rankRegister() +
      submitBtnHtml() +
      '<div class="rbtns">' +
        '<button class="btn sec" onclick="showExamReview()">📖 풀이 보기 (' + (n - c) + '개 오답)</button>' +
        '<button class="btn sec" onclick="renderStart()">처음으로</button>' +
        '<button class="btn" onclick="startExam(state.exam.mode)">다시 도전</button>' +
      '</div>' +
    '</div>';
}
// 풀이과정: 제출 후에만 — 내 수식/결과 vs 모범답안/결과 + 힌트
function showExamReview() {
  hide('practice'); show('result');
  var items = state.queue.map(function (p, i) {
    var m = state.exam.marks[i], raw = state.exam.raw[i];
    var mark = m.ok ? '<span style="color:var(--ok)">✅ 정답</span>'
      : (!raw ? '<span style="color:var(--tx2)">⬜ 미응답</span>' : '<span style="color:var(--no)">❌ 오답</span>');
    return '<div class="rvitem">' +
      '<div class="rvmeta">' + (i + 1) + '. ' + p.cat + ' · ' + mark + '</div>' +
      '<div class="rvtitle">' + p.title + '</div>' +
      '<div class="rvprompt">' + p.prompt + '</div>' +
      '<div class="fxlab">내가 쓴 수식 · 결과 ' + m.my + '</div>' +
      '<div class="fxline mine">' + (raw ? escapeHtml(raw) : '(입력하지 않음)') + '</div>' +
      '<div class="fxlab">모범답안 · 결과 ' + m.model + '</div>' +
      '<div class="fxline model">' + escapeHtml(p.answer) + '</div>' +
      (p.hint ? '<div class="rvprompt" style="margin:10px 0 0">💡 ' + p.hint + '</div>' : '') +
    '</div>';
  }).join('');
  $('result').innerHTML =
    '<div>' +
      '<div class="row" style="justify-content:space-between;margin-bottom:10px">' +
        '<div style="font-weight:800;font-size:16px">📖 풀이 보기 · ' + state.queue.length + '문항</div>' +
        '<button class="btn sec" onclick="showExamResult()">← 결과로</button></div>' +
      items +
      '<div class="rbtns"><button class="btn sec" onclick="renderStart()">처음으로</button>' +
      '<button class="btn" onclick="startExam(state.exam.mode)">다시 도전</button></div>' +
    '</div>';
  window.scrollTo(0, 0);
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
  var n = state.queue.length, c = state.correct, score = Math.round(c / n * 100);
  var tier = hasRank() ? (' · ' + CH2Rank.tierOf(CH2Rank.rp()).name + '(' + CH2Rank.rp() + 'RP)') : '';
  if (isExam()) {
    // 시트 탭은 하나로 — 실전 유형은 mode 로 (규약 §1 ①)
    ResultCollector.config.tool = '컴활 2급 실기-스프레드시트';
    ResultCollector.open({
      score: score, correct: c, total: n, durationSec: state.durationSec,
      labels: { score: '점수', correct: '맞힘', total: '문항수' },
      mode: '스프레드시트 실기 — 실전 ' + state.exam.mode.nm +
            (score >= PASS_SCORE ? ' (합격)' : ' (불합격)'),
      tier: hasRank() ? CH2Rank.tierOf(CH2Rank.rp()).name : undefined,
      extra: ['실전 형식 문제 해결'],
    });
    return;
  }
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
      if (isExam()) examNav(1); else checkAnswer();
    }
  }
});

/* ---------- init ---------- */
renderStart();
