// 資料處理器 - 將原始 JSON 轉換為系統格式

/**
 * 處理單筆資料
 */
function processRecord(record, index) {
  // 城市名稱對應
  const cityMap = {
    '台北市': 'taipei',
    '新北市': 'newtaipei',
    '桃園市': 'taoyuan',
    '台中市': 'taichung',
    '台南市': 'tainan',
    '高雄市': 'kaohsiung',
    '新竹市': 'hsinchu',
    '新竹縣': 'hsinchu-county',
    '基隆市': 'keelung',
    '宜蘭縣': 'yilan',
    '花蓮縣': 'hualien',
    '台東縣': 'taitung',
    '澎湖縣': 'penghu',
    '金門縣': 'kinmen',
    '連江縣': 'lienchiang',
    '苗栗縣': 'miaoli',
    '彰化縣': 'changhua',
    '南投縣': 'nantou',
    '雲林縣': 'yunlin',
    '嘉義市': 'chiayi',
    '嘉義縣': 'chiayi-county',
    '屏東縣': 'pingtung'
  };

  // 房型標準化
  const normalizeRoomType = (roomCount) => {
    if (!roomCount && roomCount !== 0) return '其他';
    const count = parseInt(roomCount);
    if (count <= 0) return '套房';
    if (count === 1) return '1房';
    if (count === 2) return '2房';
    if (count === 3) return '3房';
    if (count === 4) return '4房';
    if (count >= 5) return '5房以上';
    return `${count}房`;
  };

  // 日期格式處理 (YYYY/MM/DD → YYYY-MM-DD)
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    
    // 處理各種格式
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return dateStr;
  };

  // 樓層處理
  const processFloor = (floorStr) => {
    if (!floorStr) return 0;
    
    // 處理特殊樓層
    if (floorStr === '全' || floorStr === '透天') return -1; // 透天厝
    if (floorStr === '地下層') return -2;
    
    // 提取數字
    const match = floorStr.match(/(\d+)/);
    if (match) {
      return parseInt(match[1]);
    }
    
    // 中文數字轉換
    const chineseNumbers = {
      '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
      '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
    };
    
    for (const [chinese, num] of Object.entries(chineseNumbers)) {
      if (floorStr.includes(chinese)) {
        return num;
      }
    }
    
    return 0;
  };

  // 處理車位
  const hasParkingSpace = record['車位'] === '有' || 
                          record['車位'] === true || 
                          record['車位'] === 'Y' ||
                          (record['車位總價'] && record['車位總價'] > 0);

  // 計算單價（如果沒有提供）
  let unitPrice = parseFloat(record['單價(萬/坪)']) || 0;
  if (!unitPrice && record['總價(萬)'] && record['面積(坪)']) {
    unitPrice = parseFloat(record['總價(萬)']) / parseFloat(record['面積(坪)']);
  }

  // 建物型態標準化
  const buildingTypeMap = {
    '透天厝': 'house',
    '公寓': 'apartment',
    '華廈(10層含以下有電梯)': 'building',
    '住宅大樓(11層含以上有電梯)': 'highrise',
    '套房': 'studio',
    '店面': 'store',
    '辦公商業大樓': 'office',
    '廠辦': 'factory',
    '其他': 'other'
  };

  const buildingType = buildingTypeMap[record['建物型態']] || 'other';

  return {
    // 基本資訊
    id: `data-${index + 1}`,
    city: cityMap[record['縣市'] || record['city']] || record['city'] || 'other',
    cityName: record['縣市'] || record['city'] || '',
    district: record['區域'] || record['district'] || '',
    project: record['建案名稱'] || record['project'] || '',
    
    // 房屋資訊
    roomType: normalizeRoomType(record['房型']),
    roomCount: parseInt(record['房型']) || 0,
    bathroomCount: parseInt(record['衛']) || 0,
    area: parseFloat(record['面積(坪)']) || 0,
    buildingType: buildingType,
    buildingTypeName: record['建物型態'] || '',
    
    // 價格資訊
    totalPrice: (parseFloat(record['總價(萬)']) || 0) * 10000, // 轉換為元
    unitPrice: unitPrice * 10000, // 轉換為元/坪
    
    // 樓層資訊
    floor: processFloor(record['樓層']),
    floorStr: record['樓層'] || '',
    
    // 車位資訊
    parkingSpace: hasParkingSpace,
    parkingPrice: (parseFloat(record['車位總價']) || 0) * 10000, // 轉換為元
    
    // 其他資訊
    date: formatDate(record['交易年月日']),
    address: record['建物門牌'] || '',
    landUse: record['土地使用分區'] || '',
    unitNumber: record['棟及號'] || '',
    
    // 原始資料（備用）
    raw: record
  };
}

/**
 * 處理整批資料
 */
export function processRawData(rawData) {
  if (!Array.isArray(rawData)) {
    console.error('資料必須是陣列格式');
    return [];
  }
  
  const processedData = rawData.map((record, index) => {
    try {
      return processRecord(record, index);
    } catch (error) {
      console.error(`處理第 ${index + 1} 筆資料時發生錯誤:`, error, record);
      return null;
    }
  }).filter(item => item !== null); // 過濾掉處理失敗的資料
  
  console.log(`成功處理 ${processedData.length} / ${rawData.length} 筆資料`);
  return processedData;
}

/**
 * 從處理後的資料生成 metadata
 */
export function generateMetadata(processedData) {
  const cities = new Map();
  const districts = new Map();
  const projects = new Map();
  const buildingTypes = new Map();
  
  processedData.forEach(item => {
    // 收集城市
    if (item.city && item.cityName) {
      cities.set(item.city, {
        id: item.city,
        name: item.cityName,
        count: (cities.get(item.city)?.count || 0) + 1
      });
    }
    
    // 收集區域
    if (item.district && item.city) {
      const key = `${item.city}-${item.district}`;
      if (!districts.has(key)) {
        districts.set(key, {
          id: key,
          cityId: item.city,
          name: item.district,
          count: 0
        });
      }
      districts.get(key).count++;
    }
    
    // 收集建案
    if (item.project && item.city && item.district) {
      const key = `${item.city}-${item.district}-${item.project}`;
      if (!projects.has(key)) {
        projects.set(key, {
          id: key,
          cityId: item.city,
          districtId: `${item.city}-${item.district}`,
          name: item.project,
          count: 0,
          avgPrice: 0,
          totalPrice: 0
        });
      }
      const project = projects.get(key);
      project.count++;
      project.totalPrice += item.totalPrice;
      project.avgPrice = Math.round(project.totalPrice / project.count);
    }
    
    // 收集建物型態
    if (item.buildingType && item.buildingTypeName) {
      buildingTypes.set(item.buildingType, {
        id: item.buildingType,
        name: item.buildingTypeName,
        count: (buildingTypes.get(item.buildingType)?.count || 0) + 1
      });
    }
  });
  
  return {
    cities: Array.from(cities.values()).sort((a, b) => b.count - a.count),
    districts: Array.from(districts.values()).sort((a, b) => b.count - a.count),
    projects: Array.from(projects.values()).sort((a, b) => b.count - a.count),
    buildingTypes: Array.from(buildingTypes.values()).sort((a, b) => b.count - a.count),
    summary: {
      totalRecords: processedData.length,
      cityCount: cities.size,
      districtCount: districts.size,
      projectCount: projects.size,
      dateRange: {
        min: processedData.reduce((min, item) => 
          item.date && item.date < min ? item.date : min, '9999-12-31'),
        max: processedData.reduce((max, item) => 
          item.date && item.date > max ? item.date : max, '0000-01-01')
      }
    }
  };
}

/**
 * 資料驗證
 */
export function validateData(data) {
  const errors = [];
  const warnings = [];
  
  data.forEach((record, index) => {
    // 必要欄位檢查
    if (!record['縣市']) {
      errors.push(`第 ${index + 1} 筆資料缺少縣市`);
    }
    if (!record['區域']) {
      warnings.push(`第 ${index + 1} 筆資料缺少區域`);
    }
    if (!record['總價(萬)'] || record['總價(萬)'] <= 0) {
      errors.push(`第 ${index + 1} 筆資料總價異常`);
    }
    if (!record['面積(坪)'] || record['面積(坪)'] <= 0) {
      errors.push(`第 ${index + 1} 筆資料面積異常`);
    }
    
    // 日期格式檢查
    const dateStr = record['交易年月日'];
    if (dateStr) {
      const date = new Date(dateStr.replace(/\//g, '-'));
      if (isNaN(date.getTime())) {
        warnings.push(`第 ${index + 1} 筆資料日期格式異常: ${dateStr}`);
      }
    }
  });
  
  return { errors, warnings, isValid: errors.length === 0 };
}

// 使用範例
/*
import penghuData from './chunks/penghu.json';
import { processRawData, generateMetadata, validateData } from './dataProcessor';

// 驗證資料
const validation = validateData(penghuData);
if (!validation.isValid) {
  console.error('資料驗證失敗:', validation.errors);
}

// 處理資料
const processedData = processRawData(penghuData);

// 生成 metadata
const metadata = generateMetadata(processedData);
console.log('資料統計:', metadata.summary);

// 匯出處理後的資料
export default processedData;
*/