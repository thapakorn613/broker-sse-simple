require('dotenv').config()
const express = require("express")
const moment = require('moment-timezone')
const cors = require("cors")
const EventEmitter = require("eventemitter3")
const fs = require("fs")
const logger = require('morgan')
const fileStreamRotator = require("file-stream-rotator")
const path = require('path')
const emitter = new EventEmitter()
const logsFolder = path.join(__dirname, '/accessLog')
fs.existsSync(logsFolder) || fs.mkdirSync(logsFolder)
const rotatingLogStream = fileStreamRotator.getStream({
    filename: `${logsFolder}/access-%DATE%.log`,
    frequency: "daily",
    verbose: false,
    date_format: "YYYY-MM-DD",
    max_logs: 30,
})
let formatLog = `:remote-addr - :remote-user [:local-time] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"`
logger.token('local-time', function(req, res) { return moment.tz(new Date(), 'Asia/Bangkok').format() })

const subscribe = async(req, res, next) => {
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    })
    const onMessage = data => {
        res.write(`data: ${JSON.stringify(data)}\n\n`)
    }
    let msgSubmit = req.query.eventid
    console.log(`Receiver Status : ${req.headers.origin} , eventid: ${msgSubmit} at: ${moment.tz(new Date(), 'Asia/Bangkok').format()}`)
    emitter.on(msgSubmit, onMessage)
    req.on("close", function() {
        console.log("CLOSE ", msgSubmit)
        emitter.removeListener(msgSubmit, onMessage)
    })
}

const publish = (req, res) => {
    let messageSub = req.body.msgSubmit
    console.log(`Publish, Chanel: ${messageSub} , event-msg: ${req.body.eventMsg} ,time: ${moment.tz(new Date(), 'Asia/Bangkok').format()}.`)
    emitter.emit(messageSub, req.body)
    res.send({ "status": "success", "msg": req.body.eventMsg })
}

let corsConfig = {
    // "origin": "*",
    "origin": ["http://10.151.0.159:8080"],
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
}
express()
    .use(cors(corsConfig))
    .use(logger('tiny'))
    .use(logger(formatLog, { stream: rotatingLogStream }))
    .use(express.json())
    .post("/publish", publish)
    .get("/status", subscribe)
    .listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}.`);
    });