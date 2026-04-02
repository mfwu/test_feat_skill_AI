const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

/**
 * 认证路由配置
 * 
 * POST /api/register    - 用户注册（公开）
 * POST /api/login       - 用户登录（公开）
 * POST /api/logout      - 用户注销（需要认证）
 * GET  /api/profile     - 获取当前用户信息（需要认证）
 */

// 公开路由
router.post('/register', authController.register);
router.post('/login', authController.login);

// 需要认证的路由
router.post('/logout', authMiddleware, authController.logout);
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
