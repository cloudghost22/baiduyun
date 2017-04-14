/**
 * Created by lwy on 2017-04-10.
 */

let mysql = require("mysql");
let dbConfig = require("../package.json").mysql;
let q = require('q');

let pool = mysql.createPool(dbConfig);

//获取未爬取的用户
let getUser = function (flag=0) {
    //flag 0:pubshareCount 1:followCount 2:fansCount
    let arr = ['pubshareCount','followCount','fansCount'];
    let flagArr = ['shareFlag','followFlag','fansFlag'];
    let deferred = q.defer();
    pool.getConnection((err, conn) => {
        "use strict";
        if (err) deferred.reject(err);
        conn.query(`select * from users where ${flagArr[flag]} = 0 order by ${arr[flag]} desc LIMIT 1;`, (err, result) => {
            conn.release();
            deferred.resolve(result);
        });
    });
    return deferred.promise;
};

//修改状态为已爬取
let setShareFlag = function (uk,flag=0) {
    //flag 1:pubshareCount 2:followCount 4:fansCount
    let deferred = q.defer();
    let flagArr = ['shareFlag','followFlag','fansFlag'];
    pool.getConnection((err, conn) => {
        "use strict";
        if (err) deferred.reject(err);
        conn.query(`update users set ${flagArr[flag]} = 1 where uk = '${uk}';`, (err, result) => {
            conn.release();
            if (err) deferred.reject(err);
            deferred.resolve(result);
        });
    });
    return deferred.promise;
};

//保存分享文件数据
let saveShare = function (data) {
    let deferred = q.defer();
    let saveSql = 'INSERT share(category,feed_time,isdir,server_filename,size,saveTime,shareid,shorturl,title,uk,username) VALUES ';
    let updateStr = '';
    for (let i of data) {
        let temp = '\'' + i.category + '\',\'' + i.feed_time + '\',\'' + i.isdir + '\',\'' + i.server_filename.replace(/\'/g,'\\\'') + '\',\'' + i.size + '\',\'' + i.saveTime + '\',\'' + i.shareid + '\',\'' + i.shorturl + '\',\'' + i.title.replace(/\'/g,'\\\'') + '\',\'' + i.uk + '\',\'' + i.username.replace(/\'/g,'\\\'') + '\'';
        temp = '(' + temp + ')';
        if (updateStr) {
            updateStr += ',' + temp;
        } else {
            updateStr += temp;
        }
        // console.log(temp);
    }
    saveSql += updateStr + ';';

    pool.getConnection((err, conn) => {
        "use strict";
        conn.release();
        if (err) deferred.reject(err);
        conn.query(saveSql, (err, result) => {
            if (err) throw err;
            deferred.resolve(result.affectedRows);
        });
    });
    return deferred.promise;
};

//保存订阅用户数据
let saveFollow=function (data) {
    let deferred = q.defer();
    let saveSql = 'insert into users(uk,userName,followCount,fansCount,pubShareCount) values';
    let updateStr = '';
    for (let i of data) {
        let temp = '\'' + i.uk + '\',\'' + i.userName.replace(/\'/g,'\\\'') + '\',\'' + i.followCount + '\',\'' + i.fansCount + '\',\'' + i.pubshareCount + '\'';
        temp = '(' + temp + ')';
        if (updateStr) {
            updateStr += ',' + temp;
        } else {
            updateStr += temp;
        }
    }
    saveSql += updateStr + ';';
    // console.log(saveSql);
    pool.getConnection((err, conn) => {
        "use strict";
        conn.release();
        if (err) deferred.reject(err);
        conn.query(saveSql, (err, result) => {
            if (err) throw err;
            deferred.resolve(result.affectedRows);
        });
    });
    return deferred.promise;
};

//保存fans用户数据
let saveFans=function (data) {
    let deferred = q.defer();
    let saveSql = 'insert into users(uk,userName,followCount,fansCount,pubShareCount) values';
    let updateStr = '';
    for (let i of data) {
        let temp = '\'' + i.uk + '\',\'' + i.userName.replace(/\'/g,'\\\'') + '\',\'' + i.followCount + '\',\'' + i.fansCount + '\',\'' + i.pubshareCount + '\'';
        temp = '(' + temp + ')';
        if (updateStr) {
            updateStr += ',' + temp;
        } else {
            updateStr += temp;
        }
    }
    saveSql += updateStr + ';';
    // console.log(saveSql);
    pool.getConnection((err, conn) => {
        "use strict";
        conn.release();
        if (err) deferred.reject(err);
        conn.query(saveSql, (err, result) => {
            if (err) throw err;
            deferred.resolve(result.affectedRows);
        });
    });
    return deferred.promise;
};

module.exports.getUser = getUser;
module.exports.saveShare = saveShare;
module.exports.setShareFlag = setShareFlag;
module.exports.saveFollow = saveFollow;
module.exports.saveFans = saveFans;