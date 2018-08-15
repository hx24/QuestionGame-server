// 场次相关api
const express=require('express');
const router = express.Router();
const moment = require('moment');
const { getPerAnsReward, query} = require('../../lib/util');


// 用户列表
router.post('/getUserList',async (req,res,next)=>{       // 获取今天内最近的场次
    const {pagesize, pageindex} = req.body;
    try {
        const allUserData = await query(`SELECT ID FROM tb_user`, res);
        const count = allUserData.length;
        var start = (pageindex-1)*pagesize;
        const usersData = await query(`SELECT * FROM tb_user ORDER BY phone LIMIT ${start},${pagesize}`, res);
        console.log(usersData)
        usersData.forEach(user=>{
            if(!user.name)user.name = user.wechatName;
        })
        res.json({
            result: {
                count,
                userList: usersData
            }
        }).end();
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: {
                message: '服务器发生错误'
            }
        })
    }
})

// 删除用户
router.post('/deleteUser',async (req,res)=>{       // 获取今天内最近的场次
    const {id} = req.body;
    try {
        await query(`DELETE FROM tb_user WHERE ID='${id}'`);
        res.json({
            result: {message: '删除成功'}
        }).end();
        
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: {
                message: '服务器发生错误'
            }
        })
    }
})

// 修改复活卡数量
router.post('/editRevive',async (req,res)=>{       // 获取今天内最近的场次
    const {id, revive} = req.body;
    try {
        await query(`UPDATE tb_user SET revive='${revive}' WHERE ID='${id}'`, res);
        res.json({
            result: {message: '修改成功'}
        }).end();
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: {
                message: '服务器发生错误'
            }
        })
    }
})

// 获取用户参加的场次信息
router.post('/getUserRound',async (req,res)=>{       // 获取今天内最近的场次
    const {id, pagesize, pageindex} = req.body;
    try {
        const allUserRoundData = await query(`SELECT roundID,SUM(correct) FROM tb_res WHERE userID='${id}' GROUP BY roundID`, res);   // 获取所有参加过的场次
        const count = allUserRoundData.length;
        const rightCountObj = {};
        allUserRoundData.forEach(item=>{
            rightCountObj[item.roundID] = item['SUM(correct)'];   // { 'sjdc12': 10 }
        })

        var start = (pageindex-1)*pagesize;
        const roundIDs = allUserRoundData.map(item=>item.roundID).join(',')
        if(!roundIDs){
            res.json({
                result: {
                    count: 0,
                    list: []
                }
            }).end()
        }else{
            const roundListData = await query(`SELECT * FROM tb_round WHERE ID IN (${roundIDs}) ORDER BY time DESC LIMIT ${start},${pagesize}`, res);
            const ids = roundListData.map(item=>item.ID);
            const roundDataArr = await getPerAnsReward(ids, res); // 获取到了场次信息和每场次中每道题目的奖金
            const list = roundDataArr.map(item=>{
                const rightCount =  rightCountObj[item.ID];
                return {
                    roundName: item.title,
                    startTime: item.time,
                    count: rightCount,
                    reward: Math.round(rightCount*item.perReward)
                }
            })
            res.json({
                result: {
                    count,
                    list
                }
            }).end();
        }
        
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