/**
 * Created by lwy on 2017-04-06.
 */

let async = require('async');
let FollowWorker = require('./crawler/fetch').FollowWorker;
let FansWorker = require('./crawler/fetch').FansWorker;
let WapShareWorker = require('./crawler/wapFetch').WapShareWorker;
let updateErrorUrls = require('./crawler/save').updateErrorUrls;
let getErrorUrls = require('./crawler/save').getErrorUrls;
let q = require('q');
let sleeptime = require('sleep-time');
let ShareWorker = require('./crawler/fetch').ShareWorker;
let getUser = require('./crawler/save').getUser;
let saveShare = require('./crawler/save').saveShare;
let saveFollow = require('./crawler/save').saveFollow;
let saveFans = require('./crawler/save').saveFans;
let getAllTasks = require('./crawler/fetch').getAllTasks;
let getFollow = require('./crawler/fetch').getFollow;
let getShare = require('./crawler/fetch').getShare;
let getFans = require('./crawler/fetch').getFans;
let setShareFlag = require('./crawler/save').setShareFlag;
let getFollowTasks = require('./crawler/fetch').getFollowTasks;
let getShareTasks = require('./crawler/fetch').getShareTasks;
let getFansTasks = require('./crawler/fetch').getFansTasks;
let saveWapShare = require('./crawler/save').saveWapShare;
let getWapShare = require('./crawler/wapFetch').getWapShare;
let getWapAlbumShare = require('./crawler/wapFetch').getWapAlbumShare;
let WapShareUpdateWorker = require('./crawler/updateShare').WapShareUpdateWorker;
let getWapShareUpdate = require('./crawler/updateShare').getWapShareUpdate;
let getHotFromDouban = require('./crawler/getHot').getHotFromDouban;
let saveHot = require('./crawler/save').saveHot;
let getHotFromBaidu = require('./crawler/getHot').getHotFromBaidu;

// getHotFromBaidu(0).then((res)=>{
//     saveHot(res);
// });

/*let getHotAll = function () {
    return q.all([getHotFromBaidu(0),getHotFromBaidu(1),getHotFromBaidu(2),getHotFromBaidu(3),getHotFromBaidu(4),getHotFromBaidu(5)])
        .then(res=>{
            saveHot(res);
        });
};

getHotAll();*/

/*getHotFromDouban('tv')
    .then((res)=>{
      saveHot(res);
    });*/


//set the time
// let setTime = 5000 + Math.round(Math.random() * 1000);

//let wapShareWorker = new WapShareWorker();
 let followWorker = new FollowWorker();
// let fansWorker = new FansWorker();

//wapShareWorker.init();

//
 followWorker.init();

//fansWorker.init();


let wapShareUpdateWorker = new WapShareUpdateWorker();
wapShareUpdateWorker.init();
// getWapShareUpdate('https://pan.baidu.com/wap/share/home?uk=1426671309&start=0').then(res=>console.log(res)).catch(err=>console.log(err));

/*//####################################################################################################
let ErrorUrls = function () {
    let self = this;
};
ErrorUrls.prototype = {
    begin: function () {
        let deferred = q.defer();
        getErrorUrls()
            .then((result) => {
                if (result != '') {
                    let urlArr = [];
                    let idArr = [];
                    for (let i of result) {
                        urlArr.push(i.url);
                        idArr.push(i.ID);
                    }
                    async.mapLimit(urlArr, 1, (url, callback) => {
                        if (url.indexOf('album') < 0) {
                            setTimeout(() => {
                                console.log('Get errorurls start:' + new Date().toLocaleString());
                                getWapShare(url)
                                    .then((data) => {
                                        saveWapShare(data)
                                            .then((res) => {
                                                callback(null, null);
                                            })
                                            .catch(err => console.log(err));
                                    })
                                    .catch(err => console.log(err));
                            }, setTime);
                        }
                        else {
                            setTimeout(() => {
                                console.log('Get errorurls start:' + new Date().toLocaleString());
                                getWapAlbumShare(url)
                                    .then((data) => {
                                        saveWapShare(data)
                                            .then((res) => {
                                                callback(null, null);
                                            })
                                            .catch(err => console.log(err));
                                    })
                                    .catch(err => console.log(err));
                            }, setTime);
                        }
                    }, (err, res) => {
                        if (err) throw err;
                        updateErrorUrls(idArr)
                            .then(() => {
                                console.log('ok');
                                deferred.resolve(this.begin());
                            });
                    });
                }
                else {
                    console.log('Get errorurls  all done.Wating 5 min');
                    // sleeptime(300000);
                    setTimeout(() => {
                        deferred.resolve(this.begin());
                    }, 300000);
                }
            })
            .catch(err => console.log(err));
        return deferred.promise;
    }
};

let errorUrls = new ErrorUrls();

let wapShareWorker = new WapShareWorker();
let followWorker = new FollowWorker();
let fansWorker = new FansWorker();

async.parallel([
    function () {
        wapShareWorker.init();
    },
    function () {
        followWorker.init();
    },
    function () {
        fansWorker.init();
    },
    function () {
        errorUrls.begin();
    }
], (err, result) => {
    "use strict";
    if (err) throw err;
    console.log(result);
});


//####################################################################################################*/



/*getFollow('https://pan.baidu.com/pcloud/friend/getfollowlist?query_uk=3292618829&limit=24&start=1128&bdstoken=null&channel=chunlei&clienttype=0&web=1')
 .then((data)=>{
 console.log(data);
 saveFollow(data);
 });*/

/*getFans('https://pan.baidu.com/pcloud/friend/getfanslist?query_uk=2469870276&limit=24&start=1128&bdstoken=null&channel=chunlei&clienttype=0&web=1')
 .then((data)=>{
 console.log(data);
 saveFans(data);
 });*/

/* getWapShare('https://pan.baidu.com/wap/share/home?third=0&uk=774603158')
 .then((data)=>{
 // console.log(data);
 saveWapShare(data);
 });*/

/*
getWapAlbumShare('https://pan.baidu.com/wap/album/info?uk=824179360&third=0&album_id=4842558800517786049')
 .then((data)=>{
 // console.log(data);
 saveWapShare(data);
 });
*/

/*let wapShareWorker = new WapShareWorker();
 wapShareWorker.init();*/

// getWapShare('https://pan.baidu.com/wap/share/home?uk=608138975');

/*let test = function () {
 let deferred = q.defer();
 getUser().then((user) => {
 "use strict";
 let tasks = getAllTasks(user);
 async.mapLimit(tasks, 2, (url, callback) => {
 if (url.indexOf('getsharelist') > 0) {
 console.log(url);
 console.time('Get share wating');
 sleeptime(500 + Math.round(Math.random() * 1000));
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
 } else if (url.indexOf('getfollowlist') > 0) {
 console.log(url);
 console.time('Get follow wating');
 sleeptime(1000 + Math.round(Math.random() * 3000));
 console.timeEnd('Get follow wating');
 getFollow(url)
 .then((followDate) => {
 // console.log(saveFollow);
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
 } else {
 console.log(url);
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
 }
 }, (err, result) => {
 if (err) throw err;
 setShareFlag(user[0].uk)
 .then(() => {
 console.log(`${user[0].uk} is finish.`);
 deferred.resolve(test());
 })
 .catch(err => console.log(err));

 })
 });
 return deferred.promise;
 };

 test();*/

/*let shareWorker = new ShareWorker();
 let followWorker = new FollowWorker();
 let fansWorker = new FansWorker();


 let AllWork = function () {
 };

 AllWork.prototype = {
 begin: function () {
 //获取用户分享数据
 let deferred = q.defer();
 shareWorker.init()
 .then((user) => {
 "use strict";
 //获取用户粉丝数据
 fansWorker.init(user)
 .then((user) => {
 //获取用户订阅数据
 followWorker.init(user)
 .then(() => {
 deferred.resolve(this.begin());
 })
 .catch(err => console.log('followWorker' + err));
 })
 .catch(err => console.log('fansWorker' + err));
 })
 .catch(err => console.log('shareWorker' + err));
 return deferred.promise;
 }
 };

 let allWork = new AllWork();
 allWork.begin();*/
