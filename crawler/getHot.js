/**
 * Created by linweiyun on 2017/6/15.
 */
let superagent = require('superagent');
let q = require('q');
let async = require('async');
let cheerio = require('cheerio');
require('superagent-charset')(superagent);


//###########http header#########
let options = {
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, sdch, br',
    'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.6,en;q=0.4',
    'Connection': 'keep-alive',
    'Host': 'movie.douban.com',
    'Referer': 'https://movie.douban.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest'
};

let optionsBaidu = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, sdch',
    'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.6,en;q=0.4',
    'Cache-Control':'max-age=0',
    'Connection': 'keep-alive',
    'Host': 'top.baidu.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.81 Safari/537.36',
    'Upgrade-Insecure-Requests': '1'
};

let getHotFromDouban = function (type) {
    let deferred = q.defer();
    let movieUrl = 'https://movie.douban.com/j/search_subjects?type=movie&tag=%E7%83%AD%E9%97%A8&page_limit=40&page_start=0';
    let tvUrl = 'https://movie.douban.com/j/search_subjects?type=tv&tag=%E7%83%AD%E9%97%A8&page_limit=40&page_start=0';
    let link = type == 'movie' ? movieUrl : tvUrl;
    console.log('Getting the hot top');
    superagent
        .get(link)
        .set(options)
        .end((err, res) => {
            // console.log(res.text);
            let temp = parseHot(eval("(" + res.text + ")"), type);
            deferred.resolve(temp);
        });
    return deferred.promise;
};

//解析分享json
let parseHot = function (json, type) {
    // console.log(json);
    let top = [];
    let topObj = {};
    for (let i = 0; i < json.subjects.length; i++) {
        topObj.cover = json.subjects[i].cover;
        topObj.rate = json.subjects[i].rate;
        topObj.title = json.subjects[i].title;
        topObj.type = type;
        top.push(topObj);
        topObj = {};

    }
    // console.log(top);
    return top;
};

let getHotFromBaidu = function () {
    let deferred = q.defer();
    let xiaoshuo = 'http://top.baidu.com/buzz?b=7&c=10&fr=topcategory_c10';
    // let link = type == 'movie' ? movieUrl : tvUrl;
    console.log('Getting the hot top');
    superagent
        .get(xiaoshuo)
        .charset('gb2312')
        .set(optionsBaidu)
        .end((err, res) => {
            console.log(res.text);
            // let temp = parseHot(eval("(" + res.text + ")"), type);
            deferred.resolve();
        });
    return deferred.promise;
};


module.exports.getHotFromDouban = getHotFromDouban;
module.exports.getHotFromBaidu = getHotFromBaidu;