// require needed modules
const express = require('express')
const router = express.Router()
const passport = require('../../config/passport')
const { authenticated, authenticatedAdmin } = require('../../middleware/api-auth')

// require controller
const adminController = require('../../controllers/admin-controller')

// set router
router.get('/users', authenticated, authenticatedAdmin, adminController.getUsers)
router.post('/login', passport.authenticate('local', { session: false }), adminController.login)

module.exports = router
