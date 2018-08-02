// 场次相关api
const express=require('express');
const router = express.Router();
const moment = require('moment');
const {getPerAnsReward, query} = require('../../lib/util');


// 获取场次 (wait.html)
router.post('/getRound',async (req,res,next)=>{       // 获取今天内最近的场次
    try {
        const todayStartTimeStamp = new Date(new Date().toLocaleDateString()).getTime();  // 今天0点时间戳
        const todayEndTimeStamp = todayStartTimeStamp+24*60*60*1000;                        // 第二天0点

        const nowStamp = new Date().getTime();

        const recentRoundData = await query(`SELECT * FROM tb_round WHERE time>${nowStamp} AND time<${todayEndTimeStamp} ORDER BY time ASC LIMIT 0,1`, res);
        if(recentRoundData[0]){
            recentRoundData[0].time = moment(recentRoundData[0].time).format('HH:mm')
        }
        req.body.recentRound=recentRoundData[0];
        next();

    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: {
                message: '服务器发生错误'
            }
        })
    }
})
router.post('/getRound', async (req,res)=>{     // 获取历史记录
    const {userid}=req.body;
    console.log(userid)
    try {
        const userJoinedData = await query(`SELECT roundID,SUM(correct) FROM tb_res WHERE userID='${userid}' GROUP BY roundID`, res);
        const roundIDs = [];
        const userJoined = {};
        userJoinedData.forEach(item => {
            roundIDs.push(item.roundID);
            userJoined[item.roundID] = item['SUM(correct)'];
        });
        const roundDataArr = await getPerAnsReward(roundIDs, res); // 获取到了参加过的场次信息和每场次中每道题目的奖金,按时间从大到小排序
        var rewardAll = 0;
        const history = roundDataArr.slice(0,6).map(item=>{         // 暂时只显示最近的6场
            const count = userJoined[item.ID];  // 答对的题目数量
            const reward = item.perReward*count;
            rewardAll += reward;
            return {
                roundName: item.title,
                answercount: count,
                reward: reward
            }
        })

        const userData = await query(`SELECT revive FROM tb_user WHERE ID='${userid}'`,res);

        res.json({
            result: {
                round: req.body.recentRound,
                personinfo: {
                    revive: userData[0].revive,
                    rewardAll, 
                    history
                }
            }
        })

    } catch (error) {
        res.status(500).json({
            error: {
                message: '服务器发生错误'
            }
        })
    }
})

module.exports=router;