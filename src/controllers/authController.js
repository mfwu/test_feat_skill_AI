const userModel = require('../models/userModel');
const blacklist = require('../database/blacklist');
const { generateToken } = require('../middleware/auth');

/**
 * 错误码定义
 */
const ERROR_CODES = {
  SUCCESS: { code: 0, message: 'success' },
  INVALID_CREDENTIALS: { code: 10001, message: '用户名或密码错误' },
  USER_EXISTS: { code: 10004, message: '用户名已存在' },
  INVALID_PARAMS: { code: 10005, message: '参数错误' },
  SERVER_ERROR: { code: 99999, message: '服务器错误' }
};

/**
 * 认证控制器
 */
class AuthController {
  /**
   * 用户注册
   * POST /api/register
   */
  register(req, res) {
    try {
      const { username, password } = req.body;

      // 参数校验
      if (!username || !password) {
        return res.status(400).json({
          code: ERROR_CODES.INVALID_PARAMS.code,
          message: '用户名和密码不能为空'
        });
      }

      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({
          code: ERROR_CODES.INVALID_PARAMS.code,
          message: '用户名长度为 3-20 个字符'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          code: ERROR_CODES.INVALID_PARAMS.code,
          message: '密码长度至少 6 个字符'
        });
      }

      // 检查用户名是否已存在
      if (userModel.exists(username)) {
        return res.status(409).json({
          code: ERROR_CODES.USER_EXISTS.code,
          message: ERROR_CODES.USER_EXISTS.message
        });
      }

      // 创建用户
      const user = userModel.create(username, password);

      // 返回成功响应（不返回密码）
      return res.status(201).json({
        code: ERROR_CODES.SUCCESS.code,
        message: '注册成功',
        data: {
          id: user.id,
          username: user.username,
          createdAt: user.createdAt
        }
      });

    } catch (error) {
      console.error('注册错误:', error);
      return res.status(500).json({
        code: ERROR_CODES.SERVER_ERROR.code,
        message: ERROR_CODES.SERVER_ERROR.message
      });
    }
  }

  /**
   * 用户登录
   * POST /api/login
   */
  login(req, res) {
    try {
      const { username, password } = req.body;

      // 参数校验
      if (!username || !password) {
        return res.status(400).json({
          code: ERROR_CODES.INVALID_PARAMS.code,
          message: '用户名和密码不能为空'
        });
      }

      // 查找用户
      const user = userModel.findByUsername(username);
      if (!user) {
        return res.status(401).json({
          code: ERROR_CODES.INVALID_CREDENTIALS.code,
          message: ERROR_CODES.INVALID_CREDENTIALS.message
        });
      }

      // 验证密码
      const isValid = userModel.verifyPassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({
          code: ERROR_CODES.INVALID_CREDENTIALS.code,
          message: ERROR_CODES.INVALID_CREDENTIALS.message
        });
      }

      // 生成 JWT Token
      const token = generateToken({
        userId: user.id,
        username: user.username
      });

      // 返回成功响应
      return res.status(200).json({
        code: ERROR_CODES.SUCCESS.code,
        message: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username
          }
        }
      });

    } catch (error) {
      console.error('登录错误:', error);
      return res.status(500).json({
        code: ERROR_CODES.SERVER_ERROR.code,
        message: ERROR_CODES.SERVER_ERROR.message
      });
    }
  }

  /**
   * 用户注销
   * POST /api/logout
   */
  logout(req, res) {
    try {
      // 从请求头中提取 token
      const authHeader = req.headers.authorization;
      const token = authHeader.split(' ')[1];

      // 将 token 加入黑名单
      blacklist.add(token);

      return res.status(200).json({
        code: ERROR_CODES.SUCCESS.code,
        message: '注销成功'
      });

    } catch (error) {
      console.error('注销错误:', error);
      return res.status(500).json({
        code: ERROR_CODES.SERVER_ERROR.code,
        message: ERROR_CODES.SERVER_ERROR.message
      });
    }
  }

  /**
   * 获取当前用户信息
   * GET /api/profile
   */
  getProfile(req, res) {
    try {
      const userId = req.userId;
      
      // 查询用户信息
      const user = userModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          code: 10007,
          message: '用户不存在'
        });
      }

      return res.status(200).json({
        code: ERROR_CODES.SUCCESS.code,
        message: ERROR_CODES.SUCCESS.message,
        data: {
          id: user.id,
          username: user.username,
          createdAt: user.created_at
        }
      });

    } catch (error) {
      console.error('获取用户信息错误:', error);
      return res.status(500).json({
        code: ERROR_CODES.SERVER_ERROR.code,
        message: ERROR_CODES.SERVER_ERROR.message
      });
    }
  }
}

// 导出控制器实例
module.exports = new AuthController();
