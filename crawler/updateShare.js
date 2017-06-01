/**
 * Created by linweiyun on 2017/6/1.
 */

let superagent = require('superagent');
let q = require('q');
let sleeptime = require('sleep-time');
let getUser = require('./save').getUser;
let saveWapShare = require('./save').saveWapShare;
let setShareFlag = require('./save').setShareFlag;
let async = require('async');
let cheerio = require('cheerio');
let errorUrl = require('./save').errorUrl;

