#! /usr/bin/env python3
##
## (C) 2019 - Marco Patander
## 
## This file is part of ScoutPOS. ScoutPOS is released
## under the GPLv3 only for non-profit organizations.
## For other businesses contact the mantainers.
## 
## pEPOS: pico ESC/POS thermal printer handling
## 
## Motivation: thermal printer handling routines,
## with minimal dependencies
##


ESC = b'\x1B'
GS  = b'\x1D'
LF  = b'\x0A' # \n
class EscPosProtocol:
  ALIGN_LEFT   = b'\x00'
  ALIGN_CENTER = b'\x01'
  ALIGN_RIGHT  = b'\x02'
  IMAGE_MODE_NORMAL       = b'\x00'
  IMAGE_MODE_DOUBLEWIDTH  = b'\x01'
  IMAGE_MODE_DOUBLEHEIGHT = b'\x02'
  IMAGE_MODE_QUADRUPLE    = b'\x03'
  TEXT_MODE_NORMAL        = b'\x00'
  TEXT_MODE_EMPHASIS      = b'\x08'
  TEXT_MODE_DOUBLEHEIGHT  = b'\x10'
  TEXT_MODE_DOUBLEWIDTH   = b'\x20'
  TEXT_MODE_UNDERLINE     = b'\x80'
  @staticmethod
  def init():
    return ESC + b'@'
  @staticmethod
  def fini():
    return ''
  @staticmethod
  def vspace(n):
    return ESC + b'd' + bytes([n])
  @staticmethod
  def text_alignment(alignment):
    return ESC + b'a' + alignment
  @staticmethod
  def text_mode(mode):
    return ESC + b'!' + mode
  @staticmethod
  def text_reverse_color(enable):
    return GS + b'b' + (b'\x01' if enable else b'\x00')
  @staticmethod
  def print_image(width,height,image_bytes_str):
    assert width  < 524288
    assert height < 524288
    mode = b'0'
    return GS + b'v' + b'0' + mode + bytes([(width//8)%256,width//2048,height%256,height//256]) + image_bytes_str
  @staticmethod
  def cut(partial):
    return GS + b'V' + (b'\x01' if partial else b'\x00')
  @staticmethod
  def cut_and_feed(lines):
    return GS + b'V' + b'\x42' + bytes([lines])
  @staticmethod
  def text(string):
    return string.encode('utf-8')
  @staticmethod
  def text_line(string):
    return EscPosProtocol.text(string) + LF
  
class AbstractThermalPrinter:
  def write(self,string):
    self._ensureTextModeFlushed()
    self.raw_print(EscPosProtocol.text(string))
  def writeln(self,string):
    self._ensureTextModeFlushed()
    self.raw_print(EscPosProtocol.text_line(string))
  def cut(self):
    self.raw_print(EscPosProtocol.cut(self.settings['partial_cut']))
  def cut_and_feed(self,lines):
    self.raw_print(EscPosProtocol.cut_and_feed(lines))
  def flush(self):
    self.raw_flush()
  def vspace(self,n):
    self.raw_print(EscPosProtocol.vspace(n))
  def print_image(self,w,h,buffer_str):
    self._ensureTextModeFlushed()
    self.raw_print(EscPosProtocol.print_image(w,h,buffer_str))
  def text_hline(self):
    self.writeln('-'*self.settings['width'])
  def text_align_left(self):
    self.desiredTextAlign = EscPosProtocol.ALIGN_LEFT
  def text_align_center(self):
    self.desiredTextAlign = EscPosProtocol.ALIGN_CENTER
  def text_align_right(self):
    self.desiredTextAlign = EscPosProtocol.ALIGN_RIGHT
  def text_color_reversed(self,enable=True):
    if self.textColorReversed != enable:
      self.textColorReversed = enable
      self.textColorReversedChanged = True
  def text_normal(self):
    self.desiredTextMode = EscPosProtocol.TEXT_MODE_NORMAL
    self.desiredTextAlign = EscPosProtocol.ALIGN_LEFT
    self.desiredTextColorReverse = False
  @staticmethod
  def _byteflagset(val,flagval,flagbit):
    return bytes([ x|y for x,y in zip(flagval,flagbit) ] if val else [ x&~y for x,y in zip(flagval,flagbit) ])
  def text_emphasis(self,enable=True):
    self.desiredTextMode = self._byteflagset(enable,self.desiredTextMode,EscPosProtocol.TEXT_MODE_EMPHASIS)
  def text_double_height(self,enable=True):
    self.desiredTextMode = self._byteflagset(enable,self.desiredTextMode,EscPosProtocol.TEXT_MODE_DOUBLEHEIGHT)
  def text_double_width(self,enable=True):
    self.desiredTextMode = self._byteflagset(enable,self.desiredTextMode,EscPosProtocol.TEXT_MODE_DOUBLEWIDTH)
  def text_underline(self,enable=True):
    self.desiredTextMode = self._byteflagset(enable,self.desiredTextMode,EscPosProtocol.TEXT_MODE_UNDERLINE)
  
  def reset_settings_to_default(self):
    self.settings = {
        'partial_cut': True,
        'width': 32
      }
  def _init(self):
    self.raw_print(EscPosProtocol.init())
    self.currentTextMode = EscPosProtocol.TEXT_MODE_NORMAL
    self.currentTextAlign = EscPosProtocol.ALIGN_LEFT
    self.currentTextColorReverse = False
    self.text_normal()
  def _fini(self):
    self.raw_print(EscPosProtocol.fini())
  def _ensureTextModeFlushed(self):
    if self.currentTextMode != self.desiredTextMode:
      self.raw_print(EscPosProtocol.text_mode(self.desiredTextMode))
      self.currentTextMode = self.desiredTextMode
    if self.currentTextAlign != self.desiredTextAlign:
      self.raw_print(EscPosProtocol.text_alignment(self.desiredTextAlign))
      self.currentTextAlign = self.desiredTextAlign
    if self.currentTextColorReverse != self.desiredTextColorReverse:
      self.raw_print(EscPosProtocol.text_reverse_color(self.desiredTextColorReverse))
      self.currentTextColorReverse = self.desiredTextColorReverse
    

class FileThermalPrinter(AbstractThermalPrinter):
  def __init__(self,fname):
    self.fname = fname
    self.isOpen = False
    self.reset_settings_to_default()
  def __del__(self):
    self.ensureClosed()
  
  
  def raw_print(self,string):
    if string:
      self.ensureOpen()
      self.f.write(string)
  
  def raw_flush(self):
    if self.isOpen:
      self.f.flush()
  
  
  def __enter__(self):
    self.ensureOpen()
    return self
  def __exit__(self, t, v, tb):
    self.ensureClosed()
  
  def ensureOpen(self):
    if not self.isOpen:
      self.f = open(self.fname,'wb')
      self.isOpen = True
      self._init()
  def ensureClosed(self):
    if self.isOpen:
      self._fini()
      self.f.close()
      self.isOpen = False
    


class DummyThermalPrinter(AbstractThermalPrinter):
  def __init__(self):
    self.reset_settings_to_default()
    self._init()
  def __del__(self):
    self._fini()
  
  def raw_print(self,string):
    pass
  def raw_flush(self):
    pass
  
  def ensureOpen(self):
    pass
  def ensureClosed(self):
    pass
  
  
def read_hex_bytes(filename):
  bs = []
  with open(filename,'r') as f:
    for l in f:
      bs.extend([ int(x.strip(),16) for x in l.split(',') if x.strip() ])
  return bytes(bs)

