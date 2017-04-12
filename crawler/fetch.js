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
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest'
};


//获取用户分享的信息
let ShareWorker = function () {
};

ShareWorker.prototype = {
    init: function () {
        let deferred = q.defer();
        //获取用户
        getUser()
            .then((user) => {
                if (user == '') {
                    throw ('Get users share all done.');
                }
                if (user[0].pubshareCount == 0) {
                    //该用户无分享数据，递归
                    console.log(`${user[0].uk} share is 0`);
                    setShareFlag(user[0].uk)
                        .then(() => {
                            deferred.resolve(this.init());
                        })
                        .catch(err => console.log(err));
                } else {
                    //根据用户数据生成连接
                    // console.log('getShareTasks');
                    let urls = getShareTasks(user[0].uk, user[0].pubshareCount);
                    async.mapLimit(urls, 1, (url, callback) => {
                        "use strict";
                        console.time('Get share wating');
                        sleeptime(1000 + Math.round(Math.random() * 5000));
                        console.timeEnd('Get share wating');
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
                                console.log(`${user[0].uk} get share is finish.`);
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

//生成获取分享任务
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

//获取分享数据
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
            deferred.resolve(parseShareJson(json));
        });
    return deferred.promise;
};

//生成获取订阅任务
let getFollowTasks = function (uk, total) {
    let followTasks = [];
    let _uk = uk,
        _total = total,
        _pn = 0,
        _url = '';
    for (let i = 0; i < total; i += 24) {
        _url = `https://pan.baidu.com/pcloud/friend/getfollowlist?query_uk=${_uk}&limit=24&start=${_pn}&bdstoken=null&channel=chunlei&clienttype=0&web=1`;
        followTasks.push(_url);
        _pn += 24;
    }
    return shareTasks;
};

//获取订阅数据
let getFollow = function (url) {
    let deferred = q.defer();
    let uk = url.slice(url.indexOf('query_uk=') + 9, url.indexOf('&limit'));
    options.Referer = `https://pan.baidu.com/pcloud/friendpage?type=follow&uk=${uk}&self=0`;
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

//生成获取粉丝任务
let getFansTasks = function (uk, total) {
    let fansTasks = [];
    let _uk = uk,
        _total = total,
        _pn = 0,
        _url = '';
    for (let i = 0; i < total; i += 24) {
        _url = `https://pan.baidu.com/pcloud/friend/getfanslist?query_uk=${_uk}&limit=24&start=${_pn}&bdstoken=null&channel=chunlei&clienttype=0&web=1`;
        fansTasks.push(_url);
        _pn += 24;
    }
    return shareTasks;
};

//获取粉丝数据
let getFans = function (url) {
    let deferred = q.defer();
    let uk = url.slice(url.indexOf('query_uk=') + 9, url.indexOf('&limit'));
    options.Referer = `https://pan.baidu.com/pcloud/friendpage?type=fans&uk=${uk}&self=0`;
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

//解析分享json
let parseShareJson = function (json) {
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
            shareObj = {};
        }
        return userShare;
    }
    return 'errno:' + json.errno;
};

//解析订阅json
let parseFollowJson = function (json) {
    if (json.errno == 0) {
        console.log(json.follow_list.length);
        let userFollow = [];
        let followObj = {};
        for (let i = 0; i < json.follow_list.length; i++) {
            followObj.fansCount = json.follow_list[i].fans_count;
            followObj.followCount = json.follow_list[i].follow_count;
            followObj.uk = json.follow_list[i].follow_uk;
            followObj.userName = json.follow_list[i].follow_uname;
            followObj.pubshareCount = json.follow_list[i].pubshare_count;
            userFollow[i] = followObj;
            followObj = {};
        }
        return userFollow;
    }
    return 'errno:' + json.errno;
};

//解析粉丝json
let parseFansJson = function (json) {
    if (json.errno == 0) {
        console.log(json.fans_list.length);
        let userFans = [];
        let fanObj = {};
        for (let i = 0; i < json.fans_list.length; i++) {
            fanObj.fansCount = json.fans_list[i].fans_count;
            fanObj.followCount = json.fans_list[i].follow_count;
            fanObj.uk = json.follow_list[i].fans_uk;
            fanObj.userName = json.fans_list[i].fans_uname;
            fanObj.pubshareCount = json.fans_list[i].pubshare_count;
            userFans[i] = fanObj;
            fanObj = {};
        }
        return userFans;
    }
    return 'errno:' + json.errno;
};

module.exports.ShareWorker = ShareWorker;