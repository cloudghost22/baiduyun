/**
 * Created by lwy on 2017-04-06.
 */

let superagent = require('superagent');
let q = require('q');
let sleeptime = require('sleep-time');
let getUser = require('./save').getUser;
let saveShare = require('./save').saveShare;
let saveFollow = require('./save').saveFollow;
let saveFans = require('./save').saveFans;
let setShareFlag = require('./save').setShareFlag;
let async = require('async');
let log4js = require('log4js');

//日志设置
log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('logs/yun.log'), 'yun');
let logger = log4js.getLogger('yun');
logger.setLevel('Trace');

//###########http header#########
let options = {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Encoding': 'gzip, deflate, sdch, br',
    'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.6,en;q=0.4',
    'Connection': 'keep-alive',
    'Host': 'pan.baidu.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest'
};


//##########获取数据##############
//获取用户分享的信息
let ShareWorker = function () {
};

ShareWorker.prototype = {
    init: function () {
        let deferred = q.defer();
        //获取用户
        getUser(0)
            .then((user) => {
                if (user == '') {
                    throw ('Get users share all done.');
                }
                if (user[0].pubshareCount == 0) {
                    //该用户无分享数据，递归
                    console.log(`${user[0].uk} share is 0`);
                    setShareFlag(user[0].uk, 0).then(() => {
                        deferred.resolve(this.init());
                    }).catch(err => callback(err, null));
                } else {
                    //根据用户数据生成连接
                    console.log('getShareTasks');
                    let urls = getShareTasks(user[0].uk, user[0].pubshareCount);
                    async.mapLimit(urls, 1, (url, callback) => {
                        "use strict";
                        console.time('Get share wating');
                        sleeptime(1000 + Math.round(Math.random() * 4000));
                        console.timeEnd('Get share wating');
                        getShare(url)
                            .then((shareDate) => {
                                if (shareDate == 'err') {
                                    callback(null, null);
                                } else {
                                    saveShare(shareDate).then(() => {
                                        //数据保存后回调
                                        callback(null, null);
                                    }).catch(err => callback(err, null));
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

//生成获取分享任务
let getShareTasks = function (uk, total) {
    let shareTasks = [];
    let _uk = uk,
        _total = total,
        _pn = 0,
        _url = '',
        _timeStamp = (new Date()).valueOf();
    for (let i = 0; i < total; i += 60) {
        _url = `https://pan.baidu.com/pcloud/feed/getsharelist?t=${_timeStamp}&category=0&auth_type=1&request_location=share_home&start=${_pn}&limit=60&query_uk=${_uk}&channel=chunlei&clienttype=0&web=1`;
        shareTasks.push(_url);
        _pn += 60;
    }
    return shareTasks;
};

//获取分享数据
let getShare = function (url) {
    logger.trace(url);
    let deferred = q.defer();
    let uk = url.slice(url.indexOf('query_uk=') + 9, url.indexOf('&channel'));
    options.Referer = `https://pan.baidu.com/share/home?uk=${uk}`;
    options.Cookie=`PANWEB=1; BAIDUID=5A7C09B80B0F8719481880EB58EB1B2F:FG=1; Hm_lvt_7a3960b6f067eb0085b7f96ff5e660b0=${Math.round(((new Date()).valueOf())/1000)}; Hm_lpvt_7a3960b6f067eb0085b7f96ff5e660b0=${Math.round(((new Date()).valueOf())/1000)}`;
    superagent
        .get(url)
        .set(options)
        .end((err, res) => {
            "use strict";
            if (err) deferred.reject(err);
            let json = JSON.parse(res.text);
            let jsonTemp = parseShareJson(json);
            if (jsonTemp == 'err') {
                console.log(`${url} request error.`);
                setTimeout(() => {
                    deferred.resolve('err');
                }, 600000);

            } else {
                deferred.resolve(jsonTemp);
            }
        });
    return deferred.promise;
};

//获取用户订阅的信息
let FollowWorker = function () {
};

FollowWorker.prototype = {
    init: function () {
        let deferred = q.defer();
        getUser(1).then((user) => {
            "use strict";
            if (user[0].followCount == 0) {
                //该用户无订阅数据，递归
                console.log(`${user[0].uk} follow is 0`);
                setShareFlag(user[0].uk, 1)
                    .then(() => {
                        deferred.resolve(this.init());
                    })
                    .catch(err => console.log(err));
            } else {
                //根据用户数据生成连接
                console.log('getFollowTasks');
                let urls = getFollowTasks(user[0].uk, user[0].followCount);
                // console.log(urls);
                async.mapLimit(urls, 1, (url, callback) => {
                    "use strict";
                    console.time('Get follow wating');
                    sleeptime(1000 + Math.round(Math.random() * 3000));
                    console.timeEnd('Get follow wating');
                    getFollow(url)
                        .then((followDate) => {
                            console.log('saveFollow');
                            if (followDate == 'err') {
                                callback(null, null);
                            } else {
                                saveFollow(followDate).then(() => {
                                    //数据保存后回调
                                    callback(null, null);
                                }).catch(err => callback(err, null));
                            }
                        })
                        .catch(err => callback(err, null));
                }, (err, result) => {
                    "use strict";
                    if (err) throw err;
                    setShareFlag(user[0].uk, 1)
                        .then(() => {
                            console.log(`${user[0].uk} get follow is finish.`);
                            deferred.resolve(this.init());
                        })
                        .catch(err => console.log(err));

                });
            }
        }).catch(err => console.log(err));

    }
};

//生成获取订阅任务
let getFollowTasks = function (uk, total) {
    let followTasks = [];
    let _uk = uk,
        _total = total > 2400 ? 2400 : total,
        _pn = 0,
        _url = '';
    for (let i = 0; i < _total; i += 24) {
        _url = `https://pan.baidu.com/pcloud/friend/getfollowlist?query_uk=${_uk}&limit=24&start=${_pn}&bdstoken=null&channel=chunlei&clienttype=0&web=1`;
        followTasks.push(_url);
        _pn += 24;
    }
    return followTasks;
};

//获取订阅数据
let getFollow = function (url) {
    logger.trace(url);
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
            let jsonTemp = parseFollowJson(json);
            if (jsonTemp == 'err') {
                console.log(`${url} request error.`);
                setTimeout(() => {
                    deferred.resolve('err');
                }, 600000);

            } else {
                deferred.resolve(jsonTemp);
            }
        });
    return deferred.promise;
};

//获取用户fans的信息
let FansWorker = function () {
};

FansWorker.prototype = {
    init: function () {
        let deferred = q.defer();
        getUser(2).then((user) => {
            "use strict";
            if (user[0].fansCount == 0) {
                //该用户无订阅数据，递归
                console.log(`${user[0].uk} fans is 0`);
                setShareFlag(user[0].uk, 2).then(() => {
                    deferred.resolve(this.init());
                }).catch(err => console.log(err));

            } else {
                //根据用户数据生成连接
                let urls = getFansTasks(user[0].uk, user[0].fansCount);
                async.mapLimit(urls, 1, (url, callback) => {
                    "use strict";
                    console.time('Get fans wating');
                    sleeptime(500 + Math.round(Math.random() * 1000));
                    console.timeEnd('Get fans wating');
                    // console.log(url);
                    getFans(url)
                        .then((fansDate) => {
                            // console.log(fansDate);
                            if (fansDate == 'err') {
                                callback(null, null);
                            } else {
                                saveFans(fansDate).then(() => {
                                    //数据保存后回调
                                    callback(null, null);
                                }).catch(err => callback(err, null));
                            }

                        })
                        .catch(err => callback(err, null));
                }, (err, result) => {
                    "use strict";
                    if (err) throw err;
                    console.log(`${user[0].uk} get fans is finish.`);
                    setShareFlag(user[0].uk, 2).then(() => {
                        deferred.resolve(this.init());
                    }).catch(err => console.log(err));

                });
            }
        }).catch(err => console.log(err));

    }
};

//生成获取粉丝任务
let getFansTasks = function (uk, total) {
    let fansTasks = [];
    let _uk = uk,
        _total = total > 2400 ? 2400 : total,
        _pn = 0,
        _url = '';
    for (let i = 0; i < _total; i += 24) {
        _url = `https://pan.baidu.com/pcloud/friend/getfanslist?query_uk=${_uk}&limit=24&start=${_pn}&bdstoken=null&channel=chunlei&clienttype=0&web=1`;
        fansTasks.push(_url);
        _pn += 24;
    }
    return fansTasks;
};

//获取粉丝数据
let getFans = function (url) {
    logger.trace(url);
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
            let jsonTemp = parseFansJson(json);
            if (jsonTemp == 'err') {
                console.log(`${url} request error.`);
                logger.trace(`${url} request error.`);
                setTimeout(() => {
                    deferred.resolve('err');
                }, 600000);

            } else {
                deferred.resolve(jsonTemp);
            }
        });
    return deferred.promise;
};

//##############解析数据####################
//解析分享json
let parseShareJson = function (json) {
    if (json.errno == 0) {
        // console.log(json.records.length);
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
    } else {
        logger.trace(json.errno);
        return 'err';
    }

};

//解析订阅json
let parseFollowJson = function (json) {
    if (json.errno == 0) {
        // console.log(json.follow_list.length);
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
    } else {
        logger.trace(json.errno);
        return 'err';
    }
};

//解析粉丝json
let parseFansJson = function (json) {
    if (json.errno == 0) {
        // console.log(json.fans_list.length);
        let userFans = [];
        let fanObj = {};
        for (let i = 0; i < json.fans_list.length; i++) {
            fanObj.fansCount = json.fans_list[i].fans_count;
            fanObj.followCount = json.fans_list[i].follow_count;
            fanObj.uk = json.fans_list[i].fans_uk;
            fanObj.userName = json.fans_list[i].fans_uname;
            fanObj.pubshareCount = json.fans_list[i].pubshare_count;
            userFans[i] = fanObj;
            fanObj = {};
        }
        return userFans;
    } else {
        logger.trace(json.errno);
        return 'err';
    }
};

//获取该用户所有任务
let getAllTasks = function (user) {
    let urls1 = getShareTasks(user[0].uk, user[0].pubshareCount);
    let urls2 = getFollowTasks(user[0].uk, user[0].followCount);
    let urls3 = getFansTasks(user[0].uk, user[0].fansCount);
    let urls = urls1.concat(urls2, urls3);
    urls = shuffle(urls);
    return urls;
};

//数组随机排序
let shuffle = function (arr) {
    var i,
        j,
        temp;
    for (i = arr.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
    return arr;
};

module.exports.ShareWorker = ShareWorker;
module.exports.FollowWorker = FollowWorker;
module.exports.FansWorker = FansWorker;
module.exports.getAllTasks = getAllTasks;
module.exports.getFansTasks = getFansTasks;
module.exports.getShareTasks = getShareTasks;
module.exports.getFollowTasks = getFollowTasks;
module.exports.getShare = getShare;
module.exports.getFans = getFans;
module.exports.getFollow = getFollow;