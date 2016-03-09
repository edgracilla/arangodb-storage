'use strict';

var platform = require('./platform'),
	isPlainObject = require('lodash.isplainobject'),
	isArray = require('lodash.isarray'),
	async = require('async'),
	collection;

let sendData = (data) => {
	collection.save(data, function(err, res) {
		if (err) {
			console.error('Error inserting record on ArangoDB', err);
			if (err.errorNum && (err.errorNum === 1221 && err.errorNum === 1210 &&  err.errorNum === 400) ) {
				platform.log(JSON.stringify({
					title: 'Error inserting record to ArangoDB.',
					data: data,
					error: err
				}));
			} else {
				platform.handleException(err);
			}
		} else {
			platform.log(JSON.stringify({
				title: 'Record Successfully inserted to ArangoDB.',
				data: data,
				key: res._key
			}));
		}
	});
};

platform.on('data', function (data) {
	if(isPlainObject(data)){
		sendData(data);
	}
	else if(isArray(data)){
		async.each(data, function(datum){
			sendData(datum);
		});
	}
	else
		platform.handleException(new Error(`Invalid data received. Data must be a valid Array/JSON Object or a collection of objects. Data: ${data}`));
});

/**
 * Emitted when the platform shuts down the plugin. The Storage should perform cleanup of the resources on this event.
 */
platform.once('close', function () {
	let d = require('domain').create();

	d.once('error', function (error) {
		console.error(error);
		platform.handleException(error);
		platform.notifyClose();
		d.exit();
	});

	d.run(function () {
		// TODO: Release all resources and close connections etc.
		platform.notifyClose(); // Notify the platform that resources have been released.
		d.exit();
	});
});

/**
 * Emitted when the platform bootstraps the plugin. The plugin should listen once and execute its init process.
 * Afterwards, platform.notifyReady() should be called to notify the platform that the init process is done.
 * @param {object} options The options or configuration injected by the platform to the plugin.
 */
platform.once('ready', function (options) {
	var Database = require('arangojs').Database,
		url      = options.host,
		auth     = options.user + ':';

	if (options.password) auth = auth + options.password;
	if (options.port) url = url + ':' + options.port;

	var db = new Database(options.connection_type + '://' + auth + '@' + url);

	db.useDatabase(options.database);

	if (options.collection_type === 'collection')
		collection = db.collection(options.collection);
	else
		collection = db.edgeCollection(options.collection);

	platform.notifyReady();
	platform.log('ArangoDB has been initialized.');
});