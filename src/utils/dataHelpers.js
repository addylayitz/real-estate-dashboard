// src/utils/dataHelpers.js
// 輔助函數:安全地從大量資料中提取唯一值

/**
 * 從大量資料中提取唯一值,避免堆疊溢位
 * @param {Array} data - 資料陣列
 * @param {Function} extractor - 提取函數,例如: item => item.city
 * @param {Object} options - 選項
 * @param {boolean} options.filter - 是否過濾空值
 * @param {number} options.limit - 限制數量
 * @returns {Array} 唯一值陣列
 */
export function getUniqueValues(data, extractor, options = {}) {
  const { filter = true, limit = Infinity } = options;
  
  if (!data || data.length === 0) {
    return [];
  }

  const uniqueSet = new Set();
  
  // 使用 for 迴圈逐步收集,避免 map() 創建臨時陣列
  for (let i = 0; i < data.length && uniqueSet.size < limit; i++) {
    const value = extractor(data[i]);
    
    // 根據選項決定是否過濾空值
    if (filter) {
      if (value && String(value).trim()) {
        uniqueSet.add(value);
      }
    } else {
      uniqueSet.add(value);
    }
  }

  // 使用 Array.from 而不是展開運算符,避免堆疊溢位
  return Array.from(uniqueSet);
}

/**
 * 從大量資料中提取多個唯一值欄位
 * @param {Array} data - 資料陣列
 * @param {Object} extractors - 提取函數對象,例如: { cities: item => item.city }
 * @param {Object} options - 選項
 * @returns {Object} 唯一值對象
 */
export function getMultipleUniqueValues(data, extractors, options = {}) {
  if (!data || data.length === 0) {
    return Object.keys(extractors).reduce((acc, key) => {
      acc[key] = [];
      return acc;
    }, {});
  }

  const sets = {};
  const limits = options.limits || {};
  
  // 初始化 Set
  Object.keys(extractors).forEach(key => {
    sets[key] = new Set();
  });

  // 一次遍歷收集所有欄位
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    
    Object.entries(extractors).forEach(([key, extractor]) => {
      const limit = limits[key] || Infinity;
      if (sets[key].size < limit) {
        const value = extractor(item);
        if (value && String(value).trim()) {
          sets[key].add(value);
        }
      }
    });
  }

  // 轉換為陣列
  const result = {};
  Object.entries(sets).forEach(([key, set]) => {
    result[key] = Array.from(set);
  });

  return result;
}

/**
 * 安全地對大量資料進行 map 操作
 * @param {Array} data - 資料陣列
 * @param {Function} mapper - 映射函數
 * @param {number} chunkSize - 分塊大小
 * @returns {Array} 映射後的陣列
 */
export function safeMap(data, mapper, chunkSize = 10000) {
  if (!data || data.length === 0) {
    return [];
  }

  // 如果資料量小,直接使用 map
  if (data.length <= chunkSize) {
    return data.map(mapper);
  }

  // 分塊處理大量資料
  const result = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    result.push(...chunk.map(mapper));
  }

  return result;
}

/**
 * 安全地對大量資料進行 filter 操作
 * @param {Array} data - 資料陣列
 * @param {Function} predicate - 過濾函數
 * @param {number} chunkSize - 分塊大小
 * @returns {Array} 過濾後的陣列
 */
export function safeFilter(data, predicate, chunkSize = 10000) {
  if (!data || data.length === 0) {
    return [];
  }

  // 如果資料量小,直接使用 filter
  if (data.length <= chunkSize) {
    return data.filter(predicate);
  }

  // 分塊處理大量資料
  const result = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    result.push(...chunk.filter(predicate));
  }

  return result;
}
