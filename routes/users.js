/**
 * 用户管理模块
 */
const router = require('koa-router')()
const User = require('./../models/userSchema')
const util = require('./../utils/util')
const jwt = require('jsonwebtoken')

router.prefix('/users')

//登录
router.post('/login', async (ctx) => {
	try {
		const { userName, userPwd } = ctx.request.body
		/**
		 * 返回数据库指定字段, 三种方式
		 * 1. 'userName userEmail'
		 * 2.{ userId: 1, _id: 0 }
		 * 3. .select('userId)
		 */
		const res = await User.findOne(
			{
				userName,
				userPwd,
			},
			'userId userName state role deptId roleList'
		)
		const data = res._doc
		console.log('data=>', data)
		const token = jwt.sign(
			{
				data,
			},
			'shiro',
			{ expiresIn: '1h' }
		)
		if (res) {
			data.token = token
			ctx.body = util.success(data)
		} else {
			ctx.body = util.fail('账号或密码错误')
		}
	} catch (error) {
		ctx.body = util.fail(`查询异常:${error.stack}`)
	}
})

//获取用户列表
router.get('/list', async (ctx) => {
	const { userId, userName, state } = ctx.request.query
	const { page, skipIndex } = util.pager(ctx.request.query)
	let params = {}
	if (userId) params.userId = userId
	if (userName) params.userName = userName
	if (state && state != '0') params.state = state
	try {
		//根据条件查询所有用户
		const query = User.find(params, { _id: 0, userPwd: 0 })
		const list = await query.skip(skipIndex).limit(page.pageSize)
		const total = await User.countDocuments(params)
		ctx.body = util.success({
			page: {
				...page,
				total,
			},
			list,
		})
	} catch (error) {
		ctx.body = util.fail(`查询异常:${error.stack}`)
	}
})

//用户删除/批量删除
router.post('/delete', async (ctx) => {
	//待删除的用户id数组
	const { userIds } = stx.request.body
	const res = await User.updateMany({ userId: { $in: userIds } }, { state: 2 })
	if (res.nModified) {
		ctx.body = util.success(res, `共删除成功${res.nModified}条`)
		return
	}
	ctx.body = util.fail('删除失败')
})

module.exports = router
