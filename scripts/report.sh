#! /bin/bash

(
echo '```'
bash scripts/coperti.sh receiptsdb.txt.gz
echo
echo -n "RICAVO TOTALE: "
bash scripts/ricavo.sh receiptsdb.txt.gz
echo '```'
bash scripts/gbattuti.sh receiptsdb.txt.gz
echo "![Grafico scontrini battuti](shopBattuti.png)"
) | pandoc -f markdown -t latex - -o report.pdf
