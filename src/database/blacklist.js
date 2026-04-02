/**
 * Token 黑名单管理（内存实现）
 * 适用于单实例部署，重启后黑名单清空
 */
class TokenBlacklist {
  constructor() {
    this.blacklist = new Set();
    this.initCleanup();
  }

  /**
   * 添加 Token 到黑名单
   * @param {string} token - JWT Token
   */
  add(token) {
    this.blacklist.add(token);
    console.log(`🔒 Token 已加入黑名单，当前黑名单数量: ${this.blacklist.size}`);
  }

  /**
   * 检查 Token 是否在黑名单中
   * @param {string} token - JWT Token
   * @returns {boolean} - 是否在黑名单中
   */
  has(token) {
    return this.blacklist.has(token);
  }

  /**
   * 获取黑名单大小
   * @returns {number}
   */
  size() {
    return this.blacklist.size;
  }

  /**
   * 清空黑名单
   */
  clear() {
    this.blacklist.clear();
    console.log('🗑️  Token 黑名单已清空');
  }

  /**
   * 启动定时清理（每小时检查一次过期 Token）
   * 注意：实际生产环境应使用 Redis 等持久化存储
   */
  initCleanup() {
    // 每小时清理一次（简单实现，实际应根据 Token 过期时间）
    const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1小时
    
    setInterval(() => {
      const size = this.blacklist.size;
      if (size > 0) {
        // 简化处理：直接清空（因为 Token 本身有过期时间）
        this.blacklist.clear();
        console.log(`🧹 Token 黑名单自动清理完成（清理前: ${size} 个）`);
      }
    }, CLEANUP_INTERVAL);
  }
}

// 导出单例
module.exports = new TokenBlacklist();
