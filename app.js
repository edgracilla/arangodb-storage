'use strict'

const reekoh = require('reekoh')
const plugin = new reekoh.plugins.Storage()

const async = require('async')
const isPlainObject = require('lodash.isplainobject')

let collection = null

let sendData = (data, callback) => {
  collection.save(data, (error, res) => {
    if (!error) {
      plugin.log(JSON.stringify({
        title: 'Record Successfully inserted to ArangoDB.',
        data: data,
        key: res._key
      }))
    }

    callback(error)
  })
}

plugin.on('data', (data) => {
  if (isPlainObject(data)) {
    sendData(data, (error) => {
      if (error) {
        return plugin.logException(error)
      }
      plugin.emit('processed')
    })
  } else if (Array.isArray(data)) {
    async.each(data, (datum, done) => {
      sendData(datum, done)
    }, (error) => {
      if (error) plugin.logException(error)
    })
  } else {
    plugin.logException(new Error(`Invalid data received. Data must be a valid Array/JSON Object or a collection of objects. Data: ${data}`))
  }
})

plugin.once('ready', () => {
  let options = plugin.config
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

  plugin.log('ArangoDB has been initialized.')
  plugin.emit('init')
})

module.exports = plugin

