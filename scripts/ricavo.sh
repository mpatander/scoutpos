#! /bin/bash

zgrep '<<<' $@ | awk '{ print $2 }' | paste -sd+ - | awk '{ print "scale=2; (" $0 ")/100" }' | bc -l




