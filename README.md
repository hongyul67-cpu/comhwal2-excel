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

## 구조
```
index.html      UI
app.js          진행/채점 흐름
engine.js       수식 파서 + 계산 엔진 (window.XLEngine)
data/problems.js 연습문제
```

## 엔진 테스트
브라우저가 engine.js를 강하게 캐시하므로 Node로 검증하는 편이 확실합니다.
```bash
node -e "const fs=require('fs');global.window={};eval(fs.readFileSync('engine.js','utf8'));\
eval(fs.readFileSync('data/problems.js','utf8'));\
window.XL_PROBLEMS.forEach(p=>console.log(p.id,JSON.stringify(window.XLEngine.evaluate(p.answer,p.grid))))"
```
