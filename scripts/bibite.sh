#! /bin/bash

for f in $@; do
  zgrep 'Refill' $f
done
