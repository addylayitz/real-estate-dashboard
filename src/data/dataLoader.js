// 完整版資料載入器 - 載入所有 21 個縣市資料
import { processRawData, generateMetadata } from './dataProcessor';

// 所有縣市的載入器對應
const cityDataLoaders = {
  'changhua': () => import('./chunks/changhua.json'),
  'chiayi-county': () => import('./chunks/chiayi-county.json'),
  'chiayi': () => import('./chunks/chiayi.json'),
  'hsinchu-county': () => import('./chunks/hsinchu-county.json'),
  'hsinchu': () => import('./chunks/hsinchu.json'),
  'hualien': () => import('./chunks/hualien.json'),
  'kaohsiung': () => import('./chunks/kaohsiung.json'),
  'keelung': () => import('./chunks/keelung.json'),
  'kinmen': () => import('./chunks/kinmen.json'),
  'miaoli': () => import('./chunks/miaoli.json'),
  'nantou': () => import('./chunks/nantou.json'),
  'newtaipei': () => import('./chunks/newtaipei.json'),
  'penghu': () => import('./chunks/penghu.json'),
  'pingtung': () => import('./chunks/pingtung.json'),
  'taichung': () => import('./chunks/taichung.json'),
  'tainan': () => import('./chunks/tainan.json'),
  'taipei': () => import('./chunks/taipei.json'),
  'taitung': () => import('./chunks/taitung.json'),
  'taoyuan': () => import('./chunks/taoyuan.json'),
  'yilan': () => import('./chunks/yilan.json'),
  'yunlin': () => import('./chunks/yunlin.json'),
};

// 縣市名稱對應表
const cityNameMap = {
  'changhua': '彰化縣',
  'chiayi-county': '嘉義縣',
  'chiayi': '嘉義市',
  'hsinchu-county': '新竹縣',
  'hsinchu': '新竹市',
  'hualien': '花蓮縣',
  'kaohsiung': '高雄市',
  'keelung': '基隆市',
  'kinmen': '金門縣',
  'miaoli': '苗栗縣',
  'nantou': '南投縣',
  'newtaipei': '新北市',
  'penghu': '澎湖縣',
  'pingtung': '屏東縣',
  'taichung': '台中市',
  'tainan': '台南市',
  'taipei': '台北市',
  'taitung': '台東縣',
  'taoyuan': '桃園市',
  'yilan': '宜蘭縣',
  'yunlin': '雲林縣',
};

class DataLoader {
  constructor() {
    this.cache = new Map();
    this.metadata = null;
    this.isLoading = false;
    this.loadingProgress = 0;
  }

  /**
   * 載入單一城市資料
   */
  async loadCityData(cityId) {
    // 檢查快取
    if (this.cache.has(cityId)) {
      console.log(`從快取讀取 ${cityNameMap[cityId]} 資料`);
      return this.cache.get(cityId);
    }

    const loader = cityDataLoaders[cityId];
    if (!loader) {
      console.warn(`找不到城市資料: ${cityId}`);
      return [];
    }

    try {
      console.log(`載入 ${cityNameMap[cityId]} 資料...`);
      
      // 動態載入 JSON
      const module = await loader();
      const rawData = module.default;
      
      // 處理資料
      const processedData = processRawData(rawData);
      
      // 快取
      this.cache.set(cityId, processedData);
      
      console.log(`${cityNameMap[cityId]} 資料載入完成：${processedData.length} 筆`);
      return processedData;
    } catch (error) {
      console.error(`載入 ${cityNameMap[cityId]} 資料失敗:`, error);
      return [];
    }
  }

  /**
   * 載入多個城市資料
   */
  async loadMultipleCities(cityIds, onProgress) {
    const results = [];
    const total = cityIds.length;
    
    for (let i = 0; i < cityIds.length; i++) {
      const cityId = cityIds[i];
      const data = await this.loadCityData(cityId);
      results.push(...data);
      
      // 更新進度
      this.loadingProgress = Math.round((i + 1) / total * 100);
      if (onProgress) {
        onProgress(this.loadingProgress, cityNameMap[cityId]);
      }
    }
    
    return results;
  }

  /**
   * 載入所有資料
   */
  async loadAllData(onProgress) {
    try {
      this.isLoading = true;
      console.log('開始載入所有縣市資料...');
      
      const allCities = Object.keys(cityDataLoaders);
      const startTime = Date.now();
      
      // 分批載入以避免記憶體問題
      const batchSize = 5;
      const allData = [];
      
      for (let i = 0; i < allCities.length; i += batchSize) {
        const batch = allCities.slice(i, i + batchSize);
        const batchPromises = batch.map(cityId => this.loadCityData(cityId));
        const batchResults = await Promise.all(batchPromises);
        
        // 合併結果
        batchResults.forEach(cityData => {
          allData.push(...cityData);
        });
        
        // 更新進度
        this.loadingProgress = Math.min(100, Math.round((i + batchSize) / allCities.length * 100));
        if (onProgress) {
          onProgress(this.loadingProgress, `已載入 ${Math.min(i + batchSize, allCities.length)}/${allCities.length} 個縣市`);
        }
      }
      
      // 生成 metadata
      this.metadata = generateMetadata(allData);
      
      const endTime = Date.now();
      const loadTime = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log('='.repeat(50));
      console.log(`資料載入完成！`);
      console.log(`總筆數：${allData.length} 筆`);
      console.log(`載入時間：${loadTime} 秒`);
      console.log(`縣市數：${this.metadata.cities.length}`);
      console.log(`區域數：${this.metadata.districts.length}`);
      console.log(`建案數：${this.metadata.projects.length}`);
      console.log('='.repeat(50));
      
      // 顯示各縣市統計
      console.log('\n各縣市資料統計：');
      this.metadata.cities.forEach(city => {
        console.log(`${city.name}: ${city.count} 筆`);
      });
      
      this.isLoading = false;
      return allData;
    } catch (error) {
      console.error('載入資料失敗:', error);
      this.isLoading = false;
      return [];
    }
  }

  /**
   * 載入熱門城市資料（六都）
   */
  async loadMajorCities(onProgress) {
    const majorCities = ['taipei', 'newtaipei', 'taoyuan', 'taichung', 'tainan', 'kaohsiung'];
    console.log('載入六都資料...');
    return this.loadMultipleCities(majorCities, onProgress);
  }

  /**
   * 取得 metadata
   */
  async getMetadata() {
    if (this.metadata) return this.metadata;
    
    // 如果沒有 metadata，先載入部分資料來生成
    console.log('生成 metadata...');
    const sampleData = await this.loadCityData('taipei');
    this.metadata = generateMetadata(sampleData);
    return this.metadata;
  }

  /**
   * 清除快取
   */
  clearCache() {
    this.cache.clear();
    this.metadata = null;
    this.loadingProgress = 0;
    console.log('快取已清除');
  }

  /**
   * 取得快取狀態
   */
  getCacheStatus() {
    const cachedCities = Array.from(this.cache.keys());
    const totalRecords = Array.from(this.cache.values())
      .reduce((sum, data) => sum + data.length, 0);
    
    const status = {
      cachedCities: cachedCities.map(id => ({
        id,
        name: cityNameMap[id],
        count: this.cache.get(id)?.length || 0
      })),
      totalCities: cachedCities.length,
      totalRecords,
      cacheSize: this.estimateCacheSize(),
      hasMetadata: !!this.metadata
    };
    
    return status;
  }

  /**
   * 估算快取大小
   */
  estimateCacheSize() {
    let size = 0;
    this.cache.forEach(data => {
      // 粗略估算每筆資料 200 bytes
      size += data.length * 200;
    });
    return (size / 1024 / 1024).toFixed(2) + ' MB';
  }

  /**
   * 取得載入進度
   */
  getLoadingProgress() {
    return this.loadingProgress;
  }

  /**
   * 取得縣市列表
   */
  getCityList() {
    return Object.entries(cityNameMap).map(([id, name]) => ({
      id,
      name,
      hasData: cityDataLoaders.hasOwnProperty(id)
    }));
  }
}

// 建立單例
const dataLoader = new DataLoader();

// 匯出
export default dataLoader;

// 測試功能（開發模式）
if (import.meta.env.DEV) {
  window.dataLoader = dataLoader;
  console.log('DataLoader 已載入，可在 Console 使用 window.dataLoader 進行測試');
  console.log('測試指令：');
  console.log('- window.dataLoader.getCityList() // 查看所有縣市');
  console.log('- window.dataLoader.loadCityData("taipei") // 載入單一縣市');
  console.log('- window.dataLoader.loadMajorCities() // 載入六都');
  console.log('- window.dataLoader.loadAllData() // 載入所有資料');
  console.log('- window.dataLoader.getCacheStatus() // 查看快取狀態');
}