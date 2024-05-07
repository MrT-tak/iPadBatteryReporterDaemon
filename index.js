console.info("Welcome to SIBRD \n school ipad battery reporter daemon")

const express = require('express')
const app = new express();
const uuid = require('uuid');
const date = require('date');
//const AccessLogger = require('access-logger');
const yargs = require('yargs');
//const alert = require('alert');
//const notify = require("node-notifier")
//var FFI = require('node-ffi');
// ES6 syntax: import koffi from 'koffi';
const koffi = require('koffi');

// Load the shared library
const lib = koffi.load('user32.dll');

// Declare constants
const MB_OK = 0x0;
const MB_YESNO = 0x4;
const MB_ICONQUESTION = 0x20;
const MB_ICONINFORMATION = 0x40;
const IDOK = 1;
const IDYES = 6;
const IDNO = 7;

// Find functions
const MessageBoxW = lib.func('__stdcall', 'MessageBoxW', 'int', ['void *', 'str16', 'str16', 'uint']);




const argv = yargs
    .option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: 'Enable verbose output',
    })
    .option('debug', {
        alias: 'd',
        type: 'boolean',
        description: 'Enable debug output'
    })
    .option('sensitive-ip-console-logging', {
        alias: 'sicl',
        type: 'boolean',
        description: 'Enable sensitive ip logging, requires debug mode and verbose logging'
    })
    .option('port', {
        alias: 'p',
        type: 'number',
        description: 'Changes default port'
    })
    .help()
    .argv;

console.log('Verbose mode:', argv.verbose);

var accessLog = []

function AccessLogger(req, res, next) {
    var accessTimestapUUID = uuid.v1()
    var accessUUID = uuid.v4();
    console.log('Accessed to ' + req.path)
    console.log('Logged as: ' + accessUUID)
    res.locals.accessUUID = accessUUID;
    res.locals.accessDate = Date.now();

    var accessData = {};
    accessData[accessTimestapUUID] = {
        [accessUUID]: {
            ip: req.ip,
            forwardedfor: req.headers['X-Forwarded-For'],
            req,
            timestamp: Date.now()
        }
    }

    accessLog.push(accessData);
    next()
}

app.use(AccessLogger)

app.get("/favicon.ico", async function (req, res) {
    try {
        const fetchRes = await fetch("https://mrt-tak.github.io/favicon.ico");
        if (!fetchRes.ok) {
            res.status(500)
            throw new Error(`Failed to fetch favicon: ${fetchRes.status}`);
        }

        const faviconData = await fetchRes.arrayBuffer(); // Assuming favicon is an image
        res.contentType("image/x-icon"); // Set appropriate content type
        res.send(faviconData);
    } catch (error) {
        console.error("Error fetching favicon:", error);
        res.sendStatus(500); // Send internal server error
    }
});

app.get("/:batteryInfo", (req, res) => {
    const batteryInfo = JSON.stringify(req.params.batteryInfo).replace("\"", "")
    console.info(batteryInfo)
    batteryPercent = Number(batteryInfo.split("&")[0].replace("\"", ""));
    console.info(batteryPercent)
    batteryCharging = batteryInfo.split("&")[1] == "charging"
    console.info(batteryCharging)
    if (batteryPercent > 56) res.send("200 ok")
    if (batteryCharging == false || batteryCharging == null) {
        console.log(`The battery percentage is ${batteryPercent}%. Please charge the school iPad.`)
        res.send("200 ok")
        MessageBoxW(null, `The battery percentage is ${batteryPercent}%. Please charge the school iPad.`, 'Sibrd - NOTIFICATION', MB_ICONINFORMATION);
        //alert(`The battery percentage is ${batteryPercent}. Please charge the school iPad.`);
        //notify.notify(`The battery percentage is ${batteryPercent}. Please charge the school iPad.`)
    }
})

app.get("/", (req, res) => {
    res.redirect(200, "/100")
});

process.on("SIGINT", () => {
    console.table(accessLog)
    process.exit(0)
})

//console.log("port:" + argv.port | 80)
//console.log(argv.port)
app.listen(80, "0.0.0.0", function () {
    console.info(`Listening! \n http://192.168.0.104:80`)
})