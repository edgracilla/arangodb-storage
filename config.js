'use strict'

const validate = require('validate.js')

let constraints = {
  host: {
    presence: true
  },
  port: {
    presence: true
  },
  connection_type: {
    presence: true
  },
  user: {
    presence: true
  },
  password: {
    presence: false
  },
  database: {
    presence: true
  },
  collection: {
    presence: true
  },
  collection_type: {
    presence: true
  }
}

module.exports.validate = (attribs) => {
  return validate(attribs, constraints)
}

