/* XLEngine - 간이 엑셀 수식 엔진 (컴활 실기 계산작업 연습용)
 * ※ comhwal-excel(1급) / comhwal2-excel(2급) 두 저장소가 같은 파일을 쓴다.
 *   1급 범위가 2급을 포함하므로 넓은 쪽에 맞춘다. 한쪽을 고치면 반드시 다른 쪽에도 복사할 것.
 * window.XLEngine.evaluate(formula, grid) -> { value } 또는 { error }
 *   grid: 2차원 배열 grid[row][col] (0-based). 빈 셀은 null.
 *   formula: "=IF(...)" 또는 "IF(...)"
 * 지원: 셀참조(A1,$A$1) / 범위(A1:B5) / + - * / ^ & 비교연산 / 배열수식
 *      IF AND OR NOT, SUM AVERAGE MAX MIN, COUNT COUNTA COUNTBLANK,
 *      COUNTIF SUMIF AVERAGEIF, COUNTIFS SUMIFS AVERAGEIFS MAXIFS MINIFS, ROUND ROUNDUP ROUNDDOWN INT MOD TRUNC ABS,
 *      LEFT RIGHT MID LEN UPPER LOWER TRIM, VLOOKUP HLOOKUP INDEX MATCH CHOOSE,
 *      RANK RANK.EQ LARGE SMALL MEDIAN, IFERROR, CONCATENATE, POWER, SUMPRODUCT
 */
(function () {
  'use strict';

  var ERR = { DIV0: '#DIV/0!', VALUE: '#VALUE!', REF: '#REF!', NAME: '#NAME?', NA: '#N/A', NUM: '#NUM!' };
  function XErr(c) { this.err = c; }
  function isErr(v) { return v instanceof XErr; }

  /* ---------- 토크나이저 ---------- */
  function tokenize(s) {
    var toks = [], i = 0, n = s.length;
    function isDigit(c) { return c >= '0' && c <= '9'; }
    function isAlpha(c) { return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || c === '_'; }
    while (i < n) {
      var c = s[i];
      if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }
      if (isDigit(c) || (c === '.' && isDigit(s[i + 1]))) {
        var num = ''; while (i < n && (isDigit(s[i]) || s[i] === '.')) num += s[i++];
        toks.push({ t: 'num', v: parseFloat(num) }); continue;
      }
      if (c === '"') {
        i++; var str = '';
        while (i < n) { if (s[i] === '"') { if (s[i + 1] === '"') { str += '"'; i += 2; continue; } i++; break; } str += s[i++]; }
        toks.push({ t: 'str', v: str }); continue;
      }
      if (isAlpha(c) || c === '$') {
        var id = ''; while (i < n && (isAlpha(s[i]) || isDigit(s[i]) || s[i] === '.' || s[i] === '$')) id += s[i++];
        toks.push({ t: 'id', v: id }); continue;
      }
      // 2글자 연산자
      var two = s.substr(i, 2);
      if (two === '<>' || two === '<=' || two === '>=') { toks.push({ t: 'op', v: two }); i += 2; continue; }
      if ('+-*/^&=<>'.indexOf(c) >= 0) { toks.push({ t: 'op', v: c }); i++; continue; }
      if (c === '(') { toks.push({ t: 'lp' }); i++; continue; }
      if (c === ')') { toks.push({ t: 'rp' }); i++; continue; }
      if (c === ',') { toks.push({ t: 'comma' }); i++; continue; }
      if (c === ':') { toks.push({ t: 'colon' }); i++; continue; }
      throw new XErr(ERR.VALUE);
    }
    return toks;
  }

  /* ---------- 파서 (재귀 하강) ---------- */
  function parse(toks) {
    var p = 0;
    function peek() { return toks[p]; }
    function next() { return toks[p++]; }
    function expect(t) { var tk = next(); if (!tk || tk.t !== t) throw new XErr(ERR.VALUE); return tk; }

    function parseExpr() { return parseCompare(); }
    function parseCompare() {
      var l = parseConcat();
      while (peek() && peek().t === 'op' && ['=', '<>', '<', '>', '<=', '>='].indexOf(peek().v) >= 0) {
        var op = next().v; l = { type: 'bin', op: op, l: l, r: parseConcat() };
      }
      return l;
    }
    function parseConcat() {
      var l = parseAdd();
      while (peek() && peek().t === 'op' && peek().v === '&') { next(); l = { type: 'bin', op: '&', l: l, r: parseAdd() }; }
      return l;
    }
    function parseAdd() {
      var l = parseMul();
      while (peek() && peek().t === 'op' && (peek().v === '+' || peek().v === '-')) { var op = next().v; l = { type: 'bin', op: op, l: l, r: parseMul() }; }
      return l;
    }
    function parseMul() {
      var l = parsePow();
      while (peek() && peek().t === 'op' && (peek().v === '*' || peek().v === '/')) { var op = next().v; l = { type: 'bin', op: op, l: l, r: parsePow() }; }
      return l;
    }
    function parsePow() {
      var l = parseUnary();
      while (peek() && peek().t === 'op' && peek().v === '^') { next(); l = { type: 'bin', op: '^', l: l, r: parseUnary() }; }
      return l;
    }
    function parseUnary() {
      if (peek() && peek().t === 'op' && (peek().v === '-' || peek().v === '+')) { var op = next().v; return { type: 'unary', op: op, x: parseUnary() }; }
      return parsePrimary();
    }
    function parsePrimary() {
      var tk = peek();
      if (!tk) throw new XErr(ERR.VALUE);
      if (tk.t === 'num') { next(); return { type: 'num', v: tk.v }; }
      if (tk.t === 'str') { next(); return { type: 'str', v: tk.v }; }
      if (tk.t === 'lp') { next(); var e = parseExpr(); expect('rp'); return e; }
      if (tk.t === 'id') {
        next();
        var name = tk.v;
        if (peek() && peek().t === 'lp') { // 함수 호출
          next(); var args = [];
          if (peek() && peek().t !== 'rp') {
            args.push(parseExpr());
            while (peek() && peek().t === 'comma') { next(); args.push(parseExpr()); }
          }
          expect('rp');
          return { type: 'func', name: name.toUpperCase(), args: args };
        }
        var up = name.toUpperCase();
        if (up === 'TRUE') return { type: 'bool', v: true };
        if (up === 'FALSE') return { type: 'bool', v: false };
        // 셀 참조 / 범위
        if (peek() && peek().t === 'colon') { next(); var b = expect('id'); return { type: 'range', a: name, b: b.v }; }
        return { type: 'ref', ref: name };
      }
      throw new XErr(ERR.VALUE);
    }
    var ast = parseExpr();
    if (p < toks.length) throw new XErr(ERR.VALUE);
    return ast;
  }

  /* ---------- 참조 해석 ---------- */
  function colToIdx(letters) { var n = 0; letters = letters.toUpperCase(); for (var i = 0; i < letters.length; i++) n = n * 26 + (letters.charCodeAt(i) - 64); return n - 1; }
  function parseRef(ref) {
    var m = /^\$?([A-Za-z]{1,3})\$?([0-9]+)$/.exec(ref);
    if (!m) throw new XErr(ERR.REF);
    return { c: colToIdx(m[1]), r: parseInt(m[2], 10) - 1 };
  }

  /* ---------- 값 도우미 ---------- */
  function cellVal(grid, r, c) {
    if (r < 0 || c < 0 || r >= grid.length || !grid[r] || c >= grid[r].length) return null;
    var v = grid[r][c];
    return (v === undefined) ? null : v;
  }
  function toNum(v) {
    if (isErr(v)) return v;
    if (v === null || v === '') return 0;
    if (typeof v === 'number') return v;
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (typeof v === 'string') { var t = v.trim(); if (t === '') return 0; var n = Number(t); if (!isNaN(n)) return n; return new XErr(ERR.VALUE); }
    return new XErr(ERR.VALUE);
  }
  function toStr(v) {
    if (isErr(v)) return v;
    if (v === null) return '';
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    return String(v);
  }
  function toBool(v) {
    if (isErr(v)) return v;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    if (v === null || v === '') return false;
    if (typeof v === 'string') { var u = v.toUpperCase(); if (u === 'TRUE') return true; if (u === 'FALSE') return false; }
    return !!v;
  }
  function flatten(v) { // 배열/2D → 1D 리스트
    var out = [];
    (function rec(x) { if (Array.isArray(x)) x.forEach(rec); else out.push(x); })(v);
    return out;
  }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function parseDate(v) { // "2024-03-15" / "2024/3/5" 형태를 Date로
    if (isErr(v) || v === null) return null;
    if (v instanceof Date) return v;
    var m = /^\s*(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})\s*$/.exec(String(v));
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d.getTime()) ? null : d;
  }

  /* ---------- 평가기 ---------- */
  function makeEval(grid) {
    function rangeValues(node) { // 2D 배열 반환
      var a = parseRef(node.a), b = parseRef(node.b);
      var r1 = Math.min(a.r, b.r), r2 = Math.max(a.r, b.r), c1 = Math.min(a.c, b.c), c2 = Math.max(a.c, b.c);
      var out = [];
      for (var r = r1; r <= r2; r++) { var row = []; for (var c = c1; c <= c2; c++) row.push(cellVal(grid, r, c)); out.push(row); }
      return out;
    }
    function ev(node) {
      switch (node.type) {
        case 'num': return node.v;
        case 'str': return node.v;
        case 'bool': return node.v;
        case 'ref': { var p = parseRef(node.ref); return cellVal(grid, p.r, p.c); }
        case 'range': return rangeValues(node);
        case 'unary': { var x = ev(node.x); if (isErr(x)) return x; return mapNum(x, function (a) { return node.op === '-' ? -a : a; }); }
        case 'bin': return evBin(node);
        case 'func': return evFunc(node);
      }
      return new XErr(ERR.VALUE);
    }
    function mapNum(v, fn) { // 숫자 단항, 배열 지원
      if (Array.isArray(v)) return v.map(function (x) { return mapNum(x, fn); });
      var n = toNum(v); if (isErr(n)) return n; return fn(n);
    }
    function broadcast(l, r, fn) {
      if (Array.isArray(l) || Array.isArray(r)) {
        var la = flatten(l), ra = flatten(r);
        var len = Math.max(Array.isArray(l) ? la.length : 1, Array.isArray(r) ? ra.length : 1);
        var out = [];
        for (var i = 0; i < len; i++) {
          var lv = Array.isArray(l) ? la[i] : l, rv = Array.isArray(r) ? ra[i] : r;
          out.push(fn(lv, rv));
        }
        return out;
      }
      return fn(l, r);
    }
    function evBin(node) {
      var l = ev(node.l), r = ev(node.r);
      if (isErr(l)) return l; if (isErr(r)) return r;
      var op = node.op;
      if (op === '&') return broadcast(l, r, function (a, b) { var sa = toStr(a), sb = toStr(b); if (isErr(sa)) return sa; if (isErr(sb)) return sb; return sa + sb; });
      if (['=', '<>', '<', '>', '<=', '>='].indexOf(op) >= 0) return broadcast(l, r, function (a, b) { return cmp(op, a, b); });
      // 산술
      return broadcast(l, r, function (a, b) {
        var na = toNum(a), nb = toNum(b); if (isErr(na)) return na; if (isErr(nb)) return nb;
        switch (op) { case '+': return na + nb; case '-': return na - nb; case '*': return na * nb;
          case '/': return nb === 0 ? new XErr(ERR.DIV0) : na / nb; case '^': return Math.pow(na, nb); }
      });
    }
    function cmp(op, a, b) {
      // 숫자끼리 or 문자끼리 비교. 문자 비교는 대소문자 무시.
      var av, bv;
      if (typeof a === 'number' || typeof b === 'number' || a === null || b === null) {
        av = toNum(a === null ? 0 : a); bv = toNum(b === null ? 0 : b);
        if (isErr(av) || isErr(bv)) { av = toStr(a).toUpperCase(); bv = toStr(b).toUpperCase(); }
      } else { av = toStr(a).toUpperCase(); bv = toStr(b).toUpperCase(); }
      switch (op) { case '=': return av === bv; case '<>': return av !== bv;
        case '<': return av < bv; case '>': return av > bv; case '<=': return av <= bv; case '>=': return av >= bv; }
    }

    /* 조건(criteria) 매칭: ">=70", "합격", 30, "<>x", "김*" */
    function matchCrit(cell, crit) {
      var cr = crit;
      if (typeof cr === 'string') {
        var m = /^(<=|>=|<>|<|>|=)(.*)$/.exec(cr);
        if (m) { var op = m[1] === '=' ? '=' : m[1]; var rhs = m[2]; var rn = Number(rhs); var val = (rhs.trim() !== '' && !isNaN(rn)) ? rn : rhs; return cmp(op, cell, val); }
        // 와일드카드
        if (cr.indexOf('*') >= 0 || cr.indexOf('?') >= 0) {
          var re = new RegExp('^' + cr.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i');
          return re.test(toStr(cell));
        }
        return toStr(cell).toUpperCase() === cr.toUpperCase();
      }
      return cmp('=', cell, cr);
    }

    /* COUNTIFS 계열 도우미: (범위,조건) 쌍을 모으고, 모든 조건을 만족하는 위치를 돌려준다 */
    function ifsPairs(A, val, from) {
      var pairs = [], i;
      for (i = from; i + 1 < A.length; i += 2) pairs.push({ r: flatten(val(i)), c: val(i + 1) });
      if (!pairs.length) return new XErr(ERR.VALUE);
      return pairs;
    }
    function ifsHits(pairs) {
      var n = pairs[0].r.length, hits = [], i, j, ok;
      for (i = 0; i < n; i++) {
        ok = true;
        for (j = 0; j < pairs.length; j++) if (!matchCrit(pairs[j].r[i], pairs[j].c)) { ok = false; break; }
        if (ok) hits.push(i);
      }
      return hits;
    }

    /* ── 데이터베이스 함수 도우미 (DSUM/DAVERAGE/DCOUNT/DMAX/DMIN …) ──
       database: 머리글 행을 포함한 2차원 범위
       criteria: 머리글 행 + 조건 행. 같은 행 = AND, 다른 행 = OR (엑셀과 동일) */
    function dbFieldIndex(db, fieldVal) {
      if (typeof fieldVal === 'number') return fieldVal - 1;
      var heads = db[0].map(function (x) { return toStr(x).trim().toUpperCase(); });
      return heads.indexOf(toStr(fieldVal).trim().toUpperCase());
    }
    function dbFilter(db, crit) {
      var heads = db[0].map(function (x) { return toStr(x).trim().toUpperCase(); });
      var rows = db.slice(1);
      var critHead = (crit[0] || []).map(function (x) { return toStr(x).trim().toUpperCase(); });
      var critRows = crit.slice(1);
      if (!critRows.length) return rows;
      return rows.filter(function (row) {
        return critRows.some(function (cr) {               // 행 사이는 OR
          var used = 0, ok = true;
          cr.forEach(function (cv, i) {
            if (cv === null || cv === undefined || cv === '') return;
            used++;
            var ci = heads.indexOf(critHead[i]);
            if (ci < 0) { ok = false; return; }
            if (!matchCrit(row[ci], cv)) ok = false;        // 같은 행 안에서는 AND
          });
          return used ? ok : true;
        });
      });
    }

    function evFunc(node) {
      var name = node.name, A = node.args;
      function val(i) { return ev(A[i]); }
      function nums(list) { return flatten(list).filter(function (x) { return typeof x === 'number' || (typeof x === 'string' && x.trim() !== '' && !isNaN(Number(x))); }).map(function (x) { return Number(x); }); }
      function firstErr() { for (var i = 0; i < arguments.length; i++) if (isErr(arguments[i])) return arguments[i]; return null; }

      switch (name) {
        case 'IF': {
          var cond = val(0); if (isErr(cond)) return cond;
          if (Array.isArray(cond)) { var tb = A.length > 1 ? val(1) : true, fb = A.length > 2 ? val(2) : false;
            return flatten(cond).map(function (c, i) { return toBool(c) ? (Array.isArray(tb) ? flatten(tb)[i] : tb) : (Array.isArray(fb) ? flatten(fb)[i] : fb); }); }
          return toBool(cond) ? (A.length > 1 ? val(1) : true) : (A.length > 2 ? val(2) : false);
        }
        case 'IFERROR': { var v = val(0); return isErr(v) ? val(1) : v; }
        case 'AND': { var arr = flatten(A.map(ev)); var e = firstErr.apply(null, arr); if (e) return e; return arr.every(function (x) { return toBool(x); }); }
        case 'OR': { var arr2 = flatten(A.map(ev)); var e2 = firstErr.apply(null, arr2); if (e2) return e2; return arr2.some(function (x) { return toBool(x); }); }
        case 'NOT': { var b = val(0); if (isErr(b)) return b; return !toBool(b); }
        case 'SUM': { var l = flatten(A.map(ev)); var e3 = l.filter(isErr)[0]; if (e3) return e3; return nums(l).reduce(function (a, b) { return a + b; }, 0); }
        case 'SUMPRODUCT': { var prod = null; for (var i = 0; i < A.length; i++) { var col = flatten(val(i)).map(function (x) { var n = toNum(x); return isErr(n) ? 0 : n; }); prod = prod ? prod.map(function (x, k) { return x * col[k]; }) : col; } return (prod || []).reduce(function (a, b) { return a + b; }, 0); }
        case 'AVERAGE': { var ns = nums(flatten(A.map(ev))); if (!ns.length) return new XErr(ERR.DIV0); return ns.reduce(function (a, b) { return a + b; }, 0) / ns.length; }
        case 'MEDIAN': { var ms = nums(flatten(A.map(ev))).sort(function (a, b) { return a - b; }); if (!ms.length) return new XErr(ERR.NUM); var mid = Math.floor(ms.length / 2); return ms.length % 2 ? ms[mid] : (ms[mid - 1] + ms[mid]) / 2; }
        case 'MAX': { var mx = nums(flatten(A.map(ev))); return mx.length ? Math.max.apply(null, mx) : 0; }
        case 'MIN': { var mn = nums(flatten(A.map(ev))); return mn.length ? Math.min.apply(null, mn) : 0; }
        case 'COUNT': { return flatten(A.map(ev)).filter(function (x) { return typeof x === 'number' || (typeof x === 'string' && x.trim() !== '' && !isNaN(Number(x))); }).length; }
        case 'COUNTA': { return flatten(A.map(ev)).filter(function (x) { return x !== null && x !== ''; }).length; }
        case 'COUNTBLANK': { return flatten(A.map(ev)).filter(function (x) { return x === null || x === ''; }).length; }
        case 'COUNTIF': { var rg = flatten(val(0)), cr = val(1); return rg.filter(function (x) { return matchCrit(x, cr); }).length; }
        case 'SUMIF': { var rg1 = flatten(val(0)), cr1 = val(1), sr = A.length > 2 ? flatten(val(2)) : rg1; var s = 0; rg1.forEach(function (x, k) { if (matchCrit(x, cr1)) { var n = toNum(sr[k]); if (!isErr(n)) s += n; } }); return s; }
        case 'AVERAGEIF': { var rg2 = flatten(val(0)), cr2 = val(1), ar = A.length > 2 ? flatten(val(2)) : rg2; var sum = 0, cnt = 0; rg2.forEach(function (x, k) { if (matchCrit(x, cr2)) { var n = toNum(ar[k]); if (!isErr(n)) { sum += n; cnt++; } } }); return cnt ? sum / cnt : new XErr(ERR.DIV0); }
        /* 다중 조건 — COUNTIFS(범위1,조건1, 범위2,조건2 …)
           SUMIFS/AVERAGEIFS/MAXIFS/MINIFS 는 첫 인수가 '계산할 범위'이고 그 뒤가 조건 쌍이다. */
        case 'COUNTIFS': {
          var cs = ifsPairs(A, val, 0);
          if (isErr(cs)) return cs;
          return ifsHits(cs).length;
        }
        case 'SUMIFS': case 'AVERAGEIFS': case 'MAXIFS': case 'MINIFS': {
          var target = flatten(val(0));
          var cs2 = ifsPairs(A, val, 1);
          if (isErr(cs2)) return cs2;
          var picked = ifsHits(cs2).map(function (k) { return toNum(target[k]); })
                                   .filter(function (x) { return !isErr(x) && x !== '' && x !== null; });
          if (name === 'SUMIFS') return picked.reduce(function (a, b) { return a + b; }, 0);
          if (!picked.length) return name === 'AVERAGEIFS' ? new XErr(ERR.DIV0) : 0;
          if (name === 'AVERAGEIFS') return picked.reduce(function (a, b) { return a + b; }, 0) / picked.length;
          return name === 'MAXIFS' ? Math.max.apply(null, picked) : Math.min.apply(null, picked);
        }
        case 'ROUND': { var nv = toNum(val(0)), d = toNum(val(1)); var e4 = firstErr(nv, d); if (e4) return e4; var f = Math.pow(10, d); return Math.round(nv * f) / f; }
        case 'ROUNDUP': { var nv1 = toNum(val(0)), d1 = toNum(val(1)); var f1 = Math.pow(10, d1); return (nv1 >= 0 ? Math.ceil(nv1 * f1) : Math.floor(nv1 * f1)) / f1; }
        case 'ROUNDDOWN': case 'TRUNC': { var nv2 = toNum(val(0)), d2 = A.length > 1 ? toNum(val(1)) : 0; var f2 = Math.pow(10, d2); return (nv2 >= 0 ? Math.floor(nv2 * f2) : Math.ceil(nv2 * f2)) / f2; }
        case 'INT': { var iv = toNum(val(0)); if (isErr(iv)) return iv; return Math.floor(iv); }
        case 'ABS': { var av2 = toNum(val(0)); if (isErr(av2)) return av2; return Math.abs(av2); }
        case 'MOD': { var m1 = toNum(val(0)), m2 = toNum(val(1)); if (m2 === 0) return new XErr(ERR.DIV0); return ((m1 % m2) + m2) % m2; }
        case 'POWER': { return Math.pow(toNum(val(0)), toNum(val(1))); }
        case 'LEFT': { var s0 = toStr(val(0)), k0 = A.length > 1 ? toNum(val(1)) : 1; return s0.substr(0, k0); }
        case 'RIGHT': { var s1 = toStr(val(0)), k1 = A.length > 1 ? toNum(val(1)) : 1; return s1.substr(Math.max(0, s1.length - k1)); }
        case 'MID': { var s2 = toStr(val(0)), st = toNum(val(1)), ln = toNum(val(2)); return s2.substr(st - 1, ln); }
        case 'LEN': { return toStr(val(0)).length; }
        case 'UPPER': { return toStr(val(0)).toUpperCase(); }
        case 'LOWER': { return toStr(val(0)).toLowerCase(); }
        case 'PROPER': { return toStr(val(0)).replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }
        case 'TRIM': { return toStr(val(0)).replace(/\s+/g, ' ').trim(); }
        case 'CONCATENATE': { return A.map(function (_, i) { return toStr(val(i)); }).join(''); }
        case 'VALUE': { var vv = toNum(val(0)); return vv; }
        case 'CHOOSE': { var idx = toNum(val(0)); if (isErr(idx)) return idx; return (idx >= 1 && idx < A.length) ? val(idx) : new XErr(ERR.VALUE); }
        case 'RANK': case 'RANK.EQ': {
          var num = toNum(val(0)), ref = flatten(val(1)).map(toNum).filter(function (x) { return !isErr(x); });
          var order = A.length > 2 ? toNum(val(2)) : 0;
          if (isErr(num)) return num;
          var rank = 1; ref.forEach(function (x) { if (order === 0 || order === false) { if (x > num) rank++; } else { if (x < num) rank++; } });
          return rank;
        }
        case 'LARGE': { var la = flatten(val(0)).map(toNum).filter(function (x) { return !isErr(x); }).sort(function (a, b) { return b - a; }); var kk = toNum(val(1)); return la[kk - 1] !== undefined ? la[kk - 1] : new XErr(ERR.NUM); }
        case 'SMALL': { var sa = flatten(val(0)).map(toNum).filter(function (x) { return !isErr(x); }).sort(function (a, b) { return a - b; }); var kk2 = toNum(val(1)); return sa[kk2 - 1] !== undefined ? sa[kk2 - 1] : new XErr(ERR.NUM); }
        case 'VLOOKUP': {
          var key = val(0), table = val(1), colIdx = toNum(val(2)), approx = A.length > 3 ? toBool(val(3)) : true;
          if (!Array.isArray(table)) return new XErr(ERR.NA);
          var found = null;
          if (approx) { for (var ri = 0; ri < table.length; ri++) { var cv = table[ri][0]; if (toNum(cv) <= toNum(key)) found = table[ri]; else break; } }
          else { for (var ri2 = 0; ri2 < table.length; ri2++) { if (matchCrit(table[ri2][0], key) || toStr(table[ri2][0]) === toStr(key)) { found = table[ri2]; break; } } }
          if (!found) return new XErr(ERR.NA);
          return found[colIdx - 1] !== undefined ? found[colIdx - 1] : new XErr(ERR.REF);
        }
        case 'HLOOKUP': {
          var key2 = val(0), tb2 = val(1), rowIdx = toNum(val(2)), approx2 = A.length > 3 ? toBool(val(3)) : true;
          if (!Array.isArray(tb2)) return new XErr(ERR.NA);
          var head = tb2[0], colf = -1;
          if (approx2) { for (var ci = 0; ci < head.length; ci++) { if (toNum(head[ci]) <= toNum(key2)) colf = ci; else break; } }
          else { for (var ci2 = 0; ci2 < head.length; ci2++) { if (toStr(head[ci2]) === toStr(key2)) { colf = ci2; break; } } }
          if (colf < 0 || !tb2[rowIdx - 1]) return new XErr(ERR.NA);
          return tb2[rowIdx - 1][colf];
        }
        case 'INDEX': {
          var arr3 = val(0); if (!Array.isArray(arr3)) return new XErr(ERR.REF);
          var rr = toNum(val(1)), cc = A.length > 2 ? toNum(val(2)) : 1;
          if (arr3.length === 1 && A.length <= 2) { return arr3[0][rr - 1]; }
          if (arr3[0].length === 1 && A.length <= 2) { return arr3[rr - 1][0]; }
          return (arr3[rr - 1] && arr3[rr - 1][cc - 1] !== undefined) ? arr3[rr - 1][cc - 1] : new XErr(ERR.REF);
        }
        case 'MATCH': {
          var mkey = val(0), marr = flatten(val(1)), mtype = A.length > 2 ? toNum(val(2)) : 1;
          for (var mi = 0; mi < marr.length; mi++) {
            if (mtype === 0) { if (toStr(marr[mi]) === toStr(mkey) || toNum(marr[mi]) === toNum(mkey)) return mi + 1; }
            else if (mtype === 1) { if (toNum(marr[mi]) > toNum(mkey)) return mi; }
          }
          return mtype === 1 ? marr.length : new XErr(ERR.NA);
        }
        case 'YEAR': { var dy = parseDate(val(0)); return dy ? dy.getFullYear() : new XErr(ERR.VALUE); }
        case 'MONTH': { var dm = parseDate(val(0)); return dm ? dm.getMonth() + 1 : new XErr(ERR.VALUE); }
        case 'DAY': { var dd = parseDate(val(0)); return dd ? dd.getDate() : new XErr(ERR.VALUE); }
        case 'WEEKDAY': {
          var dw = parseDate(val(0)); if (!dw) return new XErr(ERR.VALUE);
          var ty = A.length > 1 ? toNum(val(1)) : 1, w = dw.getDay(); // 0=일
          if (ty === 2) return w === 0 ? 7 : w;        // 월=1 … 일=7
          if (ty === 3) return w === 0 ? 6 : w - 1;    // 월=0 … 일=6
          return w + 1;                                // 기본: 일=1 … 토=7
        }
        case 'DATE': {
          var yy = toNum(val(0)), mm = toNum(val(1)), dd2 = toNum(val(2));
          if (isErr(yy) || isErr(mm) || isErr(dd2)) return new XErr(ERR.VALUE);
          var dt = new Date(yy, mm - 1, dd2);
          return dt.getFullYear() + '-' + p2(dt.getMonth() + 1) + '-' + p2(dt.getDate());
        }
        case 'DAYS': { var de = parseDate(val(0)), ds = parseDate(val(1)); if (!de || !ds) return new XErr(ERR.VALUE); return Math.round((de - ds) / 86400000); }
        case 'TIME': { var th = toNum(val(0)), tm = toNum(val(1)), ts = toNum(val(2)); return p2(th) + ':' + p2(tm) + ':' + p2(ts); }
        case 'HOUR': { var ph = /(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/.exec(toStr(val(0))); return ph ? Number(ph[1]) : new XErr(ERR.VALUE); }
        case 'MINUTE': { var pm = /(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/.exec(toStr(val(0))); return pm ? Number(pm[2]) : new XErr(ERR.VALUE); }
        case 'SECOND': { var psec = /(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/.exec(toStr(val(0))); return psec ? Number(psec[3] || 0) : new XErr(ERR.VALUE); }

        /* ── 2급 출제범위 추가 함수 ── */
        case 'PRODUCT': { var pn = nums(flatten(A.map(ev))); return pn.length ? pn.reduce(function (a, b) { return a * b; }, 1) : 0; }
        case 'AVERAGEA': { var aa = flatten(A.map(ev)).filter(function (x) { return x !== null && x !== ''; })
            .map(function (x) { var n = toNum(x); return isErr(n) ? (x === true ? 1 : 0) : n; });
          if (!aa.length) return new XErr(ERR.DIV0); return aa.reduce(function (a, b) { return a + b; }, 0) / aa.length; }
        case 'MODE': case 'MODE.SNGL': {
          var mo = nums(flatten(A.map(ev))), cnt2 = {}, best = null, bc = 1;
          mo.forEach(function (x) { cnt2[x] = (cnt2[x] || 0) + 1; if (cnt2[x] > bc) { bc = cnt2[x]; best = x; } });
          return best === null ? new XErr(ERR.NA) : best;
        }
        case 'STDEV': case 'STDEV.S': case 'VAR': case 'VAR.S': {
          var vs = nums(flatten(A.map(ev)));
          if (vs.length < 2) return new XErr(ERR.DIV0);
          var mean = vs.reduce(function (a, b) { return a + b; }, 0) / vs.length;
          var variance = vs.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / (vs.length - 1);
          return (name === 'VAR' || name === 'VAR.S') ? variance : Math.sqrt(variance);
        }
        case 'REPLACE': { var rs = toStr(val(0)), rst = toNum(val(1)), rln = toNum(val(2)), rnew = toStr(val(3));
          return rs.slice(0, rst - 1) + rnew + rs.slice(rst - 1 + rln); }
        case 'FIND': { var fh = toStr(val(1)), fn2 = toStr(val(0)); var fp = fh.indexOf(fn2, A.length > 2 ? toNum(val(2)) - 1 : 0); return fp < 0 ? new XErr(ERR.VALUE) : fp + 1; }
        case 'SEARCH': { var sh = toStr(val(1)).toUpperCase(), sn = toStr(val(0)).toUpperCase(); var sp = sh.indexOf(sn, A.length > 2 ? toNum(val(2)) - 1 : 0); return sp < 0 ? new XErr(ERR.VALUE) : sp + 1; }
        case 'CONCAT': { return flatten(A.map(ev)).map(function (x) { return x === null ? '' : toStr(x); }).join(''); }
        case 'TRUE': return true;
        case 'FALSE': return false;

        /* ── 데이터베이스 함수 ── */
        case 'DSUM': case 'DAVERAGE': case 'DCOUNT': case 'DCOUNTA': case 'DMAX': case 'DMIN': {
          var db = val(0), fieldV = val(1), crt = val(2);
          if (!Array.isArray(db) || !Array.isArray(crt) || !Array.isArray(db[0]) || !Array.isArray(crt[0])) return new XErr(ERR.VALUE);
          var fi = dbFieldIndex(db, Array.isArray(fieldV) ? flatten(fieldV)[0] : fieldV);
          if (fi < 0) return new XErr(ERR.VALUE);
          var hits = dbFilter(db, crt).map(function (row) { return row[fi]; });
          if (name === 'DCOUNTA') return hits.filter(function (x) { return x !== null && x !== ''; }).length;
          var dn = hits.filter(function (x) { return typeof x === 'number' || (typeof x === 'string' && x.trim() !== '' && !isNaN(Number(x))); }).map(Number);
          if (name === 'DCOUNT') return dn.length;
          if (!dn.length) return name === 'DSUM' ? 0 : new XErr(ERR.DIV0);
          if (name === 'DSUM') return dn.reduce(function (a, b) { return a + b; }, 0);
          if (name === 'DAVERAGE') return dn.reduce(function (a, b) { return a + b; }, 0) / dn.length;
          if (name === 'DMAX') return Math.max.apply(null, dn);
          return Math.min.apply(null, dn);
        }

        case 'TODAY': case 'NOW': return new XErr(ERR.NA); // 오늘 날짜는 채점이 불가하여 제외
        default: return new XErr(ERR.NAME);
      }
    }
    return ev;
  }

  function evaluate(formula, grid) {
    try {
      var f = String(formula).trim();
      if (f[0] === '=') f = f.slice(1);
      if (f === '') return { error: '수식을 입력하세요' };
      var toks = tokenize(f);
      var ast = parse(toks);
      var v = makeEval(grid)(ast);
      if (isErr(v)) return { error: v.err };
      if (Array.isArray(v)) v = flatten(v)[0]; // 단일 셀 결과
      return { value: v };
    } catch (e) {
      if (isErr(e)) return { error: e.err };
      return { error: '#ERROR' };
    }
  }

  window.XLEngine = { evaluate: evaluate };
})();
