// 场次相关api
const express=require('express');
const router = express.Router();
const moment = require('moment');
const db = require('../../lib/util').db;

// 获取场次 (wait.html)
router.post('/getRound',(req,res,next)=>{
    try {
        const todayStartTimeStamp = new Date(new Date().toLocaleDateString()).getTime();  // 今天0点时间戳
        const todayEndTimeStamp = todayStartTimeStamp+24*60*60*1000;                        // 第二天0点

        const nowStamp = new Date().getTime();

        db.query(`SELECT * FROM tb_round WHERE time>${nowStamp} AND time<${todayEndTimeStamp} ORDER BY time ASC LIMIT 0,1`,(err,data)=>{
            if(err){
                res.status(501).json({error: {message: '数据库查询失败'}});
            }else{
                if(data[0]){
                    var d = new Date(data.time)
                    data[0].time = moment(data[0].time).format('HH:mm')
                }
                req.body.roundData=data[0];
                next();
            }
        });
    } catch (error) {
        res.status(500).json({
            error: {
                message: '服务器发生错误'
            }
        })
    }
})
router.post('/getRound',(req,res)=>{
    const {userid}=req.body;
    try {
        // 查询该用户的历史答题记录
        db.query(`SELECT * FROM tb_user WHERE ID='${userid}'`,(err,data)=>{
            if(err){
                res.status(501).json({error: {message: '数据库查询失败'}})
            }else{
                res.json({
                    result: {
                        round: req.body.roundData,
                        personinfo: {
                            ...data[0],
                            amount: 0, 
                            history: []  // amount 和 history 需要另外查询
                        }
                    }
                })
            }
        });
    } catch (error) {
        res.status(500).json({
            error: {
                message: '服务器发生错误'
            }
        })
    }
})

module.exports=router;