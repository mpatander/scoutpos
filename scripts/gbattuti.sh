#! /bin/bash

data=$(mktemp)

for f in $@; do
  zgrep '>>>' $f | awk '{ print int($2/1000000000) }'
done > $data

gnuplot -persist <<- EOFMarker
  set title 'Tortafritta 2019 - Scontrini battuti'
  binwidth=900
  bin(x,width)=width*floor(x/width)
  set xdata time
  set xtic rotate by -45 scale 0
  set format x '%H:%M'
  set term png
  set output 'shopBattuti.png'
  plot '$data' using (bin(\$1+2*3600,binwidth)):(1.0) smooth freq with boxes title 'Scontrini battuti'
EOFMarker


rm $data
