const { getUser } = require('../helpers/auth-helpers.js')
const { User, Tweet, Reply, Like, Followship } = require('../models')
const jwt = require('jsonwebtoken')
// 之後加'../helpers/file-helpers'

const adminController = {
  login: async (req, res, next) => {
    try {
      const userData = await getUser(req)?.toJSON()
      delete userData.password
      const token = await jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '30d' })
      if (userData.role !== 'admin') throw new Error('帳號不存在!')
      return res.json({
        status: 'success',
        data: {
          token,
          user: userData
        }
      })
    } catch (err) {
      next(err)
    }
  },
  getUsers: async (req, res, next) => {
    try {
      let users = await User.findAll({
        where: { role: 'user' },
        attributes: ['id', 'name', 'account', 'avatar', 'cover'],
        include: [
          Tweet,
          { model: Tweet, include: [{ model: User, as: 'LikedUsers' }], attributes: ['id'] },
          { model: User, as: 'Followers' },
          { model: User, as: 'Followings' }
        ]
      })
      users = await Promise.all(users.map(async user => ({
        ...user.toJSON(),
        Likes: user.Tweets.LikedUsers?.length,
        postNum: user.Tweets.length,
        follower: user.Followings.length, // 跟隨者人數(被多少人跟隨)
        following: user.Followers.length // 跟隨人數(主動跟隨多少人)
      })))

      // 計算Likes
      const Likes = []
      for (let i = 0; i < users.length; i++) {
        let likesCounter = 0
        for (let j = 0; j < users[i].Tweets.length; j++) {
          const likes = users[i].Tweets[j].LikedUsers.length
          likesCounter += likes
        }
        Likes.push(likesCounter)
      }

      // 將Likes加入JSON
      users = await Promise.all(users.map(async (user, like) => ({
        Id: user.id,
        Name: user.name,
        Account: user.account,
        Avatar: user.avatar,
        Cover: user.cover,
        Likes: Likes[like],
        PostNum: user.postNum,
        Follower: user.follower,
        Following: user.following
      })))

      // 排序
      users = users.sort((a, b) => b.PostNum - a.PostNum)

      return res.json({
        data: { userList: users }
      }
      )
    } catch (err) {
      next(err)
    }
  }
}

module.exports = adminController
