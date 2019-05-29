SCOUTPOS - a simple point-of-sale app
=====================================

The software is licensed under GPLv3
**only for non-profit organizations**.
For other businesses contact the mantainers.

The AGESCI logo belongs to the AGESCI association
and is a registered mark.

This app has been made to make a Point-of-Sale
for a local scout event (tortafritta-based dinner).
It provides a user interface and enqueues requests
on the server controlling a thermal printer.

The application must be of immediate use for the cashiers,
so the user interface will be in italian.

First-time installation is detailed in the INSTALL file.

For quick development of the UI part you can use `npm start`.
But for real usage (thermal printer control) you will need the flask
server (`server.py`) - you can start it with `server.sh` - and if
you modify the js application remember to run `npm run build`
to update the served version.

This is my first application with react-materialui-flask and some
time since I programmed in JS, it changed so much these years.
It started as an improvement over the 2018 version: that one was in C
from command-line and didn't allow thermal printer sharing.
Here we can print from multiple connected browsers: the server will
handle the simultaneous requests.

## Requirements / features
 - [x] Cashier's desk controls - add to order and buy
 - [x] Cashier's desk controls - remove from order or clear
 - [x] Compute bill, ask paid amount and compute change
 - [x] Generate receipt with thermal printer
 - [x] Generate log to compute selling stats
 - [x] Handle multiple cashiers thermal printer sharing
 - [x] Add new items on-the-fly (edit `price_list.json` and refresh)
 - [x] waiters' tickets by category
 - [x] pantry countdown
 - [ ] Bill manual override (do we want it?)
 - [ ] cancel order
 - [ ] waiters' frontend page (list of orders to be served)


## TODO list:
 - [ ] UI improvement (layout,icons...)
 - [ ] hotkeys (if possible)
 - [ ] code refactoring






