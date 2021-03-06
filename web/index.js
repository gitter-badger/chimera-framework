'use strict'

const staticCache = require('express-static-cache')
const path = require('path')
const process = require('process')
const web = require('chimera-framework/lib/web.js')
const cck = require('./cck.js')
const helper = require('./helper.js')
const port = process.env.PORT || 3000

// load webConfig
let webConfig = helper.getWebConfig()
let maxAgeOption = {maxAge: 'staticMaxAge' in webConfig ? webConfig.staticMaxAge : 365 * 24 * 60 * 60}

// get bootstrap & jquery path
let bootstrapPath = path.join(__dirname, 'node_modules/bootstrap')
let jqueryPath = path.join(__dirname, 'node_modules/jquery')
let popperPath = path.join(__dirname, 'node_modules/popper.js')
let acePath = path.join(__dirname, 'node_modules/ace-builds')

// define default middlewares (bootstrap, jquery, and JWT)
webConfig.middlewares = 'middlewares' in webConfig ? webConfig.middlewares : []
webConfig.middlewares.unshift(helper.jwtMiddleware)
webConfig.middlewares.unshift({'/bootstrap': staticCache(bootstrapPath, maxAgeOption)})
webConfig.middlewares.unshift({'/css/fonts': staticCache(path.join(bootstrapPath, 'dist/fonts'), maxAgeOption)})
webConfig.middlewares.unshift({'/jquery': staticCache(jqueryPath, maxAgeOption)})
webConfig.middlewares.unshift({'/popper.js': staticCache(popperPath, maxAgeOption)})
webConfig.middlewares.unshift({'/ace-builds': staticCache(acePath, maxAgeOption)})

// add `helper`, `cck`, and helper.runChain to webConfig.vars.$
webConfig.vars = 'vars' in webConfig ? webConfig.vars : {}
webConfig.vars.$ = '$' in webConfig.vars ? webConfig.vars.$ : {}
webConfig.vars.$.helper = helper
webConfig.vars.$.cck = cck
webConfig.vars.$.runChain = helper.runChain

// create app
let app = web.createApp(webConfig, ...webConfig.middlewares)

// export the app
module.exports = {app}

// run the server
if (require.main === module) {
  app.listen(port, function () {
    console.error('Start at port ' + port)
  })
}
