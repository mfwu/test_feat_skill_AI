const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

// 数据库文件路径
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'users.db');

// 创建数据库连接
const db = new Database(DB_PATH);

// 启用外键约束
db.pragma('journal_mode = WAL');

/**
 * 初始化数据库表
 */
function initTables() {
  // 创建用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  console.log('✅ 数据库表初始化完成');
}

/**
 * 初始化默认用户
 */
function initDefaultUser() {
  // 检查是否已有用户
  const count = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  
  if (count === 0) {
    // 创建默认用户 admin / 123456
    const defaultPassword = '123456';
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(defaultPassword, salt);
    
    const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
    stmt.run('admin', hash);
    
    console.log('✅ 默认用户创建成功: admin / 123456');
  } else {
    console.log(`ℹ️  数据库已有 ${count} 个用户，跳过默认用户创建`);
  }
}

/**
 * 初始化数据库
 */
function initDatabase() {
  try {
    initTables();
    initDefaultUser();
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    throw error;
  }
}

// 导出数据库实例和初始化函数
module.exports = {
  db,
  initDatabase
};
