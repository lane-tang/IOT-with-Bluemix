// =====================================
// Get the packages we need ============
// =====================================
var express = require('express');
var exphbs = require('express-handlebars');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var passport = require('passport');
var flash = require('connect-flash');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var Client = require('ibmiotf').IotfApplication;
var MongoClient = require("mongodb").MongoClient;
var cfenv = require('cfenv');

var index = require('./routes/index');
var dashboard = require('./routes/dashboard');
var api = require('./routes/api');

require('./controller/passport');
// ===========================================
// Set up some tools and middleware  =========
// ===========================================

// Setup socket.io
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

// view engine setup
app.engine('hbs', exphbs({defaultLayout: 'layout', extname: '.hbs'}));
app.set('view engine', 'hbs');

// setup middleware

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(session({
    secret: 'some random string',
    saveUninitialized: false,
    cookie: {maxAge: 180 * 60 * 1000},
    resave: false
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session({
    secret: 'cookie_secret',
    name: 'cookie_name',
    saveUninitialized: false,
    resave: false
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
    res.locals.login = req.isAuthenticated();
    res.locals.session = req.session;
    next();
});

// ==================================================
// Connect to IBM MQTT Borker, and get data =========
// ==================================================

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// get deviceId, this should added by yourself as an environment variable
var deviceId = cfenv.getAppEnv(DEVICE_ID);

// this iot service credentials
var iotCredentials;

// IoT platform service name
var iotPlatformServiceName = 'iot-python';

//Loop through configuration internally defined in Bluemix and retrieve the credential from the IoT service
var baseConfig = appEnv.getServices(iotPlatformServiceName);


// this mongodb service credentials
var mongodbCredentials;

// IoT mongodb platform service name
var mongodbServiceName = 'iot-mongo-database';

//Loop through configuration internally defined in Bluemix and retrieve the credential from the mongodb service
var mongodbConfig = appEnv.getServices(mongodbServiceName);

/**
 * Local vcap_service.json ported from VCAP_SERVICES defined as Environment Variables on your Bluemix dashboard.
 * but the vcap_service stored in Bluemix is different.
 */
// setup iot service credentials and mongodb credentials var vcap_service.json file
if ((!baseConfig || Object.keys(baseConfig).length === 0)
    || (!mongodbConfig || Object.keys(mongodbConfig).length === 0)) {
    var configJSON = require('./vcap_service.json');

    configJSON["iotf-service"].forEach(function (entry) {
        if (entry.name === iotPlatformServiceName) {
            iotCredentials = entry;
        }
    });

    configJSON['compose-for-mongodb'].forEach(function (entry) {
        if(entry.name === mongodbServiceName) {
            mongodbCredentials = entry
        }
    });
}
/**
 * VCAP_SERVICES stored in Bluemix, its JSON format is different than VCAP_SERVICES.
 */
else {
    iotCredentials = baseConfig[iotPlatformServiceName];
    mongodbCredentials = mongodbConfig[mongodbServiceName];
}

// console.log('iot config is ' + JSON.stringify(iotCredentials));
// console.log(':=====================:');
// console.log('mongodb config is ' + JSON.stringify(mongodbCredentials));

// setup iot server config to connect to MQTT server
var iotAppConfig = {
    "org": iotCredentials.credentials.org,
    // ID has to be unique,
    // https://docs.internetofthings.ibmcloud.com/applications/mqtt.html#/mqtt-client-identifier#mqtt-client-identifier
    "id": Date.now().toString(),
    "auth-method": "apikey",
    "auth-key": iotCredentials.credentials.apiKey,
    "auth-token": iotCredentials.credentials.apiToken
};

// connect to IBM MQTT server
var appClient = new Client(iotAppConfig);

appClient.connect();
console.log("Successfully connected to our IoT service!");


// connect to mongodb server, you can get sample code at:
// https://github.com/IBM-Bluemix/compose-mongodb-helloworld-nodejs

// Within the credentials, an entry ca_certificate_base64 contains the SSL pinning key
// We convert that from a string into a Buffer entry in an array which we use when
// connecting.
var ca = [new Buffer(mongodbCredentials.credentials.ca_certificate_base64, 'base64')];

// This is a global variable we'll use for handing the MongoDB client around
var mongodb;

// This is the MongoDB connection. From the application environment, we got the
// credentials and the credentials contain a URI for the database. Here, we
// connect to that URI, and also pass a number of SSL settings to the
// call. Among those SSL settings is the SSL CA, into which we pass the array
// wrapped and now decoded ca_certificate_base64,
MongoClient.connect(mongodbCredentials.credentials.uri, {
        mongos: {
            ssl: true,
            sslValidate: true,
            sslCA: ca,
            poolSize: 1,
            reconnectTries: 1
        }
    },
    function(err, db) {
        // Here we handle the async response. This is a simple example and
        // we're not going to inject the database connection into the
        // middleware, just save it in a global variable, as long as there
        // isn't an error.
        if (err) {
            console.log(err);
        } else {
            // Although we have a connection, it's to the "admin" database
            // of MongoDB deployment. In this example, we want the
            // "examples" database so what we do here is create that
            // connection using the current connection.
            mongodb = db.db("raspberry-pi");
            console.log("Successfully connected to our MongoDB service!");
        }
    }
);

// ==================================================
// subscribe or publish an specific event ===========
// ==================================================

// subscribe to input events
appClient.on("connect", function () {
    console.log("subscribe to input events");
    appClient.subscribeToDeviceEvents("raspberrypi");
});

// get device events, we need to initialize this JSON doc with an attribute
var temperatureSensorData = {"temperaturePayload": {}};
var motionSensorData = {"motionPayload": {}};
var raspderyPiData = {"payload": {}};

// deviceType "raspberrypi" and eventType "temperatureSensor", "motionSensor" are
// published by client.py on RaspberryPi
appClient.on("deviceEvent", function (deviceType, deviceId, eventType, format, payload) {
    if (eventType === 'status') {
        raspderyPiData.payload = JSON.parse(payload);

        // get Raspberry Pi device dtatus data.
        var deviceData = raspderyPiData.payload.d;
        io.emit('device-status', deviceData);
    } else if (eventType === 'temperatureSensor') {
        // get temperature data
        temperatureSensorData.temperaturePayload = JSON.parse(payload);
        var tempData = temperatureSensorData.temperaturePayload;

        // emit temperature data to socket.io
        io.emit('temperature-sensor', tempData);

        // save temperature data to mongodb
        mongodb.collection("data").insertOne( {
            sensorType: 'temperatureSensor',
            payload: tempData
        }, function (error, result) {
            if(error) {
                console.log(error);
            } else {
                console.log(result);
            }
        });

    } else if (eventType === 'motionSensor') {
        // get motion event data
        motionSensorData.motionPayload = JSON.parse(payload);
        var motionData = motionSensorData.motionPayload;

        // emit motion sensor data to socket.io
        io.emit('motion-sensor', motionData);

        // save motion sensor data to mongodb
        mongodb.collection("data").insertOne( {
            sensorType: 'motionSensor',
            payload: motionData
        }, function (error, result) {
            if(error) {
                console.log(error);
            } else {
                console.log(result);
            }
        });

    }
    else {
        console.log("Event type: " + eventType);
    }
});

io.on('connection', function (socket) {
    // once connect subscribe to light event which will been emit when corresponding button are clicked
    socket.on('light', function (data) {
        console.log(data);
        var control = {
            'command': data
        };
        appClient.publishDeviceEvent("raspberrypi", deviceId, "light", "json", control);
    });
});

// =======================
// Use routes  ===========
// =======================

app.use('/api', api);
app.use('/dashboard', dashboard);
app.use('/', index);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = {app: app, server: server};
