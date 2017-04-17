/**
 * Created by lwy on 2017-04-17.
 */
let superagent = require('superagent');
let q = require('q');
let sleeptime = require('sleep-time');
let getUser = require('./save').getUser;
let saveWapShare = require('./save').saveWapShare;
let setShareFlag = require('./save').setShareFlag;
let async = require('async');
let log4js = require('log4js');
let cheerio = require('cheerio');

//###########http header#########
let options = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, sdch, br',
    'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.6,en;q=0.4',
    'Connection': 'keep-alive',
    'Host': 'pan.baidu.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest'
};
//生成获取分享任务
let getWapShareTasks = function (uk, total) {
    let wapShareTasks = [];
    let _uk = uk,
        _url = '';
    for (let i = 0; i < total; i += 20) {
        _url = `https://pan.baidu.com/wap/share/home?third=0&uk=${_uk}&start=${i}`;
        wapShareTasks.push(_url);
    }
    return wapShareTasks;
};

let getWapShare = function (url) {
    let deferred = q.defer();
    console.log('getWapShare:' + url);
    superagent
        .get(url)
        .set(options)
        .end((err, res) => {
            "use strict";
            if (err) deferred.reject(err);
            try {
                // console.log(res.text);
                let $ = cheerio.load(res.text);
                let temp = $('script')[16].children[0].data;
                temp = temp.replace(/ /g, '');
                temp = temp.substring(temp.indexOf('{"'), temp.indexOf('}();') - 2);
                temp = eval("(" + temp + ")");
                // console.log(temp.feedata.records[0]);
                deferred.resolve(parseWapShareJson(temp.feedata));
            } catch (e) {
                console.log(e);
                deferred.resolve('err');
            }
        });
    return deferred.promise;
};

//解析分享json
let parseWapShareJson = function (json) {
    // console.log(json.records.length);
    let userShare = [];
    let shareObj = {};
    for (let i = 0; i < json.records.length; i++) {
        shareObj.category = json.records[i].category;
        shareObj.feed_time = json.records[i].feed_time;
        shareObj.isdir = json.records[i].filelist[0].isdir;
        shareObj.server_filename = json.records[i].filelist[0].server_filename;
        shareObj.size = json.records[i].filelist[0].size;
        // shareObj.saveTime = json.records[i].filelist[0].time_stamp;
        shareObj.shareid = json.records[i].shareid;
        // shareObj.shorturl = json.records[i].shorturl;
        shareObj.title = json.records[i].title;
        shareObj.uk = json.records[i].uk;
        shareObj.username = json.records[i].username;
        userShare[i] = shareObj;
        shareObj = {};
    }
    // console.log(userShare);
    return userShare;
};

//从wap获取用户分享的信息
let WapShareWorker = function () {
};
let shareCounter = 0;
WapShareWorker.prototype = {
    init: function () {
        let deferred = q.defer();
        //获取用户
        getUser(0)
            .then((user) => {
                if (user == '') {
                    console.log('Get users share all done.Wating 5 min');
                    sleeptime(300000);
                    deferred.resolve(this.init());
                }
                if (user[0].pubshareCount == 0) {
                    //该用户无分享数据，递归
                    console.log(`${user[0].uk} share is 0`);
                    setShareFlag(user[0].uk, 0).then(() => {
                        deferred.resolve(this.init());
                    }).catch(err => callback(err, null));
                } else {
                    //根据用户数据生成连接
                    console.log('getWapShareTasks');
                    let urls = getWapShareTasks(user[0].uk, user[0].pubshareCount);
                    // console.log(urls);
                    async.mapLimit(urls, 3, (url, callback) => {
                        "use strict";
                        console.time('Get share wating');
                        sleeptime(500 + Math.round(Math.random() * 1000));
                        console.timeEnd('Get share wating');
                        getWapShare(url)
                            .then((shareDate) => {
                                if (shareDate == 'err' || shareDate == '') {
                                    callback(null, null);
                                } else {
                                    saveWapShare(shareDate);
                                    callback(null, null);
                                }
                            })
                            .catch(err => callback(err, null));
                    }, (err, result) => {
                        "use strict";
                        if (err) throw err;
                        console.log(`${user[0].uk} get share is finish.`);
                        setShareFlag(user[0].uk, 0).then(() => {
                            deferred.resolve(this.init());
                        }).catch(err => callback(err, null));
                    });
                }
            })
            .catch(err => console.log(err));
        return deferred.promise;
    }
};

module.exports.getWapShare = getWapShare;
module.exports.WapShareWorker = WapShareWorker;