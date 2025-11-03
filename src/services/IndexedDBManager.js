// src/services/IndexedDBManager.js - 修正批次處理
export class IndexedDBManager {
  constructor() {
    this.db = null;
    this.dbName = 'RealEstateDB';
    this.version = 2; // 升級版本以支援元資料
    this.storeName = 'properties';
    this.metadataStoreName = 'metadata'; // 元資料存儲
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('[IndexedDB] 開啟失敗:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[IndexedDB] 資料庫開啟成功');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log('[IndexedDB] 建立/升級資料庫');
        const db = event.target.result;
        const oldVersion = event.oldVersion;

        // 如果是從版本 1 升級,不刪除舊資料
        if (oldVersion < 1) {
          // 建立 properties store
          const store = db.createObjectStore(this.storeName, { 
            keyPath: 'id', 
            autoIncrement: true 
          });

          // 建立索引
          store.createIndex('city', 'city', { unique: false });
          store.createIndex('district', 'district', { unique: false });
          store.createIndex('project', 'project', { unique: false });
          store.createIndex('roomType', 'roomType', { unique: false });
          store.createIndex('transactionDate', 'transactionDate', { unique: false });
        }

        // 建立 metadata store (版本 2 新增)
        if (!db.objectStoreNames.contains(this.metadataStoreName)) {
          db.createObjectStore(this.metadataStoreName, { keyPath: 'key' });
          console.log('[IndexedDB] 元資料存儲建立完成');
        }

        console.log('[IndexedDB] 資料庫結構建立完成');
      };
    });
  }

  async addData(dataArray) {
    if (!this.db) {
      throw new Error('資料庫未初始化');
    }

    if (!dataArray || dataArray.length === 0) {
      console.log('[IndexedDB] 沒有資料需要新增');
      return;
    }

    console.log(`[IndexedDB] 開始新增 ${dataArray.length} 筆資料`);

    // 使用單一交易處理所有資料
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      let processedCount = 0;
      let hasError = false;

      // 交易完成事件
      transaction.oncomplete = () => {
        console.log(`[IndexedDB] 資料新增完成: ${processedCount} 筆`);
        resolve();
      };

      // 交易錯誤事件
      transaction.onerror = () => {
        console.error('[IndexedDB] 交易失敗:', transaction.error);
        reject(transaction.error);
      };

      // 交易中止事件
      transaction.onabort = () => {
        console.error('[IndexedDB] 交易被中止');
        reject(new Error('交易被中止'));
      };

      // 批次新增資料
      dataArray.forEach((item, index) => {
        if (hasError) return;

        try {
          const request = store.add(item);
          
          request.onsuccess = () => {
            processedCount++;
            
            if (processedCount % 1000 === 0) {
              console.log(`[IndexedDB] 已處理 ${processedCount}/${dataArray.length} 筆資料`);
            }
          };
          
          request.onerror = () => {
            if (!hasError) {
              hasError = true;
              console.error(`[IndexedDB] 新增第 ${index + 1} 筆資料失敗:`, request.error);
              transaction.abort();
            }
          };
        } catch (error) {
          if (!hasError) {
            hasError = true;
            console.error(`[IndexedDB] 處理第 ${index + 1} 筆資料時發生錯誤:`, error);
            transaction.abort();
          }
        }
      });
    });
  }

  async queryData(filters = {}, limit = 1000) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result || [];
        
        // 應用篩選條件
        if (Object.keys(filters).length > 0) {
          results = results.filter(item => {
            for (const [key, value] of Object.entries(filters)) {
              if (value && item[key] !== value) {
                return false;
              }
            }
            return true;
          });
        }
        
        // 應用數量限制
        if (limit > 0 && results.length > limit) {
          results = results.slice(0, limit);
        }
        
        resolve(results);
      };

      request.onerror = () => {
        console.error('[IndexedDB] 查詢失敗:', request.error);
        reject(request.error);
      };
    });
  }

  async getDatabaseStats() {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const countRequest = store.count();

      countRequest.onsuccess = () => {
        const totalRecords = countRequest.result;
        
        if (totalRecords === 0) {
          resolve({
            totalRecords: 0,
            totalCities: 0,
            isLoaded: false,
            lastUpdated: null
          });
          return;
        }

        // 取得所有資料來計算城市數
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          const allData = getAllRequest.result || [];
          const cities = new Set(allData.map(item => item.city).filter(Boolean));
          
          resolve({
            totalRecords,
            totalCities: cities.size,
            isLoaded: totalRecords > 0,
            lastUpdated: new Date().toLocaleString('zh-TW')
          });
        };

        getAllRequest.onerror = () => {
          reject(getAllRequest.error);
        };
      };

      countRequest.onerror = () => {
        console.error('[IndexedDB] 取得統計失敗:', countRequest.error);
        reject(countRequest.error);
      };
    });
  }

  async getAllCities() {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('city');
      const request = index.getAllKeys();

      request.onsuccess = () => {
        const cities = [...new Set(request.result)].filter(Boolean);
        resolve(cities);
      };

      request.onerror = () => {
        console.error('[IndexedDB] 取得城市列表失敗:', request.error);
        reject(request.error);
      };
    });
  }

  async clearAllData() {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[IndexedDB] 資料清除完成');
        resolve();
      };

      request.onerror = () => {
        console.error('[IndexedDB] 清除資料失敗:', request.error);
        reject(request.error);
      };
    });
  }
}
  // ==================== 元資料管理方法 ====================

  /**
   * 儲存元資料
   * @param {string} key - 元資料鍵名
   * @param {any} value - 元資料值
   */
  async saveMetadata(key, value) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.metadataStoreName], 'readwrite');
      const store = transaction.objectStore(this.metadataStoreName);
      const request = store.put({ key, value, updatedAt: Date.now() });

      request.onsuccess = () => {
        console.log(`[IndexedDB] 元資料已儲存: ${key}`);
        resolve();
      };

      request.onerror = () => {
        console.error(`[IndexedDB] 儲存元資料失敗: ${key}`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 讀取元資料
   * @param {string} key - 元資料鍵名
   * @returns {Promise<any>} 元資料值
   */
  async getMetadata(key) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.metadataStoreName], 'readonly');
      const store = transaction.objectStore(this.metadataStoreName);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          console.log(`[IndexedDB] 讀取元資料: ${key}`, result.value);
          resolve(result.value);
        } else {
          console.log(`[IndexedDB] 元資料不存在: ${key}`);
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error(`[IndexedDB] 讀取元資料失敗: ${key}`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 刪除元資料
   * @param {string} key - 元資料鍵名
   */
  async deleteMetadata(key) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.metadataStoreName], 'readwrite');
      const store = transaction.objectStore(this.metadataStoreName);
      const request = store.delete(key);

      request.onsuccess = () => {
        console.log(`[IndexedDB] 元資料已刪除: ${key}`);
        resolve();
      };

      request.onerror = () => {
        console.error(`[IndexedDB] 刪除元資料失敗: ${key}`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 取得所有元資料
   * @returns {Promise<Object>} 所有元資料
   */
  async getAllMetadata() {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.metadataStoreName], 'readonly');
      const store = transaction.objectStore(this.metadataStoreName);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        const metadata = {};
        results.forEach(item => {
          metadata[item.key] = item.value;
        });
        resolve(metadata);
      };

      request.onerror = () => {
        console.error('[IndexedDB] 讀取所有元資料失敗:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 關閉資料庫連線
   */
  async close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('[IndexedDB] 資料庫連線已關閉');
    }
  }
}
