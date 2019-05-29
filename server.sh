#! /bin/bash
##
## (C) 2019 - Marco Patander
##
## This file is part of ScoutPOS. ScoutPOS is released
## under the GPLv3 only for non-profit organizations.
## For other businesses contact the mantainers.
## 
## ScoutPOS server launch script
##

SCRIPTDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source $SCRIPTDIR/server-env/bin/activate
$SCRIPTDIR/server.py 2> >(grep -v '"GET /status HTTP/1.1" 200')


