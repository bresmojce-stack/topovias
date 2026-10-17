#!/bin/bash
# usage: lo_cmp.sh file.xlsx  -> recalcs with LibreOffice and compares every formula cell with the app value
D=$(dirname $0); P=$(cd $D; pwd)/loprof
f=$1; rm -rf $D/lo/$(basename $f); mkdir -p $D/lo
timeout 180 soffice -env:UserInstallation=file://$P --headless --convert-to xlsx:"Calc MS Excel 2007 XML" --outdir $D/lo $f >/dev/null 2>&1
python3 -W ignore - ${2:-$f} $D/lo/$(basename $f) <<'PY'
import openpyxl, sys
a=openpyxl.load_workbook(sys.argv[1]); av=openpyxl.load_workbook(sys.argv[1],data_only=True); lv=openpyxl.load_workbook(sys.argv[2],data_only=True)
n=bad=0
for ws in a.worksheets:
  for row in ws.iter_rows():
    for c in row:
      if isinstance(c.value,str) and c.value.startswith('='):
        n+=1; x=av[ws.title][c.coordinate].value; y=lv[ws.title][c.coordinate].value
        if not (isinstance(x,(int,float)) and isinstance(y,(int,float)) and abs(x-y)<0.0006):
          bad+=1
          if bad<15: print('  X',ws.title,c.coordinate,c.value,'app=',x,'LO=',y)
print(f'{n} formulas, {bad} differ')
PY
