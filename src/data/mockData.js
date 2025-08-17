// 城市資料
export const cities = [
  { id: 'taipei', name: '台北市' },
  { id: 'newtaipei', name: '新北市' },
  { id: 'taoyuan', name: '桃園市' },
  { id: 'taichung', name: '台中市' },
  { id: 'tainan', name: '台南市' },
  { id: 'kaohsiung', name: '高雄市' },
];

// 區域資料（扁平化結構）
export const districts = [
  // 台北市
  { id: 'd1', cityId: 'taipei', name: '信義區' },
  { id: 'd2', cityId: 'taipei', name: '大安區' },
  { id: 'd3', cityId: 'taipei', name: '中山區' },
  { id: 'd4', cityId: 'taipei', name: '中正區' },
  { id: 'd5', cityId: 'taipei', name: '松山區' },
  { id: 'd6', cityId: 'taipei', name: '萬華區' },
  
  // 新北市
  { id: 'd7', cityId: 'newtaipei', name: '板橋區' },
  { id: 'd8', cityId: 'newtaipei', name: '中和區' },
  { id: 'd9', cityId: 'newtaipei', name: '永和區' },
  { id: 'd10', cityId: 'newtaipei', name: '新莊區' },
  { id: 'd11', cityId: 'newtaipei', name: '新店區' },
  { id: 'd12', cityId: 'newtaipei', name: '土城區' },
  
  // 桃園市
  { id: 'd13', cityId: 'taoyuan', name: '桃園區' },
  { id: 'd14', cityId: 'taoyuan', name: '中壢區' },
  { id: 'd15', cityId: 'taoyuan', name: '平鎮區' },
  { id: 'd16', cityId: 'taoyuan', name: '八德區' },
  
  // 台中市
  { id: 'd17', cityId: 'taichung', name: '西屯區' },
  { id: 'd18', cityId: 'taichung', name: '南屯區' },
  { id: 'd19', cityId: 'taichung', name: '北屯區' },
  { id: 'd20', cityId: 'taichung', name: '西區' },
  
  // 台南市
  { id: 'd21', cityId: 'tainan', name: '安平區' },
  { id: 'd22', cityId: 'tainan', name: '東區' },
  { id: 'd23', cityId: 'tainan', name: '北區' },
  { id: 'd24', cityId: 'tainan', name: '永康區' },
  
  // 高雄市
  { id: 'd25', cityId: 'kaohsiung', name: '鼓山區' },
  { id: 'd26', cityId: 'kaohsiung', name: '左營區' },
  { id: 'd27', cityId: 'kaohsiung', name: '三民區' },
  { id: 'd28', cityId: 'kaohsiung', name: '苓雅區' },
];

// 建案資料
export const projects = [
  { id: 'p1', cityId: 'taipei', districtId: 'd1', name: '信義之星' },
  { id: 'p2', cityId: 'taipei', districtId: 'd2', name: '大安森活' },
  { id: 'p3', cityId: 'taipei', districtId: 'd1', name: '信義帝寶' },
  { id: 'p4', cityId: 'taipei', districtId: 'd3', name: '中山首席' },
  { id: 'p5', cityId: 'newtaipei', districtId: 'd7', name: '板橋新天地' },
  { id: 'p6', cityId: 'newtaipei', districtId: 'd8', name: '中和新城' },
  { id: 'p7', cityId: 'taoyuan', districtId: 'd14', name: '中壢之心' },
  { id: 'p8', cityId: 'taichung', districtId: 'd17', name: '西屯首席' },
  { id: 'p9', cityId: 'tainan', districtId: 'd21', name: '安平新灣' },
  { id: 'p10', cityId: 'kaohsiung', districtId: 'd25', name: '鼓山豪景' },
];

// 房型資料
export const roomTypes = [
  { id: '1房', name: '1房', minArea: 8, maxArea: 15 },
  { id: '2房', name: '2房', minArea: 15, maxArea: 25 },
  { id: '3房', name: '3房', minArea: 25, maxArea: 35 },
  { id: '4房', name: '4房', minArea: 35, maxArea: 50 },
  { id: '5房', name: '5房以上', minArea: 50, maxArea: 100 },
];

// 價格範圍
export const priceRanges = [
  { id: 'r1', name: '1000萬以下', min: 0, max: 10000000 },
  { id: 'r2', name: '1000-2000萬', min: 10000000, max: 20000000 },
  { id: 'r3', name: '2000-3000萬', min: 20000000, max: 30000000 },
  { id: 'r4', name: '3000-5000萬', min: 30000000, max: 50000000 },
  { id: 'r5', name: '5000萬以上', min: 50000000, max: null },
];

// 產生模擬交易資料
function generateMockData() {
  const data = [];
  const currentYear = 2024;
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  
  // 為每個城市、區域產生交易資料
  cities.forEach(city => {
    const cityDistricts = districts.filter(d => d.cityId === city.id);
    const cityProjects = projects.filter(p => p.cityId === city.id);
    
    cityDistricts.forEach(district => {
      const districtProjects = cityProjects.filter(p => p.districtId === district.id);
      
      // 為每個建案產生交易資料
      districtProjects.forEach(project => {
        // 每個建案產生 10-30 筆交易
        const transactionCount = Math.floor(Math.random() * 20) + 10;
        
        for (let i = 0; i < transactionCount; i++) {
          const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
          const area = roomType.minArea + Math.random() * (roomType.maxArea - roomType.minArea);
          const basePrice = city.id === 'taipei' ? 800000 : 
                           city.id === 'newtaipei' ? 600000 :
                           city.id === 'taoyuan' ? 400000 :
                           city.id === 'taichung' ? 350000 :
                           city.id === 'tainan' ? 300000 : 280000;
          
          const unitPrice = basePrice + Math.random() * 200000;
          const totalPrice = Math.floor(area * unitPrice);
          const hasParkingSpace = Math.random() > 0.3;
          const parkingPrice = hasParkingSpace ? 1500000 + Math.floor(Math.random() * 500000) : 0;
          
          data.push({
            id: `t${data.length + 1}`,
            city: city.id,
            cityName: city.name,
            district: district.name,
            project: project.name,
            roomType: roomType.id,
            area: Math.round(area * 10) / 10,
            unitPrice: Math.round(unitPrice),
            totalPrice: totalPrice,
            parkingSpace: hasParkingSpace,
            parkingPrice: parkingPrice,
            floor: Math.floor(Math.random() * 20) + 1,
            totalFloors: 25,
            date: `${currentYear}-${months[Math.floor(Math.random() * 12)]}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
            address: `${city.name}${district.name}${project.name}`,
          });
        }
      });
      
      // 為沒有特定建案的區域也產生一些交易資料
      if (districtProjects.length === 0) {
        const genericCount = Math.floor(Math.random() * 10) + 5;
        for (let i = 0; i < genericCount; i++) {
          const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
          const area = roomType.minArea + Math.random() * (roomType.maxArea - roomType.minArea);
          const basePrice = city.id === 'taipei' ? 800000 : 
                           city.id === 'newtaipei' ? 600000 :
                           city.id === 'taoyuan' ? 400000 :
                           city.id === 'taichung' ? 350000 :
                           city.id === 'tainan' ? 300000 : 280000;
          
          const unitPrice = basePrice + Math.random() * 200000;
          const totalPrice = Math.floor(area * unitPrice);
          const hasParkingSpace = Math.random() > 0.3;
          const parkingPrice = hasParkingSpace ? 1500000 + Math.floor(Math.random() * 500000) : 0;
          
          data.push({
            id: `t${data.length + 1}`,
            city: city.id,
            cityName: city.name,
            district: district.name,
            project: `${district.name}建案${Math.floor(Math.random() * 10) + 1}`,
            roomType: roomType.id,
            area: Math.round(area * 10) / 10,
            unitPrice: Math.round(unitPrice),
            totalPrice: totalPrice,
            parkingSpace: hasParkingSpace,
            parkingPrice: parkingPrice,
            floor: Math.floor(Math.random() * 20) + 1,
            totalFloors: 25,
            date: `${currentYear}-${months[Math.floor(Math.random() * 12)]}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
            address: `${city.name}${district.name}`,
          });
        }
      }
    });
  });
  
  return data;
}

// 產生模擬資料
export const mockData = generateMockData();

// 匯出預設物件
export default {
  mockData,
  cities,
  districts,
  projects,
  roomTypes,
  priceRanges,
};