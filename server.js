// 设置默认环境变量
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var logger = require('./log/logger')
var koa = require('koa')
var Router = require('koa-router')
var logger = require('koa-logger')
var session = require('koa-generic-session')
var redisStore = require('koa-redis')
var bodyParser = require('koa-bodyparser')
var mongo = require('koa-mongo')
var cors = require('koa-cors')
var compress = require("koa-compress")

var debug = require('debug')('wx')
var env = process.env.NODE_ENV

var app = koa()

var router = new Router()
var r = require('./routes')
router.post('/login', bodyParser(), r.postLogin())
router.post('/register', bodyParser(), r.postRegister())
router.get('/user', r.getUser())
router.post('/save', bodyParser(), r.postSave())
router.get('/todos', r.getTodos())
router.get('/logout', r.logout())

app.use(cors({
  origin: true,
  credentials: true
}))

// app.keys用来加密cookie
app.keys = ['wx', 'zf'];
app.use(session({
  key: 'wx.sid',
  store: redisStore(),
  cookie: {
    httpOnly: true,
    path: '/',
    overwrite: true,
    signed: true,
    maxAge: null //one hour in ms
  }
}))

app.use(logger())
app.use(mongo({
  db: 'notes'
}))

app.use(compress())
app.use(router.routes()).use(router.allowedMethods())
app.on('error', function(err, ctx) {
  console.error('server error', err)
})

// Start server
app.listen(3345, function () {
  console.log('Koa server listening on %d, in %s mode', 3345, env)
})

