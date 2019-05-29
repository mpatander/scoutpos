#! /usr/bin/env python3
##
## (C) 2019 - Marco Patander
##
## This file is part of ScoutPOS. ScoutPOS is released
## under the GPLv3 only for non-profit organizations.
## For other businesses contact the mantainers.
## 
## ScoutPOS server
##
##

import time
import sys
import json
from collections import OrderedDict, deque

import pepos
from pepos import FileThermalPrinter, DummyThermalPrinter
printer = FileThermalPrinter('/dev/usb/lp0')
#printer = FileThermalPrinter('/tmp/test')

#from pepos import DummyThermalPrinter
#printer = DummyThermalPrinter()

logo_agesci = pepos.read_hex_bytes('logo_agesci.h')
logo_w = 384
logo_h = 128

def build_order(item):
  order = {}
  for element in item['order']:
    count = int(element['count'])
    if count == 0: continue
    if 'items' in element['what']:
      for e in element['what']['items'].values():
        w = e['what']
        es = order.setdefault(w['cat'],{})
        k = (w['name'],w['cost'])
        es.setdefault(k,0)
        es[k] += int(e['count'])*count
    else:
      e = element
      w = e['what']
      es = order.setdefault(w['cat'],{})
      k = (w['name'],w['cost'])
      es.setdefault(k,0)
      es[k] += count
  return order

def receipt_print(item,order):
  req_counter = '{:06}'.format(item['req_id'])
  total = float(item['total'])
  bill = float(item['bill'])
  income = float(item['income'])
  change = float(item['change'])
  
  printer.ensureOpen()
  printer.text_align_center()
  printer.print_image(logo_w,logo_h,logo_agesci)
  printer.vspace(1)
  printer.write('AGESCI Gruppo Scout Sorbolo 1\nTortafritta 2019\n')
  printer.text_align_left()
  printer.text_hline()
  printer.writeln((' '*(printer.settings['width']-5)) + 'EURO ');
  for element in item['order']:
    count = int(element['count'])
    if count == 0: continue
    what = element['what']
    unit_cost = float(what['cost'])
    printer.writeln( '{:s} {:20.18s} {:6.2f}'.format('{:2d}x'.format(count) if count > 1 else '   ',
                                                     what['name'], unit_cost*count) )
  printer.text_hline()
  printer.text_double_width()
  printer.text_emphasis()
  hspace_size = printer.settings['width']-6-6-3
  hspace = (' '*(2))
  printer.writeln( ('TOTALE '+hspace+' {:6.2f}' ).format(total) )
  printer.text_emphasis(False)
  printer.text_double_width(False)
  hspace = (' '*hspace_size)
  printer.writeln( ('PAGATO '+hspace+' {:6.2f}').format(income) )
  #printer.writeln( ('RESTO  '+hspace+' {:6.2f}').format(change) )
  printer.text_hline()
  printer.text_align_center()
  printer.writeln('GRAZIE')
  printer.text_align_right()
  printer.writeln(req_counter)
  printer.text_align_left()
  printer.vspace(1)
  
  
  printer.cut_and_feed(1)
  #cdq = deque([2])
  
  #start tickets
  for cat in sorted(order.keys()):
    cc = order[cat]
    if not cc:
      continue
    for (name,cost) in cc:
      count = cc[(name,cost)]
      printer.writeln('{:3d}x {:s}'.format(count,name))
    printer.text_align_right()
    printer.writeln(req_counter)
    printer.text_align_left()
    printer.cut_and_feed(1)
  # done tickets
  
  
  #printer.vspace(3)
  
  ##start tickets
  #for cat in sorted(order.keys()):
    #cc = order[cat]
    #printer.vspace(1)
    #printer.cut()
    #for (name,cost) in cc:
      #count = cc[(name,cost)]
      #printer.writeln('{:3d}x {:s}\n'.format(count,name))
    
  
  ## end tickets
  #printer.vspace(1)
  #printer.cut()
  #printer.vspace(4)
  ## done tickets
  
  printer.flush()
  if isinstance(printer,DummyThermalPrinter):
    time.sleep(2)
  
  
  


def receipt_log(item):
  #out = sys.stdout
  out = receipts_storage
  out.write('>>> {:d}\n'.format(int(time.time()*1000)))
  for element in item['order']:
    what = element['what']
    count = int(element['count'])
    unit_cost = float(what['cost'])
    out.write('<-- {:7d} {:2d} {:5d} "{:s}" \'{:s}\'\n'.format(
            int(count*unit_cost*100),count,int(unit_cost*100),
            what['name'],
            json.dumps(what['items']) if ('items' in what) else ''
          )
        )
  out.write('<<< {:d} {:d}\n'.format(
            int(float(item['total'])*100),int(float(item['bill']*100))
          )
        )
  out.flush()


import threading
pantry_lock = threading.Lock()
remapped_items = {}


def handle_request(item):
  print('Handling '+str(item))
  order = build_order(item)
  delta = { k[0]: v for d in order.values() for k,v in d.items() }
  pantry_lock.acquire()
  for k, v in delta.items():
    k = remapped_items.get(k,k)
    pantry.setdefault(k,0)
    pantry[k] -= v
  pantry_lock.release()
  receipt_log(item)
  receipt_print(item,order)
  print('Done item '+str(item))
  


#from Queue import Queue
from queue import Queue

class AtomicInteger():
  def __init__(self, value=0):
    self._value = value
    self._lock = threading.Lock()
  
  def inc(self):
    with self._lock:
      self._value += 1
      return self._value
  
  def dec(self):
    with self._lock:
      self._value -= 1
      return self._value
  
  @property
  def value(self):
    with self._lock:
      return self._value
  
  @value.setter
  def value(self, v):
    with self._lock:
      self._value = v
      return self._value


requests_queue = Queue()
request_gid = AtomicInteger()


def process_requests():
  while True:
    item = requests_queue.get()
    if item is None:
      break
    handle_request(item)
    requests_queue.task_done()


from flask import Flask, request, send_from_directory, render_template, jsonify

import os
#from filelock import FileLock
import gzip


server = Flask(__name__,
            static_url_path='',
            static_folder='web/build'
           )


@server.route('/')
def root():
  return server.send_static_file('index.html')

@server.route('/status')
def send_status():
  pantry_lock.acquire()
  response = jsonify(in_queue=requests_queue.qsize(),pantry=pantry)
  pantry_lock.release()
  response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, public, max-age=0"
  response.headers["Expires"] = 0
  response.headers["Pragma"] = "no-cache"
  #print(response.get_data())
  return response

@server.route('/confirm',methods=['POST'])
def process_order():
  curr_request = request.get_json()
  curr_request['req_id'] = request_gid.inc()
  requests_queue.put(curr_request)
  return jsonify(req_id=curr_request['req_id'])

@server.route("/hello")
def hello():
  return "Hello World!"


if __name__ == "__main__":
  receipts_storage_filename = 'receiptsdb.txt.gz'
  pantry_storage_filename = 'pantry.json'
  req_counter_filename = 'gid.txt'
  with open(server.static_folder+'/price_list.json') as f:
    j = json.load(f)
    for item in j:
      if 'count_as' in item:
        remapped_items[item['name']] = item['count_as']
  try:
    with open(req_counter_filename,'r') as f:
      request_gid.value = int(f.read())
  except FileNotFoundError:
    print('gid file not found')
    pass
  if os.path.isfile(pantry_storage_filename):
    with open(pantry_storage_filename,'r') as f:
      pantry = json.load(f)
  else:
    pantry = {}
  #try:
    #with FileLock(receipts_storage_filename+'.lock',timeout=1):
  if 1:
    if 1:
      with gzip.open(receipts_storage_filename,'at') as receipts_storage:
        thx = threading.Thread(target=process_requests)
        thx.start()
        server.run(host='0.0.0.0')
        print('Tearing down, please wait')
        requests_queue.put(None)
        thx.join()
        
        printer.ensureClosed()
        
        with open(pantry_storage_filename,'w') as f:
          json.dump(pantry,f,indent=2)
        with open(req_counter_filename,'w') as f:
          f.write(str(request_gid.value)+'\n')
        
        print('Goodbye')
  #except filelock.Timeout:
    #print('Server already running')
  
  

