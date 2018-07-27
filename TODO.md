### 待完善任务
- 增加场次修改的限制，若场次正在执行中，不可修改

- 放题时判断上一题是否有人答对，若已全部出局，返回end，结束游戏  
    SELECT questionID FROM tb_res WHERE correct=1 GROUP BY questionID ;  根据data.length 与 questionIndex比较的值判断
    若data.length>questionIndex  没有人可以答下一题了  返回end  并且统计结果(最好设定定时器统计))
