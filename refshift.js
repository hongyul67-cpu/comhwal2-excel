/* 채우기 핸들(끌어내리기) 흉내 — 수식 안의 셀 주소를 엑셀처럼 옮긴다
 *
 *   XLShift.shift('=IF(D2>=$B$9,"달성","미달")', 3)  →  '=IF(D5>=$B$9,"달성","미달")'
 *
 * $ 가 붙은 쪽(행 또는 열)은 움직이지 않는다. 따옴표 안의 글자는 건드리지 않는다.
 * 앱(app.js)과 엑셀 파일 만드는 스크립트(_src/xlsx-gen/export_web.js)가 함께 쓴다.
 */
(function (root) {
  'use strict';
  var REF = /^(\$?)([A-Za-z]{1,3})(\$?)([0-9]+)(?![A-Za-z0-9_(])/;

  function colNum(L) { var n = 0; L = L.toUpperCase(); for (var i = 0; i < L.length; i++) n = n * 26 + (L.charCodeAt(i) - 64); return n; }
  function colLet(n) { var s = ''; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }

  function shift(f, dr, dc) {
    dr = dr || 0; dc = dc || 0;
    if (!dr && !dc) return f;
    var out = '', i = 0, n = f.length, q = false;
    while (i < n) {
      var ch = f.charAt(i);
      if (ch === '"') { q = !q; out += ch; i++; continue; }
      if (q) { out += ch; i++; continue; }
      var prev = i ? f.charAt(i - 1) : '';
      if (!/[A-Za-z0-9_.$]/.test(prev)) {
        var m = REF.exec(f.slice(i));
        if (m) {
          var col = m[1] ? m[2].toUpperCase() : colLet(colNum(m[2]) + dc);
          var row = m[3] ? m[4] : String(parseInt(m[4], 10) + dr);
          out += m[1] + col + m[3] + row;
          i += m[0].length;
          continue;
        }
      }
      out += ch; i++;
    }
    return out;
  }

  /* 'E2:E7' → {col:'E', c:4, r0:1, r1:6}  (0부터 세는 행·열) */
  function range(t) {
    var p = String(t).split(':');
    var a = /^\$?([A-Z]+)\$?([0-9]+)$/.exec(p[0]), b = /^\$?([A-Z]+)\$?([0-9]+)$/.exec(p[1] || p[0]);
    return { col: a[1], c: colNum(a[1]) - 1, r0: parseInt(a[2], 10) - 1, r1: parseInt(b[2], 10) - 1 };
  }

  root.XLShift = { shift: shift, range: range, colLet: colLet, colNum: colNum };
})(typeof window !== 'undefined' ? window : globalThis);
