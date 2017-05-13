#!/usr/bin/python
# Define setup() that initializes GPIO, and sample() that samples data

from datetime import datetime
import RPi.GPIO as GPIO

gpioPort = 0

def setup(inputPort):
   global gpioPort
   gpioPort = inputPort

   GPIO.setmode(GPIO.BCM)
   GPIO.setup(gpioPort, GPIO.IN, GPIO.PUD_DOWN)

def sample():
   global gpioPort
   data = {}

   currentState = GPIO.input(gpioPort)

   time = datetime.now().isoformat(' ')

   data['motionTime'] = time
   data['motionDetected'] = currentState

   return data
