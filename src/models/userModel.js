const { db } = require('../database/db');
const bcrypt = require('bcryptjs');

/**
 * 用户模型 - 数据库操作封装
 */
class UserModel {
  /**
   * 根据用户名查找用户
   * @param {string} username - 用户名
   * @returns {Object|null} - 用户对象或 null
   */
  findByUsername(username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username) || null;
  }

  /**
   * 根据 ID 查找用户
   * @param {number} id - 用户ID
   * @returns {Object|null} - 用户对象或 null
   */
  findById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) || null;
  }

  /**
   * 创建新用户
   * @param {string} username - 用户名
   * @param {string} password - 明文密码
   * @returns {Object} - 创建的用户对象
   */
  create(username, password) {
    // 密码加密
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    
    const stmt = db.prepare(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)'
    );
    
    const result = stmt.run(username, passwordHash);
    
    return {
      id: result.lastInsertRowid,
      username,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * 验证用户密码
   * @param {string} inputPassword - 输入的明文密码
   * @param {string} storedHash - 存储的密码哈希
   * @returns {boolean} - 是否匹配
   */
  verifyPassword(inputPassword, storedHash) {
    return bcrypt.compareSync(inputPassword, storedHash);
  }

  /**
   * 检查用户名是否已存在
   * @param {string} username - 用户名
   * @returns {boolean} - 是否存在
   */
  exists(username) {
    const stmt = db.prepare('SELECT 1 FROM users WHERE username = ?');
    return stmt.get(username) !== undefined;
  }

  /**
   * 获取所有用户（用于测试/管理）
   * @returns {Array} - 用户列表
   */
  findAll() {
    const stmt = db.prepare('SELECT id, username, created_at FROM users ORDER BY id');
    return stmt.all();
  }

  /**
   * 删除用户（用于测试清理）
   * @param {number} id - 用户ID
   */
  delete(id) {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);
  }
}

// 导出单例
module.exports = new UserModel();
