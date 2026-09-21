# -*- coding: utf-8 -*-
"""검산 — 숨은 정답을 학생 칸에 그대로 넣어 채점이 전부 '맞음' 이 되는지 본다.
   python verify.py out
"""
import sys, os, re, glob
sys.stdout.reconfigure(encoding='utf-8')
import win32com.client as w

ANS = re.compile(r'ISFORMULA\((\$?[A-Z]+\$?\d+)\)')
HLP = re.compile(r'ROUND\(\$?[A-Z]+\$?\d+,4\)=ROUND\((\$?[A-Z]+\$?\d+),4\)')

# 표 안의 노란 열 : 시트이름 -> [(학생 열, 숨은 열, 첫 행, 끝 행)]
TABLES = {
    "생산일보":   [("J", "AB", 5, 29), ("K", "AC", 5, 29), ("L", "AD", 5, 29),
                 ("M", "AE", 5, 29), ("N", "AF", 5, 29)],
    "자재입출고": [("H", "AB", 4, 43)],
    "월별실적":   [("E", "AB", 4, 15), ("F", "AC", 4, 15)],
    "품질검사":   [("H", "AB", 5, 34), ("I", "AC", 5, 34), ("J", "AD", 5, 34), ("K", "AE", 5, 34)],
    "출하실적":   [("G", "AB", 4, 51)],
    "설비가동":   [("D", "AB", 4, 15)],
}


def run(path):
    x = w.DispatchEx('Excel.Application'); x.Visible = False; x.DisplayAlerts = False
    bad, filled = 0, 0
    try:
        wb = x.Workbooks.Open(os.path.abspath(path), UpdateLinks=0)
        print("=" * 74); print(os.path.basename(path))
        # ① 표 채우기
        for sh in wb.Worksheets:
            for stu, hlp, r0, r1 in TABLES.get(sh.Name, []):
                for r in range(r0, r1 + 1):
                    f = sh.Range("%s%d" % (hlp, r)).Formula
                    if f:
                        sh.Range("%s%d" % (stu, r)).Formula = f
                        filled += 1
        # ② 문제 채우기 (채점 수식에서 답 칸·정답 칸 주소를 뽑아낸다)
        marks = []
        for sh in wb.Worksheets:
            ur = sh.UsedRange
            for row in range(1, ur.Row + ur.Rows.Count):
                for col in range(1, ur.Column + ur.Columns.Count):
                    c = sh.Cells(row, col)
                    f = c.Formula
                    if isinstance(f, str) and "ISFORMULA(" in f:
                        a, h = ANS.search(f), HLP.search(f)
                        if a and h:
                            sh.Range(a.group(1)).Formula = sh.Range(h.group(1)).Formula
                            marks.append((sh.Name, str(c.Address).replace("$",""), a.group(1)))
                            filled += 1
        x.CalculateFullRebuild()
        # ③ 결과 읽기
        for sheet, addr, ans in marks:
            t = str(wb.Worksheets(sheet).Range(addr).Text)
            v = str(wb.Worksheets(sheet).Range(ans).Text)
            if "맞음" not in t:
                print("  ✘ %s!%s (답칸 %s) => 채점 '%s' / 값 '%s'" % (sheet, addr, ans, t, v))
                bad += 1
            elif v.startswith("#") and not v.startswith("###"):
                print("  ! %s!%s 값이 오류 %s" % (sheet, ans, v))
                bad += 1
        # ④ 표 채점 줄 · 그 밖의 오류 값
        errs = 0
        for sh in wb.Worksheets:
            ur = sh.UsedRange
            for row in range(1, ur.Row + ur.Rows.Count):
                for col in range(1, ur.Column + ur.Columns.Count):
                    t = sh.Cells(row, col).Text
                    if isinstance(t, str) and t.startswith("#") and not t.startswith("###") and t != "#" and sh.Cells(row, col).HasFormula:
                        print("  ! 오류 %s!%s = %s  (%s)" % (sh.Name, str(sh.Cells(row, col).Address).replace("$",""),
                                                            t, str(sh.Cells(row, col).Formula)[:50]))
                        errs += 1
        print("  채운 칸 %d · 문제 %d개 · 틀림 %d · 오류칸 %d" % (filled, len(marks), bad, errs))
        for sh in wb.Worksheets:
            if sh.Name in TABLES:
                for stu, hlp, r0, r1 in TABLES[sh.Name]:
                    pass
        wb.Close(SaveChanges=False)
    finally:
        x.Quit()
    return bad + errs


total = 0
for f in sorted(glob.glob(os.path.join(sys.argv[1] if len(sys.argv) > 1 else "out", "*.xlsx"))):
    total += run(f)
print("\n모두 합쳐 문제 있는 칸 :", total)
