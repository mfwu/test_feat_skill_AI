const jwt = require('jsonwebtoken');
const blacklist = require('../database/blacklist');

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * 错误码定义
 */
const ERROR_CODES = {
  TOKEN_MISSING: { code: 10002, message: 'Token 缺失' },
  TOKEN_INVALID: { code: 10002, message: 'Token 无效或过期' },
  TOKEN_BLACKLISTED: { code: 10003, message: 'Token 已注销' }
};

/**
 * JWT 验证中间件
 * 验证请求头中的 Authorization Token
 */
function authMiddleware(req, res, next) {
  try {
    // 1. 获取 Authorization 头
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        code: ERROR_CODES.TOKEN_MISSING.code,
        message: ERROR_CODES.TOKEN_MISSING.message
      });
    }

    // 2. 提取 Token（Bearer token）
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        code: ERROR_CODES.TOKEN_INVALID.code,
        message: ERROR_CODES.TOKEN_INVALID.message
      });
    }

    const token = parts[1];

    // 3. 检查 Token 是否在黑名单中
    if (blacklist.has(token)) {
      return res.status(401).json({
        code: ERROR_CODES.TOKEN_BLACKLISTED.code,
        message: ERROR_CODES.TOKEN_BLACKLISTED.message
      });
    }

    // 4. 验证 Token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 5. 将用户信息附加到请求对象
    req.userId = decoded.userId;
    req.username = decoded.username;
    
    // 6. 继续执行后续中间件或控制器
    next();
    
  } catch (error) {
    // Token 验证失败（过期或签名错误）
    return res.status(401).json({
      code: ERROR_CODES.TOKEN_INVALID.code,
      message: ERROR_CODES.TOKEN_INVALID.message
    });
  }
}

/**
 * 生成 JWT Token
 * @param {Object} payload - 包含 userId 和 username 的对象
 * @param {string} expiresIn - 过期时间（默认 24h）
 * @returns {string} - JWT Token
 */
function generateToken(payload, expiresIn = '24h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

module.exports = {
  authMiddleware,
  generateToken,
  JWT_SECRET
};
