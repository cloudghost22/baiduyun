/**
 * Created by lwy on 2017-04-10.
 */

let mysql = require("mysql");
let dbConfig = require("../package.json").mysql;
let q = require('q');

let pool = mysql.createPool(dbConfig);

//获取未爬取的用户
let getUser = function (flag = 0) {
    //flag 0:pubshareCount 1:followCount 2:fansCount
    let arr = ['pubshareCount', 'followCount', 'fansCount'];
    let flagArr = ['shareFlag', 'followFlag', 'fansFlag'];
    let queryStr = [
        `select * from users where  shareFlag = 0 and not EXISTS(select 1 from v_fetcheduser where v_fetcheduser.uk = users.uk) and  pubshareCount > 0 LIMIT 1;`,
        `select * from users where  followFlag = 0 and not EXISTS(select 1 from v_followeduser where v_followeduser.uk = users.uk) order by followCount desc LIMIT 1;`,
        `select * from users where  fansFlag = 0 and not EXISTS(select 1 from v_fanseduser where v_fanseduser.uk = users.uk) order by fansCount desc LIMIT 1;`
    ];
    let deferred = q.defer();
    pool.getConnection((err, conn) => {
        "use strict";
        if (err) deferred.reject(err);
        conn.query(queryStr[flag], (err, result) => {
            conn.release();
            deferred.resolve(result);
        });
    });
    return deferred.promise;
};

//修改状态为已爬取
let setShareFlag = function (uk, flag = 0) {
    //flag 1:pubshareCount 2:followCount 4:fansCount
    let deferred = q.defer();
    let flagArr = ['shareFlag', 'followFlag', 'fansFlag'];
    pool.getConnection((err, conn) => {
        "use strict";
        if (err) deferred.reject(err);
        // console.log(`update users set ${flagArr[flag]} = 1 where uk = '${uk}';`);
        conn.query(`update users set ${flagArr[flag]} = 1 where uk = '${uk}';`, (err, result) => {
            conn.release();
            if (err) {
                console.log('error:' + saveSql);
                deferred.resolve();
            } else {
                deferred.resolve(result);
            }

        });
    });
    return deferred.promise;
};

//保存分享文件数据
let saveShare = function (data) {
    let deferred = q.defer();
    let saveSql = 'INSERT share_new(category,feed_time,isdir,server_filename,size,saveTime,shareid,shorturl,title,uk,username) VALUES ';
    let updateStr = '';
    for (let i of data) {
        let temp = '\'' + i.category + '\',\'' + i.feed_time + '\',\'' + i.isdir + '\',\'' + (i.server_filename.replace(/\\/g, '').replace(/\'/g, '')).substr(0, 512) + '\',\'' + i.size + '\',\'' + i.saveTime + '\',\'' + i.shareid + '\',\'' + i.shorturl + '\',\'' + (i.title.replace(/\\/g, '').replace(/\'/g, '')).substr(0, 512) + '\',\'' + i.uk + '\',\'' + i.username.replace(/\\/g, '').replace(/\'/g, '') + '\'';
        // let temp = `'${i.category}','${i.feed_time}','${i.isdir}','${i.server_filename.substr(0, 512)}','${i.size}','${i.saveTime}','${i.shareid}','${i.shorturl}','${i.title.substr(0, 512)}','${i.uk}','${i.username}'`;
        temp = '(' + temp + ')';
        if (updateStr) {
            updateStr += ',' + temp;
        } else {
            updateStr += temp;
        }
        // console.log(temp);
    }
    saveSql += updateStr + ';';
    // console.log(saveSql);
    pool.getConnection((err, conn) => {
        "use strict";
        conn.release();
        if (err) deferred.reject(err);
        conn.query(saveSql, (err, result) => {
            if (err) {
                console.log('error:' + saveSql);
                deferred.resolve();
            } else {
                deferred.resolve(result.affectedRows);
            }

        });
    });
    return deferred.promise;
};

let saveWapShare = function (data,table = 'share_new') {
    // console.log(data);
    let deferred = q.defer();
    let saveSql = `INSERT ${table}(category,feed_time,isdir,server_filename,size,saveTime,shareid,title,uk,username) VALUES `;
    let updateStr = '';
    let _saveTime = (new Date()).valueOf();
    for (let i of data) {
/*        console.log(i);
        console.log(typeof(i.server_filename) != 'undefined');*/
        if (i && typeof(i.server_filename) != 'undefined') {
            let temp = '\'' + i.category + '\',\'' + i.feed_time + '\',\'' ;
            if(i.server_filename){
                temp += i.isdir + '\',\'' + (i.server_filename.replace(/\\/g, '').replace(/\'/g, '')).substr(0, 512) + '\',\'' + i.size + '\',\'';
            }else {
                temp += null + '\',\'' + null + '\',\'' + null + '\',\'';
            }

            temp += _saveTime + '\',\'' + i.shareid + '\',\'' + (i.title.replace(/\\/g, '').replace(/\'/g, '')).substr(0, 512) + '\',\'' + i.uk + '\',\'' + i.username.replace(/\\/g, '').replace(/\'/g, '') + '\'';
            temp = '(' + temp + ')';
            // console.log(temp);
            if (updateStr) {
                updateStr += ',' + temp;
            } else {
                updateStr += temp;
            }
        }
    }
    saveSql += updateStr + ';';
    // console.log(saveSql);
    pool.getConnection((err, conn) => {
        "use strict";
        conn.release();
        if (err) deferred.reject(err);
        conn.query(saveSql, (err, result) => {
            if (err) {
                console.log('Saving wap share error,sql is:' + saveSql);
                deferred.resolve();
            } else {
                deferred.resolve(result.affectedRows);
            }

        });
    });
    return deferred.promise;
};

//保存订阅用户数据
let saveFollow = function (data) {
    let deferred = q.defer();
    let saveSql = 'insert into users_new(uk,userName,followCount,fansCount,pubShareCount) values';
    let updateStr = '';
    for (let i of data) {
        let temp = '\'' + i.uk + '\',\'' + (i.userName.replace(/\'/g, '').replace(/\\/g, '')).substr(0, 255) + '\',\'' + i.followCount + '\',\'' + i.fansCount + '\',\'' + i.pubshareCount + '\'';
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
            if (err) {
                console.log('Saving follow error,sql is:' + saveSql);
                deferred.resolve();
            } else {
                deferred.resolve(result.affectedRows);
            }

        });
    });
    return deferred.promise;
};

//保存fans用户数据
let saveFans = function (data) {
    let deferred = q.defer();
    let saveSql = 'insert into users_new(uk,userName,followCount,fansCount,pubShareCount) values';
    let updateStr = '';
    for (let i of data) {
        let temp = '\'' + i.uk + '\',\'' + (i.userName.replace(/\'/g, '\\\'')).substr(0, 512) + '\',\'' + i.followCount + '\',\'' + i.fansCount + '\',\'' + i.pubshareCount + '\'';
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
            if (err) {
                console.log('Saving fans error,sql is:' + saveSql);
                deferred.resolve();
            } else {
                deferred.resolve(result.affectedRows);
            }
        });
    });
    return deferred.promise;
};

let errorUrl = function (urls) {
    let deferred = q.defer();
    let saveSql = 'INSERT into errorurls(url) VALUES ';
    let updateStr = '';
    for (let i of urls) {
        let temp = '\'' + i.substr(0, 512) + '\'';
        temp = '(' + temp + ')';
        if (updateStr) {
            updateStr += ',' + temp;
        } else {
            updateStr += temp;
        }
    }
    saveSql += updateStr + ';';
    console.log('saveSql' + saveSql);
    pool.getConnection((err, conn) => {
        "use strict";
        conn.release();
        if (err) deferred.reject(err);
        conn.query(saveSql, (err, result) => {
            if (err) {
                console.log('Saving errorurls error,sql is:' + saveSql);
                deferred.resolve();
            } else {
                deferred.resolve(result.affectedRows);
            }
        });
    });
    return deferred.promise;
};

let getErrorUrls = function () {
    let deferred = q.defer();
    let sql = `select ID,url from errorurls where flag = 0 ORDER BY ID LIMIT 10;`;
    pool.getConnection((err, conn) => {
        "use strict";
        conn.release();
        if (err) deferred.reject(err);
        conn.query(sql, (err, result) => {
            if (err) {
                console.log('getErrorUrls error:' + getErrorUrls);
                deferred.resolve();
            } else {
                deferred.resolve(result);
            }
        });
    });
    return deferred.promise;
};

let updateErrorUrls = function (IDs) {
    let deferred = q.defer();
    let idArr = '';
    for (let i of IDs) {
        idArr += (idArr.length > 0 ? ',' : '') + i;
    }
    let sql = `update errorurls set flag = 1 where ID in (${idArr});`;
    // console.log(sql);
    pool.getConnection((err, conn) => {
        "use strict";
        conn.release();
        if (err) deferred.reject(err);
        conn.query(sql, (err, result) => {
            if (err) {
                console.log('updateErrorUrls error:' + updateErrorUrls);
                deferred.resolve();
            } else {
                deferred.resolve(result);
            }
        });
    });
    return deferred.promise;
};

let albumUrlSave = function (urls) {
    let deferred = q.defer();
    let saveSql = 'INSERT into album(url) VALUES ';
    let updateStr = '';
    for (let i of urls) {
        let temp = '\'' + i.substr(0, 512) + '\'';
        temp = '(' + temp + ')';
        if (updateStr) {
            updateStr += ',' + temp;
        } else {
            updateStr += temp;
        }
    }
    saveSql += updateStr + ';';
    // console.log('saveSql' + saveSql);
    pool.getConnection((err, conn) => {
        "use strict";
        conn.release();
        if (err) deferred.reject(err);
        conn.query(saveSql, (err, result) => {
            if (err) {
                console.log('Saving album error,sql is:' + saveSql);
                deferred.resolve();
            } else {
                deferred.resolve(result.affectedRows);
            }
        });
    });
    return deferred.promise;
};

//获取update的用户
let getUpdateUser = function (offset = 0) {
    console.log('Getting the update user...');
    let queryStr = `SELECT id,uk,shareFlag from users where updateTime is null and pubshareCount > 0 LIMIT ${offset},20`;
    //let queryStr = `SELECT id,uk from users_new where pubshareCount > 0 order by id  LIMIT ${offset},5`;
    console.log('Query string:'+queryStr);
    let deferred = q.defer();
    pool.getConnection((err, conn) => {
        "use strict";
        if (err) deferred.reject(err);
        conn.query(queryStr, (err, result) => {
            conn.release();
            deferred.resolve(result);
        });
    });
    return deferred.promise;
};

//save the update users
//获取update的用户
let saveUpdateUsers = function (usersObj) {
    let deferred = q.defer();
    let saveSql = 'INSERT INTO users_update(uk,updateNumber,totalCount) VALUES ';
    let updateStr = '';
    for (let i of usersObj) {
        if(typeof(i.updateNumber) == 'undefined'){
            i.updateNumber = 0;
        }
        let temp = '\'' + i.uk + '\',\'' + i.updateNumber + '\',\'' + i.totalCount + '\'';
        temp = '(' + temp + ')';
        if (updateStr) {
            updateStr += ',' + temp;
        } else {
            updateStr += temp;
        }
    }
    saveSql += updateStr + ';';
    // console.log('saveUpdateUsers save Sql' + saveSql);
    pool.getConnection((err, conn) => {
        "use strict";
        conn.release();
        if (err) deferred.reject(err);
        conn.query(saveSql, (err, result) => {
            if (err) {
                console.log('Saving errorurls error,sql is:' + saveSql);
                deferred.resolve();
            } else {
                deferred.resolve(result.affectedRows);
            }
        });
    });
    return deferred.promise;
};

//save the update users
//获取update的用户
let saveHot = function (obj) {
    let deferred = q.defer();
    let saveSql = 'INSERT INTO hotTop(title,author,type) VALUES ';
    let updateStr = '';
    for (let i of obj) {
        let temp = '\'' + i.title + '\',\'' + i.author + '\',\'' + i.type + '\'';
        temp = '(' + temp + ')';
        if (updateStr) {
            updateStr += ',' + temp;
        } else {
            updateStr += temp;
        }
    }
    saveSql += updateStr + ';';
    // console.log('hotTop save Sql' + saveSql);
    pool.getConnection((err, conn) => {
        "use strict";
        conn.release();
        if (err) deferred.reject(err);
        conn.query(saveSql, (err, result) => {
            if (err) {
                console.log('Saving hotTop error,sql is:' + saveSql);
                deferred.resolve();
            } else {
                deferred.resolve(result.affectedRows);
            }
        });
    });
    return deferred.promise;
};

module.exports.getUser = getUser;
module.exports.saveShare = saveShare;
module.exports.setShareFlag = setShareFlag;
module.exports.saveFollow = saveFollow;
module.exports.saveFans = saveFans;
module.exports.saveWapShare = saveWapShare;
module.exports.errorUrl = errorUrl;
module.exports.getErrorUrls = getErrorUrls;
module.exports.updateErrorUrls = updateErrorUrls;
module.exports.albumUrlSave = albumUrlSave;
module.exports.getUpdateUser = getUpdateUser;
module.exports.saveUpdateUsers = saveUpdateUsers;
module.exports.saveHot = saveHot;