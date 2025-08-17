// 除錯工具函數
import IndexedDBManager from '../services/IndexedDBManager';

// 建立全域除錯工具
export const setupDebugTools = async () => {
  if (typeof window === 'undefined') return;

  // 建立全域 dbManager 實例
  const dbManager = new IndexedDBManager();
  await dbManager.init();
  
  // 暴露到 window
  window.dbManager = dbManager;
  window.IndexedDBManager = IndexedDBManager;

  // 建立便利的除錯函數
  window.debugDB = {
    // 取得資料庫統計
    async getStats() {
      try {
        const stats = await dbManager.getDatabaseStats();
        console.table(stats);
        return stats;
      } catch (error) {
        console.error('取得統計失敗:', error);
      }
    },

    // 取得所有城市列表
    async getCities() {
      try {
        const cities = await dbManager.getAllCities();
        console.table(cities);
        return cities;
      } catch (error) {
        console.error('取得城市列表失敗:', error);
      }
    },

    // 查詢資料
    async query(filter = {}, limit = 10) {
      try {
        const results = await dbManager.queryData(filter, limit);
        console.table(results.slice(0, 5)); // 只顯示前 5 筆
        console.log(`查詢結果: ${results.length} 筆`);
        return results;
      } catch (error) {
        console.error('查詢失敗:', error);
      }
    },

    // 測試台北市資料
    async testTaipei() {
      return await this.query({ city: '台北市' }, 100);
    },

    // 測試新北市資料
    async testNewTaipei() {
      return await this.query({ city: '新北市' }, 100);
    },

    // 清除資料
    async clear() {
      try {
        await dbManager.clearAllData();
        console.log('✅ 資料已清除');
      } catch (error) {
        console.error('清除失敗:', error);
      }
    },

    // 顯示幫助
    help() {
      console.log(`
📊 除錯工具使用說明：

基本指令：
  debugDB.getStats()     - 取得資料庫統計
  debugDB.getCities()    - 取得所有城市
  debugDB.query()        - 查詢前 10 筆資料
  debugDB.clear()        - 清除所有資料

測試指令：
  debugDB.testTaipei()   - 測試台北市資料
  debugDB.testNewTaipei() - 測試新北市資料

進階使用：
  debugDB.query({city: '台中市'}, 50)  - 查詢台中市前 50 筆
  debugDB.query({roomType: '3房'}, 20) - 查詢 3房 前 20 筆

原生 API：
  window.dbManager       - IndexedDBManager 實例
  window.IndexedDBManager - 類別建構子
      `);
    }
  };

  // 顯示載入訊息
  console.log('🔧 除錯工具已載入！');
  console.log('💡 輸入 debugDB.help() 查看使用說明');
  
  return dbManager;
};

// 資料庫健康檢查
export const healthCheck = async () => {
  try {
    const dbManager = new IndexedDBManager();
    await dbManager.init();
    
    const stats = await dbManager.getDatabaseStats();
    const testQuery = await dbManager.queryData({}, 1);
    
    const health = {
      database: stats.totalRecords > 0 ? '✅ 正常' : '❌ 無資料',
      totalRecords: stats.totalRecords,
      totalCities: stats.totalCities,
      canQuery: testQuery.length > 0 ? '✅ 正常' : '❌ 查詢失敗',
      lastUpdate: stats.lastUpdate
    };
    
    console.table(health);
    return health;
  } catch (error) {
    console.error('健康檢查失敗:', error);
    return { status: '❌ 錯誤', error: error.message };
  }
};