var debug = require('debug')('wx');
var logger = require('./log/logger');

exports.getUser = function () {
  return function * (next) {
    if (this.session.user) {
      this.status = 200
      this.body = {user: this.session.user}
    } else {
      this.status = 401
      this.body = {error_msg: '未登陆，请登陆'}
    }
  }
}

exports.postLogin = function () {
  return function*(next) {
    var data = this.request.body
    debug('login post data is %s', JSON.stringify(data))
    try {
      var user = yield this.mongo.db('notes').collection('users').findOne(data, {
        _id: 0,
        password: 0
      })
      logger.log(data)
      this.session.user = user.username
      this.status = 200
      this.body = {success: true, user: user.username}
    } catch (err) {
      this.throw(err)
    }
  }
}
exports.postRegister = function () {
  return function*(next) {
    var data = this.request.body
    debug('register post data is %s', JSON.stringify(data))
    try {
      var user = yield this.mongo.db('notes').collection('users').findOne({username: data.username}, {
        _id: 0,
        password: 0
      })
      debug('register find user is %s', JSON.stringify(user))
      if(user) {
        this.status = 404
        return this.body = {error_msg: '该用户名已存在'}
      }
      yield this.mongo.db('notes').collection('users').insertOne(data)
      logger.log(data)
      this.session.user = data.username
      this.status = 200
      this.body = {success: true, user: data.username}
    } catch (err) {
      this.throw(err)
    }
  }
}

exports.getTodos = function () {
  return function* () {
    if (this.session.user) {
      try {
        var username = this.session.user
        var todo = {
          username: username,
          todos: this.request.body
        }
        var todos = yield this.mongo.db('notes').collection('todos').findOne({username: username}, {
          _id: 0
        })
        debug('get todos is %s', JSON.stringify(todos))
        this.status = 200
        this.body = {success: true, todos: todos.todos}
      } catch (err){
        this.throw(err)
      }
    } else {
      this.status = 401
      this.body = {error_msg: '您还未登陆，请登陆'}
    }
  }
}

exports.postSave = function () {
  debug('post save')
  return function* () {
    debug('session is %s', this.session.user)
    if (this.session.user) {
      try {
        var username = this.session.user
        var todo = {
          username: username,
          todos: this.request.body
        }
        debug('post save data is %s', JSON.stringify(todo))
        var todos = yield this.mongo.db('notes')
          .collection('todos')
          .updateOne({
            username: username
          }, todo, {upsert: true})
        this.status = 200
        this.body = {success: true, user: username}
      } catch (err){
        this.throw(err)
      }
    } else {
      this.status = 401
      this.body = {error_msg: '请登陆用户'}
    }
  }
}

exports.logout = function () {
  return function*(next) {
    this.session.user = null
    this.status = 200
    this.body = {success: true}
  };
}
