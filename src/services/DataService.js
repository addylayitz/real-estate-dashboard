// src/services/DataService.js - 修正城市選項
import { IndexedDBManager } from './IndexedDBManager';

class DataService {
  constructor() {
    this.dbManager = new IndexedDBManager();
    this.initialized = false;
  }

  async init() {
    if (!this.initialized) {
      await this.dbManager.init();
      this.initialized = true;
    }
  }

  async isDataLoaded() {
    await this.init();
    const stats = await this.dbManager.getDatabaseStats();
    return stats.totalRecords > 0;
  }

  async getAllData() {
    await this.init();
    return await this.dbManager.queryData({}, 200000); // 增加限制到 20萬筆
  }

  async loadDataFromFiles() {
    await this.init();
    
    // 這裡會由 DataLoader 元件呼叫
    // 實際的檔案載入邏輯在 dataWorker_v2.js 中
    return true;
  }

  getFilterOptions(data) {
    if (!data || data.length === 0) {
      return {
        cities: [],
        districts: [],
        projects: [],
        roomTypes: []
      };
    }

    // 建立城市選項 - 使用 Map 去重並保持順序
    const cityMap = new Map();
    
    data.forEach(item => {
      if (item.city && item.cityName) {
        cityMap.set(item.city, item.cityName);
      }
    });

    const cities = Array.from(cityMap.entries()).map(([value, label]) => ({
      value,
      label
    }));

    // 按城市名稱排序
    cities.sort((a, b) => a.label.localeCompare(b.label, 'zh-TW'));

    // 其他選項
    const districts = [...new Set(data.map(item => item.district).filter(Boolean))];
    const projects = [...new Set(data.map(item => item.project).filter(Boolean))];
    const roomTypes = [...new Set(data.map(item => item.roomType).filter(Boolean))];

    console.log('[DataService] 篩選選項統計:', {
      cities: cities.length,
      districts: districts.length,
      projects: projects.length,
      roomTypes: roomTypes.length
    });

    return {
      cities: cities,
      districts: districts.slice(0, 100),
      projects: projects.slice(0, 200),
      roomTypes: roomTypes.slice(0, 20)
    };
  }

  filterData(data, filters) {
    if (!data || data.length === 0) return [];

    return data.filter(item => {
      // 城市篩選
      if (filters.city && item.city !== filters.city) {
        return false;
      }

      // 區域篩選
      if (filters.district && item.district !== filters.district) {
        return false;
      }

      // 建案篩選
      if (filters.project && item.project !== filters.project) {
        return false;
      }

      // 房型篩選
      if (filters.roomType && item.roomType !== filters.roomType) {
        return false;
      }

      // 日期篩選
      if (filters.startDate && item.transactionDate) {
        const itemDate = new Date(item.transactionDate);
        const startDate = new Date(filters.startDate);
        if (itemDate < startDate) return false;
      }

      if (filters.endDate && item.transactionDate) {
        const itemDate = new Date(item.transactionDate);
        const endDate = new Date(filters.endDate);
        if (itemDate > endDate) return false;
      }

      // 價格篩選 (以萬為單位)
      if (filters.minPrice && item.totalPrice) {
        const priceInWan = item.totalPrice / 10000;
        if (priceInWan < parseFloat(filters.minPrice)) return false;
      }

      if (filters.maxPrice && item.totalPrice) {
        const priceInWan = item.totalPrice / 10000;
        if (priceInWan > parseFloat(filters.maxPrice)) return false;
      }

      return true;
    });
  }

  getStatistics(data) {
    if (!data || data.length === 0) {
      return {
        totalCount: 0,
        avgPrice: 0,
        avgUnitPrice: 0,
        avgArea: 0
      };
    }

    const validData = data.filter(item => 
      item.totalPrice > 0 && item.unitPrice > 0 && item.area > 0
    );

    if (validData.length === 0) {
      return {
        totalCount: data.length,
        avgPrice: 0,
        avgUnitPrice: 0,
        avgArea: 0
      };
    }

    const totalPrice = validData.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalUnitPrice = validData.reduce((sum, item) => sum + item.unitPrice, 0);
    const totalArea = validData.reduce((sum, item) => sum + item.area, 0);

    return {
      totalCount: data.length,
      avgPrice: Math.round(totalPrice / validData.length / 10000), // 萬
      avgUnitPrice: Math.round(totalUnitPrice / validData.length / 10000), // 萬/坪
      avgArea: Math.round(totalArea / validData.length) // 坪
    };
  }

  async clearData() {
    await this.init();
    await this.dbManager.clearAllData();
  }

  async queryData(filters = {}, limit = 1000) {
    await this.init();
    return await this.dbManager.queryData(filters, limit);
  }
}

// 建立單一實例
export const dataService = new DataService();