# -*- coding: utf-8 -*-
"""함수 연습 엑셀(gen_fx.py) 검산 — 엑셀을 실제로 띄워
   ① 처음엔 채점이 전부 '0 지우고 수식' 인지
   ② 숨은 모범답안을 노란 칸에 넣으면 전부 '맞음' 인지
   ③ 엑셀이 계산한 값이 웹 연습소 엔진 값과 같은지 (웹·엑셀 채점이 어긋나지 않게)
   ④ $ 를 뺀 수식은 여러 칸 문제에서 '다시' 가 나오는지
   python verify_fx.py out
"""
import sys, os, glob, json, datetime as dt
sys.stdout.reconfigure(encoding='utf-8')
import win32com.client as w

out = sys.argv[1] if len(sys.argv) > 1 else "out"
G1 = len(sys.argv) > 2 and sys.argv[2] == "1"          # python verify_fx.py out 1  → 1급
WEB = {p["title"]: p for p in json.load(open(os.path.join(out, "web_problems_1.json" if G1 else "web_problems.json"), encoding="utf-8"))}


def same(xv, wv):
    if wv is None:
        return False
    if isinstance(xv, (int, float)) and isinstance(wv, (int, float)):
        return abs(xv - wv) < 1e-6
    if hasattr(xv, "year"):                      # 엑셀 날짜 → 웹은 일련번호나 'yyyy-mm-dd'
        base = dt.datetime(1899, 12, 30, tzinfo=xv.tzinfo)
        serial = (xv - base).days
        return wv == serial or str(wv) == xv.strftime("%Y-%m-%d")
    if isinstance(xv, bool) or isinstance(wv, bool):
        return bool(xv) == bool(wv)
    if isinstance(xv, float) and isinstance(wv, str):
        try: return abs(xv - float(wv)) < 1e-6
        except ValueError: return False
    return str(xv) == str(wv)


x = w.DispatchEx("Excel.Application"); x.Visible = False; x.DisplayAlerts = False
bad = 0
try:
    for path in sorted(glob.glob(os.path.join(out, "fx1" if G1 else "fx", "*.xlsx"))):
        wb = x.Workbooks.Open(os.path.abspath(path))
        x.CalculateFullRebuild()
        print("=" * 70); print(os.path.basename(path))
        sheets = [s for s in wb.Worksheets if s.Name[:2].isdigit()]
        # ① 처음 상태
        for s in sheets:
            f = None
            for r in range(1, 12):
                for c in range(8, 16):
                    t = s.Cells(r, c).Formula
                    if isinstance(t, str) and t.startswith("=IF(NOT(ISFORMULA("):
                        f = (r, c)
            if not f:
                print("  ! 채점 칸 못 찾음", s.Name); bad += 1; continue
            s.__dict__  # noqa
            if "0 지우고" not in str(s.Cells(*f).Text):
                print("  ! 처음 채점이 이상", s.Name, s.Cells(*f).Text); bad += 1
        # ② 모범답안 넣기 + ③ 웹 값 비교
        for s in sheets:
            title = s.Name[3:]
            p = next((v for k, v in WEB.items() if k.replace("/", "").replace("(", "").replace(")", "")
                      .replace("*", "").replace('"', "").strip()[:25] == title[:25]), None)
            if not p:
                print("  ! 웹 문제 못 찾음", s.Name); bad += 1; continue
            for rr in p["rows"]:
                src = s.Range("AA%d" % rr["r"])
                dst = s.Range("%s%d" % (p["col"], rr["r"]))
                if src.HasArray: dst.FormulaArray = src.FormulaArray
                else: dst.Formula = src.Formula
        x.CalculateFullRebuild()
        for s in sheets:
            title = s.Name[3:]
            p = next((v for k, v in WEB.items() if k.replace("/", "").replace("(", "").replace(")", "")
                      .replace("*", "").replace('"', "").strip()[:25] == title[:25]), None)
            if not p: continue
            mark = None
            for r in range(1, 12):
                for c in range(8, 16):
                    t = s.Cells(r, c).Formula
                    if isinstance(t, str) and t.startswith("=IF(NOT(ISFORMULA("):
                        mark = s.Cells(r, c).Text
            if "맞음" not in str(mark):
                print("  ✘ 모범답안인데 채점이", mark, "—", s.Name); bad += 1
            for rr in p["rows"]:
                xv = s.Range("%s%d" % (p["col"], rr["r"])).Value
                if not same(xv, rr["web"]):
                    print("  ≠ 웹/엑셀 값 다름 %s %s%d : 엑셀 %r / 웹 %r   %s"
                          % (s.Name, p["col"], rr["r"], xv, rr["web"], rr["formula"])); bad += 1
        # ④ $ 뺀 수식
        for s in sheets:
            title = s.Name[3:]
            p = next((v for k, v in WEB.items() if k.replace("/", "").replace("(", "").replace(")", "")
                      .replace("*", "").replace('"', "").strip()[:25] == title[:25]), None)
            if not p or len(p["rows"]) < 2 or "$" not in p["answer"]: continue
            r0 = p["rows"][0]["r"]
            s.Range("%s%d" % (p["col"], r0)).Formula = p["answer"].replace("$", "")
            s.Range("%s%d" % (p["col"], r0)).Copy(s.Range("%s%d:%s%d" % (p["col"], r0 + 1, p["col"], p["rows"][-1]["r"])))
        x.CalculateFullRebuild()
        sc = wb.Worksheets("채점표")
        vals = [sc.Cells(r, 4).Text for r in range(4, 4 + len(sheets))]
        print("  채점표:", sc.Cells(4 + len(sheets) + 1, 4).Text, "| $ 뺀 뒤:", " ".join(v[:1] for v in vals))
        wb.Close(SaveChanges=False)
finally:
    x.Quit()
print("문제", bad)
