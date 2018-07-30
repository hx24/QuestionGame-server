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
        const usersData = await query(`SELECT * FROM tb_user ORDER BY name LIMIT ${start},${pagesize}`, res);
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
        await query(`UPDATE tb_user SET revive='${revive}' WHERE ID=${id}`);
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



module.exports=router;


var userList = [
    {
        "id": "asdc15",
        "name": "",
        "phone": 13176863291,
        "revive": 5
    }
]