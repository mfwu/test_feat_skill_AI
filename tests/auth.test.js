/**
 * 认证接口测试脚本 (简化版)
 * 使用方法: node tests/auth.test.js
 */

const http = require('http');

const BASE_URL = 'localhost';
const PORT = process.env.PORT || 3000;

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

let passed = 0;
let failed = 0;
let authToken = null;

function request(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path.startsWith('/') ? path : '/' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: body ? JSON.parse(body) : {}
          });
        } catch {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function assert(condition, message) {
  if (condition) {
    console.log(`${colors.green}✓${colors.reset} ${message}`);
    passed++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('🧪 开始认证接口测试...\n');

  // 等待服务就绪
  await new Promise(r => setTimeout(r, 1000));

  // Test 1: Health check
  console.log('📋 测试 1: 健康检查');
  try {
    const res = await request('/health');
    assert(res.status === 200 && res.body.code === 0, '健康检查通过');
  } catch (err) {
    assert(false, '健康检查失败: ' + err.message);
  }
  console.log('');

  // Test 2: Login
  console.log('📋 测试 2: 用户登录');
  try {
    const res = await request('/api/login', 'POST', {
      username: 'admin',
      password: '123456'
    });
    assert(res.status === 200, '登录返回 200');
    assert(res.body.code === 0, '登录返回 code 0');
    assert(res.body.data && res.body.data.token, '登录返回 token');
    authToken = res.body.data.token;
  } catch (err) {
    assert(false, '登录失败: ' + err.message);
  }
  console.log('');

  // Test 3: Wrong password
  console.log('📋 测试 3: 登录失败-密码错误');
  try {
    const res = await request('/api/login', 'POST', {
      username: 'admin',
      password: 'wrongpass'
    });
    assert(res.status === 401, '错误密码返回 401');
    assert(res.body.code === 10001, '返回错误码 10001');
  } catch (err) {
    assert(false, '测试失败: ' + err.message);
  }
  console.log('');

  // Test 4: Register
  console.log('📋 测试 4: 用户注册');
  try {
    const res = await request('/api/register', 'POST', {
      username: 'user' + Date.now().toString().slice(-6),
      password: '123456'
    });
    console.log('   响应状态:', res.status);
    console.log('   响应数据:', JSON.stringify(res.body));
    assert(res.status === 201 || res.status === 200, '注册返回 201 或 200');
    assert(res.body && res.body.code === 0, '注册返回 code 0');
  } catch (err) {
    assert(false, '注册失败: ' + err.message);
  }
  console.log('');

  // Test 5: Duplicate user
  console.log('📋 测试 5: 注册失败-用户名已存在');
  try {
    const res = await request('/api/register', 'POST', {
      username: 'admin',
      password: '123456'
    });
    assert(res.status === 409, '重复用户名返回 409');
    assert(res.body.code === 10004, '返回错误码 10004');
  } catch (err) {
    assert(false, '测试失败: ' + err.message);
  }
  console.log('');

  // Test 6: Get profile
  console.log('📋 测试 6: 获取用户信息');
  try {
    const res = await request('/api/profile', 'GET', null, {
      'Authorization': 'Bearer ' + authToken
    });
    assert(res.status === 200, '获取信息返回 200');
    assert(res.body.code === 0, '返回 code 0');
    assert(res.body.data.username === 'admin', '返回正确的用户名');
  } catch (err) {
    assert(false, '获取信息失败: ' + err.message);
  }
  console.log('');

  // Test 7: No token
  console.log('📋 测试 7: 获取信息失败-无 Token');
  try {
    const res = await request('/api/profile', 'GET');
    assert(res.status === 401, '无 Token 返回 401');
    assert(res.body.code === 10002, '返回错误码 10002');
  } catch (err) {
    assert(false, '测试失败: ' + err.message);
  }
  console.log('');

  // Test 8: Logout
  console.log('📋 测试 8: 用户注销');
  try {
    const res = await request('/api/logout', 'POST', null, {
      'Authorization': 'Bearer ' + authToken
    });
    assert(res.status === 200, '注销返回 200');
    assert(res.body.code === 0, '注销返回 code 0');
  } catch (err) {
    assert(false, '注销失败: ' + err.message);
  }
  console.log('');

  // Test 9: Token invalid after logout
  console.log('📋 测试 9: 注销后 Token 失效');
  try {
    const res = await request('/api/profile', 'GET', null, {
      'Authorization': 'Bearer ' + authToken
    });
    assert(res.status === 401, '已注销 Token 返回 401');
    assert(res.body.code === 10003, '返回错误码 10003');
  } catch (err) {
    assert(false, '测试失败: ' + err.message);
  }
  console.log('');

  // Test 10: Validation
  console.log('📋 测试 10: 参数校验');
  try {
    const res = await request('/api/login', 'POST', {
      username: '',
      password: ''
    });
    assert(res.status === 400, '空参数返回 400');
  } catch (err) {
    assert(false, '测试失败: ' + err.message);
  }
  console.log('');

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 测试结果汇总');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`${colors.green}通过: ${passed}${colors.reset}`);
  console.log(`${colors.red}失败: ${failed}${colors.reset}`);
  console.log(`总计: ${passed + failed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (failed === 0) {
    console.log(`${colors.green}🎉 所有测试通过！${colors.reset}`);
    return 0;
  } else {
    console.log(`${colors.red}⚠️ 存在失败的测试${colors.reset}`);
    return 1;
  }
}

async function checkServer() {
  try {
    await request('/health');
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🔍 检查服务状态...\n');
  
  if (!(await checkServer())) {
    console.log(`${colors.red}❌ 服务未运行${colors.reset}`);
    console.log('请先启动服务: npm start');
    process.exit(1);
  }
  
  console.log(`${colors.green}✓ 服务运行正常${colors.reset}\n`);
  
  const result = await runTests();
  process.exit(result);
}

main().catch(err => {
  console.error('测试执行错误:', err);
  process.exit(1);
});
