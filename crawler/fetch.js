/**
 * Created by lwy on 2017-04-06.
 */

let cheerio = require('cheerio');
let superagent = require('superagent');
let q = require('q');
let sleeptime = require('sleep-time');
let getUser = require('./save').getUser;
let saveShare = require('./save').saveShare;
let setShareFlag = require('./save').setShareFlag;
let async = require('async');

//http header
let options = {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Encoding': 'gzip, deflate, sdch, br',
    'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.6,en;q=0.4',
    'Connection': 'keep-alive',
    'Host': 'pan.baidu.com',
    'Referer': 'https://pan.baidu.com/share/home?uk=608138975',
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest'
};


let getUrl = (uk, viewType) => {
    "use strict";
    return `https://pan.baidu.com/share/home?uk=${uk}&view=${viewType}`;
};

let ShareWorker = function () {
};

ShareWorker.prototype = {
    init: function () {
        let deferred = q.defer();
        //获取用户
        getUser()
            .then((user) => {
                if (user == '') {
                    throw ('all done.');
                }
                if (user[0].pubshareCount == 0) {
                    //该用户无分享数据，递归
                    console.log(`${user[0].uk} share count is 0`);
                    deferred.resolve(this.init());
                } else {
                    //根据用户数据生成连接
                    // console.log('getShareTasks');
                    let urls = getShareTasks(user[0].uk, user[0].pubshareCount);
                    async.mapLimit(urls, 1, (url, callback) => {
                        "use strict";
                        console.time('wating');
                        sleeptime(1000 + Math.round(Math.random() * 9000));
                        console.timeEnd('wating');
                        getShare(url)
                            .then((shareDate) => {
                                saveShare(shareDate).then(() => {
                                    //数据保存后回调
                                    callback(null, null);
                                }).catch(err => callback(err, null));
                            })
                            .catch(err => callback(err, null));
                    }, (err, result) => {
                        "use strict";
                        if (err) throw err;
                        setShareFlag(user[0].uk)
                            .then(() => {
                                console.log(`${user[0].uk} is finish.`);
                                deferred.resolve(this.init());
                            })
                            .catch(err => console.log(err));

                    });
                }
            })
            .catch(err => console.log(err));
        return deferred.promise;
    }
}

let getShareTasks = function (uk, total) {
    let shareTasks = [];
    let _uk = uk,
        _total = total,
        _pn = 0,
        _url = '';
    for (let i = 0; i < total; i += 60) {
        _url = `https://pan.baidu.com/pcloud/feed/getsharelist?t=1491962358545&category=0&auth_type=1&request_location=share_home&start=${_pn}&limit=60&query_uk=${_uk}&channel=chunlei&clienttype=0&web=1`;
        shareTasks.push(_url);
        _pn += 60;
    }
    return shareTasks;
};

let getShare = function (url) {
    let deferred = q.defer();
    let uk = url.slice(url.indexOf('query_uk=') + 9, url.indexOf('&channel'));
    options.Referer = `https://pan.baidu.com/share/home?uk=${uk}`;
    superagent
        .get(url)
        .set(options)
        .end((err, res) => {
            "use strict";
            if (err) deferred.reject(err);
            let json = JSON.parse(res.text);
            deferred.resolve(parseJson(json));
        });
    return deferred.promise;
};


let getFollow = function (uk) {
    let viewType = 'follow';
    let url = getUrl(uk, viewType);
};

let getFans = function (uk) {
    let viewType = 'fans';
    let url = getUrl(uk, viewType);
};

let parseJson = function (json) {
    if (json.errno == 0) {
        console.log(json.records.length);
        let userShare = [];
        let shareObj = {};
        for (let i = 0; i < json.records.length; i++) {
            shareObj.category = json.records[i].category;
            shareObj.feed_time = json.records[i].feed_time;
            shareObj.isdir = json.records[i].filelist[0].isdir;
            shareObj.server_filename = json.records[i].filelist[0].server_filename;
            shareObj.size = json.records[i].filelist[0].size;
            shareObj.saveTime = json.records[i].filelist[0].time_stamp;
            shareObj.shareid = json.records[i].shareid;
            shareObj.shorturl = json.records[i].shorturl;
            shareObj.title = json.records[i].title;
            shareObj.uk = json.records[i].uk;
            shareObj.username = json.records[i].username;
            userShare[i] = shareObj;
            shareObj={};
        }
        return userShare;
    }
    return 'errno:' + json.errno;
};

module.exports.ShareWorker = ShareWorker;