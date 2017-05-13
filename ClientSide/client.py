#!/usr/bin/python
# This is only executed on the device client e.g. Raspberry Pi
import time
import os, json
import ibmiotf.application
import uuid
import myCallbackFunction
import motionSensor
import tempSensor

client = None

motionSensorGPIOPort = 4
ledGPIOPort = 17

try:
    options = ibmiotf.application.ParseConfigFile("/home/pi/device.cfg")
    options["deviceId"] = options["id"]
    options["id"] = "aaa" + options["id"]
    client = ibmiotf.application.Client(options)
    print "try to connect to IoT"
    client.connect()
    print "connect to IoT successfully"

    myCallbackFunction.ledSetup(ledGPIOPort)
    client.deviceEventCallback = myCallbackFunction.ledCallback
    client.subscribeToDeviceEvents(event="light")

    motionStatus = False
    motionSensor.setup(motionSensorGPIOPort)

    tempSensor.setup(27)

    while True:
        motionData = motionSensor.sample()

        if motionData['motionDetected'] != motionStatus:
            motionStatus = motionData['motionDetected']
            client.publishEvent("raspberrypi", options["deviceId"], "motionSensor", "json", motionData)

            print "Change in motion detector status, motionDetected is now: ", motionStatus

        tempData = tempSensor.sample()
        client.publishEvent("raspberrypi", options["deviceId"], "temperatureSensor", "json", tempData)

        time.sleep(1)

except ibmiotf.ConnectionException as e:
    print e
