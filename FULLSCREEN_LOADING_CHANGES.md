# 全螢幕載入和自動更新功能實現說明

## 更新日期
2025-11-03

## 重大更新

本次更新完全重構了資料載入流程,實現了以下核心功能:

### ✨ 主要改進

1. **移除資料載入管理對話框** - 不再顯示彈出式對話框
2. **全螢幕載入畫面** - 美觀的全螢幕載入體驗
3. **自動載入資料** - 首次使用時自動開始載入
4. **資料版本管理** - 自動檢測資料更新
5. **背景自動更新** - 檢測到新資料時自動更新

## 新增檔案

### 1. `public/data/version.json`
資料版本資訊檔案:
```json
{
  "version": "1.0.0",
  "recordCount": 170000,
  "lastUpdate": "2025-11-03",
  "cities": 21,
  "description": "預售屋交易資料"
}
```

**重要**: 每次更新資料時,必須更新此檔案的 `recordCount` 和 `lastUpdate`

### 2. `src/components/LoadingScreen.jsx`
全螢幕載入畫面組件:
- 美觀的漸層背景
- 動態進度條
- 實時狀態顯示
- 平滑的淡入淡出動畫

### 3. `src/components/UpdateNotification.jsx`
更新通知組件:
- 右上角小型通知
- 支援不同類型(info, success)
- 自動關閉功能

### 4. `src/services/DataLoadService.js`
資料載入服務:
- 版本檢查邏輯
- 資料載入管理
- Worker 通訊處理

## 修改檔案

### 1. `src/services/IndexedDBManager.js`
**主要變更**:
- 升級資料庫版本到 v2
- 新增 `metadata` 存儲空間
- 添加元資料管理方法:
  - `saveMetadata(key, value)` - 儲存元資料
  - `getMetadata(key)` - 讀取元資料
  - `deleteMetadata(key)` - 刪除元資料
  - `getAllMetadata()` - 取得所有元資料
  - `close()` - 關閉資料庫連線

**資料庫升級策略**:
- 從版本 1 升級到版本 2 時,保留原有資料
- 只新增 metadata 存儲空間
- 不影響現有用戶的資料

### 2. `src/App.jsx`
**完全重構**:
- 移除 DataLoader 對話框
- 整合 LoadingScreen 組件
- 實現自動初始化流程
- 添加版本檢查邏輯
- 移除「資料管理」按鈕
- 在 Header 顯示資料統計

**新的初始化流程**:
```javascript
啟動應用
    ↓
檢查資料版本
    ↓
┌─────────────────┬─────────────────┐
│   首次使用      │    有資料        │
│  (needsLoad)    │  (已載入)        │
└─────────────────┴─────────────────┘
    ↓                     ↓
顯示全螢幕載入        檢查是否有更新
    ↓                     ↓
自動開始載入          ┌──────────┐
    ↓                 │ 有新版本？│
載入完成              └──────────┘
    ↓                     ↓
進入主介面            是: 背景更新
                          ↓
                      顯示更新通知
```

## 移除檔案

### 1. `src/components/DataLoader.jsx`
已備份為 `DataLoader_backup.jsx`,可以安全刪除

### 2. `src/App_backup.jsx`
舊版 App.jsx 的備份,可以安全刪除

## 功能說明

### 首次使用體驗

1. 用戶訪問網站
2. 自動檢測沒有資料
3. 顯示全螢幕載入畫面
4. 自動開始載入約 17 萬筆資料
5. 顯示實時進度和狀態
6. 載入完成後淡出,進入主介面

### 後續訪問體驗

1. 用戶訪問網站
2. 自動檢測已有資料
3. 直接顯示主介面(< 1 秒)
4. 背景檢查資料版本
5. 如有更新,顯示通知並背景更新

### 資料更新流程

當管理員更新資料(例如從 17 萬筆增加到 20 萬筆):

1. **更新資料檔案**:
   - 更新 `public/data/chunks/` 中的 JSON 檔案
   - 更新 `public/data/version.json`:
     ```json
     {
       "version": "1.1.0",
       "recordCount": 200000,
       "lastUpdate": "2025-11-10",
       "cities": 21
     }
     ```

2. **部署更新**:
   - 提交並推送到 GitHub
   - GitHub Actions 自動部署

3. **用戶端自動更新**:
   - 用戶訪問網站
   - 背景檢測到新版本
   - 顯示通知:「檢測到 30,000 筆新資料,正在更新...」
   - 背景下載並更新資料
   - 完成後顯示:「資料更新完成！」
   - 介面自動刷新

## 技術細節

### 版本檢查邏輯

```javascript
// DataLoadService.js
async checkDataVersion() {
  // 1. 從 IndexedDB 讀取當前版本
  const currentVersion = await this.dbManager.getMetadata('dataVersion');
  
  // 2. 從靜態檔案讀取最新版本
  const latestVersion = await fetch('/data/version.json').then(r => r.json());
  
  // 3. 比較版本
  if (!currentVersion) {
    return { needsLoad: true, needsUpdate: false };
  }
  
  if (currentVersion.recordCount < latestVersion.recordCount) {
    return { 
      needsLoad: false, 
      needsUpdate: true,
      newRecords: latestVersion.recordCount - currentVersion.recordCount
    };
  }
  
  return { needsLoad: false, needsUpdate: false };
}
```

### 元資料結構

```javascript
// 儲存在 IndexedDB metadata store 中
{
  key: 'dataVersion',
  value: {
    version: '1.0.0',
    recordCount: 170000,
    lastUpdate: '2025-11-03',
    cities: 21
  },
  updatedAt: 1730620800000
}
```

### 載入進度追蹤

```javascript
// App.jsx
const [loadProgress, setLoadProgress] = useState(0);    // 0-100
const [loadStatus, setLoadStatus] = useState('');       // 狀態文字
const [loadCityName, setLoadCityName] = useState('');   // 當前城市

// DataLoadService 回調
onProgress: (progressData) => {
  setLoadProgress(progressData.progress);
  setLoadStatus(progressData.status);
  setLoadCityName(progressData.cityName);
}
```

## 用戶介面變更

### Header 變更

**移除**:
- 「資料管理」按鈕

**新增**:
- 資料統計資訊顯示:「📊 找到 200,000 筆交易資料」

### 載入畫面

**舊版**: 彈出式對話框
- 需要用戶點擊「開始載入資料」
- 阻擋部分介面
- 視覺效果較弱

**新版**: 全螢幕載入畫面
- 自動開始載入
- 全螢幕覆蓋
- 美觀的漸層背景
- 動態進度條
- 實時狀態更新
- 平滑的淡入淡出

## 開發者功能

在開發模式下,可以使用以下控制台指令:

```javascript
// 清除所有資料並重新載入
window.clearData = async () => {
  const { IndexedDBManager } = await import('./services/IndexedDBManager');
  const dbManager = new IndexedDBManager();
  await dbManager.init();
  await dbManager.clearAllData();
  window.location.reload();
};

// 強制重新載入資料
window.forceReload = async () => {
  const { dataLoadService } = await import('./services/DataLoadService');
  await dataLoadService.loadAllData({
    onProgress: (p) => console.log(p),
    onComplete: () => window.location.reload(),
    onError: (e) => console.error(e)
  });
};

// 檢查版本
window.checkVersion = async () => {
  const { dataLoadService } = await import('./services/DataLoadService');
  const result = await dataLoadService.checkDataVersion();
  console.log('版本檢查結果:', result);
};
```

## 測試檢查清單

### 首次使用測試
- [ ] 清除瀏覽器資料
- [ ] 訪問網站
- [ ] 確認顯示全螢幕載入畫面
- [ ] 確認自動開始載入
- [ ] 確認進度條正常更新
- [ ] 確認狀態訊息正確顯示
- [ ] 確認載入完成後自動進入主介面
- [ ] 確認資料正確顯示

### 後續訪問測試
- [ ] 關閉瀏覽器
- [ ] 重新開啟網站
- [ ] 確認直接顯示主介面(< 1 秒)
- [ ] 確認資料已持久保存
- [ ] 確認所有功能正常

### 資料更新測試
- [ ] 修改 version.json 增加 recordCount
- [ ] 重新訪問網站
- [ ] 確認顯示更新通知
- [ ] 確認背景開始更新
- [ ] 確認更新完成通知
- [ ] 確認資料已更新

### 錯誤處理測試
- [ ] 斷開網路連線
- [ ] 嘗試載入資料
- [ ] 確認顯示錯誤訊息
- [ ] 重新連線後重試

### 相容性測試
- [ ] Chrome/Edge 最新版
- [ ] Firefox 最新版
- [ ] Safari 最新版
- [ ] 行動裝置瀏覽器

## 部署步驟

### 1. 提交更改
```bash
git add .
git commit -m "feat: 實現全螢幕載入和自動更新功能

- 創建全螢幕載入畫面替代對話框
- 實現資料版本管理和自動檢測
- 移除資料管理按鈕,簡化介面
- 支援背景自動更新
- 升級 IndexedDB 到版本 2
- 添加元資料管理功能"
```

### 2. 推送到 GitHub
```bash
git push origin main
```

### 3. 自動部署
GitHub Actions 會自動構建和部署到 GitHub Pages

### 4. 驗證部署
- 訪問部署的網站
- 執行完整測試流程

## 維護指南

### 更新資料時的步驟

1. **準備新資料**:
   - 更新 `public/data/chunks/` 中的 JSON 檔案
   - 確認資料格式正確

2. **更新版本資訊**:
   ```json
   {
     "version": "1.1.0",           // 遞增版本號
     "recordCount": 200000,        // 更新總筆數
     "lastUpdate": "2025-11-10",   // 更新日期
     "cities": 21                  // 城市數量
   }
   ```

3. **測試**:
   - 在本地測試資料載入
   - 確認版本檢測正常
   - 驗證更新流程

4. **部署**:
   - 提交並推送更改
   - 等待自動部署完成
   - 驗證線上版本

### 監控建議

- 監控載入時間
- 追蹤錯誤率
- 收集用戶反饋
- 檢查資料完整性

## 注意事項

### ⚠️ 重要提醒

1. **version.json 必須更新**: 每次更新資料時,務必更新 `version.json`
2. **快取策略**: 確保 `version.json` 不被瀏覽器快取
3. **資料完整性**: 更新前驗證所有資料檔案
4. **向後相容**: 確保新版本可以處理舊資料
5. **錯誤處理**: 載入失敗時提供友好提示

### 💡 最佳實踐

1. **版本號規則**: 使用語義化版本 (Semantic Versioning)
2. **測試流程**: 每次更新前完整測試
3. **備份資料**: 保留舊版本資料備份
4. **文件記錄**: 記錄每次更新的內容
5. **用戶通知**: 重大更新時提前通知用戶

## 回滾方案

如果需要回滾到舊版本:

### 方案 1: 恢復舊檔案
```bash
# 恢復舊的 App.jsx
mv src/App_backup.jsx src/App.jsx

# 恢復 DataLoader
mv src/components/DataLoader_backup.jsx src/components/DataLoader.jsx

# 刪除新檔案
rm src/components/LoadingScreen.jsx
rm src/components/UpdateNotification.jsx
rm src/services/DataLoadService.js
```

### 方案 2: Git 回滾
```bash
git revert HEAD
git push origin main
```

## 未來改進方向

### 短期 (1-2 週)
- [ ] 添加載入動畫優化
- [ ] 實現更詳細的錯誤處理
- [ ] 添加載入重試機制
- [ ] 優化進度計算精確度

### 中期 (1-2 個月)
- [ ] 實現增量更新(只下載新資料)
- [ ] 添加資料壓縮
- [ ] 實現 Service Worker
- [ ] 支援完全離線使用

### 長期 (3-6 個月)
- [ ] 建立後端 API
- [ ] 實現即時資料同步
- [ ] 支援多裝置同步
- [ ] 添加資料分析功能

## 問題排查

### 如果載入畫面沒有顯示
1. 檢查瀏覽器控制台錯誤
2. 確認 LoadingScreen.jsx 已正確匯入
3. 檢查 loading 狀態是否正確設置

### 如果版本檢測失敗
1. 確認 version.json 檔案存在
2. 檢查檔案格式是否正確
3. 確認網路連線正常
4. 檢查 CORS 設定

### 如果資料沒有自動更新
1. 確認 version.json 已更新
2. 檢查 recordCount 是否增加
3. 清除瀏覽器快取重試
4. 檢查控制台日誌

### 如果 IndexedDB 升級失敗
1. 清除瀏覽器所有資料
2. 重新訪問網站
3. 確認資料庫版本正確
4. 檢查瀏覽器相容性

## 技術支援

如有問題,請檢查:
1. 瀏覽器控制台錯誤訊息
2. 網路連線狀態
3. IndexedDB 可用性
4. 瀏覽器版本和相容性

---

**文件版本**: 1.0  
**最後更新**: 2025-11-03  
**作者**: AI Assistant  
**狀態**: ✅ 已完成
