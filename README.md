This is my graduation project - a simple Internet of things(IOT) system based on the Raspberry Pi.   
I use IBM Bluemix cloud computing platform to build this project, if you want to learn more about Bluemix, please visit: [IBM Bluemix](https://www.ibm.com/cloud-computing/bluemix/) .The project is divided into three parts: the client side, the server side, the Android App.The user can obtain the data of sensors which connected to the local device in the browser or the mobile application, also can control the LED light switch.

## Client side

Circuit shown as  follow:   
![](./circuit.png)  
I use Python programming on local device ,and connect to the Bluemix server through [MQTT](https://en.wikipedia.org/wiki/MQTT) Protocol.

## Server side.

The server uses Node.js, then connect to the IBM IOT service via the `ibmoitf` component to obtain local sensor data.I use `socket.io` to achieve real-time communication with front-end pages.   
Accessed via browser:   
![](./pc.jpg)


## Mobile application

I use [`socket.io-client-java`](https://github.com/socketio/socket.io-client-java) to connect to the Node.js server, similar to the front page.   
Application Runs:   
![](mobile.png)

[中文版](./README-zh.md)