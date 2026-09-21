# -*- coding: utf-8 -*-
"""v2 부품 — 문제 블록 · 자동 채점 · 따라하기 · 함수사전 · 정답표"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_common import *
import re
from openpyxl.formatting.rule import FormulaRule

HELP_COL = 28          # AB — 채점 기준(모범답안)을 숨겨 두는 열
PLACEHOLDER = 0        # 노란 칸에 미리 넣어 두는 숫자 (지우고 수식을 넣게 함)

ORANGE = "C55A11"
PURPLE = "7B4FBF"


NEWFN = ["ISFORMULA", "RANK.EQ", "RANK.AVG", "STDEV.S", "STDEV.P", "VAR.S", "VAR.P",
          "MODE.SNGL", "DAYS", "IFS", "CONCAT", "MAXIFS", "MINIFS", "TEXTJOIN", "SWITCH",
          "NORM.DIST", "PERCENTILE.INC", "QUARTILE.INC", "COVARIANCE.P", "FREQUENCY.X"]


def fx(f):
    """엑셀 2007 이후에 생긴 함수는 파일 안에서 _xlfn. 을 붙여야 한다.
       (안 붙이면 열었을 때 #NAME? 가 난다. 화면에는 _xlfn. 이 안 보인다)"""
    if not isinstance(f, str) or not f.startswith("="):
        return f
    for fn in NEWFN:
        f = f.replace("_xlfn." + fn + "(", fn + "(")     # 두 번 붙는 것 막기
        f = re.sub(r"(?<![A-Za-z0-9._])" + re.escape(fn) + r"\(", "_xlfn." + fn + "(", f)
    return f


def ph(ws, row, col, fmt=None):
    """노란 칸에 0 을 넣어 둔다 — '이 0 을 지우고 수식을 넣으세요'"""
    c = ws.cell(row=row, column=col, value=PLACEHOLDER)
    c.fill = PatternFill("solid", fgColor=YEL)
    c.border = BORDER
    c.alignment = Alignment(horizontal="center", vertical="center")
    c.font = Font(color="A6A6A6", italic=True)
    if fmt:
        c.number_format = fmt
    return c


def mark_rules(ws, rng):
    """채점 칸 — 맞으면 초록, 틀리면 빨강"""
    first = rng.split(":")[0]
    ws.conditional_formatting.add(rng, FormulaRule(
        formula=['ISNUMBER(SEARCH("맞",%s))' % first],
        fill=PatternFill("solid", bgColor="C6EFCE"), font=Font(color="006100", bold=True)))
    ws.conditional_formatting.add(rng, FormulaRule(
        formula=['ISNUMBER(SEARCH("다시",%s))' % first],
        fill=PatternFill("solid", bgColor="FFC7CE"), font=Font(color="9C0006", bold=True)))


def chk(ans, help_):
    """학생이 넣은 수식의 결과를 숨은 정답 칸과 견주는 채점 수식"""
    return ('=IF(NOT(ISFORMULA(%s)),"↖ 0 지우고 수식",'
            'IF(IFERROR(ROUND(%s,4)=ROUND(%s,4),%s=%s),"✔ 맞음","✘ 다시"))'
            % (ans, ans, help_, ans, help_))


def qblock(ws, r0, items, *, qspan, ans_col, chk_col, hspan, help_col=HELP_COL):
    """
    문제 블록 — A열에 '번호 ▶넣을칸', 문제 · 답(노랑 0) · 채점 · 힌트.
    items : ('cat', '분류 이름')  또는  dict(q=, hint=, ans=, why=, fmt=)
    돌려주는 것 : (다음 행, [(번호, 넣을칸, 문제, 모범답안, 왜, 그 행) ...])
    """
    ac = get_column_letter(ans_col)
    hc = get_column_letter(help_col)
    r, no, made = r0, 0, []
    for it in items:
        if isinstance(it, tuple) and it[0] == "cat":
            ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=hspan[1])
            c = astext(ws.cell(row=r, column=1, value="  " + it[1]))
            c.font = Font(bold=True, size=11, color="FFFFFF")
            c.fill = PatternFill("solid", fgColor=PURPLE)
            c.alignment = Alignment(vertical="center")
            ws.row_dimensions[r].height = 21
            r += 1
            continue

        no += 1
        addr = "%s%d" % (ac, r)
        a = ws.cell(row=r, column=1, value="%d  ▶%s" % (no, addr))
        a.font = Font(bold=True, size=10.5, color=BLUE)
        a.alignment = Alignment(horizontal="center", vertical="center")
        a.border = BORDER

        ws.merge_cells(start_row=r, start_column=qspan[0], end_row=r, end_column=qspan[1])
        q = astext(ws.cell(row=r, column=qspan[0], value=it["q"]))
        q.alignment = Alignment(vertical="center", wrap_text=True)
        q.font = Font(size=10.5)
        for col in range(qspan[0], qspan[1] + 1):
            ws.cell(row=r, column=col).border = BORDER

        ph(ws, r, ans_col, it.get("fmt"))

        cc = ws.cell(row=r, column=chk_col, value=fx(chk(addr, "%s%d" % (hc, r))))
        cc.border = BORDER
        cc.alignment = Alignment(horizontal="center", vertical="center")
        cc.font = Font(size=10, bold=True)

        ws.merge_cells(start_row=r, start_column=hspan[0], end_row=r, end_column=hspan[1])
        h = astext(ws.cell(row=r, column=hspan[0], value=it["hint"]))
        h.alignment = Alignment(vertical="center", wrap_text=True)
        h.font = Font(size=10, color="7F7F7F")
        for col in range(hspan[0], hspan[1] + 1):
            ws.cell(row=r, column=col).border = BORDER

        ws.cell(row=r, column=help_col, value=fx(it.get("chkans", it["ans"])))
        ws.row_dimensions[r].height = it.get("h", 26)
        made.append((no, addr, it["q"], it["ans"], it.get("why", ""), r))
        r += 1

    mark_rules(ws, "%s%d:%s%d" % (get_column_letter(chk_col), r0, get_column_letter(chk_col), r - 1))
    return r, made


def qhead(ws, row, last_col, ans_col, chk_col, text, hint_label="힌트 — 쓰는 함수"):
    """문제 블록 머리글 — 제목 줄 + 열 이름 줄"""
    title(ws, row, text, span=last_col)
    hr = row + 1
    for col in range(1, last_col + 1):
        c = ws.cell(row=hr, column=col)
        c.fill = PatternFill("solid", fgColor=BLUE)
        c.border = BORDER
    ws.merge_cells(start_row=hr, start_column=2, end_row=hr, end_column=ans_col - 1)
    ws.merge_cells(start_row=hr, start_column=chk_col + 1, end_row=hr, end_column=last_col)
    for col, label in ((1, "번호 ▶ 넣을 칸"), (2, "문제 — 무엇을 구하나"),
                       (ans_col, "답"), (chk_col, "채점"), (chk_col + 1, hint_label)):
        c = ws.cell(row=hr, column=col, value=label)
        c.font = Font(bold=True, color="FFFFFF", size=11)
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    ws.row_dimensions[hr].height = 26
    return hr + 1


def hide_helpers(ws, first=HELP_COL, last=HELP_COL + 6):
    for c in range(first, last + 1):
        ws.column_dimensions[get_column_letter(c)].hidden = True


def answers_sheet(wb, name, head, sections, colw=None):
    """sections : [(구역 제목, 시트이름, made)]  — made 는 qblock 이 돌려준 것"""
    ws = wb.create_sheet(name)
    widths(ws, colw or {"A": 6, "B": 16, "C": 42, "D": 46, "E": 13, "F": 44})
    title(ws, 1, head, span=6)
    note(ws, 2, "먼저 스스로 만들어 본 뒤에 펼쳐 보세요.  [넣을 칸] 이 그 답을 적을 자리이고, "
                "[정답값] 은 제대로 넣었을 때 나와야 하는 값입니다.", span=6)
    r = 4
    for sec_title, sheet_name, made in sections:
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=6)
        c = astext(ws.cell(row=r, column=1, value="  " + sec_title))
        c.font = Font(bold=True, size=11.5, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor=NAVY)
        c.alignment = Alignment(vertical="center")
        ws.row_dimensions[r].height = 22
        r += 1
        hdr(ws, r, ["번호", "넣을 칸", "무엇을 구하나", "정답 수식", "정답값", "왜 그런가 · 자주 하는 실수"])
        r += 1
        for no, addr, q, ans, why, srcrow in made:
            put(ws, r, [no, "%s %s" % (sheet_name, addr), q, None, None, why],
                fill=GREEN if no % 2 == 0 else None)
            ws.cell(row=r, column=1).alignment = Alignment(horizontal="center", vertical="center")
            ws.cell(row=r, column=2).alignment = Alignment(horizontal="center", vertical="center")
            ws.cell(row=r, column=2).font = Font(bold=True, color=ORANGE)
            for col in (3, 6):
                ws.cell(row=r, column=col).alignment = Alignment(vertical="center", wrap_text=True)
                ws.cell(row=r, column=col).font = Font(size=10)
            lit(ws, r, 4, ans, bold=True, color="1F4E79")
            ws.cell(row=r, column=4).alignment = Alignment(vertical="center", wrap_text=True)
            v = ws.cell(row=r, column=5, value="='%s'!%s%d" % (sheet_name, get_column_letter(HELP_COL), srcrow))
            v.border = BORDER
            v.font = Font(bold=True, color="006100")
            v.alignment = Alignment(horizontal="center", vertical="center")
            ws.row_dimensions[r].height = 30
            r += 1
        r += 1
    return ws


def howto_sheet(wb, name, head, blocks, intro=None):
    """따라하기 — 미션마다 1단계·2단계… 를 줄로 펼친다
       blocks : [(미션제목, 어디서, [(단계, 곁들임)…], 이렇게 되면 성공)]"""
    ws = wb.create_sheet(name)
    widths(ws, {"A": 9, "B": 62, "C": 50})
    ws.sheet_view.showGridLines = False
    title(ws, 1, head, span=3)
    if intro:
        note(ws, 2, intro, span=3)
    r = 4
    for i, (mt, where, steps, ok) in enumerate(blocks, 1):
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=3)
        c = astext(ws.cell(row=r, column=1, value="  미션 %d · %s" % (i, mt)))
        c.font = Font(bold=True, size=12, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor=BLUE)
        c.alignment = Alignment(vertical="center")
        ws.row_dimensions[r].height = 24
        r += 1
        w = ws.cell(row=r, column=1, value="어디서")
        w.font = Font(bold=True, size=10, color=ORANGE)
        w.alignment = Alignment(horizontal="center", vertical="center")
        ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=3)
        c = astext(ws.cell(row=r, column=2, value=where))
        c.font = Font(size=10.5, color=ORANGE, bold=True)
        c.alignment = Alignment(vertical="center", wrap_text=True)
        ws.row_dimensions[r].height = 20
        r += 1
        for j, (step, tip) in enumerate(steps, 1):
            s = ws.cell(row=r, column=1, value="%d단계" % j)
            s.font = Font(bold=True, size=10, color=BLUE)
            s.alignment = Alignment(horizontal="center", vertical="center")
            s.border = BORDER
            t = astext(ws.cell(row=r, column=2, value=step))
            t.alignment = Alignment(vertical="center", wrap_text=True)
            t.font = Font(size=10.5)
            t.border = BORDER
            p = astext(ws.cell(row=r, column=3, value=tip))
            p.font = Font(size=10, color="7F7F7F")
            p.alignment = Alignment(vertical="center", wrap_text=True)
            p.border = BORDER
            ws.row_dimensions[r].height = 28
            r += 1
        k = ws.cell(row=r, column=1, value="확인")
        k.font = Font(bold=True, size=10, color="006100")
        k.alignment = Alignment(horizontal="center", vertical="center")
        ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=3)
        c = astext(ws.cell(row=r, column=2, value="이렇게 되면 성공 — " + ok))
        c.font = Font(size=10.5, color="006100")
        c.fill = PatternFill("solid", fgColor="EBF7EE")
        c.alignment = Alignment(vertical="center", wrap_text=True)
        ws.row_dimensions[r].height = 26
        r += 2
    return ws


def checklist_sheet(wb, name, head, rows, note_text=None):
    """미션 체크리스트 — □ 칸에 v 를 쳐 가며"""
    ws = wb.create_sheet(name)
    widths(ws, {"A": 6, "B": 64, "C": 7, "D": 42})
    title(ws, 1, head, span=4)
    if note_text:
        note(ws, 2, note_text, span=4)
    hdr(ws, 4, ["번호", "미션 — 무엇을 하는가", "다 함", "어디서 (메뉴)"])
    r = 5
    for i, (m, where) in enumerate(rows, 1):
        put(ws, r, [i, m, None, where])
        ws.cell(row=r, column=1).alignment = Alignment(horizontal="center", vertical="center")
        ws.cell(row=r, column=2).alignment = Alignment(vertical="center", wrap_text=True)
        ws.cell(row=r, column=4).alignment = Alignment(vertical="center", wrap_text=True)
        ws.cell(row=r, column=4).font = Font(size=10, color="7F7F7F")
        b = ws.cell(row=r, column=3, value="□")
        b.fill = PatternFill("solid", fgColor=YEL)
        b.border = BORDER
        b.alignment = Alignment(horizontal="center", vertical="center")
        b.font = Font(size=13)
        ws.row_dimensions[r].height = 30
        r += 1
    return ws


def dict_sheet(wb, name, head, rows, intro=None):
    """함수 사전 — 형식 · 살아 있는 예시 · 자주 하는 실수
       rows : ('cat','분류')  또는  (함수, 하는 일, 형식, 예시수식, 실수)"""
    ws = wb.create_sheet(name)
    widths(ws, {"A": 15, "B": 28, "C": 38, "D": 40, "E": 13, "F": 42})
    title(ws, 1, head, span=6)
    if intro:
        note(ws, 2, intro, span=6)
    hdr(ws, 4, ["함수", "하는 일", "쓰는 법 (형식)", "이 파일 자료로 든 예시", "결과", "자주 하는 실수"])
    r = 5
    for it in rows:
        if it[0] == "cat":
            ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=6)
            c = astext(ws.cell(row=r, column=1, value="  " + it[1]))
            c.font = Font(bold=True, size=11, color="FFFFFF")
            c.fill = PatternFill("solid", fgColor=PURPLE)
            c.alignment = Alignment(vertical="center")
            ws.row_dimensions[r].height = 21
            r += 1
            continue
        fn, does, form, ex, mistake = it
        put(ws, r, [fn, does, None, None, None, mistake])
        ws.cell(row=r, column=1).font = Font(bold=True, name="Consolas", size=10.5, color="1F4E79")
        ws.cell(row=r, column=1).alignment = Alignment(horizontal="center", vertical="center")
        for col in (2, 6):
            ws.cell(row=r, column=col).alignment = Alignment(vertical="center", wrap_text=True)
            ws.cell(row=r, column=col).font = Font(size=10)
        lit(ws, r, 3, form)
        ws.cell(row=r, column=3).alignment = Alignment(vertical="center", wrap_text=True)
        lit(ws, r, 4, ex)
        ws.cell(row=r, column=4).alignment = Alignment(vertical="center", wrap_text=True)
        v = ws.cell(row=r, column=5, value=fx(ex))  # 진짜로 계산되는 칸
        v.border = BORDER
        v.font = Font(bold=True, color="006100")
        v.alignment = Alignment(horizontal="center", vertical="center")
        ws.row_dimensions[r].height = 30
        r += 1
    return ws
