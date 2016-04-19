'use strict';

var platform      = require('./platform'),
	isPlainObject = require('lodash.isplainobject'),
	isArray       = require('lodash.isarray'),
	async         = require('async'),
	collection;

let sendData = function (data, callback) {
	collection.save(data, (error, res) => {
		if (!error) {
			platform.log(JSON.stringify({
				title: 'Record Successfully inserted to ArangoDB.',
				data: data,
				key: res._key
			}));
		}

		callback(error);
	});
};

platform.on('data', function (data) {
	if (isPlainObject(data)) {
		sendData(data, (error) => {
			if (error) platform.handleException(error);
		});
	}
	else if (isArray(data)) {
		async.each(data, (datum, done) => {
			sendData(datum, done);
		}, (error) => {
			if (error) platform.handleException(error);
		});
	}
	else
		platform.handleException(new Error(`Invalid data received. Data must be a valid Array/JSON Object or a collection of objects. Data: ${data}`));
});

/**
 * Emitted when the platform shuts down the plugin. The Storage should perform cleanup of the resources on this event.
 */
platform.once('close', function () {
	platform.notifyClose();
});

/**
 * Emitted when the platform bootstraps the plugin. The plugin should listen once and execute its init process.
 * Afterwards, platform.notifyReady() should be called to notify the platform that the init process is done.
 * @param {object} options The options or configuration injected by the platform to the plugin.
 */
platform.once('ready', function (options) {
	var Database = require('arangojs').Database,
		url      = `${options.host}:${options.port}`,
		auth     = `${options.user}:${options.password}`;

	var db = new Database(`${options.connection_type}://${auth}@${url}`);

	db.useDatabase(options.database);

	if (options.collection_type === 'collection')
		collection = db.collection(options.collection);
	else
		collection = db.edgeCollection(options.collection);

	platform.notifyReady();
	platform.log('ArangoDB has been initialized.');
});