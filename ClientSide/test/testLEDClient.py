import time
import ibmiotf.application
import uuid
import myCallbackFunction

client = None
ledPort = 17

try:
    options = ibmiotf.application.ParseConfigFile("/home/pi/device.cfg")
    options["deviceId"] = options["id"]
    options["id"] = "aaa" + options["id"]
    client = ibmiotf.application.Client(options)
    print "Try to connect to IOT"
    client.connect()
    print "connect to IOT successfully"

    myCallbackFunction.ledSetup(ledPort)
    client.deviceEventCallback = myCallbackFunction.ledCallback
    client.subscribeToDeviceEvents(event="light")

    while True:
        print "no event"
        time.sleep(2)

except ibmiotf.ConnectionException  as e:
    print e

finally:
    GPIO.cleanup()

