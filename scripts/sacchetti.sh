#! /bin/sh

zgrep 'Menu\|Torta' receiptsdb.txt.gz | awk '{ sum+=$3; print sum }' | tail -n 1
