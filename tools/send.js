#! /usr/bin/env node
'use strict'

require('cache-require-paths')
let sender = require('../lib/sender.js')

if (require.main === module) {
  if (process.argv.length > 3) {
    let host = process.argv[2]
    let chain = process.argv[3]
    let parameters = process.argv.slice(4)
    sender.send(host, chain, parameters, function (error, output) {
      if (error) {
        return console.error(error)
      }
      console.log(output)
    })
  } else {
    console.error('INVALID ARGUMENTS')
  }
}
