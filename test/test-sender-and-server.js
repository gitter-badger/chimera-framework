/* eslint-env mocha */

const path = require('path')
const chai = require('chai')
const chimera = require('../index.js')
const assert = chai.assert

let server
let cwd

describe('server and sender', function () {
  it('server run in the correct port', function (done) {
    cwd = process.cwd()
    process.chdir(__dirname)
    process.env.PUBLISHED = './fractures'
    chimera.server.serve({port: 3011}, function (error, result) {
      if (error) {
        return done(error)
      }
      assert.equal(result.port, 3011)
      server = result.server
      done()
    })
  })

  it('should be able to execute square-distributed.chiml and get the result', function (done) {
    chimera.core.executeChain(path.join(__dirname, 'fractures/square-distributed.chiml'), ['http://localhost:3011', 10], {}, function (error, result) {
      if (error) {
        return done(error)
      }
      assert.strictEqual(result, 100)
      done()
    })
  })

  it('should be able to execute square-distributed.chiml and get the result (without parameter) to test startupHook', function (done) {
    chimera.core.executeChain(path.join(__dirname, 'fractures/square-distributed.chiml'), ['http://localhost:3011'], {}, function (error, result) {
      if (error) {
        return done(error)
      }
      assert.strictEqual(result, 0)
      done()
    })
  })

  it('should be able to execute square-distributed.chiml and get the result (with 73 as parameter) to test afterRequestHook', function (done) {
    chimera.core.executeChain(path.join(__dirname, 'fractures/square-distributed.chiml'), ['http://localhost:3011', 73], {}, function (error, result) {
      if (error) {
        return done(error)
      }
      assert.strictEqual(result, 'you do not square 73, because 73 is the most beautiful number and you do not want to ruin the beauty')
      done()
    })
  })

  it('should return error when trying to acces circle-area.chiml', function (done) {
    chimera.sender.send('http://localhost:3011', path.join(__dirname, 'fractures/circle-area.chiml'), [4], function (error, result) {
      if (error) {
        assert.equal(error.message, 'Access to circle-area.chiml denied')
        return done()
      }
      done(new Error('Error expected, but no error found'))
    })
  })

  it('should return error when trying to acces dummy.chiml', function (done) {
    chimera.sender.send('http://localhost:3011', 'dummy.chiml', [4], function (error, result) {
      if (error) {
        assert.equal(error.message, 'Cannot access dummy.chiml')
        return done()
      }
      done(new Error('Error expected, but no error found'))
    })
  })

  it('http.server returned by chimera.server.serve should be closeable programmatically', function (done) {
    server.close()
    process.chdir(cwd)
    assert.equal(server.listening, false)
    done()
  })
})
