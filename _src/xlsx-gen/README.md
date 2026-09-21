# 엑셀 예제파일 만드는 스크립트

`files/*.xlsx` 와 1급 저장소(`comhwal-excel`)의 `files/*.xlsx` 를 여기서 한 번에 굽습니다.
파일을 손으로 고치지 말고 **이 스크립트를 고쳐서 다시 구우세요.**

```bash
python gen_2.py out        # 2급 4종
python gen_1.py out        # 1급 3종
python -c "import sys;sys.path.insert(0,'.');from gen_00_theory import build;from gen_common import save;save(build(),'out/00_엑셀이론체험_v1.xlsx')"
python deploy_files.py     # out/ 을 두 저장소의 files/ 로 복사 + excel-files.html 다시 생성
```

| 파일 | 하는 일 |
|---|---|
| `gen_common.py` | 머리글·노란 칸·미션표·정답표·인쇄 설정 같은 공통 조각 |
| `gen_00_theory.py` | 필기 이론 체험 (셀참조·오류값 7종·표시형식·연산자·이름정의·자동채우기) |
| `gen_2.py` | 2급 ①계산 ②기본 ③분석 ④기타 |
| `gen_1.py` | 1급 ①계산(배열) ②분석(피벗·데이터표) ③기타(차트·VBA) |
| `deploy_files.py` | 두 저장소로 복사 + 내려받기 페이지 생성 (파일 설명·미션 목록이 여기 있음) |
| `check_answers.py` | **정답 검산** — 모범답안을 엑셀 COM 으로 실제 셀에 넣어 값이 나오는지 확인 |

## 걸렸던 것

- 표시 형식에 한글 색 이름 `[빨강]` 을 쓰면 **엑셀이 파일을 못 엽니다.** `[Red]` 로 써야 합니다(화면에는 [빨강]으로 보임).
- openpyxl 은 `=` 로 시작하는 글자를 무조건 수식으로 봅니다. 수식을 *글자로* 보여 줄 칸은
  `cell.data_type = "s"` (`gen_common.lit()`) 로 넣습니다.
- 이 PC 의 엑셀은 **배열 수식에 Ctrl+Shift+Enter 가 필요한 버전**입니다.
  `=SUM((조건)*범위)` 를 그냥 Enter 로 넣으면 `#VALUE!` 가 납니다 — 파일 안내문에 그렇게 적어 두었습니다.
- 파일 이름은 **영문**으로 저장합니다(깃허브 Pages 주소 안전). 한글 이름은 `<a download="...">` 로 붙입니다.
