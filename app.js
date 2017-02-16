'use strict'

const reekoh = require('reekoh')
const config = require('./config.js')
const _plugin = new reekoh.plugins.Storage()

const isPlainObject = require('lodash.isplainobject')
const async = require('async')

let collection = null

let sendData = (data, callback) => {
  collection.save(data, (error, res) => {
    if (!error) {
      _plugin.log(JSON.stringify({
        title: 'Record Successfully inserted to ArangoDB.',
        data: data,
        key: res._key
      }))
    }

    callback(error)
  })
}

_plugin.on('data', (data) => {
  if (isPlainObject(data)) {
    sendData(data, (error) => {
      if (error) {
        console.log(error)
        return _plugin.logException(error)
      }
      process.send({ type: 'processed' })
    })
  } else if (Array.isArray(data)) {
    async.each(data, (datum, done) => {
      sendData(datum, done)
    }, (error) => {
      if (error) _plugin.logException(error)
    })
  } else {
    _plugin.logException(new Error(`Invalid data received. Data must be a valid Array/JSON Object or a collection of objects. Data: ${data}`))
  }
})

_plugin.once('ready', () => {
  let err = config.validate(_plugin.config)
  if (err) return console.error('Config Validation Error: \n', err)

  let options = _plugin.config

  let Database = require('arangojs').Database
  let url = `${options.host}:${options.port}`
  let auth = `${options.user}:${options.password}`

  let db = new Database(`${options.connection_type}://${auth}@${url}`)

  db.useDatabase(options.database)

  if (options.collection_type === 'collection') {
    collection = db.collection(options.collection)
  } else {
    collection = db.edgeCollection(options.collection)
  }

  _plugin.log('ArangoDB has been initialized.')
  process.send({ type: 'ready' })
})
