# -*- coding: utf-8 -*-
"""만든 xlsx 를 각 저장소의 files/ 로 복사하고 내려받기 페이지를 만든다"""
import sys, os, shutil, pathlib, html
sys.stdout.reconfigure(encoding='utf-8')

ROOT = pathlib.Path(r"C:\Users\user\Desktop\claude code")
OUT  = pathlib.Path(__file__).parent / "out"

THEORY = dict(
    src="00_엑셀이론체험_v1.xlsx", name="excel-theory-basics.xlsx",
    dl="엑셀이론_체험_v1.xlsx",
    title="⓪ 엑셀 이론 체험  <span class='tag tag-t'>필기·실기 공통</span>",
    desc="필기에서 글자로만 외우는 것을 실제로 눌러 보는 파일입니다. 오류값 7가지가 진짜로 떠 있고, "
         "상대·절대·혼합 참조가 나란히 들어 있습니다.",
    sheets="읽어보기 · ① 셀참조 · ② 오류값 · ③ 표시형식 · ④ 연산자 · ⑤ 이름정의 · ⑥ 자동채우기",
    missions=["$ 를 붙인 칸과 안 붙인 칸이 왜 다른 값이 되는지 확인하기",
              "#DIV/0! #N/A #VALUE! #NAME? #NUM! #REF! #NULL! 이 각각 어떤 수식에서 나오는지 보기",
              "같은 숫자에 서식만 바꿔 천원 단위·요일·빨간 음수로 보이게 하기",
              "범위에 이름을 붙이고 =AVERAGE(가동시간) 처럼 써 보기"])

G2 = [
    dict(src="2급_01_계산작업_생산일보_v1.xlsx", name="g2-01-func-production.xlsx",
         dl="2급_01_계산작업_생산일보_v1.xlsx",
         title="① 계산작업 — 생산일보 <span class='tag'>함수</span>",
         desc="라인별 하루 생산 실적입니다. 표의 노란 열 5개와 아래쪽 집계 15문제, "
              "데이터베이스 함수 5문제를 풉니다.",
         sheets="읽어보기 · 생산일보 · DB함수 · 정답·해설",
         missions=["달성률·판정·불량률 — ROUND · IF",
                   "단가 찾아오기 — VLOOKUP (표는 $ 로 고정)",
                   "A라인만 더하기·평균 — SUMIF · AVERAGEIF · COUNTIF",
                   "제품코드 자르기 — LEFT · RIGHT · &",
                   "조건 표를 만들어 DSUM · DAVERAGE · DCOUNT · DMAX · DMIN"]),
    dict(src="2급_02_기본작업_자재입출고_v1.xlsx", name="g2-02-basic-inventory.xlsx",
         dl="2급_02_기본작업_자재입출고_v1.xlsx",
         title="② 기본작업 — 자재 입출고 <span class='tag tag-b'>서식·필터</span>",
         desc="자재 입출고 대장 30건. 실기 1번 문제에서 나오는 서식·조건부 서식·고급 필터·"
              "유효성 검사를 한 장에서 연습합니다.",
         sheets="읽어보기 · 자재입출고 · 고급필터 · 목록 · 미션 · 정답·해설",
         missions=["제목 만들기 — 병합하고 가운데 맞춤",
                   '전표번호 뒤에 "호" 붙이기 — 사용자 지정 표시 형식',
                   "수량 100 이상인 행 전체 칠하기 — 조건부 서식(수식)",
                   "조건 범위를 만들어 고급 필터로 뽑아내기",
                   "데이터 유효성 검사 목록 · 틀 고정"]),
    dict(src="2급_03_분석작업_설비점검_v1.xlsx", name="g2-03-analysis-maintenance.xlsx",
         dl="2급_03_분석작업_설비점검_v1.xlsx",
         title="③ 분석작업 — 설비 점검 이력 <span class='tag tag-a'>부분합·피벗</span>",
         desc="설비 점검 기록 40건과 작은 원가 모형. 부분합·피벗·목표값 찾기·시나리오를 연습합니다.",
         sheets="읽어보기 · 점검이력 · 원가모형 · 미션 · 정답·해설",
         missions=["공정별 부분합 (정렬을 먼저!)",
                   "부분합 하나 더 덧붙이기 — '새로운 값으로 대치' 해제",
                   "피벗 테이블 — 행 공정 · 열 점검구분 · 값 수리비용",
                   "목표값 찾기 — 개당 원가를 6,000원으로 맞추려면 몇 개 만들어야 하나",
                   "시나리오 — 불량률 1%·3%·6% 요약표"]),
    dict(src="2급_04_기타작업_차트매크로_v1.xlsx", name="g2-04-chart-macro.xlsx",
         dl="2급_04_기타작업_차트매크로_v1.xlsx",
         title="④ 기타작업 — 차트 · 매크로 · 인쇄 <span class='tag tag-c'>차트</span>",
         desc="월별 생산 실적 12개월과 60행짜리 긴 표. 차트·매크로·페이지 설정을 연습합니다.",
         sheets="읽어보기 · 월별실적 · 인쇄연습 · 미션 · 정답·해설",
         missions=["묶은 세로 막대 차트 만들고 제목·레이블 붙이기",
                   "불량률을 꺾은선 보조 축으로 — 콤보 차트",
                   "너비 1페이지·가로 방향·머리글 반복 인쇄 설정",
                   "매크로 기록해 단추에 연결하기 (저장은 .xlsm)"]),
]

G1 = [
    dict(src="1급_01_계산작업_공정품질_v1.xlsx", name="g1-01-func-quality.xlsx",
         dl="1급_01_계산작업_공정품질_v1.xlsx",
         title="① 계산작업 — 공정 품질검사 <span class='tag'>배열 수식</span>",
         desc="검사 기록 20건. 1급의 고비인 배열 수식·다중 조건·INDEX+MATCH 를 집중해서 풉니다. "
              "집계 14문제 + 데이터베이스 함수 5문제.",
         sheets="읽어보기 · 품질검사 · DB·조건 · 정답·해설",
         missions=["배열 수식 — =SUM((조건)*범위) 로 조건에 맞는 것만 더하기",
                   "AVERAGE(IF(...)) · MAX(IF(...)) — Ctrl+Shift+Enter",
                   "SUMPRODUCT 로 조건 두 개 한꺼번에",
                   "INDEX + MATCH — 가장 불량이 많았던 로트 찾기",
                   "IFS 로 등급 매기기 · VLOOKUP 근사값(TRUE)",
                   "DSUM · DAVERAGE · DCOUNT · DMAX · DMIN 과 수식 조건"]),
    dict(src="1급_02_분석작업_출하실적_v1.xlsx", name="g1-02-analysis-shipment.xlsx",
         dl="1급_02_분석작업_출하실적_v1.xlsx",
         title="② 분석작업 — 출하 실적 <span class='tag tag-a'>피벗·데이터 표</span>",
         desc="출하 기록 48건과 분기별 요약표 3개, 손익 모형. 1급에서 더 나오는 피벗 그룹화·"
              "계산 필드·데이터 표·통합을 연습합니다.",
         sheets="읽어보기 · 출하실적 · 통합대상 · 데이터표 · 미션 · 정답·해설",
         missions=["피벗 — 날짜를 분기로 그룹화",
                   "피벗 계산 필드 (금액÷수량) · 값 표시 형식 '열 합계 비율'",
                   "데이터 → 통합 으로 분기별 표 3개 합치기",
                   "1변수·2변수 데이터 표 (행 입력 셀 · 열 입력 셀)",
                   "중복된 항목 제거 · 두 기준 정렬"]),
    dict(src="1급_03_기타작업_차트매크로_v1.xlsx", name="g1-03-chart-macro.xlsx",
         dl="1급_03_기타작업_차트매크로_v1.xlsx",
         title="③ 기타작업 — 차트 · 매크로 · 사용자 정의 함수 <span class='tag tag-c'>VBA</span>",
         desc="설비 가동·보전 실적 12개월. 콤보 차트와 추세선, 양식 컨트롤, 그리고 VBA 로 "
              "직접 만드는 사용자 정의 함수까지.",
         sheets="읽어보기 · 설비가동 · 양식 · 미션 · 정답·해설",
         missions=["콤보 차트 + 보조 축 + 추세선",
                   "한 점에만 데이터 레이블 달기",
                   "옵션 단추를 셀에 연결하고 INDEX 로 받아 쓰기",
                   "매크로 기록 → 단추 연결",
                   "Function ~ End Function 으로 '불량률' 함수 만들기"]),
]

PAGE = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<style>
  :root{{
    --bg:#0f1220; --card:#1f2440; --card2:#262c4e; --line:#333a63;
    --tx:#eef1ff; --tx2:#a6adcf; --pri:#4f7cff; --pri2:#6f95ff;
    --ok:#27c093; --gold:#ffd23f; --sh:0 10px 30px rgba(0,0,0,.35);
  }}
  *{{box-sizing:border-box;-webkit-tap-highlight-color:transparent}}
  body{{margin:0;font-family:'Segoe UI',system-ui,-apple-system,'Malgun Gothic',sans-serif;
    background:radial-gradient(1000px 600px at 70% -10%,#20264a 0,transparent 60%),var(--bg);
    color:var(--tx);min-height:100vh}}
  .wrap{{max-width:860px;margin:0 auto;padding:16px 16px 60px}}
  .hero{{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:24px;box-shadow:var(--sh)}}
  .badge{{display:inline-block;background:linear-gradient(135deg,var(--pri),#9d6bff);
    color:#fff;font-size:12px;padding:3px 10px;border-radius:8px;font-weight:700;margin-bottom:8px}}
  h1{{font-size:22px;margin:6px 0 10px}}
  h2{{font-size:15px;color:var(--tx2);font-weight:600;margin:22px 2px 10px}}
  .lead{{color:var(--tx2);font-size:14px;line-height:1.75}}
  .lead b{{color:var(--tx)}}
  .steps{{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}}
  .step{{flex:1;min-width:150px;background:var(--card2);border:1px solid var(--line);
    border-radius:12px;padding:12px 14px;font-size:13px;line-height:1.6;color:var(--tx2)}}
  .step b{{display:block;color:var(--gold);font-size:13px;margin-bottom:4px}}
  .fcard{{background:var(--card);border:1px solid var(--line);border-radius:16px;
    padding:18px 20px;margin-bottom:14px;box-shadow:var(--sh)}}
  .fcard h3{{font-size:17px;margin:0 0 8px;font-weight:800}}
  .tag{{display:inline-block;background:rgba(79,124,255,.22);color:var(--pri2);font-size:11px;
    padding:2px 8px;border-radius:6px;font-weight:700;vertical-align:middle;margin-left:6px}}
  .tag-b{{background:rgba(255,178,32,.2);color:#ffc75a}}
  .tag-a{{background:rgba(39,192,147,.2);color:#5fe0bb}}
  .tag-c{{background:rgba(157,107,255,.22);color:#bb9bff}}
  .tag-t{{background:rgba(255,210,63,.2);color:var(--gold)}}
  .fdesc{{font-size:14px;color:var(--tx2);line-height:1.7;margin-bottom:10px}}
  .sheets{{font-size:12px;color:var(--tx2);background:var(--card2);border-radius:9px;
    padding:8px 12px;margin-bottom:12px;font-family:'Consolas',monospace}}
  ul.miss{{margin:0 0 14px;padding-left:20px;font-size:13.5px;line-height:1.85;color:var(--tx2)}}
  ul.miss li::marker{{color:var(--pri2)}}
  .dl{{display:inline-flex;align-items:center;gap:8px;background:var(--pri);color:#fff;
    text-decoration:none;border-radius:11px;padding:12px 18px;font-size:15px;font-weight:700;
    transition:.12s}}
  .dl:hover{{background:var(--pri2)}} .dl:active{{transform:scale(.97)}}
  .fsize{{font-size:12px;color:var(--tx2);margin-left:10px}}
  .note{{font-size:13px;color:var(--tx2);line-height:1.8;background:var(--card2);border-radius:12px;
    padding:14px 16px;margin-top:14px;border-left:4px solid var(--ok)}}
  .note b{{color:var(--tx)}}
  .back{{display:inline-block;margin-bottom:14px;color:var(--tx2);text-decoration:none;font-size:14px;
    background:var(--card2);border:1px solid var(--line);border-radius:10px;padding:9px 14px}}
  .back:hover{{color:var(--tx);border-color:var(--pri)}}
  .footer{{text-align:center;color:var(--tx2);font-size:12px;margin-top:26px;line-height:1.8}}
</style>
</head>
<body>
<div class="wrap">
  <a class="back" href="index.html">← 연습소로 돌아가기</a>

  <div class="hero">
    <div class="badge">{badge}</div>
    <h1>엑셀 예제파일 내려받기</h1>
    <div class="lead">
      웹에서 푸는 연습소와 달리, 이 파일들은 <b>진짜 엑셀에서 직접 해 보는</b> 자료입니다.<br>
      <b>노란 칸</b>이 여러분이 채울 자리이고, 각 파일 안에 <b>미션</b>과 <b>정답·해설</b> 시트가 함께 들어 있습니다.<br>
      자료는 모두 <b>제조 현장</b>(생산일보 · 자재 입출고 · 설비 점검 · 공정 품질)을 소재로 만들었습니다.
    </div>
    <div class="steps">
      <div class="step"><b>1 · 내려받기</b>아래 파란 단추를 누르면 바로 저장됩니다.</div>
      <div class="step"><b>2 · 열기</b>엑셀에서 열고 첫 시트 [읽어보기] 를 먼저 봅니다.</div>
      <div class="step"><b>3 · 채우기</b>노란 칸에 <code>=</code> 로 시작해 수식을 입력합니다.</div>
      <div class="step"><b>4 · 맞춰보기</b>막히면 [정답·해설] 시트를 엽니다.</div>
    </div>
  </div>

  <h2>파일 목록</h2>
{cards}

  <div class="note">
    <b>값이 0 으로만 보일 때</b> — <code>Ctrl + Alt + F9</code> 를 누르면 전체가 다시 계산됩니다.<br>
    <b>[배열] 문제</b> — 수식을 다 쓴 뒤 그냥 Enter 가 아니라 <code>Ctrl + Shift + Enter</code> 로 마칩니다.
    제대로 들어가면 수식 양옆에 중괄호 <code>{{ }}</code> 가 저절로 붙습니다(직접 타이핑하면 안 됩니다).<br>
    <b>매크로를 넣었다면</b> — 저장할 때 형식을 <b>Excel 매크로 사용 통합 문서 (*.xlsm)</b> 로 바꿔야 매크로가 남습니다.<br>
    <b>휴대폰에서는</b> — 파일은 받아지지만 엑셀 앱이 있어야 열립니다. 함수 연습은 웹 연습소가 더 편합니다.
  </div>

  <div class="footer">
    모든 자료는 수업용으로 지어낸 것입니다 · 인쇄는 가로 방향 · 너비 1페이지로 이미 맞춰 두었습니다
  </div>
</div>
<script src="https://hongyul67-cpu.github.io/links/backbar.js"></script>
</body>
</html>
"""

CARD = """  <div class="fcard">
    <h3>{title}</h3>
    <div class="fdesc">{desc}</div>
    <div class="sheets">시트 : {sheets}</div>
    <ul class="miss">
{missions}
    </ul>
    <a class="dl" href="files/{name}" download="{dl}">⬇ 내려받기</a>
    <span class="fsize">{size} KB · xlsx</span>
  </div>
"""


def build(repo_folder, badge, page_title, items):
    repo = ROOT / repo_folder
    fdir = repo / "files"
    fdir.mkdir(exist_ok=True)
    cards = []
    for it in items:
        src = OUT / it["src"]
        dst = fdir / it["name"]
        shutil.copyfile(src, dst)
        kb = round(dst.stat().st_size / 1024)
        cards.append(CARD.format(
            title=it["title"], desc=html.escape(it["desc"]),
            sheets=html.escape(it["sheets"]), name=it["name"], dl=it["dl"], size=kb,
            missions="\n".join(f"      <li>{html.escape(m)}</li>" for m in it["missions"])))
    page = PAGE.format(title=page_title, badge=badge, cards="".join(cards))
    (repo / "excel-files.html").write_text(page, encoding="utf-8")
    print(f"[{repo_folder}] files/ {len(items)}개 · excel-files.html 생성")


build("컴활2급 실기 엑셀함수", "컴퓨터활용능력 2급", "컴활 2급 · 엑셀 예제파일", [THEORY] + G2)
build("컴활1급 실기 엑셀함수", "컴퓨터활용능력 1급", "컴활 1급 · 엑셀 예제파일", [THEORY] + G1)
print("완료")
