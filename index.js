/**
 * Created by lwy on 2017-04-06.
 */
let ShareWorker = require('./crawler/fetch').ShareWorker;
let getUser = require('./crawler/save').getUser;
let saveShare = require('./crawler/save').saveShare;
let async = require('async');
let q = require('q');

let shareWorker = new ShareWorker();
shareWorker.init();