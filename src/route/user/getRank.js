const express=require('express');
const router = express.Router();
const {getPerAnsReward, query} = require('../../lib/util');

// 获取排行版 (返回前两天到当前时间的有排名的场次)
router.post('/getRank', async (req,res,next) => {
    try {
        const todayStartTimeStamp = new Date(new Date().toLocaleDateString()).getTime();  // 今天0点时间戳
        const startTime = todayStartTimeStamp - 2*24*3600*1000;                     // 两天前
        const EndTime = new Date().getTime();                          // 现在

        const roundIdData = await query(`SELECT ID FROM tb_round WHERE time>${startTime} AND time<${EndTime} ORDER BY time`);
        var roundIds = roundIdData.map(item=>item.ID);
        const roundDataArr = await getPerAnsReward(roundIds, res); // 获取到了场次信息和每场次中每道题目的奖金
        req.body.roundDataArr = roundDataArr;
        next();

    } catch (error) {
        res.status(500).json({
            error: {
                message: '服务器发生错误'
            }
        })
    }
})
router.post('/getRank',async (req,res) => {
    const {userid, roundDataArr}=req.body;

    try {
        var result = [];
        var pros = roundDataArr.map((round,index) => {
            return new Promise(async (resolve,reject)=>{
                const userAnsData = await query(`SELECT userID,SUM(correct) FROM tb_res WHERE roundID='${round.ID}' GROUP BY userID`, res);
                var userRank = [];
                var pros = userAnsData.map(item => {
                    return new Promise(async (innerResolve)=>{
                        const userData = await query(`SELECT * FROM tb_user WHERE ID='${item.userID}'`, res);
                        const count = item['SUM(correct)'];
                        userRank.push({
                            name: userData[0].name,
                            phone: userData[0].phone,
                            answercount: count,
                            reward: Math.round(count * round.perReward)
                        })
                        innerResolve();
                    })
                });

                Promise.all(pros).then(()=>{
                    if(userRank.length>0){
                        userRank.sort((item1,item2)=>item2.reward-item1.reward)
                        result.push({
                            roundName: round.title,
                            time: round.time,
                            userRank
                        })
                    }
                    resolve();
                })
            })
        });

        Promise.all(pros).then(()=>{
            result.sort((item1,item2)=>{
                return item1.time-item2.time   // 上面是异步操作，顺序不定，按时间排下序
            })
            res.json({
                result
            })
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: {
                message: '服务器发生错误'
            }
        })
    }
})

module.exports=router;