// create by lwy 2017/9/4
let superagent = require('superagent');
let q = require('q');
let sleeptime = require('sleep-time');
let async = require('async');
let cheerio = require('cheerio');
let albumUrlSave = require('./save').albumUrl;
let getAlbumUrls = require('./save').getAlbumUrls;
let saveAlbumShare = require('./save').saveAlbumShare;
let updateAlbumStatus = require('./save').updateAlbumStatus;

let setTime = 500 + Math.round(Math.random() * 1000);
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

//记录已读取记录数
let start = 1;
let updateNumber = 0;
let updateShareArr = [];
let albumArray = [];
let currentAlbumLink = '';
let errorUrlsArr = [];
let pageOne = true;
let albumIDs = [];

let getWapAlbumShare = function (url) {
    let deferred = q.defer();
    console.log('Getting the share link:' + url);
    superagent
        .get(url)
        .set(options)
        .end((err, res) => {
            "use strict";
            if (err) {
                console.log('err:' + err);
                console.log('Getting share error,url is:' + url);
                // errorUrlsArr.push(url);
                if (errorUrlsArr.length > 10) {
                    // console.log('errorUrlsArr length:'+errorUrlsArr.length);
                    // errorUrl(errorUrlsArr);
                    // errorUrlsArr = [];
                }
                deferred.resolve('err');
            }
            try {
                // console.log('res:'+res.text);
                let tempStr = res.text.substring(res.text.indexOf('window.yunData'));
                let temp = tempStr.substring(0,tempStr.indexOf('</script>'));
                temp = temp.replace(/ /g, '');
                temp = temp.substring(temp.indexOf('{"'), temp.indexOf('};')+1);
                temp = eval("(" + temp + ")");
                // console.log('temp.albumlist.count:' + temp.albumlist.count);
                deferred.resolve(parseWapAlbumShareJson(temp));
            } catch (e) {
                console.log('e:'+e);
                console.log('Getting share error,url is:' + url);
                errorUrlsArr.push(url);
                if (errorUrlsArr.length > 10) {
                    // console.log('errorUrlsArr length:'+errorUrlsArr.length);
                    // errorUrl(errorUrlsArr);
                    // errorUrlsArr = [];
                }
                deferred.resolve('err');
            }
        });
    return deferred.promise;
};

//解析分享json Album
let parseWapAlbumShareJson = function (json) {
    // console.log(json);
    //get all album links
    let albumCount = json.albuminfo.filecount; 
    if(pageOne){
        for(let i=20;i<albumCount;){
            let link = currentAlbumLink + `&page=${(i/20+1)}`;
            albumArray.push(link);    
            i += 20;
        }
        pageOne = false;
    }
    
    let fileList = json.albumlist.list;
    let album_id = json.albuminfo.album_id;
    let uk = json.uinfo.uk;
    let username = json.uinfo.uname;
    let userShare = [];
    let shareObj = {};
    for (let i = 0; i < fileList.length; i++) {
        shareObj.category = fileList[i].category;
        //share time
        shareObj.feed_time = fileList[i].add_time;
        shareObj.isdir = fileList[i].isdir;
        shareObj.server_filename = fileList[i].server_filename;
        shareObj.size = fileList[i].size;
        // shareObj.saveTime = json.records[i].filelist[0].time_stamp;
        shareObj.shareid = fileList[i].fs_id;
        shareObj.shorturl = album_id;
        // shareObj.shorturl = json.records[i].shorturl;
        shareObj.title = fileList[i].server_filename;
        shareObj.uk = uk;
        shareObj.username = username;
        userShare[i] = shareObj;
        shareObj = {};
    }
    // console.log(userShare);
    return userShare;
};

let AlbumWorker = function(){
};

AlbumWorker.prototype = {
    init: function () {
        let deferred = q.defer();
        //获取用户
        getAlbumUrls()
            .then((links) => {
                updateNumber += 10;
                if (links == '') {
                    console.log('Get album all done...');
                    updateNumber = 0;
                    deferred.resolve('ok');
                }else{
                    let linksArr = [];
                    for (let i of links) {
                        linksArr.push(i);
                    }
                    // console.log(urls);
                    async.mapLimit(linksArr, 1, (u, callback) => {
                        "use strict";
                        currentAlbumLink = u.url;
                        albumIDs.push(u.id);
                        pageOne = true;
                        start = 1;
                        console.log('Getting album start:' + new Date().toLocaleString());
                        let url = `${u.url}&page=${start}`;
                        albumShare(url)
                        .then(result => {
                            // console.log(result);
                            callback(null, null);
                        })
                        .catch(err => callback(err, null));
                    }, (err, result) => {
                        "use strict";
                        if (err) throw err;
                        console.log(`${updateNumber} albums is finish.`);
                        updateAlbumStatus(albumIDs).then(()=>{
                            albumIDs = [];
                            deferred.resolve(this.init());
                        }).catch(err => callback(err, null));
                    });     
                }     
            })
            .catch(err => console.log(err));
        return deferred.promise;
    }
};

let albumShare = function (url) {
    let deferred = q.defer();
    let originUrl = url;
    setTimeout(() => {
        getWapAlbumShare(url)
            .then((shareDate) => {
                // console.log(shareDate);
                if (shareDate == 'err' || shareDate == '') {
                    deferred.resolve('err');
                } else {
                    for (let i of shareDate) {
                        updateShareArr.push(i);
                    }
                    if (updateShareArr.length >= 40) {
                        console.log('Save album share...');
                        saveAlbumShare(updateShareArr);
                        updateShareArr = [];
                    }
                    if(albumArray.length>0){
                        let link = albumArray.shift();
                        albumShare(link)
                            .then(res=>{
                                deferred.resolve('ok');
                            });
                    }else{
                        deferred.resolve('ok');
                    }
                }
            })
            .catch(err => console.log(err));
    }, setTime);
    return deferred.promise;
};

module.exports.AlbumWorker = AlbumWorker;
module.exports.getWapAlbumShare = getWapAlbumShare;