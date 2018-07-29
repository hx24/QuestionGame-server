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

async function getPerAnsReward(req, res, next, roundId) { // 统计该场次每道题的奖金, 可传单个id或数组， 会将场次信息和奖金结果作为数组挂载在 req.body.perRewardArr
    try {
        var IDs = [];
        if (Array.isArray(roundId)) {
            IDs = roundId;
        } else {
            IDs.push(roundId)
        }

        var perRewardArr = [];
        var roundDataArr = [];

        var pros = IDs.map(id=>{
            return new Promise(async (resolve,reject)=>{
                const data = await query(`SELECT COUNT(ID) FROM tb_res WHERE roundID='${id}' AND correct=1`,res);
                var count = data[0]['COUNT(ID)']; // 答对从题目数量
    
                const roundData = await query(`SELECT * FROM tb_round WHERE ID='${id}'`,res);
                roundDataArr.push(roundData[0])
                var perReward = roundData[0].reward;
                if (count != 0) {
                    perReward /= count;
                }
                perRewardArr.push(perReward);
                resolve();
            })
        });

        Promise.all(pros).then(()=>{
            req.body.roundDataArr = roundDataArr;
            req.body.perRewardArr = perRewardArr;
            next();
        })

    } catch (error) {
        // console.log(error)
        res.status(500).json({
            error: {
                message: '服务器发生错误'
            }
        })
    }
}