/* eslint-env mocha */

const chai = require('chai')
const assert = chai.assert
const request = require('request')

let app
let server
let sessionId

describe('web', function () {
  this.timeout(5000)

  it('app.listen shoud return http.server. It should be runnable and listening for request', function (done) {
    app = require('./fractures/web/app.js')
    let port = 3010
    server = app.listen(port, function () {
      console.error('Start at port ' + port)
    })
    assert.equal(server.listening, true)
    done()
  })

  it('should serve hello-string', function (done) {
    request('http://localhost:3010/hello-string', function (error, response, body) {
      if (error) {
        return done(error)
      }
      assert.equal(body, 'Hello :D')
      return done()
    })
  })

  it('should serve hello-json, and transmit the data from custom middleware as well', function (done) {
    request('http://localhost:3010/hello-json', function (error, response, body) {
      if (error) {
        return done(error)
      }
      assert.equal(body, '{"data":"Hello :D","fromMiddleware":"yes","message":"hi"}')
      return done()
    })
  })

  it('should serve hello-pug', function (done) {
    request('http://localhost:3010/hello-pug', function (error, response, body) {
      if (error) {
        return done(error)
      }
      assert.equal(body, '<!DOCTYPE html><html><body><h1>This is Pug</h1><p>Hello :D</p></body></html>')
      return done()
    })
  })

  it('should serve hello-ejs', function (done) {
    request('http://localhost:3010/hello-ejs', function (error, response, body) {
      if (error) {
        return done(error)
      }
      assert.equal(body, '<h1>This is EJS</h1>\n<p>Hello :D</p>\n\n')
      return done()
    })
  })

  it('should serve hello-hook (defined in hook-startup.chiml)', function (done) {
    request('http://localhost:3010/hello-hook', function (error, response, body) {
      if (error) {
        return done(error)
      }
      assert.equal(body, 'Hello :D')
      return done()
    })
  })

  it('should serve hello-hook/:name (defined in hook-startup.chiml)', function (done) {
    request('http://localhost:3010/hello-hook/emiya', function (error, response, body) {
      if (error) {
        return done(error)
      }
      assert.equal(body, 'Hello emiya')
      return done()
    })
  })

  it('should serve plus-one-query (defined in hook-startup.chiml)', function (done) {
    request('http://localhost:3010/plus-one-query?data=3', function (error, response, body) {
      if (error) {
        return done(error)
      }
      assert.equal(body, '4')
      return done()
    })
  })

  it('should serve plus-one-body (defined in hook-startup.chiml)', function (done) {
    request.post({url: 'http://localhost:3010/plus-one-body', form: {data: 3}}, function (error, response, body) {
      if (error) {
        return done(error)
      }
      assert.equal(body, '4')
      return done()
    })
  })

  it('should serve plus-one-cookie (defined in hook-startup.chiml)', function (done) {
    let cookieJar = request.jar()
    let cookie = request.cookie('data=3')
    let url = 'http://localhost:3010/plus-one-cookie'
    cookieJar.setCookie(cookie, url)
    request({url: url, jar: cookieJar}, function (error, response, body) {
      if (error) {
        return done(error)
      }
      assert.equal(body, '4')
      return done()
    })
  })

  it('plus-one-cookie should send set-cookie response with correct value', function (done) {
    let cookieJar = request.jar()
    let cookie = request.cookie('data=3')
    let url = 'http://localhost:3010/plus-one-cookie'
    cookieJar.setCookie(cookie, url)
    request({url: url, jar: cookieJar}, function (error, response, body) {
      if (error) {
        return done(error)
      }
      assert.equal(response.headers['set-cookie'][0], 'data=4; Path=/')
      return done()
    })
  })

  it('should serve plus-one-session (defined in hook-startup.chiml)', function (done) {
    let cookieJar = request.jar()
    let cookie = request.cookie('')
    let url = 'http://localhost:3010/plus-one-session'
    cookieJar.setCookie(cookie, url)
    request({url: url, jar: cookieJar}, function (error, response, body) {
      if (error) {
        return done(error)
      }
      sessionId = response.headers['set-cookie'][0].match(/connect\.sid=(.*?);/)[1]
      assert.equal(body, '1')
      return done()
    })
  })

  it('plus-one-session should plus session.data by one', function (done) {
    let cookieJar = request.jar()
    let cookie = request.cookie('connect.sid=' + sessionId)
    let url = 'http://localhost:3010/plus-one-session'
    cookieJar.setCookie(cookie, url)
    request({url: url, jar: cookieJar}, function (error, response, body) {
      if (error) {
        return done(error)
      }
      assert.equal(body, '2')
      return done()
    })
  })

  it('http.server returned by app.listen should be closeable programmatically', function (done) {
    server.close()
    assert.equal(server.listening, false)
    done()
  })
})
