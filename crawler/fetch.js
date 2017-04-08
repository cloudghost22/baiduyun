/**
 * Created by lwy on 2017-04-06.
 */

let cheerio = require('cheerio');
let superagent = require('superagent');

let options = {
    'Accept':'application/json, text/javascript, */*; q=0.01',
    'Accept-Encoding':'gzip, deflate, sdch, br',
    'Accept-Language':'zh-CN,zh;q=0.8,zh-TW;q=0.6,en;q=0.4',
    'Connection':'keep-alive',
    'Host':'pan.baidu.com',
    'Referer':'https://pan.baidu.com/share/home?uk=608138975',
    'User-Agent':'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
    'X-Requested-With':'XMLHttpRequest'
};

let userShare = [];
let shareObj = {};

let getUrl = (uk, viewType) => {
    "use strict";
    return `https://pan.baidu.com/share/home?uk=${uk}&view=${viewType}`;
};

let getShare = function (uk,perPage,pn) {
    let url = `https://pan.baidu.com/pcloud/feed/getsharelist?t=1491536771052&category=0&auth_type=1&request_location=share_home&start=${pn}&limit=${perPage}&query_uk=${uk}&channel=chunlei&clienttype=0&web=1`;
    options.Referer = `https://pan.baidu.com/share/home?uk=${uk}`;
    superagent
        .get(url)
        .set(options)
        .end((err, res) => {
            "use strict";
            if (err) throw err;
            let json = JSON.parse(res.text);
            parseJson(json);
            console.log(userShare[0]);
        });
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
    if(json.errno == 0){
        let total_count = json.total_count;
        for(let i=0;i<json.records.length;i++){
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

    }
}
module.exports.getShare = getShare;