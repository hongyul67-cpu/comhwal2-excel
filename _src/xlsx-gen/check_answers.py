# -*- coding: utf-8 -*-
"""모범답안을 실제로 셀에 넣어 값이 나오는지(오류가 아닌지) 확인"""
import sys, os
sys.stdout.reconfigure(encoding='utf-8')
import win32com.client as w

def run(path, plan):
    x = w.DispatchEx('Excel.Application'); x.Visible=False; x.DisplayAlerts=False
    bad = 0
    try:
        wb = x.Workbooks.Open(os.path.abspath(path), UpdateLinks=0)
        for sheet, cells in plan:
            sh = wb.Worksheets(sheet)
            for addr, f in cells:
                sh.Range(addr).Formula = f
        x.CalculateFullRebuild()
        print('='*72); print(os.path.basename(path))
        for sheet, cells in plan:
            sh = wb.Worksheets(sheet)
            for addr, f in cells:
                t = sh.Range(addr).Text
                mark = ''
                if isinstance(t,str) and t.startswith('#'): mark = '  <<< 오류'; bad += 1
                print(f'  {sheet}!{addr:<6} {f[:52]:<54} => {t}{mark}')
        wb.Close(SaveChanges=False)
    finally:
        x.Quit()
    return bad

b = 0
# ── 2급 01
p2 = 'out/2급_01_계산작업_생산일보_v1.xlsx'
표 = []
for r in range(5, 20):
    표 += [(f'I{r}', f'=ROUND(F{r}/E{r}*100,1)'),
           (f'J{r}', f'=IF(I{r}>=100,"달성","미달")'),
           (f'K{r}', f'=ROUND(G{r}/F{r}*100,2)'),
           (f'L{r}', f'=VLOOKUP(C{r},$O$5:$Q$8,3,FALSE)'),
           (f'M{r}', f'=F{r}*L{r}')]
집계 = list(zip([f'E{r}' for r in range(23,38)], [
 '=SUM(F5:F19)','=ROUND(AVERAGE(H5:H19),1)','=MAX(F5:F19)','=LARGE(F5:F19,3)',
 '=SUMIF($B$5:$B$19,"A",$F$5:$F$19)','=AVERAGEIF($B$5:$B$19,"A",$G$5:$G$19)',
 '=COUNTIF(G5:G19,">=10")','=COUNTA(B5:B19)','=LEFT(C5,2)','=RIGHT(C5,2)',
 '=B5&"라인"','=MONTH(A5)','=WEEKDAY(A5,2)','=DAYS(A19,A5)','=RANK.EQ(F5,$F$5:$F$19)']))
db = list(zip([f'I{r}' for r in range(18,23)], [
 '=DSUM(생산일보!$A$4:$M$19,"생산수량",A5:A6)',
 '=DAVERAGE(생산일보!$A$4:$M$19,"불량수",A5:A6)',
 '=DCOUNT(생산일보!$A$4:$M$19,"불량수",A9:A10)',
 '=DMAX(생산일보!$A$4:$M$19,"생산수량",A9:A10)',
 '=DMIN(생산일보!$A$4:$M$19,"작업시간",A13:B14)']))
b += run(p2, [('생산일보', 표[:5] + 집계), ('DB함수', db)])

# ── 1급 01
p1 = 'out/1급_01_계산작업_공정품질_v1.xlsx'
표1 = [('H5','=F5/E5'), ('I5','=IFS(H5<1%,"A",H5<3%,"B",H5<5%,"C",TRUE,"D")'),
       ('J5','=IF(AND(G5>=49.95,G5<=50.05),"합격","불합격")'), ('K5','=MID(B5,5,2)'),
       ('H14','=F14/E14'), ('I14','=IFS(H14<1%,"A",H14<3%,"B",H14<5%,"C",TRUE,"D")')]
집계1 = list(zip([f'E{r}' for r in range(29,43)], [
 '=SUM((C5:C24="가공")*F5:F24)',
 '=SUM((C5:C24="가공")*(F5:F24>=10))',
 '=AVERAGE(IF(C5:C24="조립",E5:E24))',
 '=MAX(IF(D5:D24="김현수",F5:F24))',
 '=SUMPRODUCT((C5:C24="조립")*(D5:D24="박지훈")*E5:E24)',
 '=INDEX(B5:B24,MATCH(MAX(F5:F24),F5:F24,0))',
 '=COUNTIF(G5:G24,">50.05")+COUNTIF(G5:G24,"<49.95")',
 '=ROUND(STDEV.S(G5:G24),4)',
 '=LARGE(E5:E24,1)+LARGE(E5:E24,2)+LARGE(E5:E24,3)',
 '=VLOOKUP(H5,$M$5:$N$8,2,TRUE)',
 '=RIGHT(B5,1)','=ROUNDUP(MONTH(A5)/3,0)','=DAYS(A24,A5)',
 '=ROUND(AVERAGEIF(C5:C24,"가공",H5:H24)*100,2)&"%"']))
db1 = list(zip([f'I{r}' for r in range(23,28)], [
 '=DSUM(품질검사!$A$4:$K$24,"불량수",A5:A6)',
 '=DAVERAGE(품질검사!$A$4:$K$24,"검사수량",A5:A6)',
 '=DCOUNT(품질검사!$A$4:$K$24,"불량수",A9:A10)',
 '=DMAX(품질검사!$A$4:$K$24,"불량수",A13:B14)',
 '=DMIN(품질검사!$A$4:$K$24,"측정값(mm)",A13:B14)']))
b += run(p1, [('품질검사', 표1 + 집계1), ('DB·조건', db1)])

# ── 2급 04 / 1급 03 비율 칸
b += run('out/2급_04_기타작업_차트매크로_v1.xlsx',
         [('월별실적', [('E4','=D4/C4'), ('F4','=C4/B4')])])
b += run('out/1급_03_기타작업_차트매크로_v1.xlsx',
         [('설비가동', [('D4','=B4/(B4+C4)')])])
b += run('out/2급_02_기본작업_자재입출고_v1.xlsx',
         [('자재입출고', [('H4','=F4*G4')])])
print('\n오류 칸 수 :', b)
