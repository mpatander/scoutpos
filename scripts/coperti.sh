#! /bin/bash

echo -n "Coperti: "
zgrep 'Coperto' $@ | awk '{ print $3 }' | paste -sd+ - | bc -l

echo
echo -n "Menù: "
zgrep 'Menu' $@ | awk '{ print $3 }' | paste -sd+ - | bc -l
echo -n "  di cui acqua: "
zgrep "Menu' acqua" $@ | awk '{ print $3 }' | paste -sd+ - | bc -l
echo -n "  di cui bibita: "
zgrep "Menu' bibita" $@ | awk '{ print $3 }' | paste -sd+ - | bc -l
echo -n "  di cui birra: "
zgrep "Menu' birra" $@ | awk '{ print $3 }' | paste -sd+ - | bc -l
echo -n "  di cui vino: "
zgrep "Menu' vino" $@ | awk '{ print $3 }' | paste -sd+ - | bc -l

echo
echo -n "Sacchetti di tortafritta (fuori menù): "
zgrep 'Tortafritta' $@ | awk '{ print $3 }' | paste -sd+ - | bc -l
echo -n "Salumi (fuori menù): "
zgrep 'Salumi' $@ | awk '{ print $3 }' | paste -sd+ - | bc -l
echo -n "Dolci (fuori menù): "
zgrep 'Dolce' $@ | awk '{ print $3 }' | paste -sd+ - | bc -l
echo -n "Yogurt venduti bianchi (fuori menù): "
zgrep 'Yogurt bianco' $@ | awk '{ print $3 }' | paste -sd+ - | bc -l


echo
echo -n "Acqua (fuori menù): "
zgrep 'Acqua' $@ | awk '{ print $3 }' | paste -sd+ - | bc -l
echo -n "Bibite (fuori menù): "
zgrep 'Bibita' $@ | awk '{ print $3 }' | paste -sd+ - | bc -l
echo -n " + refill: "
zgrep 'Refill bibita' $@ | awk '{ print $3 }' | paste -sd+ - | bc -l
echo -n "Birra (fuori menù): "
zgrep 'Birra' $@ | awk '{ print $3 }' | paste -sd+ - | bc -l
echo -n " + refill: "
zgrep 'Refill birra' $@ | awk '{ print $3 }' | paste -sd+ - | bc -l
echo -n "Caffè: "
zgrep 'Caffe' $@ | awk '{ print $3 }' | paste -sd+ - | bc -l
echo -n "Vino bicchieri: "
zgrep 'Vino bicchiere' $@ | awk '{ print $3 }' | paste -sd+ - | bc -l
echo -n " + refill: "
zgrep 'Refill vino' $@ | awk '{ print $3 }' | paste -sd+ - | bc -l
echo -n "Vino bottiglie: "
zgrep 'Bottiglia vino' $@ | awk '{ print $3 }' | paste -sd+ - | bc -l




