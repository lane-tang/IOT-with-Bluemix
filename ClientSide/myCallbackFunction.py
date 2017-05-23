#!/usr/bin/python
import RPi.GPIO as GPIO
import os, json

gpioPort = 0

def ledSetup(inputPort):
    global gpioPort
    gpioPort = inputPort
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(gpioPort, GPIO.OUT)


def ledCallback(cmd):
    global gpioPort
    if cmd.event == "light":
        payload = json.loads(cmd.payload)
        command = payload["command"]
        print command
        if command == "on":
            GPIO.output(gpioPort, True)
        elif command == "off":
            GPIO.output(gpioPort, False)
