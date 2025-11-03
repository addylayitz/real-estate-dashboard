// src/services/DataLoadService.js - 資料載入服務
import { IndexedDBManager } from './IndexedDBManager';

export class DataLoadService {
  constructor() {
    this.dbManager = new IndexedDBManager();
    this.worker = null;
    this.onProgress = null;
    this.onComplete = null;
    this.onError = null;
  }

  /**
   * 檢查資料版本
   * @returns {Promise<Object>} 版本檢查結果
   */
  async checkDataVersion() {
    try {
      await this.dbManager.init();

      // 1. 從 IndexedDB 讀取當前版本
      const currentVersion = await this.dbManager.getMetadata('dataVersion');
      
      // 2. 從靜態檔案讀取最新版本
      const response = await fetch('/data/version.json');
      const latestVersion = await response.json();

      console.log('[DataLoadService] 當前版本:', currentVersion);
      console.log('[DataLoadService] 最新版本:', latestVersion);

      // 3. 比較版本
      if (!currentVersion) {
        // 首次使用,需要載入
        return { 
          needsLoad: true, 
          needsUpdate: false,
          currentVersion: null,
          latestVersion 
        };
      }

      if (currentVersion.recordCount < latestVersion.recordCount) {
        // 有新資料,需要更新
        return { 
          needsLoad: false, 
          needsUpdate: true,
          currentVersion,
          latestVersion,
          newRecords: latestVersion.recordCount - currentVersion.recordCount
        };
      }

      // 資料是最新的
      return { 
        needsLoad: false, 
        needsUpdate: false,
        currentVersion,
        latestVersion 
      };
    } catch (error) {
      console.error('[DataLoadService] 檢查版本失敗:', error);
      // 如果無法檢查版本,假設需要載入
      return { needsLoad: true, needsUpdate: false, error };
    }
  }

  /**
   * 載入所有資料
   * @param {Object} callbacks - 回調函數
   */
  async loadAllData(callbacks = {}) {
    this.onProgress = callbacks.onProgress;
    this.onComplete = callbacks.onComplete;
    this.onError = callbacks.onError;

    try {
      await this.dbManager.init();

      // 清除舊資料(如果是更新)
      const stats = await this.dbManager.getDatabaseStats();
      if (stats.totalRecords > 0) {
        console.log('[DataLoadService] 清除舊資料...');
        await this.dbManager.clearAllData();
      }

      // 建立 Worker
      this.worker = new Worker(`${import.meta.env.BASE_URL}dataWorker_v3.js`);

      this.worker.onmessage = async (e) => {
        const { type, data } = e.data;

        try {
          switch (type) {
            case 'progress':
              if (this.onProgress) {
                this.onProgress({
                  progress: data.progress,
                  status: data.status,
                  cityName: ''
                });
              }
              break;

            case 'cityComplete':
              console.log(`[DataLoadService] ${data.cityName} 載入完成: ${data.count} 筆`);
              
              // 將資料寫入 IndexedDB
              if (data.data && data.data.length > 0) {
                await this.dbManager.addData(data.data);
              }

              if (this.onProgress) {
                this.onProgress({
                  progress: data.progress || 0,
                  status: `${data.cityName} 載入完成`,
                  cityName: data.cityName
                });
              }
              break;

            case 'complete':
              console.log('[DataLoadService] 所有資料載入完成');
              
              // 儲存版本資訊
              const response = await fetch('/data/version.json');
              const versionInfo = await response.json();
              await this.dbManager.saveMetadata('dataVersion', versionInfo);
              
              // 結束 Worker
              this.worker.terminate();
              this.worker = null;

              if (this.onComplete) {
                this.onComplete();
              }
              break;

            case 'error':
              console.error('[DataLoadService] 載入錯誤:', data.error);
              this.worker.terminate();
              this.worker = null;

              if (this.onError) {
                this.onError(data.error);
              }
              break;

            default:
              console.warn('[DataLoadService] 未知的訊息類型:', type);
          }
        } catch (error) {
          console.error('[DataLoadService] 處理訊息失敗:', error);
          if (this.onError) {
            this.onError(error.message);
          }
        }
      };

      this.worker.onerror = (error) => {
        console.error('[DataLoadService] Worker 錯誤:', error);
        if (this.onError) {
          this.onError('資料載入程序發生錯誤');
        }
      };

      // 開始載入
      console.log('[DataLoadService] 啟動 Worker 載入程序');
      this.worker.postMessage({ type: 'loadData' });

    } catch (error) {
      console.error('[DataLoadService] 載入失敗:', error);
      if (this.onError) {
        this.onError(error.message);
      }
    }
  }

  /**
   * 取消載入
   */
  cancelLoad() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      console.log('[DataLoadService] 載入已取消');
    }
  }
}

// 建立單一實例
export const dataLoadService = new DataLoadService();
