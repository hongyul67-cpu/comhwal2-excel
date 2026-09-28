# -*- coding: utf-8 -*-
"""실전 모의고사 검산 — 엑셀을 띄워 학생이 할 일을 실제로 해 보고 채점표가 100점이 되는지 본다.
   (자료 입력 · 이름 정의 · 고급 필터 · 계산작업 · 목표값/통합/정렬 을 COM 으로 수행)
   python verify_mock.py out
"""
import sys, os, glob
sys.stdout.reconfigure(encoding='utf-8')
import win32com.client as w

out = sys.argv[1] if len(sys.argv) > 1 else "out"
x = w.DispatchEx("Excel.Application"); x.Visible = False; x.DisplayAlerts = False
bad = 0


def total(wb):
    sc = wb.Worksheets("채점표")
    r = 4
    while sc.Cells(r, 1).Text: r += 1
    return sc, r


try:
    for path in sorted(glob.glob(os.path.join(out, "mock", "*.xlsx"))):
        wb = x.Workbooks.Open(os.path.abspath(path))
        x.CalculateFullRebuild()
        name = os.path.basename(path); print("=" * 70); print(name)
        sc, end = total(wb)
        print("  처음 점수:", sc.Cells(end + 1, 5).Text, "/", sc.Cells(end + 1, 6).Text)
        for s in wb.Worksheets:
            ur = s.UsedRange
            for rr in range(1, ur.Row + ur.Rows.Count):
                for cc in range(1, min(ur.Column + ur.Columns.Count, 40)):
                    t = s.Cells(rr, cc).Text
                    if s.Cells(rr, cc).HasFormula and isinstance(t, str) and t.startswith("#"):
                        print("  ! 오류", s.Name, s.Cells(rr, cc).Address, t, s.Cells(rr, cc).Formula[:60]); bad += 1
        # 1 자료 입력 — 숨은 정답을 그대로 옮겨 적기
        f = sc.Cells(4, 5).Formula
        import re
        hid = re.search(r"'?채점표'?!\$AA\$(\d+):\$(\w+?)\$(\d+)", f)
        r0, r1 = int(hid[1]), int(hid[3])
        ncol = wb.Worksheets("기본작업-1").Range("A3").CurrentRegion.Columns.Count
        for i in range(r1 - r0 + 1):
            for j in range(ncol):
                v = sc.Cells(r0 + i, 27 + j).Value
                wb.Worksheets("기본작업-1").Cells(4 + i, 1 + j).Value = v if v is not None else None
        # 2 이름 정의
        for r in range(4, end):
            fm = sc.Cells(r, 5).Formula
            m = re.search(r"ISREF\((\w+)\)", fm)
            if m:
                b2 = wb.Worksheets("기본작업-2")
                txt = sc.Cells(r, 2).Text
                rng = re.search(r"\[([A-Z]\d+:[A-Z]\d+)\]", txt)[1]
                wb.Names.Add(Name=m[1], RefersTo="='기본작업-2'!" + rng.replace(":", ":"))
        # 3 고급 필터
        b3 = wb.Worksheets("기본작업-3")
        if b3.Range("A1").Text == "고급 필터":
            head = [b3.Cells(3, c).Text for c in range(1, 8)]
            if "분류" in head:   # 1회
                b3.Range("A15").Value = "분류"; b3.Range("B15").Value = "재고"
                b3.Range("A16").Value = "베어링"; b3.Range("B16").Value = "<=50"
                crit = b3.Range("A15:B16")
            else:                # 3회
                b3.Range("A15").Value = "창고"; b3.Range("B15").Value = "금액"
                b3.Range("A16").Value = "2창고"; b3.Range("B17").Value = ">=500000"
                crit = b3.Range("A15:B17")
            b3.Range("A3:G12").AdvancedFilter(Action=2, CriteriaRange=crit, CopyToRange=b3.Range("A19"))
        # 4 계산작업
        cw = wb.Worksheets("계산작업")
        vals = []
        for rr in range(1, 80):
            fa = cw.Cells(rr, 27).Formula
            if fa:
                for cc in range(1, 12):
                    if cw.Cells(rr, cc).Interior.Color == 13431551 and cw.Cells(rr, cc).Value == 0:  # FFF2CC
                        cw.Cells(rr, cc).Formula = fa
                        break
        x.CalculateFullRebuild()
        for rr in range(1, 80):
            if cw.Cells(rr, 27).Formula:
                vals.append(cw.Cells(rr, 27).Text)
        print("  계산작업 값:", " ".join(vals))
        # 5 분석작업-2
        a2 = wb.Worksheets("분석작업-2")
        t = a2.Range("A1").Text
        if t == "원가 모형":
            a2.Range("B7").GoalSeek(Goal=1000000, ChangingCell=a2.Range("B4"))
        elif t == "분기별 제품 생산량":
            srcs = []
            r = 3
            for k in range(3):
                n = 0
                while a2.Cells(r + 2 + n, 1).Text: n += 1
                srcs.append("'분석작업-2'!R%dC1:R%dC2" % (r + 1, r + 1 + n))
                r += n + 3
            a2.Range("G3:H8").Consolidate(Sources=srcs, Function=-4157, TopRow=True, LeftColumn=True)
        else:
            so = a2.Sort; so.SortFields.Clear()
            so.SortFields.Add(a2.Range("C4:C15"), 0, 1); so.SortFields.Add(a2.Range("D4:D15"), 0, 2)
            so.SetRange(a2.Range("A3:F15")); so.Header = 1; so.Apply()
        x.CalculateFullRebuild()
        # 6 스스로 문항은 O
        for r in range(4, end):
            if sc.Cells(r, 4).Text == "스스로":
                sc.Cells(r, 7).Value = "O"
        x.CalculateFullRebuild()
        for r in range(4, end):
            if sc.Cells(r, 4).Text == "자동" and sc.Cells(r, 5).Value != sc.Cells(r, 3).Value:
                print("  ✘ 자동 채점 실패:", sc.Cells(r, 2).Text, sc.Cells(r, 5).Text); bad += 1
        pts = sum(sc.Cells(r, 3).Value for r in range(4, end))
        print("  배점 합 %d · 다 한 뒤 점수: %s %s" % (pts, sc.Cells(end + 1, 5).Text, sc.Cells(end + 1, 6).Text))
        if pts != 100 or sc.Cells(end + 1, 5).Value != 100: bad += 1
        wb.Close(SaveChanges=False)
finally:
    x.Quit()
print("문제", bad)
