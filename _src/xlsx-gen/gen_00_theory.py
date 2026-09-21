# -*- coding: utf-8 -*-
"""00 · 필기 이론을 눈으로 확인하는 체험 파일 (1급·2급 공통)"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_common import *

def build():
    wb = Workbook()

    guide_sheet(wb, [
        ("h1", "엑셀 이론 체험 — 필기에서 글로 외운 것을 실제로 눌러 보기"),
        ("", ""),
        ("", "필기 문제집에 글자로만 나오는 것들을 이 파일에서 직접 확인합니다."),
        ("", "셀을 눌러 수식 입력줄(위쪽 fx 줄)에 무엇이 적혀 있는지 보는 것이 이 파일의 사용법입니다."),
        ("", ""),
        ("h2", "시트 안내"),
        ("", "① 셀참조    — 상대참조 / 절대참조($) / 혼합참조를 복사해 보며 차이를 확인"),
        ("", "② 오류값    — #DIV/0!  #N/A  #VALUE!  #NAME?  #NUM!  #REF!  #NULL!  7가지가 실제로 떠 있음"),
        ("", "③ 표시형식  — 같은 숫자에 서식만 달리 준 것. 값은 그대로인데 보이는 모양만 바뀜"),
        ("", "④ 연산자    — 산술·비교·문자열(&)·참조 연산자와 우선순위"),
        ("", "⑤ 이름정의  — 범위에 이름을 붙여 수식에 쓰기 (수식 → 이름 관리자)"),
        ("", "⑥ 자동채우기 — 채우기 핸들을 끌었을 때 무엇이 어떻게 늘어나는지"),
        ("", ""),
        ("h2", "이렇게 쓰세요"),
        ("", "1. 노란 칸이 나오면 직접 채워 봅니다."),
        ("", "2. 수식이 들어 있는 칸은 F2 를 눌러 안을 들여다봅니다."),
        ("", "3. 값이 0 으로 보이면  Ctrl + Alt + F9  (전체 다시 계산)."),
        ("note", "만든 목적 : 컴퓨터활용능력 필기·실기 수업 자료. 자료는 모두 지어낸 제조 현장 예시입니다."),
    ])

    # ── ① 셀참조
    ws = wb.create_sheet("① 셀참조")
    widths(ws, {"A": 14, "B": 12, "C": 12, "D": 12, "E": 12, "F": 12, "G": 3, "H": 46})
    title(ws, 1, "셀 참조 — 상대 · 절대($) · 혼합", span=8)
    note(ws, 2, "복사했을 때 주소가 따라 움직이면 상대참조, 고정되면 절대참조입니다. F4 키를 누르면 $ 가 순서대로 붙습니다.", span=8)

    put(ws, 4, ["부가세율", 0.1], fill=GREY, bold=True)
    ws.cell(row=4, column=2).number_format = "0%"

    hdr(ws, 6, ["자재명", "단가", "수량", "금액", "부가세(틀림)", "부가세(맞음)"])
    data = [("베어링 6204", 3200, 40), ("SM45C 환봉", 18500, 12), ("유압호스 1/2", 7400, 25), ("리니어 가이드", 96000, 4)]
    r = 7
    for name, price, qty in data:
        put(ws, r, [name, price, qty], fmt=None)
        ws.cell(row=r, column=2).number_format = "#,##0"
        ws.cell(row=r, column=4, value=f"=B{r}*C{r}").border = BORDER
        ws.cell(row=r, column=4).number_format = "#,##0"
        ws.cell(row=r, column=5, value=f"=D{r}*B4").border = BORDER      # 상대참조 → 아래로 가면 어긋남
        ws.cell(row=r, column=5).number_format = "#,##0"
        ws.cell(row=r, column=6, value=f"=D{r}*$B$4").border = BORDER    # 절대참조 → 항상 B4
        ws.cell(row=r, column=6).number_format = "#,##0"
        r += 1

    note(ws, 12, "E열은 =D7*B4 를 그냥 아래로 복사한 것입니다. 두 번째 줄부터 B5, B6 … 빈 칸을 가리켜 0 이 됩니다."
                 "  F열은 =D7*$B$4 — 세율 칸이 고정되어 끝까지 맞습니다.", span=8)

    title(ws, 14, "혼합참조로 구구단처럼 만드는 단가표", span=8)
    note(ws, 15, "가로줄의 수량과 세로줄의 단가를 곱합니다. 수식 하나를 =$A18*B$17 로 만들어 오른쪽·아래로 끌면 표 전체가 채워집니다.", span=8)
    put(ws, 17, ["단가\\수량", 10, 20, 50, 100], bold=True, fill=GREY, align="center")
    prices = [3200, 18500, 7400]
    r = 18
    for p in prices:
        ws.cell(row=r, column=1, value=p).number_format = "#,##0"
        ws.cell(row=r, column=1).border = BORDER
        ws.cell(row=r, column=1).font = Font(bold=True)
        for col in range(2, 6):
            cl = get_column_letter(col)
            c = ws.cell(row=r, column=col, value=f"=$A{r}*{cl}$17")
            c.number_format = "#,##0"; c.border = BORDER
        r += 1
    note(ws, 22, "직접 해보기 → C18 셀을 클릭하고 F2. $A18 의 A 앞에만 $ 가, B$17 의 17 앞에만 $ 가 붙은 것을 확인하세요.", span=8)

    # ── ② 오류값
    ws = wb.create_sheet("② 오류값")
    widths(ws, {"A": 14, "B": 14, "C": 30, "D": 46, "E": 34})
    title(ws, 1, "엑셀 오류값 7가지 — 진짜로 띄워 놓은 것", span=5)
    note(ws, 2, "필기에 그대로 나옵니다. 각 줄의 B열을 눌러 어떤 수식이 그 오류를 냈는지 확인하세요.", span=5)

    put(ws, 4, ["보조 자료", None, None, None, None], bold=True, fill=GREY)
    put(ws, 5, ["설비", "가동시간"], bold=True, fill=GREY)
    put(ws, 6, ["CNC-01", 7.5]); put(ws, 7, ["MCT-02", 0]); put(ws, 8, ["PRESS-03", 6.2])

    hdr(ws, 10, ["오류값", "실제 결과", "어떤 수식이 냈나", "무슨 뜻인가", "현장에서 흔한 원인"])
    rows = [
        ("#DIV/0!", "=100/B7",            "0 또는 빈 칸으로 나눴다",       "생산량이 0인 날 불량률을 계산할 때"),
        ("#N/A",    '=VLOOKUP("없는코드",A6:B8,2,FALSE)', "찾는 값이 표에 없다", "자재코드 오타 · 앞뒤 공백"),
        ("#VALUE!", '="수량"+1',          "숫자 자리에 글자가 들어갔다",   "숫자처럼 보이지만 실은 글자인 칸"),
        ("#NAME?",  "=SUMM(B6:B8)",       "함수 이름·이름정의를 못 알아본다", "함수 철자 오타 · 문자에 따옴표 빠짐"),
        ("#NUM!",   "=SQRT(-1)",          "계산이 불가능한 숫자",           "음수의 제곱근 · 결과가 너무 큼"),
        ("#REF!",   "=INDEX(B6:B8,9)",    "가리키던 셀이 사라졌다",         "참조하던 행·열·시트를 지웠을 때"),
        ("#NULL!",  "=SUM(A6:A8 D6:D8)",  "두 범위가 겹치는 곳이 없다",     "범위 사이 쉼표를 빠뜨리고 공백만 둠"),
    ]
    r = 11
    for name, formula, mean, cause in rows:
        put(ws, r, [name, None, None, mean, cause])
        ws.cell(row=r, column=1).font = Font(bold=True, color="C00000")
        c = ws.cell(row=r, column=2, value=formula)      # 진짜 수식 -> 오류가 실제로 뜸
        c.border = BORDER; c.alignment = Alignment(horizontal="center", vertical="center")
        c.font = Font(bold=True, color="C00000")
        lit(ws, r, 3, formula)                            # 같은 수식을 글자로
        ws.row_dimensions[r].height = 22
        r += 1

    note(ws, 19, "IFERROR(수식, \"대체값\") 로 감싸면 오류 대신 원하는 글자가 나옵니다. 아래 칸이 그 예입니다.", span=5)
    put(ws, 20, ["오류를 감싸면", None], bold=True)
    c = ws.cell(row=20, column=2, value='=IFERROR(100/B7,"측정불가")')
    c.border = BORDER; c.font = Font(bold=True, color="2E7D32")
    c.alignment = Alignment(horizontal="center", vertical="center")
    lit(ws, 20, 3, '=IFERROR(100/B7,"측정불가")')

    # ── ③ 표시형식
    ws = wb.create_sheet("③ 표시형식")
    widths(ws, {"A": 20, "B": 20, "C": 26, "D": 50})
    title(ws, 1, "표시 형식 — 값은 그대로, 보이는 모양만 바뀐다", span=4)
    note(ws, 2, "B열은 A열과 값이 똑같습니다. 서식만 다릅니다. 수식 입력줄을 보면 원래 값이 그대로 들어 있습니다.", span=4)
    hdr(ws, 4, ["원래 값", "서식을 준 모습", "서식 코드", "언제 쓰나"])
    fmts = [
        (1234567,   "#,##0",              "천 단위 쉼표"),
        (1234567,   '#,##0,"천원"',        "천 원 단위로 줄여 보이기 (생산 실적표)"),
        (0.0857,    "0.0%",               "불량률 · 달성률"),
        (0.0857,    "0.00E+00",           "아주 작은/큰 수 (지수)"),
        (45719,     "yyyy-mm-dd(aaa)",    "날짜에 요일까지 (점검일지)"),
        (45719,     "mm\"월\" dd\"일\"",     "한글 날짜"),
        (0.5208,    "h:mm AM/PM",         "시각 (교대 근무표)"),
        (-3500,     "#,##0;[Red]-#,##0",  "음수를 빨강으로 (재고 부족)"),
        (0,         '#,##0;-#,##0;"-"',   "0 을 대시로 (빈 실적)"),
        ("SF1023",  "@\"-A\"",            "글자 뒤에 고정 문자 붙이기"),
    ]
    r = 5
    for val, code, use in fmts:
        a = ws.cell(row=r, column=1, value=val); a.border = BORDER
        b = ws.cell(row=r, column=2, value=val); b.border = BORDER; b.number_format = code
        c = ws.cell(row=r, column=3, value=code); c.border = BORDER
        c.font = Font(name="Consolas", size=10); c.number_format = "@"
        d = ws.cell(row=r, column=4, value=use); d.border = BORDER
        r += 1
    note(ws, r + 1, "직접 해보기 → B열 아무 칸에서 Ctrl+1 (셀 서식) → 사용자 지정 을 열면 C열 코드가 그대로 들어 있습니다.", span=4)

    # ── ④ 연산자
    ws = wb.create_sheet("④ 연산자")
    widths(ws, {"A": 26, "B": 16, "C": 34, "D": 44})
    title(ws, 1, "연산자와 우선순위", span=4)
    put(ws, 3, ["샘플 값", "계획", "실적"], bold=True, fill=GREY)
    put(ws, 4, ["수량", 500, 460])
    hdr(ws, 6, ["수식", "결과", "종류", "설명"])
    ops = [
        ("=2+3*4",            "산술",   "곱하기가 먼저. 결과 14"),
        ("=(2+3)*4",          "산술",   "괄호가 가장 먼저. 결과 20"),
        ("=2^3",              "산술",   "거듭제곱. 우선순위는 곱하기보다 위"),
        ("=C4/B4",            "산술",   "달성률 (실적/계획)"),
        ("=C4>=B4",           "비교",   "참·거짓(TRUE/FALSE)으로 나옴"),
        ("=C4<>B4",           "비교",   "같지 않다"),
        ('=B4&"개 계획"',      "문자열", "& 로 글자를 이어 붙임"),
        ('="달성률 "&TEXT(C4/B4,"0.0%")', "문자열", "숫자에 서식을 입혀 글자로 붙이기"),
        ("=SUM(B4:C4)",       "참조(:)", "범위 — B4 부터 C4 까지"),
        ("=SUM(B4,C4)",       "참조(,)", "여러 곳을 합침"),
    ]
    r = 7
    for f, kind, desc in ops:
        lit(ws, r, 1, f)
        v = ws.cell(row=r, column=2, value=f); v.border = BORDER     # 진짜로 계산되는 칸
        v.alignment = Alignment(horizontal="center"); v.font = Font(bold=True, color="2E5C8A")
        put(ws, r, [None, None, kind, desc])
        r += 1
    note(ws, r + 1, "우선순위 :  ( )  →  ^  →  * /  →  + -  →  &  →  비교( = < > <= >= <> )", span=4)

    # ── ⑤ 이름정의
    ws = wb.create_sheet("⑤ 이름정의")
    widths(ws, {"A": 16, "B": 14, "C": 14, "D": 16, "E": 3, "F": 52})
    title(ws, 1, "이름 정의 — 범위에 별명 붙이기", span=6)
    note(ws, 2, "범위를 잡고 [수식] → [이름 정의]. 수식이 =SUM(B5:B10) 대신 =SUM(생산량) 이 되어 읽기 쉬워집니다.", span=6)
    hdr(ws, 4, ["일자", "생산량", "불량수", "가동시간"])
    vals = [("3/2", 460, 7, 7.5), ("3/3", 512, 4, 8.0), ("3/4", 488, 11, 7.8),
            ("3/5", 505, 6, 8.0), ("3/6", 473, 9, 7.2)]
    r = 5
    for d, p, f, t in vals:
        put(ws, r, [d, p, f, t]); r += 1
    ws.cell(row=10, column=1, value="합계").font = Font(bold=True)
    ws.cell(row=10, column=2, value="=SUM(생산량)").border = BORDER
    ws.cell(row=11, column=1, value="평균 불량수").font = Font(bold=True)
    ws.cell(row=11, column=2, value="=AVERAGE(불량수)").border = BORDER
    ws.cell(row=12, column=1, value="총 불량률").font = Font(bold=True)
    ws.cell(row=12, column=2, value="=SUM(불량수)/SUM(생산량)").border = BORDER
    ws.cell(row=12, column=2).number_format = "0.00%"
    from openpyxl.workbook.defined_name import DefinedName
    wb.defined_names.add(DefinedName("생산량", attr_text="'⑤ 이름정의'!$B$5:$B$9"))
    wb.defined_names.add(DefinedName("불량수", attr_text="'⑤ 이름정의'!$C$5:$C$9"))
    ws.cell(row=4, column=6, value="이미 정의해 둔 이름 : 생산량(B5:B9) · 불량수(C5:C9)").font = Font(size=10, color="806000")
    ws.cell(row=5, column=6, value="[수식] → [이름 관리자] 에서 확인할 수 있습니다.").font = Font(size=10, color="806000")
    ws.cell(row=7, column=6, value="직접 해보기 : D5:D9 를 잡고 이름을 '가동시간' 으로 정의한 뒤").font = Font(size=10)
    c8 = ws.cell(row=8, column=6, value="아래 노란 칸에 =AVERAGE(가동시간) 을 입력해 보세요.")
    c8.data_type = "s"; c8.font = Font(size=10)
    ws.cell(row=14, column=1, value="평균 가동시간").font = Font(bold=True)
    blank(ws, 14, [2])

    # ── ⑥ 자동채우기
    ws = wb.create_sheet("⑥ 자동채우기")
    widths(ws, {"A": 22, "B": 16, "C": 16, "D": 16, "E": 16, "F": 46})
    title(ws, 1, "채우기 핸들 — 끌면 무엇이 늘어나는가", span=6)
    note(ws, 2, "칸 오른쪽 아래 작은 네모(채우기 핸들)를 오른쪽으로 끌어 보세요. 노란 칸이 채워집니다.", span=6)
    hdr(ws, 4, ["시작 값", "끌면?", "", "", "", "이렇게 됩니다"])
    cases = [
        ("1반",        "1반 → 2반 → 3반 … 숫자가 붙은 글자는 숫자가 늘어남"),
        (1,            "숫자 하나만 끌면 그대로 복사. Ctrl 을 누른 채 끌면 1씩 증가"),
        ("월",          "월 → 화 → 수 … 요일은 엑셀이 알고 있는 목록"),
        ("1월",        "1월 → 2월 → 3월 … "),
        ("A공정-01",   "A공정-01 → A공정-02 … 맨 끝 숫자가 늘어남"),
    ]
    r = 5
    for start, expl in cases:
        put(ws, r, [start], align="center", bold=True)
        blank(ws, r, [2, 3, 4, 5])
        ws.cell(row=r, column=6, value=expl).font = Font(size=10)
        r += 1
    put(ws, r + 1, ["10", "20"], align="center", bold=True)
    blank(ws, r + 1, [3, 4, 5])
    ws.cell(row=r + 1, column=6, value="두 칸을 함께 잡고 끌면 그 간격(10씩)으로 늘어납니다.").font = Font(size=10)

    return wb
