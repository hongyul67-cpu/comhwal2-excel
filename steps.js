/* 컴활 2급 실기 — '작업 순서' 모드
 *
 * 계산작업은 수식을 쳐서 연습하지만, 기본·분석·기타 작업은 손 순서가 곧 점수다.
 * 섞어 놓은 단계를 순서대로 눌러 맞히고, 이어서 대화상자에서 무엇을 고르는지 확인한다.
 * app.js와 같은 화면(#practice)을 쓰지 않고 자체 화면(#steps)을 쓴다 — 서로 간섭하지 않게.
 */
(function () {
  var ALL = window.XL_STEPS || [];
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* fixed=true 면 수업용 — 데이터 순서 그대로, 단계 카드도 섞지 않고 뒤집힌 순서로만 흐트러뜨린다 */
  var S = { queue: [], idx: 0, cat: '전체', fixed: false, picked: [], phase: 'order', oi: 0, score: 0, marked: {}, startTime: 0 };

  window.STEPS = {
    categories: function () {
      var set = {}; ALL.forEach(function (p) { set[p.cat] = 1; });
      return ['전체'].concat(Object.keys(set));
    },
    count: function (c) { return c === '전체' ? ALL.length : ALL.filter(function (p) { return p.cat === c; }).length; },
    setCat: function (c) { S.cat = c; },
    cat: function () { return S.cat; },
    start: start,
  };

  function pool() { return S.cat === '전체' ? ALL : ALL.filter(function (p) { return p.cat === S.cat; }); }

  function start(fixed) {
    var p = pool();
    if (!p.length) { alert('문제를 준비하지 못했어요.'); return; }
    S.fixed = (fixed === true);
    S.queue = S.fixed ? p.slice() : shuffle(p);
    S.idx = 0; S.score = 0; S.marked = {}; S.startTime = Date.now();
    document.getElementById('start').classList.add('hidden');
    document.getElementById('result').classList.add('hidden');
    document.getElementById('practice').classList.add('hidden');
    $('steps').classList.remove('hidden');
    render();
  }
  function quit() {
    $('steps').classList.add('hidden');
    if (window.renderStart) renderStart();
  }
  window.stepsQuit = quit;

  function render() {
    var p = S.queue[S.idx], total = S.queue.length;
    S.picked = []; S.phase = 'order'; S.oi = 0;
    $('stProg').textContent = (S.idx + 1) + ' / ' + total;
    $('stFill').style.width = (S.idx / total * 100) + '%';
    $('stScore').textContent = S.score + '점';
    $('stCat').textContent = p.cat;
    $('stTitle').textContent = p.title;
    $('stPrompt').innerHTML = p.prompt;
    $('stFb').innerHTML = '';
    // 수업용이어도 카드는 섞어야 문제가 되므로, 순서만 문제마다 고정되게 섞는다
    S.bank = S.fixed ? seedShuffle(p.steps, p.id) : shuffle(p.steps);
    drawOrder();
    drawTools();
  }
  /* 같은 문제는 늘 같은 순서로 흐트러지게 — 수업 중 화면이 학생마다 달라지면 곤란하다 */
  function seedShuffle(arr, seed) {
    var a = arr.slice(), h = 0;
    for (var i = 0; i < String(seed).length; i++) h = (h * 31 + String(seed).charCodeAt(i)) % 100000;
    for (var j = a.length - 1; j > 0; j--) {
      h = (h * 1103515245 + 12345) % 2147483648;
      var k = h % (j + 1);
      var t = a[j]; a[j] = a[k]; a[k] = t;
    }
    return a;
  }

  function drawOrder() {
    var p = S.queue[S.idx];
    var chosen = S.picked.map(function (t, i) {
      var ok = (t === p.steps[i]);
      return '<li class="stp done ' + (ok ? 'ok' : 'no') + '"><span class="n">' + (i + 1) + '</span>' + esc(t) +
        (ok ? '' : '<b class="fix"> → ' + esc(p.steps[i]) + '</b>') + '</li>';
    }).join('');
    /* 단계 글에 큰따옴표가 들어가는 것이 있어(예: "다른 장소에 복사"를 고른다)
       글자를 속성에 담으면 data-t="…" 가 중간에 끊긴다 → 뱅크의 번호만 넘긴다 */
    var rest = S.bank.map(function (t, bi) { return { t: t, bi: bi }; })
      .filter(function (x) { return S.picked.indexOf(x.t) < 0; })
      .map(function (x) { return '<li class="stp pick" role="button" tabindex="0" data-i="' + x.bi + '">' + esc(x.t) + '</li>'; }).join('');

    $('stBody').innerHTML =
      '<div class="stlab">순서대로 고른 것</div>' +
      '<ol class="stlist chosen">' + (chosen || '<li class="stempty">아래에서 <b>첫 단계</b>부터 눌러 보세요</li>') + '</ol>' +
      (rest ? '<div class="stlab">남은 단계</div><ul class="stlist bank">' + rest + '</ul>' : '');

    Array.prototype.forEach.call($('stBody').querySelectorAll('.stp.pick'), function (el) {
      function go() { pickStep(S.bank[+el.getAttribute('data-i')]); }
      el.onclick = go;
      /* 전자칠판은 터치라 클릭으로 되지만, 키보드·리모컨으로도 고를 수 있어야 한다 */
      el.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
    });
  }

  function pickStep(t) {
    var p = S.queue[S.idx];
    var i = S.picked.length;
    S.picked.push(t);
    if (t !== p.steps[i]) {
      // 틀린 순서를 골라도 정답 순서를 옆에 보여 주고 계속 진행한다 (수업이 끊기지 않게)
      S.wrong = true;
    }
    drawOrder();
    if (S.picked.length === p.steps.length) finishOrder();
  }

  function finishOrder() {
    var p = S.queue[S.idx];
    var hit = S.picked.filter(function (t, i) { return t === p.steps[i]; }).length;
    var perfect = (hit === p.steps.length);
    if (perfect && !S.marked['o' + S.idx]) { S.marked['o' + S.idx] = 1; S.score++; }
    $('stScore').textContent = S.score + '점';
    $('stFb').innerHTML = '<div class="feedback ' + (perfect ? 'ok' : 'no') + '">' +
      (perfect ? '<b>✅ 순서 정확!</b> ' : '<b>❌ 순서가 조금 달라요</b> — ') +
      p.steps.length + '단계 중 <b>' + hit + '</b>개를 제자리에 놓았어요.' +
      (p.hint ? '<div style="margin-top:6px;color:var(--tx2)">💡 ' + p.hint + '</div>' : '') +
      '</div>';
    S.phase = (p.opts && p.opts.length) ? 'opt' : 'end';
    if (S.phase === 'opt') { S.oi = 0; setTimeout(drawOpt, 250); }
    drawTools();
  }

  function drawOpt() {
    var p = S.queue[S.idx], o = p.opts[S.oi];
    $('stBody').innerHTML =
      '<div class="stlab">대화상자에서 무엇을 고르나요? (' + (S.oi + 1) + ' / ' + p.opts.length + ')</div>' +
      '<div class="stq">' + esc(o.q) + '</div>' +
      '<ol class="stopts">' + o.o.map(function (t, i) {
        return '<li role="button" tabindex="0" data-i="' + i + '"><span class="k">' + '①②③④'[i] + '</span>' + esc(t) + '</li>';
      }).join('') + '</ol>';
    Array.prototype.forEach.call($('stBody').querySelectorAll('.stopts li'), function (el) {
      function go() { answerOpt(+el.getAttribute('data-i')); }
      el.onclick = go;
      el.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
    });
    drawTools();
  }

  function answerOpt(i) {
    var p = S.queue[S.idx], o = p.opts[S.oi];
    var ok = (i === o.a);
    if (ok && !S.marked['q' + S.idx + '_' + S.oi]) { S.marked['q' + S.idx + '_' + S.oi] = 1; S.score++; }
    $('stScore').textContent = S.score + '점';
    Array.prototype.forEach.call($('stBody').querySelectorAll('.stopts li'), function (el) {
      var k = +el.getAttribute('data-i');
      if (k === o.a) el.className = 'hit';
      else if (k === i) el.className = 'miss';
      el.onclick = null; el.onkeydown = null; el.removeAttribute('tabindex');
    });
    $('stFb').innerHTML = '<div class="feedback ' + (ok ? 'ok' : 'no') + '">' +
      (ok ? '<b>✅ 맞았어요</b>' : '<b>❌ 아니에요</b>') +
      '<div style="margin-top:6px">' + o.ex + '</div></div>';
    S.oi++;
    if (S.oi >= p.opts.length) S.phase = 'end';
    drawTools();
  }

  function drawTools() {
    var p = S.queue[S.idx], last = S.idx === S.queue.length - 1;
    var h = '';
    if (S.fixed) h += '<button class="btn ghost" onclick="STEPSUI.prev()"' + (S.idx === 0 ? ' disabled' : '') + '>← 이전</button>';
    if (S.phase === 'order') {
      h += '<button class="btn sec" onclick="STEPSUI.showOrder()">순서 보기</button>';
    } else if (S.phase === 'opt') {
      h += '<button class="btn sec" onclick="STEPSUI.nextOpt()">건너뛰기</button>';
    }
    h += '<button class="btn green" onclick="STEPSUI.next()">' + (last && S.phase === 'end' ? '결과 보기 →' : '다음 →') + '</button>';
    if (S.fixed) h += jumpHtml();
    $('stTools').innerHTML = h;
  }
  function jumpHtml() {
    return '<div class="spacer"></div><select class="jump" onchange="STEPSUI.jump(this.value)">' +
      S.queue.map(function (p, i) {
        return '<option value="' + i + '"' + (i === S.idx ? ' selected' : '') + '>' + (i + 1) + '. ' + esc(p.title) + '</option>';
      }).join('') + '</select>';
  }

  window.STEPSUI = {
    prev: function () { if (S.idx > 0) { S.idx--; render(); } },
    jump: function (v) { var i = parseInt(v, 10); if (!isNaN(i) && i >= 0 && i < S.queue.length) { S.idx = i; render(); } },
    showOrder: function () {
      var p = S.queue[S.idx];
      $('stFb').innerHTML = '<div class="feedback ok"><b>순서</b><ol style="margin:8px 0 0 18px;line-height:1.7">' +
        p.steps.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol></div>';
    },
    nextOpt: function () {
      var p = S.queue[S.idx];
      S.oi++;
      if (S.oi >= p.opts.length) { S.phase = 'end'; $('stFb').innerHTML = ''; drawTools(); }
      else drawOpt();
    },
    next: function () {
      var p = S.queue[S.idx];
      if (S.phase === 'order') { finishOrder(); return; }        // 다 안 골랐어도 넘어갈 수 있게
      if (S.phase === 'opt') {
        // 아직 답을 안 골랐는데 [다음]을 누르면 같은 문제가 다시 그려져 멈춘 것처럼 보인다 → 건너뛴다
        var answered = !!document.querySelector('.stopts li.hit');
        if (answered) drawOpt(); else STEPSUI.nextOpt();
        return;
      }
      if (S.idx < S.queue.length - 1) { S.idx++; render(); }
      else showResult();
    },
  };

  function maxScore() {
    return S.queue.reduce(function (a, p) { return a + 1 + ((p.opts && p.opts.length) || 0); }, 0);
  }
  function showResult() {
    $('steps').classList.add('hidden');
    var res = document.getElementById('result');
    res.classList.remove('hidden');
    var max = maxScore(), pct = max ? Math.round(S.score / max * 100) : 0;
    var dur = Math.round((Date.now() - S.startTime) / 1000);
    var emoji = pct >= 90 ? '🏆' : pct >= 70 ? '🎉' : pct >= 40 ? '👍' : '💪';
    res.innerHTML =
      '<div class="result pcard">' +
        '<div style="color:var(--tx2);font-size:13px;font-weight:700">🧰 작업 순서 · ' + esc(S.cat) + '</div>' +
        '<div class="big">' + emoji + '</div>' +
        '<div class="score">' + S.score + ' / ' + max + '</div>' +
        '<div style="color:var(--tx2);margin-top:4px">정답률 ' + pct + '% · 소요 ' +
          Math.floor(dur / 60) + '분 ' + (dur % 60) + '초</div>' +
        '<div style="color:var(--tx2);font-size:13px;margin-top:8px">순서 맞히기 ' + S.queue.length +
          '문제 + 대화상자 문제 ' + (max - S.queue.length) + '개</div>' +
        (window.submitBtnHtml ? submitBtnHtml() : '') +
        '<div class="rbtns">' +
          '<button class="btn sec" onclick="stepsBackHome()">범위 다시 선택</button>' +
          '<button class="btn" onclick="STEPS.start(' + (S.fixed ? 'true' : 'false') + ')">다시 풀기</button>' +
        '</div>' +
      '</div>';
    // 제출은 app.js의 collector를 그대로 쓰되, 어떤 모드인지 남긴다
    window.__stepsResult = { score: pct, correct: S.score, total: max, durationSec: dur, cat: S.cat, fixed: S.fixed };
  }
  window.stepsBackHome = function () {
    window.__stepsResult = null;
    document.getElementById('result').classList.add('hidden');
    if (window.renderStart) renderStart();
  };

  /* 이 파일은 app.js 뒤에 로드된다 → app.js가 이미 renderStart()를 한 번 돌린 뒤라
     작업 순서 모드의 범위 칩이 비어 있다. 여기서 한 번 더 그려 준다. */
  if (window.renderStart) renderStart();
})();
