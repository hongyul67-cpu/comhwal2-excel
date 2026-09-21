# -*- coding: utf-8 -*-
"""예제 워크북 전부 굽기 —  python build.py out"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from gen_common import save

out = sys.argv[1] if len(sys.argv) > 1 else "out"
only = sys.argv[2] if len(sys.argv) > 2 else ""

import gen_00_theory, gen_2, gen_2b

JOBS = [
    ("00", lambda: gen_00_theory.build(), "00_엑셀이론체험_v2.xlsx"),
    ("2-1", gen_2.wb_01,  "2급_01_계산작업_생산일보_v2.xlsx"),
    ("2-2", gen_2b.wb_02, "2급_02_기본작업_자재입출고_v2.xlsx"),
    ("2-3", gen_2b.wb_03, "2급_03_분석작업_설비점검_v2.xlsx"),
    ("2-4", gen_2b.wb_04, "2급_04_기타작업_차트매크로_v2.xlsx"),
]
try:
    import gen_1, gen_1b
    JOBS += [
        ("1-1", gen_1.wb_01,  "1급_01_계산작업_공정품질_v2.xlsx"),
        ("1-2", gen_1b.wb_02, "1급_02_분석작업_출하실적_v2.xlsx"),
        ("1-3", gen_1b.wb_03, "1급_03_기타작업_차트매크로_v2.xlsx"),
    ]
except ImportError as e:
    print("(1급은 아직:", e, ")")

for key, fn, name in JOBS:
    if only and not key.startswith(only):
        continue
    save(fn(), os.path.join(out, name))
