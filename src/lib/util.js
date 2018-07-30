const crypto = require('crypto');
const mysql = require('mysql');
const config = require('../config.json');

const db = mysql.createPool(config.mysql_config);

module.exports = {
    salt: 'rasck', // md5加盐
    md5: function(str) {
        var obj = crypto.createHash('md5'); // 以md5加密
        obj.update(str + this.salt);
        return obj.degest('hex'); // 以16进制输出(一般都是16进制)
    },
    sendErr: (res, status, message) => {
        res.status(status).json({ error: { message: message } }).end();
    },
    db,
    query,
    getPerAnsReward,
}

function query(sql, res) {
    // 返回一个 Promise
    return new Promise((resolve, reject) => {
        db.getConnection(function(err, connection) {
            if (err) {
                reject(err)
                res.status(501).json(err).end();
            } else {
                connection.query(sql,  (err, rows) => {
                    if (err) {
                        reject(err)
                        res.status(501).json(err).end();
                    } else {
                        resolve(rows)
                    }
                    // 结束会话
                    connection.release()
                })
            }
        })
    })
}


/**
 * 
 * @param {String||Array[String]} roundId 
 * @param {*} res
 * 
 * 返回场次的具体信息，其中增加了perReward字段，代表每道题分多少钱
 */
function getPerAnsReward(roundId, res) { // 统计该场次每道题的奖金, 可传单个id或数组， 会将场次信息和奖金结果作为数组挂载在 req.body.perRewardArr
    try {
        return new Promise(async (resolve)=>{
            var IDs = [];
            if (Array.isArray(roundId)) {
                IDs = roundId;
            } else {
                IDs.push(roundId)
            }
            var roundDataArr = [];
            var pros = IDs.map(id=>{
                return new Promise(async (innerResolve,reject)=>{
                    const data = await query(`SELECT COUNT(ID) FROM tb_res WHERE roundID='${id}' AND correct=1`,res);
                    var count = data[0]['COUNT(ID)']; // 答对从题目数量
        
                    const roundData = await query(`SELECT * FROM tb_round WHERE ID='${id}'`,res);
                    var perReward = roundData[0].reward;
                    if (count != 0) {
                        perReward /= count;
                    }
                    roundData[0].perReward = perReward;
                    roundDataArr.push(roundData[0])
                    innerResolve();
                })
            });
    
            Promise.all(pros).then(()=>{
                roundDataArr.sort((item1,item2)=>item2.time-item1.time);
                resolve(roundDataArr)
            })
        })
        
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: {
                message: '服务器发生错误'
            }
        }).end();
    }
}