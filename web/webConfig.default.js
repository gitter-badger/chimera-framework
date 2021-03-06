'use strict'

const path = require('path')

let basePath = path.join(__dirname, '/')
let chainPath = path.join(__dirname, 'chains') + '/'
let viewPath = path.join(__dirname, 'views') + '/'
let randomNumber = String(Math.round(Math.random() * 1000000000))
let migrationPath = path.join(__dirname, 'migrations') + '/'
let staticPath = path.join(__dirname, 'public') + '/'
let faviconPath = path.join(__dirname, 'public/favicon.ico')

const webConfig = {
  basePath,
  chainPath,
  viewPath,
  migrationPath,
  staticPath,
  faviconPath,
  exceptionKeys: ['basePath', 'chainPath', 'cckPath', 'helperPath', 'exceptionKeys', 'routes', 'jwtSecret', 'jwtExpired', 'jwtTokenName', 'sessionSecret', 'sessionMaxAge', 'sessionSaveUnitialized', 'sessionResave', 'startupHook', 'beforeRequestHook', 'afterRequestHook', 'middlewares', 'mongoUrl', 'migrationPath', 'staticPath', 'faviconPath', 'viewPath', 'errorTemplate', 'defaultTemplate', 'baseLayout', 'vars'],
  // routes
  routes: [],
  // jwt configuration
  jwtSecret: 'secret' + randomNumber + 'jwt',
  jwtExpired: 60 * 60 * 24,
  jwtTokenName: 'token',
  // session configuration
  sessionSecret: 'secret' + randomNumber + 'session',
  sessionMaxAge: 60 * 60 * 24,
  sessionSaveUnitialized: true,
  sessionResave: true,
  // hook configuration
  startupHook: path.join(chainPath, 'core.hook.startup.js'),
  beforeRequestHook: path.join(chainPath, 'core.hook.beforeRequest.js'),
  afterRequestHook: path.join(chainPath, 'core.hook.afterRequest.js'),
  // list of express middlewares function
  middlewares: [],
  // mongoUrl database
  mongoUrl: 'mongodb://localhost/chimera-web-app',
  // verbosity level
  verbose: 0,
  // error view tempalate
  errorTemplate: path.join(viewPath, 'default.error.ejs'),
  defaultTemplate: null,
  baseLayout: path.join(viewPath, 'default.layout.ejs')
}

module.exports = webConfig
