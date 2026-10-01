# 컴활 2급 실기 · 함수 연습소

미니 워크시트에 **함수를 직접 입력**하면 자체 수식 엔진(`engine.js`)이 **실제로 계산해서 채점**합니다.
모범답안과 다른 수식이어도 **결과값이 같으면 정답**입니다.

## 연습 범위
논리(IF) · 통계 · 조건부 집계 · 수학/반올림 · 문자열 · 찾기/참조 · **데이터베이스 함수** · 날짜

2급 출제범위에 없는 **배열 수식은 제외**했고, 대신 2급 범위인 **DSUM·DAVERAGE·DCOUNT·DMAX·DMIN**을 넣었습니다.

## 지원 함수
IF, AND, OR, NOT, IFERROR / SUM, AVERAGE, AVERAGEA, MAX, MIN, LARGE, SMALL, MEDIAN, MODE.SNGL, STDEV.S, VAR.S,
COUNT, COUNTA, COUNTBLANK, COUNTIF, SUMIF, AVERAGEIF, RANK.EQ /
ROUND, ROUNDUP, ROUNDDOWN, TRUNC, INT, ABS, MOD, POWER, PRODUCT /
LEFT, RIGHT, MID, LEN, UPPER, LOWER, PROPER, TRIM, REPLACE, FIND, SEARCH, CONCAT, & /
VLOOKUP, HLOOKUP, INDEX, MATCH, CHOOSE /
DSUM, DAVERAGE, DCOUNT, DCOUNTA, DMAX, DMIN /
YEAR, MONTH, DAY, DAYS, DATE, WEEKDAY, HOUR, MINUTE, SECOND, TIME

## 웹은 한 문제씩, 여러 문제는 엑셀로
- **여러 명 표 + 채우기 핸들** — 문제 60개는 표에 5~8명이 있어 첫 칸에 수식을 넣고 ■ 를 끌어내린다(두 번 누르면 끝까지).
  칸마다 채점하고, 틀린 칸에 실제로 들어간 수식(주소가 내려간 모양)을 보여 준다. `refshift.js` 가 엑셀처럼 주소를 옮긴다.
  여러 명 데이터는 `data/fill.js` (경계값 일부러 포함 — 딱 160점 등).
- **범위별 엑셀** `files/fx/` 8개 — 웹과 같은 번호·표·칸 주소. 시작 화면 범위 칩 아래·문제 풀이 뒤에 내려받기 링크.
- **실전 모의고사** `files/mock/` 3회 — 웹 '실전 모드'를 대신한다. 만드는 법은 `_src/xlsx-gen/README.md`.

## 구조
```
index.html      UI
app.js          진행/채점 흐름
engine.js       수식 파서 + 계산 엔진 (window.XLEngine)
data/problems.js 연습문제 (+ problems-plus.js, fill.js 순서로 로드)
refshift.js     채우기 핸들 — 수식 주소 옮기기 (엑셀 굽는 스크립트도 같이 씀)
```

## 엔진 테스트
브라우저가 engine.js를 강하게 캐시하므로 Node로 검증하는 편이 확실합니다.
```bash
node -e "const fs=require('fs');global.window={};eval(fs.readFileSync('engine.js','utf8'));\
eval(fs.readFileSync('data/problems.js','utf8'));\
window.XL_PROBLEMS.forEach(p=>console.log(p.id,JSON.stringify(window.XLEngine.evaluate(p.answer,p.grid))))"
```

## 📖 먼저 배우기 · 그림 (2026-10-01)
- 시작 화면 맨 위 「📖 먼저 배우기」 — 수업 슬라이드 원고(`lesson.js`)의 요점을 그림과 함께 보여 준다(정답을 다 보여 주는 화면).
- 그림은 `figs.js` 한 곳(29장 · 카드 28장 중 26장). 공용 도우미는 `https://hongyul67-cpu.github.io/links/fig.js` (사본 두지 않음).
- 수업 슬라이드 25장이 같은 그림을 쓴다. `slide:'q'` 그림은 퀴즈 답이 되는 이름표를 `?` 로 가린다.
- 그림을 고칠 때: `cards` 는 `lesson.js` 의 제목과 글자까지 같아야 한다. 계산 결과는 엔진으로 다시 확인.
