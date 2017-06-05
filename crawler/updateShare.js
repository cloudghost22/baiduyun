/**
 * Created by linweiyun on 2017/6/1.
 */

let superagent = require('superagent');
let q = require('q');
let async = require('async');
let cheerio = require('cheerio');
let getUpdateUser = require('./save').getUpdateUser;
let saveWapShare = require('./save').saveWapShare;
let saveUpdateUsers = require('./save').saveUpdateUsers;
let albumUrlSave = require('./save').albumUrlSave;
let errorUrl = require('./save').errorUrl;

//set the time
let setTime = 1000 + Math.round(Math.random() * 1000);
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

let updateShareArr = [];
let updateUserArr = [];
let errorUrlsArr = [];
let album = [];
let updateNumber = 49199;
let start = 0;
let updateUserNumber = 0;
let updateDateFrom = Date.parse(new Date('2017-04-28'));

let getWapShareUpdate = function (url) {
    let deferred = q.defer();
    console.log('Getting wap share update,url is:' + url);
    superagent
        .get(url)
        .set(options)
        .end((err, res) => {
            "use strict";
            if (err) {
                console.log(err);
                console.log('Getting wap share update error,url is:' + url);
                errorUrlsArr.push(url);
                if (errorUrlsArr.length > 10) {
                    // console.log('errorUrlsArr length:'+errorUrlsArr.length);
                    errorUrl(errorUrlsArr);
                    errorUrlsArr = [];
                }
                deferred.resolve('err');
            }
            try {
                // console.log(res.text);
                let tempStr = res.text.substring(res.text.indexOf('window.yunData'));
                let temp = tempStr.substring(0, tempStr.indexOf('</script>'));
                temp = temp.replace(/ /g, '');
                temp = temp.substring(temp.indexOf('{"'), temp.indexOf('};') + 1);
                temp = eval("(" + temp + ")");
                deferred.resolve(parseWapShareUpdateJson(temp.feedata));
            } catch (e) {
                console.log(e);
                console.log('Getting wap share update error,url is:' + url);
                errorUrlsArr.push(url);
                if (errorUrlsArr.length > 10) {
                    // console.log('errorUrlsArr length:'+errorUrlsArr.length);
                    errorUrl(errorUrlsArr);
                    errorUrlsArr = [];
                }
                deferred.resolve('err');
            }
        });
    return deferred.promise;
};

//解析分享json
let parseWapShareUpdateJson = function (json) {
    let tempUk = json.records[0].uk;
    let flagUK = false;
    if (tempUk) {
        for (let i of updateUserArr) {
            if (i.uk == tempUk) {
                flagUK = true;
                break;
            }
        }
    }
    if (!flagUK) {
        let updateUserObj = new Object();
        updateUserObj.uk = tempUk;
        updateUserObj.totalCount = json.total_count;
        updateUserArr.push(updateUserObj);
    }
    let userShare = [];
    let shareObj = {};
    for (let i = 0; i < json.records.length; i++) {
        if (json.records[i].feed_type == 'share') {
            shareObj.category = json.records[i].category;
            shareObj.feed_time = json.records[i].feed_time;
            if (json.records[i].filelist[0]) {
                shareObj.isdir = json.records[i].filelist[0].isdir;
                shareObj.server_filename = json.records[i].filelist[0].server_filename;
                shareObj.size = json.records[i].filelist[0].size;
            }
            // shareObj.saveTime = json.records[i].filelist[0].time_stamp;
            shareObj.shareid = json.records[i].shareid;
            // shareObj.shorturl = json.records[i].shorturl;
            shareObj.title = json.records[i].title;
            shareObj.uk = json.records[i].uk;
            shareObj.username = json.records[i].username;
            userShare.push(shareObj);
            shareObj = {};
        } else if (json.records[i].feed_type == 'album') {
            let albumUrl = `https://pan.baidu.com/wap/album/info?uk=${json.records[i].uk}&third=0&album_id=${json.records[i].album_id}`;
            albumUrlSave(new Array(albumUrl));
        }
    }
    // console.log(userShare);
    return userShare;
};

//getting the wap update
let WapShareUpdateWorker = function () {
};
let shareCounter = 0;
WapShareUpdateWorker.prototype = {
    init: function () {
        let deferred = q.defer();
        //获取用户
        getUpdateUser(updateNumber)
            .then((user) => {
                //console.log(user);
                updateNumber += 5;
                if (user == '') {
                    console.log('Get users share all done.Wating 10 min');
                    // sleeptime(300000);
                    setTimeout(() => {
                        deferred.resolve(this.init());
                    }, 600000);
                }
                if (user[0].pubshareCount == 0) {
                    //该用户无分享数据，递归
                    console.log(`${user[0].uk} share is 0`);
                    setShareFlag(user[0].uk, 0).then(() => {
                        deferred.resolve(this.init());
                    }).catch(err => callback(err, null));
                } else {
                    let usersArr = [];
                    for (let i of user) {
                        usersArr.push(i);
                    }
                    // console.log(urls);
                    async.mapLimit(usersArr, 1, (u, callback) => {
                        "use strict";
                        start = 0;
                        console.log('Getting share update start:' + new Date().toLocaleString());
                        let url = `https://pan.baidu.com/wap/share/home?third=0&uk=${u.uk}&start=${start}`;
                        updateUserShare(url)
                            .then(result => {
                                // console.log(result);
                                callback(null, null);
                            })
                            .catch(err => callback(err, null));
                    }, (err, result) => {
                        "use strict";
                        if (err) throw err;
                        console.log(`${updateNumber} share update is finish.`);
                        saveUpdateUsers(updateUserArr).then(() => {
                            updateUserArr = [];
                            deferred.resolve(this.init());
                        }).catch(err => callback(err, null));
                    });
                }
            })
            .catch(err => console.log(err));
        return deferred.promise;
    }
};


let updateUserShare = function (url) {
    let deferred = q.defer();
    let originUrl = url;
    setTimeout(() => {
        getWapShareUpdate(url)
            .then((shareDate) => {
                // console.log(shareDate);
                if (shareDate == 'err' || shareDate == '') {
                    deferred.resolve('err');
                } else {
                    for (let i of shareDate) {
                        if (i.feed_time.toString().length == 13 && i.feed_time > updateDateFrom) {
                            updateShareArr.push(i);
                            updateUserNumber += 1;
                        } else if (i.feed_time.toString().length == 10 && i.feed_time > (updateDateFrom / 1000)) {
                            updateShareArr.push(i);
                            updateUserNumber += 1;

                        }
                    }
                    if (updateShareArr.length > 100) {
                        console.log('Save share update...');
                        saveWapShare(updateShareArr, 'share_update');
                        updateShareArr = [];
                    }
                    if (shareDate[shareDate.length-1].feed_time.toString() > updateDateFrom) {
                        start += 20;
                        let uk = originUrl.substring(originUrl.indexOf('uk=') + 3, originUrl.indexOf('&start'));
                        let url = `https://pan.baidu.com/wap/share/home?third=0&uk=${uk}&start=${start}`;
                        updateUserShare(url)
                            .then(res=>{
                                deferred.resolve('ok');
                            });
                    } else {
                        start = 0;
                        let uk = originUrl.substring(originUrl.indexOf('uk=') + 3, originUrl.indexOf('&start'));
                        for (let i = updateUserArr.length - 1; i >= 0; i--) {
                            if (updateUserArr[i].uk == uk) {
                                updateUserArr[i].updateNumber = updateUserNumber;
                                break;
                            }
                        }
                        updateUserNumber = 0;
                        deferred.resolve('ok');
                    }
                }
            })
            .catch(err => console.log(err));
    }, setTime);
    return deferred.promise;
};

module.exports.WapShareUpdateWorker = WapShareUpdateWorker;
module.exports.getWapShareUpdate = getWapShareUpdate;