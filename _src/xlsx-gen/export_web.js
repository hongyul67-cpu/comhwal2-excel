/* 함수 연습소(웹) 문제를 그대로 JSON 으로 뽑는다 → gen_fx.py 가 수업 범위별 엑셀을 굽는다.
 *   node export_web.js            (이 폴더에서)
 * 웹과 엑셀의 문제·표·칸 주소가 똑같도록, 웹 데이터 파일을 그대로 읽는다.
 * 여러 칸 문제는 칸마다 «끌어내렸을 때의 모범답안»을 refshift.js 로 미리 만들어 둔다.
 */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
global.window = {};
for (const f of ['engine.js', 'refshift.js', 'data/problems.js', 'data/problems-plus.js', 'data/fill.js'])
  eval(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const S = window.XLShift, E = window.XLEngine;

const plain = s => String(s || '').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

const out = window.XL_PROBLEMS.map(p => {
  const t = S.range(p.target);
  const rows = [];
  for (let r = t.r0; r <= t.r1; r++) {
    const f = S.shift(p.answer, r - t.r0);
    const v = E.evaluate(f, p.grid);
    rows.push({ r: r + 1, formula: f, web: 'error' in v ? null : v.value });
  }
  return { id: p.id, cat: p.cat, title: p.title, prompt: plain(p.prompt), hint: plain(p.hint),
           answer: p.answer, grid: p.grid, col: t.col, c: t.c + 1, rows };
});
const dst = path.join(__dirname, 'out', 'web_problems.json');
fs.mkdirSync(path.dirname(dst), { recursive: true });
fs.writeFileSync(dst, JSON.stringify(out, null, 1), 'utf8');
console.log('문제', out.length, '→', dst);
