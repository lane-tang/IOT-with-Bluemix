#!/usr/bin/python
# It samples the data from the motion sensor every half second

import motionSensor
import json
import time

gpioPort = 4
motionSensor.setup(gpioPort)

while True:
 time.sleep(1)
 try:
     motionData = motionSensor.sample()
     jsonData = json.dumps(motionData)
     print "Current motion sensor data:", jsonData
 except Exception as e:
     print "Uh oh, exception!", e

