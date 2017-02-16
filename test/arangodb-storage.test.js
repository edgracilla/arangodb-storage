/* global describe, it, before, after */
'use strict'

const cp = require('child_process')
const should = require('should')
const moment = require('moment')
const amqp = require('amqplib')

let _storage = null
let _channel = null
let _conn = {}

let conf = {
  host: 'localhost',
  port: 8529,
  user: 'root',
  password: 'supersecret',
  connection_type: 'http',
  database: '_system',
  collection: 'reekoh_collection',
  collection_type: 'collection'
}

const ID = new Date().getTime().toString()

let record = {
  _key: ID,
  co2: '11%',
  temp: 23,
  quality: 11.25,
  reading_time: '2015-11-27T11:04:13.539Z',
  metadata: {metadata_json: 'reekoh metadata json'},
  random_data: 'abcdefg',
  is_normal: true
}

describe('Storage', function () {
  this.slow(5000)

  before('init', () => {
    process.env.INPUT_PIPE = 'demo.pipe.storage'
    process.env.BROKER = 'amqp://guest:guest@127.0.0.1/'
    process.env.CONFIG = JSON.stringify(conf)

    amqp.connect(process.env.BROKER).then((conn) => {
      _conn = conn
      return conn.createChannel()
    }).then((channel) => {
      _channel = channel
    }).catch((err) => {
      console.log(err)
    })
  })

  after('terminate child process', function (done) {
    this.timeout(7000)

    _conn.close()
    _storage.send({
      type: 'close'
    })

    setTimeout(function () {
      _storage.kill('SIGKILL')
      done()
    }, 5000)
  })

  describe('#spawn', function () {
    it('should spawn a child process', function () {
      should.ok(_storage = cp.fork(process.cwd()), 'Child process not spawned.')
    })
  })

  describe('#handShake', function () {
    it('should notify the parent process when ready within 5 seconds', function (done) {
      this.timeout(5000)

      _storage.on('message', function (message) {
        if (message.type === 'ready') {
          done()
        }
      })
    })
  })

  describe('#data', function () {
    it('should process the data', function (done) {
      this.timeout(8000)
      _channel.sendToQueue(process.env.INPUT_PIPE, new Buffer(JSON.stringify(record)))

      _storage.on('message', (msg) => {
        if (msg.type === 'processed') done()
      })
    })
  })

  describe('#data', function () {
    it('should have inserted the data', function (done) {
      this.timeout(20000)

      let Database = require('arangojs').Database
      let db = new Database(conf.connection_type + '://' + conf.user + ':' + conf.password + '@' + conf.host + ':' + conf.port)
      let collection = null

      db.useDatabase(conf.database)

      if (conf.collection_type === 'collection') {
        collection = db.collection(conf.collection)
      } else {
        collection = db.edgeCollection(conf.collection)
      }

      collection.document(ID, function (err, result) {
        if (err) return console.log(err)

        should.equal(record.co2, result.co2, 'Data validation failed. Field: co2')
        should.equal(record.temp, result.temp, 'Data validation failed. Field: temp')
        should.equal(record.quality, result.quality, 'Data validation failed. Field: quality')
        should.equal(record.random_data, result.random_data, 'Data validation failed. Field: random_data')
        should.equal(moment(record.reading_time).format('YYYY-MM-DDTHH:mm:ss.SSSSZ'), moment(result.reading_time).format('YYYY-MM-DDTHH:mm:ss.SSSSZ'), 'Data validation failed. Field: reading_time')
        should.equal(JSON.stringify(record.metadata), JSON.stringify(result.metadata), 'Data validation failed. Field: metadata')
        should.equal(record.is_normal, result.is_normal, 'Data validation failed. Field: is_normal')

        done()
      })
    })
  })
})
