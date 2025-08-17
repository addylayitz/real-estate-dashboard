// public/dataWorker_v2.js - 修正房型處理

// 城市名稱對應
const CITY_NAMES = {
  taipei: '台北市',
  newtaipei: '新北市',
  taoyuan: '桃園市',
  taichung: '台中市',
  tainan: '台南市',
  kaohsiung: '高雄市',
  keelung: '基隆市',
  hsinchu: '新竹市',
  chiayi: '嘉義市',
  'hsinchu-county': '新竹縣',
  miaoli: '苗栗縣',
  changhua: '彰化縣',
  nantou: '南投縣',
  yunlin: '雲林縣',
  'chiayi-county': '嘉義縣',
  pingtung: '屏東縣',
  yilan: '宜蘭縣',
  hualien: '花蓮縣',
  taitung: '台東縣',
  penghu: '澎湖縣',
  kinmen: '金門縣'
};

// 城市ID列表
const CITY_IDS = Object.keys(CITY_NAMES);

// 訊息處理
self.onmessage = async function(e) {
  const { type } = e.data;
  
  try {
    if (type === 'loadData') {
      await loadAllData();
    } else {
      postMessage({
        type: 'error',
        error: `未知的訊息類型: ${type}`
      });
    }
  } catch (error) {
    console.error('[Worker] 處理訊息失敗:', error);
    postMessage({
      type: 'error',
      error: error.message
    });
  }
};

// 載入所有資料
async function loadAllData() {
  try {
    console.log('[Worker] 開始載入所有資料...');
    
    let totalProcessed = 0;
    const totalCities = CITY_IDS.length;
    
    // 逐一載入每個城市的資料
    for (let i = 0; i < CITY_IDS.length; i++) {
      const cityId = CITY_IDS[i];
      const cityName = CITY_NAMES[cityId];
      
      try {
        console.log(`[Worker] 開始載入 ${cityName} (${cityId})`);
        
        // 更新進度
        const progress = Math.round((i / totalCities) * 100);
        postMessage({
          type: 'progress',
          data: {
            progress: progress,
            status: `正在載入 ${cityName} 資料...`
          }
        });
        
        // 載入城市資料
        const cityData = await loadCityData(cityId, cityName);
        
        if (cityData && cityData.length > 0) {
          // 發送城市完成訊息
          postMessage({
            type: 'cityComplete',
            data: {
              cityName: cityName,
              cityId: cityId,
              count: cityData.length,
              data: cityData
            }
          });
          
          totalProcessed += cityData.length;
          console.log(`[Worker] ${cityName} 載入完成: ${cityData.length} 筆`);
        } else {
          console.warn(`[Worker] ${cityName} 沒有資料或載入失敗`);
        }
        
      } catch (cityError) {
        console.error(`[Worker] ${cityName} 載入失敗:`, cityError);
        postMessage({
          type: 'error',
          error: `${cityName} 載入失敗: ${cityError.message}`
        });
      }
    }
    
    // 載入完成
    console.log(`[Worker] 所有資料載入完成，總計: ${totalProcessed} 筆`);
    postMessage({
      type: 'complete',
      data: {
        totalRecords: totalProcessed,
        totalCities: totalCities
      }
    });
    
  } catch (error) {
    console.error('[Worker] 載入所有資料失敗:', error);
    postMessage({
      type: 'error',
      error: `載入失敗: ${error.message}`
    });
  }
}

// 載入單一城市資料
async function loadCityData(cityId, cityName) {
  try {
    const response = await fetch(`./data/chunks/${cityId}.json`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const rawData = await response.json();
    console.log(`[Worker] ${cityName} 原始資料: ${rawData.length} 筆`);
    
    // 處理資料
    const processedData = rawData.map((item, index) => {
      return processDataItem(item, cityId, cityName, index);
    }).filter(item => item !== null);
    
    console.log(`[Worker] ${cityName} 處理後資料: ${processedData.length} 筆`);
    return processedData;
    
  } catch (error) {
    console.error(`[Worker] 載入 ${cityName} 失敗:`, error);
    throw error;
  }
}

// 處理房型資訊 - 簡化版本（只保留房數）
function formatRoomType(rawRoomType) {
  if (!rawRoomType) return '未知';
  
  const roomStr = String(rawRoomType).trim();
  
  // 如果是純數字
  if (!isNaN(roomStr) && roomStr !== '') {
    const roomNum = parseInt(roomStr);
    if (roomNum >= 1 && roomNum <= 10) { // 合理的房數範圍
      return `${roomNum}房`;
    }
  }
  
  // 如果已經包含"房"字，直接使用
  if (roomStr.includes('房')) {
    return roomStr;
  }
  
  // 嘗試從字串中提取數字
  const match = roomStr.match(/(\d+)/);
  if (match) {
    const roomNum = parseInt(match[1]);
    if (roomNum >= 1 && roomNum <= 10) {
      return `${roomNum}房`;
    }
  }
  
  return '未知';
}

// 處理交易日期 - 修正版本（已經是西元年）
function formatTransactionDate(rawDate) {
  if (!rawDate) return null;
  
  try {
    const dateStr = String(rawDate).trim();
    console.log(`[Worker] 處理日期: ${dateStr}`);
    
    // 處理斜線分隔的西元年格式：2025/02/13
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        
        console.log(`[Worker] 西元年格式: ${year}/${month}/${day}`);
        
        // 檢查年份是否合理 (2020-2030)
        if (year >= 2020 && year <= 2030) {
          return `${year}-${month}-${day}`;
        }
      }
    }
    
    // 處理橫線分隔的西元年格式：2025-02-13
    if (dateStr.includes('-')) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        // 檢查年份是否合理
        if (year >= 2020 && year <= 2030) {
          console.log(`[Worker] 標準日期格式: ${year}`);
          return date.toISOString().split('T')[0];
        }
      }
    }
    
    // 處理純數字西元年格式：20250213 (8位數)
    if (!isNaN(dateStr) && dateStr.length === 8) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      
      const westernYear = parseInt(year);
      if (westernYear >= 2020 && westernYear <= 2030) {
        console.log(`[Worker] 8位數西元年: ${year}`);
        return `${year}-${month}-${day}`;
      }
    }
    
    console.warn(`[Worker] 無法解析的日期格式: ${dateStr}`);
    
  } catch (error) {
    console.warn(`[Worker] 日期解析失敗: ${rawDate}`, error);
  }
  
  return null;
}

// 處理單筆資料
function processDataItem(item, cityId, cityName, index) {
  try {
    // 尋找面積欄位
    const areaFields = ['面積(坪)', '總面積_坪', '總面積(坪)', '面積', '建物面積'];
    let area = 0;
    
    for (const field of areaFields) {
      if (item[field] && parseFloat(item[field]) > 0) {
        area = parseFloat(item[field]);
        break;
      }
    }
    
    // 處理價格資料
    const totalPriceWan = parseFloat(item['總價(萬)']) || 0;
    const unitPriceWan = parseFloat(item['單價(萬/坪)']) || 0;
    
    // 轉換為元
    const totalPrice = totalPriceWan * 10000;
    const unitPrice = unitPriceWan * 10000;
    
    // 處理房型資訊 - 簡化版本（只保留房數）
    const roomType = formatRoomType(item['房型']);
    
    // 處理交易日期 - 修正邏輯
    const transactionDate = formatTransactionDate(item['交易年月日']);
    
    return {
      // 基本資訊
      city: cityId,
      cityName: cityName,
      district: item['區域'] || '未知',
      project: item['建案名稱'] || '未知建案',
      
      // 房屋資訊
      roomType: roomType,
      area: area,
      floor: item['樓層'] || '',
      
      // 價格資訊
      totalPrice: totalPrice,
      unitPrice: unitPrice,
      
      // 交易資訊
      transactionDate: transactionDate,
      address: item['建物門牌'] || '',
      
      // 其他資訊
      buildingType: item['建物型態'] || '',
      parkingSpace: item['車位'] || '',
      parkingPrice: parseFloat(item['車位總價']) || 0,
      landUse: item['土地使用分區'] || '',
      buildingNumber: item['棟及號'] || '',
      
      // 保留原始資料供除錯
      raw: item
    };
    
  } catch (error) {
    console.error(`[Worker] 處理資料項目失敗 (${cityName} 第 ${index + 1} 筆):`, error);
    return null;
  }
}

console.log('[Worker] dataWorker_v2.js 已載入');