# 研发任务书：简单登录功能

> **创建日期**：2026-04-01  
> **任务类型**：feat  
> **任务模式**：轻量模式  
> **AI建议**：标准模式（文件数>5），用户选择轻量模式

---

## 1. 需求概述

### 1.1 核心目标
实现一套完整的用户认证系统，包含注册、登录、注销、信息查询功能，采用 JWT Token 机制，数据存储使用 SQLite。

### 1.2 功能清单

| 功能 | 接口 | 优先级 |
|------|------|--------|
| 用户注册 | POST /api/register | P0 |
| 用户登录 | POST /api/login | P0 |
| 用户注销 | POST /api/logout | P1 |
| 获取当前用户信息 | GET /api/profile | P1 |

### 1.3 非功能需求
- **简洁性**：代码结构清晰，易于理解
- **安全性**：密码加密存储，Token 有效期控制
- **可测试性**：提供测试脚本验证功能

---

## 2. 技术方案

### 2.1 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 运行时 | Node.js | 18+ | JavaScript 运行时 |
| Web框架 | Express | 4.x | 简洁的 Web 框架 |
| 数据库 | SQLite3 | 5.x | better-sqlite3 驱动 |
| 密码加密 | bcryptjs | 2.x | 纯 JS 实现，无原生依赖 |
| Token | jsonwebtoken | 9.x | JWT 实现 |
| 环境变量 | dotenv | 16.x | 配置管理 |

### 2.2 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端层                              │
│              (curl / Postman / 浏览器)                       │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Express Server (3000)                   │
│  ┌─────────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ 路由层 (routes) │──▶│ 控制器层    │──▶│ 模型层 (models) │  │
│  │ • /api/register │  │ • 参数校验  │  │ • 数据库操作    │  │
│  │ • /api/login    │  │ • 业务逻辑  │  │ • SQL 执行      │  │
│  │ • /api/logout   │  │ • 错误处理  │  │                 │  │
│  │ • /api/profile  │  │             │  │                 │  │
│  └─────────────────┘  └─────────────┘  └─────────────────┘  │
│           │                                              │   │
│           ▼                                              ▼   │
│  ┌─────────────────┐                          ┌───────────┐│
│  │ 中间件层        │                          │ 数据库层  ││
│  │ • JWT验证       │                          │ SQLite    ││
│  │ • 黑名单检查    │                          │ users.db  ││
│  └─────────────────┘                          └───────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 2.3 数据库设计

```sql
-- users 表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**初始数据**：
- 用户名：admin
- 密码：123456（bcrypt 加密存储）

### 2.4 Token 设计

**JWT Payload**：
```json
{
  "userId": 1,
  "username": "admin",
  "iat": 1711958400,
  "exp": 1712044800
}
```

**配置**：
- 密钥：环境变量 `JWT_SECRET`，默认 `your-secret-key`
- 有效期：24 小时

### 2.5 Token 黑名单（注销实现）

采用**内存存储**方案：
```javascript
class TokenBlacklist {
  constructor() {
    this.blacklist = new Set();
  }
  add(token) { this.blacklist.add(token); }
  has(token) { return this.blacklist.has(token); }
}
```

**说明**：适合单实例部署，重启后黑名单清空（Token 仍会过期）。

### 2.6 错误码定义

| 错误码 | 说明 | HTTP状态码 |
|-------|------|-----------|
| 0 | 成功 | 200 |
| 10001 | 用户名或密码错误 | 401 |
| 10002 | Token 无效或过期 | 401 |
| 10003 | Token 已注销 | 401 |
| 10004 | 用户名已存在 | 409 |
| 10005 | 参数错误 | 400 |
| 10006 | 权限不足 | 403 |
| 99999 | 服务器错误 | 500 |

---

## 3. 执行计划

### 3.1 分支管理

| 项目 | 内容 |
|------|------|
| 功能分支 | `feat/simple-login` |
| 目标分支 | `main` |

### 3.2 文件清单（targetFiles）

| 序号 | 文件路径 | 说明 |
|------|----------|------|
| 1 | `src/server.js` | Express 服务入口 |
| 2 | `src/routes/auth.js` | 认证路由定义 |
| 3 | `src/controllers/authController.js` | 认证业务逻辑 |
| 4 | `src/middleware/auth.js` | JWT 验证中间件 |
| 5 | `src/models/userModel.js` | 用户数据操作 |
| 6 | `src/database/db.js` | 数据库连接 |
| 7 | `src/database/blacklist.js` | Token 黑名单 |
| 8 | `tests/auth.test.js` | 接口测试脚本 |
| 9 | `package.json` | 项目配置 |
| 10 | `.env.example` | 环境变量示例 |

**禁止修改**（forbiddenFiles）：
- `README.md`（除非更新使用说明）
- 已有其他功能代码

### 3.3 开发步骤（techSteps）

| 步骤 | 任务 | 状态 |
|------|------|------|
| 1 | 初始化项目，安装依赖，创建目录结构 | ⬜ 待完成 |
| 2 | 实现数据库连接和初始化模块 | ⬜ 待完成 |
| 3 | 实现 Token 黑名单模块 | ⬜ 待完成 |
| 4 | 实现用户模型（CRUD 操作） | ⬜ 待完成 |
| 5 | 实现 JWT 验证中间件 | ⬜ 待完成 |
| 6 | 实现认证控制器（注册/登录/注销/查询） | ⬜ 待完成 |
| 7 | 实现认证路由 | ⬜ 待完成 |
| 8 | 实现服务入口（server.js） | ⬜ 待完成 |
| 9 | 编写测试脚本 | ⬜ 待完成 |
| 10 | 自测验证 | ⬜ 待完成 |

### 3.4 验收标准（acceptanceCriteria）

| 验收项 | 验证方式 |
|--------|----------|
| 服务正常启动 | `node src/server.js` 无报错 |
| 默认用户可登录 | `curl POST /api/login` 返回 token |
| 新用户可注册 | `curl POST /api/register` 成功创建用户 |
| Token 可验证 | 携带 token 访问 `/api/profile` 返回用户信息 |
| 注销后 Token 失效 | 注销后再次访问受保护接口返回 401 |
| 错误处理正确 | 参数错误返回 400，认证失败返回 401 |

### 3.5 测试命令（testCommands）

```bash
# 1. 安装依赖
npm install

# 2. 启动服务
node src/server.js

# 3. 运行测试
node tests/auth.test.js
```

---

## 4. 接口详细设计

### 4.1 POST /api/register - 用户注册

**请求**：
```http
POST /api/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "123456"
}
```

**成功响应 (201)**：
```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "id": 2,
    "username": "testuser",
    "createdAt": "2026-04-01T10:00:00.000Z"
  }
}
```

**失败响应 (409)**：
```json
{
  "code": 10004,
  "message": "用户名已存在"
}
```

### 4.2 POST /api/login - 用户登录

**请求**：
```http
POST /api/login
Content-Type: application/json

{
  "username": "admin",
  "password": "123456"
}
```

**成功响应 (200)**：
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "username": "admin"
    }
  }
}
```

**失败响应 (401)**：
```json
{
  "code": 10001,
  "message": "用户名或密码错误"
}
```

### 4.3 POST /api/logout - 用户注销

**请求**：
```http
POST /api/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**成功响应 (200)**：
```json
{
  "code": 0,
  "message": "注销成功"
}
```

### 4.4 GET /api/profile - 获取用户信息

**请求**：
```http
GET /api/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**成功响应 (200)**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "createdAt": "2026-04-01T08:00:00.000Z"
  }
}
```

**失败响应 (401)**：
```json
{
  "code": 10002,
  "message": "Token 无效或过期"
}
```

---

## 5. PR 评审记录

### 5.1 任务书 PR

| 项目 | 内容 |
|------|------|
| PR 编号 | 待创建 |
| 状态 | 待提交 |
| 评审人 | - |
| 评审意见 | - |

### 5.2 代码 PR

| 项目 | 内容 |
|------|------|
| PR 编号 | 待创建 |
| 状态 | 待开发 |
| 评审人 | - |
| 评审意见 | - |

---

## 6. 附录

### 6.1 依赖列表

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "better-sqlite3": "^9.4.3",
    "dotenv": "^16.4.5"
  }
}
```

### 6.2 目录结构

```
simple-login/
├── src/
│   ├── server.js
│   ├── routes/
│   │   └── auth.js
│   ├── controllers/
│   │   └── authController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   └── userModel.js
│   └── database/
│       ├── db.js
│       └── blacklist.js
├── tests/
│   └── auth.test.js
├── package.json
├── .env.example
└── users.db (自动生成)
```

### 6.3 测试用例

| 用例 | 步骤 | 预期结果 |
|------|------|----------|
| 登录成功 | 使用 admin/123456 登录 | 返回 token |
| 登录失败-密码错误 | 使用 admin/wrongpass 登录 | 返回 401 |
| 登录失败-用户不存在 | 使用 notexist/123456 登录 | 返回 401 |
| 注册成功 | 注册新用户 newuser/123456 | 返回 201 |
| 注册失败-用户名重复 | 再次注册 newuser/123456 | 返回 409 |
| 获取信息成功 | 携带有效 token 访问 /profile | 返回用户信息 |
| 获取信息失败-无token | 不带 token 访问 /profile | 返回 401 |
| 注销成功 | 携带 token 调用 /logout | 返回 200 |
| 注销后失效 | 用已注销 token 访问 /profile | 返回 401 |

---

**任务书版本**：v1.0  
**最后更新**：2026-04-01
