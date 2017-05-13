#!/usr/bin/python
# Define setup() that initializes GPIO, and sample() that samples data

from datetime import datetime
import Adafruit_DHT

gpioPort = 0

def setup(inputPort):
    global gpioPort
    gpioPort = inputPort

def sample():
    global gpioPort
    data = {}

    time = datetime.now().isoformat(' ')
    data['tempTime'] = time

    humidity, temperature = Adafruit_DHT.read_retry(11, gpioPort) #GPIO Port (BCM notation)
    data['humidity'] = humidity
    data['temperature'] = temperature

    return data
