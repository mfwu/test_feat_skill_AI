require('dotenv').config();
const express = require('express');
const { initDatabase } = require('./database/db');
const authRoutes = require('./routes/auth');

// 创建 Express 应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({
    code: 0,
    message: '服务运行正常',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

// 认证路由
app.use('/api', authRoutes);

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    code: 99999,
    message: '服务器内部错误'
  });
});

// 初始化数据库并启动服务
async function startServer() {
  try {
    console.log('🚀 正在启动服务...');
    
    // 初始化数据库
    initDatabase();
    
    // 启动 HTTP 服务
    app.listen(PORT, () => {
      console.log('');
      console.log('✅ 服务启动成功！');
      console.log('');
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`📚 API 文档:`);
      console.log(`   POST http://localhost:${PORT}/api/register  - 用户注册`);
      console.log(`   POST http://localhost:${PORT}/api/login     - 用户登录`);
      console.log(`   POST http://localhost:${PORT}/api/logout    - 用户注销`);
      console.log(`   GET  http://localhost:${PORT}/api/profile   - 获取用户信息`);
      console.log(`   GET  http://localhost:${PORT}/health        - 健康检查`);
      console.log('');
      console.log('🔑 默认用户: admin / 123456');
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ 服务启动失败:', error.message);
    process.exit(1);
  }
}

// 启动服务
startServer();

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('正在关闭服务...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n正在关闭服务...');
  process.exit(0);
});
