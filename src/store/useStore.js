// src/store/useStore.js - 支援建案多選版本
import { create } from 'zustand';
import { dataService } from '../services/DataService';

export const useStore = create((set, get) => ({
  // 資料狀態
  allData: [],
  filteredData: [],
  loading: false,
  dataLoaded: false,
  
  // 篩選條件 - 修改 project 為陣列格式
  filters: {
    city: '',
    district: '',
    project: '', // 保持字串格式以相容現有系統
    roomType: '',
    startDate: '',
    endDate: '',
    minPrice: '',
    maxPrice: ''
  },
  
  // 可選選項
  options: {
    cities: [],
    districts: [],
    projects: [],
    roomTypes: []
  },

  // 載入資料
  loadData: async () => {
    set({ loading: true });
    try {
      console.log('[useStore] 開始載入資料...');
      const data = await dataService.getAllData();
      console.log('[useStore] 載入資料完成:', data.length, '筆');
      
      const options = dataService.getFilterOptions(data);
      console.log('[useStore] 篩選選項:', options);
      
      set({
        allData: data,
        filteredData: data, // 初始時顯示所有資料
        options,
        dataLoaded: true,
        loading: false
      });
    } catch (error) {
      console.error('[useStore] 載入資料失敗:', error);
      set({ loading: false });
    }
  },

  // 檢查資料是否已載入
  checkDataStatus: async () => {
    try {
      const isLoaded = await dataService.isDataLoaded();
      console.log('[useStore] 資料載入狀態:', isLoaded);
      set({ dataLoaded: isLoaded });
      
      if (isLoaded) {
        // 如果資料已存在，直接載入
        await get().loadData();
      }
    } catch (error) {
      console.error('[useStore] 檢查資料狀態失敗:', error);
      set({ dataLoaded: false });
    }
  },

  // 增強的篩選資料方法 - 支援建案多選
  filterDataWithMultiSelect: (data, filters) => {
    console.log('[useStore] 開始篩選資料，支援建案多選:', filters);
    
    if (!data || data.length === 0) {
      console.log('[useStore] 沒有資料可篩選');
      return [];
    }

    let filtered = [...data];

    // 城市篩選
    if (filters.city && filters.city.trim() !== '') {
      filtered = filtered.filter(item => item.city === filters.city);
      console.log(`[useStore] 城市篩選後: ${filtered.length} 筆`);
    }

    // 區域篩選 - 支援複選（逗號分隔）
    if (filters.district && filters.district.trim() !== '') {
      const districts = filters.district.split(',').map(d => d.trim()).filter(d => d);
      if (districts.length > 0) {
        filtered = filtered.filter(item => districts.includes(item.district));
        console.log(`[useStore] 區域篩選後 (${districts.join(', ')}): ${filtered.length} 筆`);
      }
    }

    // 建案篩選 - 新增多選支援
    if (filters.project && filters.project.trim() !== '') {
      const projects = filters.project.split(',').map(p => p.trim()).filter(p => p);
      if (projects.length > 0) {
        filtered = filtered.filter(item => projects.includes(item.project));
        console.log(`[useStore] 建案篩選後 (${projects.join(', ')}): ${filtered.length} 筆`);
      }
    }

    // 房型篩選 - 支援複選（逗號分隔）
    if (filters.roomType && filters.roomType.trim() !== '') {
      const roomTypes = filters.roomType.split(',').map(rt => rt.trim()).filter(rt => rt);
      if (roomTypes.length > 0) {
        filtered = filtered.filter(item => roomTypes.includes(item.roomType));
        console.log(`[useStore] 房型篩選後 (${roomTypes.join(', ')}): ${filtered.length} 筆`);
      }
    }

    // 日期篩選
    if (filters.startDate && filters.startDate.trim() !== '') {
      filtered = filtered.filter(item => {
        if (!item.transactionDate) return false;
        const itemDate = new Date(item.transactionDate);
        const startDate = new Date(filters.startDate);
        return itemDate >= startDate;
      });
      console.log(`[useStore] 開始日期篩選後: ${filtered.length} 筆`);
    }

    if (filters.endDate && filters.endDate.trim() !== '') {
      filtered = filtered.filter(item => {
        if (!item.transactionDate) return false;
        const itemDate = new Date(item.transactionDate);
        const endDate = new Date(filters.endDate);
        return itemDate <= endDate;
      });
      console.log(`[useStore] 結束日期篩選後: ${filtered.length} 筆`);
    }

    // 價格篩選
    if (filters.minPrice && filters.minPrice !== '') {
      const minPrice = parseFloat(filters.minPrice) * 10000; // 轉換為元
      filtered = filtered.filter(item => {
        const price = parseFloat(item.totalPrice || 0);
        return price >= minPrice;
      });
      console.log(`[useStore] 最低價格篩選後: ${filtered.length} 筆`);
    }

    if (filters.maxPrice && filters.maxPrice !== '') {
      const maxPrice = parseFloat(filters.maxPrice) * 10000; // 轉換為元
      filtered = filtered.filter(item => {
        const price = parseFloat(item.totalPrice || 0);
        return price <= maxPrice;
      });
      console.log(`[useStore] 最高價格篩選後: ${filtered.length} 筆`);
    }

    console.log(`[useStore] 篩選完成: ${data.length} -> ${filtered.length} 筆`);
    return filtered;
  },

  // 更新篩選條件
  setFilters: (newFilters) => {
    console.log('[useStore] 更新篩選條件:', newFilters);
    const updatedFilters = { ...get().filters, ...newFilters };
    
    // 使用增強的篩選方法
    const filteredData = get().filterDataWithMultiSelect(get().allData, updatedFilters);
    
    console.log('[useStore] 篩選結果:', {
      原始資料: get().allData.length,
      篩選後: filteredData.length,
      篩選條件: updatedFilters
    });
    
    set({
      filters: updatedFilters,
      filteredData
    });
  },

  // 清除篩選條件
  clearFilters: () => {
    console.log('[useStore] 清除篩選條件');
    const defaultFilters = {
      city: '',
      district: '',
      project: '',
      roomType: '',
      startDate: '',
      endDate: '',
      minPrice: '',
      maxPrice: ''
    };
    
    set({
      filters: defaultFilters,
      filteredData: get().allData
    });
  },

  // 取得統計資料
  getStatistics: () => {
    const { filteredData } = get();
    return dataService.getStatistics(filteredData);
  },

  // 取得篩選選項 - 增強版本
  getFilterOptionsEnhanced: (data) => {
    if (!data || data.length === 0) return { cities: [], districts: [], projects: [], roomTypes: [] };

    // 城市選項
    const cities = [...new Set(data.map(item => item.cityName || item.city))].filter(Boolean);
    const cityOptions = cities.map(city => ({
      value: data.find(item => (item.cityName || item.city) === city)?.city || city,
      label: city
    })).sort((a, b) => a.label.localeCompare(b.label, 'zh-TW'));

    // 區域選項
    const districts = [...new Set(data.map(item => item.district))].filter(Boolean);
    
    // 建案選項
    const projects = [...new Set(data.map(item => item.project))].filter(Boolean);
    
    // 房型選項
    const roomTypes = [...new Set(data.map(item => item.roomType))].filter(Boolean);

    return {
      cities: cityOptions,
      districts: districts.sort((a, b) => a.localeCompare(b, 'zh-TW')),
      projects: projects.sort((a, b) => a.localeCompare(b, 'zh-TW')),
      roomTypes: roomTypes.sort((a, b) => a.localeCompare(b, 'zh-TW'))
    };
  },

  // 清除所有資料
  clearAllData: async () => {
    try {
      console.log('[useStore] 清除所有資料...');
      await dataService.clearData();
      set({
        allData: [],
        filteredData: [],
        dataLoaded: false,
        filters: {
          city: '',
          district: '',
          project: '',
          roomType: '',
          startDate: '',
          endDate: '',
          minPrice: '',
          maxPrice: ''
        },
        options: {
          cities: [],
          districts: [],
          projects: [],
          roomTypes: []
        }
      });
      console.log('[useStore] 資料清除完成');
    } catch (error) {
      console.error('[useStore] 清除資料失敗:', error);
    }
  }
}));