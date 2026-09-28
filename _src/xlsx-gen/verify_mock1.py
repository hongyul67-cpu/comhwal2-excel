# -*- coding: utf-8 -*-
"""1급 실전 모의고사 검산 — 엑셀을 띄워 자동 채점 문항을 실제로 해 보고 100점이 되는지 본다.
   고급 필터 · 계산작업(숨은 모범답안을 노란 칸에, 배열은 배열로) · 데이터 표 · 통합 · 중복 제거
   ※ 사용자 정의 함수는 VBA 프로젝트 접근(보안 설정)이 필요해 여기서는 같은 값을 내는 수식으로 채점만 확인한다.
   python verify_mock1.py out
"""
import sys, os, glob, re
sys.stdout.reconfigure(encoding='utf-8')
import win32com.client as w

out = sys.argv[1] if len(sys.argv) > 1 else "out"
x = w.DispatchEx("Excel.Application"); x.Visible = False; x.DisplayAlerts = False
bad = 0
CRIT = {  # 회차: (조건 칸들, 조건 범위, 결과 머리글 줄, 필드들)
    1: ({"A17": "라인", "B17": "불량률", "A18": "A", "B18": ">=0.02"}, "A17:B18", 20, ["로트번호", "제품", "불량수", "불량률"]),
    2: ({"A17": "조건", "A18": "=AND(MONTH(A4)=10,E4>=AVERAGE($E$4:$E$15))"}, "A17:A18", 20, ["출하일", "거래처", "제품", "수량"]),
    3: ({"A17": "구분", "B17": "가동률", "A18": "프레스", "B19": "<0.75"}, "A17:B19", 21, ["설비코드", "설비명", "가동률"]),
}
try:
    for path in sorted(glob.glob(os.path.join(out, "mock1", "*.xlsx"))):
        no = int(re.search(r"제(\d)회", path)[1])
        wb = x.Workbooks.Open(os.path.abspath(path))
        x.CalculateFullRebuild()
        print("=" * 70); print(os.path.basename(path))
        sc = wb.Worksheets("채점표")
        end = 4
        while sc.Cells(end, 1).Text: end += 1
        print("  처음 점수:", sc.Cells(end + 1, 5).Text)
        for s in wb.Worksheets:
            ur = s.UsedRange
            for rr in range(1, ur.Row + ur.Rows.Count):
                for cc in range(1, min(ur.Column + ur.Columns.Count, 40)):
                    t = s.Cells(rr, cc).Text
                    if s.Cells(rr, cc).HasFormula and isinstance(t, str) and t.startswith("#"):
                        print("  ! 오류", s.Name, s.Cells(rr, cc).Address, t, str(s.Cells(rr, cc).Formula)[:60]); bad += 1
        # 고급 필터
        b1 = wb.Worksheets("기본작업-1")
        cells, crit, at, fields = CRIT[no]
        for k, v in cells.items():
            if v.startswith("="): b1.Range(k).Formula = v
            else: b1.Range(k).Value = v
        for j, f in enumerate(fields):
            b1.Cells(at, 1 + j).Value = f
        b1.Range("A3:%s15" % chr(64 + b1.Range("A3").CurrentRegion.Columns.Count)).AdvancedFilter(
            2, b1.Range(crit), b1.Range(b1.Cells(at, 1), b1.Cells(at, len(fields))))
        # 계산작업
        cw = wb.Worksheets("계산작업")
        for rr in range(1, 80):
            src = cw.Cells(rr, 27)
            if src.Formula:
                for cc in range(1, 12):
                    c = cw.Cells(rr, cc)
                    if c.Interior.Color == 13431551 and c.Value == 0:
                        if src.HasArray: c.FormulaArray = src.FormulaArray
                        else: c.Formula = src.Formula
                        break
        x.CalculateFullRebuild()
        vals = [cw.Cells(rr, 27).Text for rr in range(1, 80) if cw.Cells(rr, 27).Formula]
        print("  계산 모범값:", " ".join(v for v in vals))
        # 분석작업-2
        a2 = wb.Worksheets("분석작업-2")
        t = a2.Range("A1").Text
        if t == "판매 이익 모형":
            a2.Range("B10:F15").Table(a2.Range("C3"), a2.Range("C4"))
        elif t == "월별 제품 출하":
            srcs, r = [], 3
            for k in range(3):
                n = 0
                while a2.Cells(r + 2 + n, 1).Text: n += 1
                srcs.append("'분석작업-2'!R%dC1:R%dC3" % (r + 1, r + 1 + n))
                r += n + 3
            a2.Range("H3:J8").Consolidate(srcs, -4106, True, True)
        else:
            a2.Range("A3:E20").RemoveDuplicates((1, 2), 1)
        x.CalculateFullRebuild()
        for r in range(4, end):
            if sc.Cells(r, 4).Text == "스스로": sc.Cells(r, 7).Value = "O"
        x.CalculateFullRebuild()
        for r in range(4, end):
            if sc.Cells(r, 4).Text == "자동" and sc.Cells(r, 5).Value != sc.Cells(r, 3).Value:
                print("  ✘ 자동 채점 실패:", sc.Cells(r, 2).Text, "→", sc.Cells(r, 5).Text); bad += 1
        print("  다 한 뒤 점수:", sc.Cells(end + 1, 5).Text, sc.Cells(end + 1, 6).Text)
        if sc.Cells(end + 1, 5).Value != 100: bad += 1
        wb.Close(SaveChanges=False)
finally:
    x.Quit()
print("문제", bad)
