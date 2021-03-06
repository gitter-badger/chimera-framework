const fs = require('fs')
const path = require('path')
const async = require('neo-async')
const core = require('./core.js')
const mongo = require('./mongo.js')
const util = require('./util.js')

const migrationCollectionName = 'chimera_migrations'

module.exports = {
  upgrade,
  downgrade
}

function getAvailableMigration (migrationPath, callback) {
  fs.readdir(migrationPath, (error, fileList) => {
    if (error) {
      callback(error, null)
    }
    // get migrationList
    let migrationList = []
    for (let fileName of fileList) {
      if (fileName[0] === '.') { continue }
      // remove file extension
      if (fileName.substring(fileName.length - 6) === '.chiml') {
        migrationList.push(fileName.substring(0, fileName.length - 6))
      }
    }
    // sort migrationList
    migrationList = migrationList.sort()
    callback(null, migrationList)
  })
}

function getCachedMigration (mongoUrl, callback) {
  let db = mongo.db(mongoUrl)
  let migration = mongo.collection(db, migrationCollectionName)
  migration.find({}, function (error, result) {
    if (error) {
      db.close()
      return callback(error, null)
    }
    let migrationList = []
    for (let row of result) {
      migrationList.push(row.code)
    }
    migrationList = migrationList.sort()
    db.close()
    return callback(null, migrationList)
  })
}

function unpackMigrationParameters (args) {
  // argument of this function: <options> [version] <callback>
  let callback = args.pop()
  let version = null
  if (args.length === 2) {
    version = args.pop()
  }
  let config = args[0]
  let migrationPath = ('migrationPath' in config) ? config.migrationPath : 'migrations'
  let mongoUrl = ('mongoUrl' in config) ? config.mongoUrl : 'mongodb://localhost/db'
  return {version, mongoUrl, migrationPath, config, callback}
}

function filterMigrationList (migrationList, exceptionList, filterFunction) {
  let filteredList = []
  for (let migration of migrationList) {
    if (filterFunction === null || filterFunction(migration)) {
      if (exceptionList.indexOf(migration) === -1) {
        filteredList.push(migration)
      }
    }
  }
  return filteredList
}

function upgrade (...args) {
  let {version, mongoUrl, migrationPath, config, callback} = unpackMigrationParameters(args)
  let cachedMigrationList, availableMigrationList
  let upgradeMigrationList = []
  let performedMigrationList = []
  let db = mongo.db(mongoUrl)
  let finalCallback = (error, value) => {
    db.close()
    if (error) {
      return callback(error, null)
    }
    return callback(error, performedMigrationList)
  }
  async.series([
    // get cachedMigrationList
    (next) => {
      getCachedMigration(mongoUrl, (error, migrationList) => {
        if (error) {
          return finalCallback(error, null)
        }
        cachedMigrationList = migrationList
        return next()
      })
    },
    // get availableMigrationList
    (next) => {
      getAvailableMigration(migrationPath, (error, migrationList) => {
        if (error) {
          return finalCallback(error, null)
        }
        availableMigrationList = migrationList
        return next()
      })
    },
    // get upgradeMigrationList
    (next) => {
      upgradeMigrationList = filterMigrationList(availableMigrationList, cachedMigrationList, (migration) => {
        return util.isNullOrUndefined(version) || migration <= version
      })
      next()
    },
    // do migration
    (next) => {
      let migration = mongo.collection(db, migrationCollectionName)
      let actions = []
      for (let migrationName of upgradeMigrationList) {
        actions.push((nextAction) => {
          core.executeChain(path.join(migrationPath, migrationName + '.chiml'), ['up', config], config.vars, (error, result) => {
            if (!error) {
              performedMigrationList.push(migrationName)
              return migration.insert({'code': migrationName}, function (error, result) {
                if (error) {
                  console.error(error)
                }
                return nextAction()
              })
            } else {
              console.error(error)
              return nextAction()
            }
          })
        })
      }
      async.series(actions, next)
    }
  ], finalCallback)
}

function downgrade (...args) {
  let {version, mongoUrl, migrationPath, config, callback} = unpackMigrationParameters(args)
  let db = mongo.db(mongoUrl)
  let cachedMigrationList
  let downgradeMigrationList = []
  let performedMigrationList = []
  let finalCallback = (error, value) => {
    db.close()
    if (error) {
      return callback(error, null)
    }
    return callback(error, performedMigrationList)
  }
  async.series([
    // get cachedMigrationList
    (next) => {
      getCachedMigration(mongoUrl, (error, migrationList) => {
        if (error) {
          return finalCallback(error, null)
        }
        cachedMigrationList = migrationList
        return next()
      })
    },
    // get downgradeMigrationList
    (next) => {
      downgradeMigrationList = filterMigrationList(cachedMigrationList, [], (migration) => {
        return util.isNullOrUndefined(version) || migration >= version
      })
      downgradeMigrationList = downgradeMigrationList.sort((a, b) => {
        return a < b
      })
      next()
    },
    // do migration
    (next) => {
      let migration = mongo.collection(db, migrationCollectionName)
      let actions = []
      for (let migrationName of downgradeMigrationList) {
        actions.push((nextAction) => {
          core.executeChain(path.join(migrationPath, migrationName + '.chiml'), ['down', config], config.vars, (error, result) => {
            if (!error) {
              performedMigrationList.push(migrationName)
              return migration.remove({'code': migrationName}, function (error, result) {
                if (error) {
                  console.error(error)
                }
                return nextAction()
              })
            } else {
              console.error(error)
              return nextAction()
            }
          })
        })
      }
      async.series(actions, next)
    }
  ], finalCallback)
}
