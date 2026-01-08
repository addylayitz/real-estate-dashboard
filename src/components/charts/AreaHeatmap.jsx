// src/components/charts/AreaHeatmap.jsx - 面積帶熱力圖 (優化版本)
import { Card, Spin, Tooltip as AntTooltip } from 'antd';
import { useStore } from '../../store/useStore';
import { useMemo } from 'react';
import { getUniqueValues } from '../../utils/dataHelpers';

const AreaHeatmap = () => {
  const { filteredData, loading, filters } = useStore();

  // 定義面積區間
  const areaRanges = [
    { min: 0, max: 15, label: '15坪以下' },
    { min: 15, max: 20, label: '15-20坪' },
    { min: 20, max: 25, label: '20-25坪' },
    { min: 25, max: 30, label: '25-30坪' },
    { min: 30, max: 35, label: '30-35坪' },
    { min: 35, max: 40, label: '35-40坪' },
    { min: 40, max: 50, label: '40-50坪' },
    { min: 50, max: 60, label: '50-60坪' },
    { min: 60, max: Infinity, label: '60坪以上' }
  ];

  // 計算熱力圖數據
  const heatmapData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return { data: [], locations: [], maxValue: 0 };

    console.log('[AreaHeatmap] 開始計算面積帶熱力圖數據，資料筆數:', filteredData.length);
    
    // 決定使用縣市還是區域
    const useDistrict = filters.city && filters.city !== '';
    console.log('[AreaHeatmap] 使用區域模式:', useDistrict, '篩選城市:', filters.city);

    // 篩選有效資料（需要面積和價格）
    const validData = filteredData.filter(item => 
      item.totalPrice && item.totalPrice > 0 && item.area && item.area > 0
    );
    console.log('[AreaHeatmap] 有效資料筆數:', validData.length);

    // 取得位置列表（縣市或區域）- 使用安全方法避免堆疊溢位
    const locations = useDistrict 
      ? getUniqueValues(validData, item => item.district)
      : getUniqueValues(validData, item => item.cityName || item.city);
    
    console.log('[AreaHeatmap] 位置列表:', locations);

    // 建立熱力圖數據矩陣
    const matrix = {};
    let maxValue = 0;

    // 初始化矩陣
    locations.forEach(location => {
      matrix[location] = {};
      areaRanges.forEach(range => {
        matrix[location][range.label] = 0;
      });
    });

    // 填充數據
    validData.forEach(item => {
      const location = useDistrict 
        ? item.district 
        : (item.cityName || item.city);
      
      if (!location) return;

      const area = parseFloat(item.area);
      const priceInWan = item.totalPrice / 10000;
      
      // 找到對應的面積區間
      const areaRange = areaRanges.find(range => {
        if (range.max === Infinity) {
          return area >= range.min;
        }
        return area >= range.min && area < range.max;
      });

      if (areaRange && matrix[location]) {
        matrix[location][areaRange.label] += priceInWan;
        maxValue = Math.max(maxValue, matrix[location][areaRange.label]);
      }
    });

    // 轉換為數組格式並四捨五入
    const data = [];
    locations.forEach((location, locationIndex) => {
      areaRanges.forEach((range, rangeIndex) => {
        const value = Math.round(matrix[location][range.label]);
        data.push({
          location,
          areaRange: range.label,
          value,
          locationIndex,
          rangeIndex,
          percentage: maxValue > 0 ? (value / maxValue * 100).toFixed(1) : 0
        });
      });
    });

    console.log('[AreaHeatmap] 面積帶熱力圖數據完成:', { 
      dataPoints: data.length, 
      locations: locations.length, 
      maxValue: Math.round(maxValue) 
    });

    return { 
      data, 
      locations: locations.slice(0, 10), // 限制顯示數量避免過於密集
      maxValue: Math.round(maxValue),
      useDistrict 
    };
  }, [filteredData, filters.city]);

  // 計算顏色強度
  const getColorIntensity = (value, maxValue) => {
    if (maxValue === 0) return 0;
    return Math.min(value / maxValue, 1);
  };

  // 取得顏色（紅色系）
  const getHeatmapColor = (value, maxValue) => {
    const intensity = getColorIntensity(value, maxValue);
    
    if (intensity === 0) {
      return 'rgb(254, 242, 242)'; // 很淺的紅色背景
    }
    
    // 使用紅色漸層：從淺紅到深紅
    const red = 255; // 保持紅色滿值
    const green = Math.round(255 - (intensity * 200)); // 255 -> 55
    const blue = Math.round(255 - (intensity * 200)); // 255 -> 55
    
    return `rgb(${red}, ${green}, ${blue})`;
  };

  // 格式化數字
  const formatNumber = (num) => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}億`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}千萬`;
    } else {
      return `${num.toLocaleString()}萬`;
    }
  };

  if (loading) {
    return (
      <Card title="面積帶熱力圖" className="h-full">
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  const { data, locations, maxValue, useDistrict } = heatmapData;

  return (
    <Card title="面積帶熱力圖" className="h-full">
      {data.length > 0 ? (
        <div className="space-y-6">
          {/* 標題和說明 */}
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-800">
              {useDistrict ? '各區域' : '各縣市'}面積帶銷售分布熱力圖
            </h4>
            <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-lg">
              💡 顏色越深表示該面積帶的總銷售金額越高
            </div>
          </div>

          {/* 圖例 */}
          <div className="flex items-center justify-center space-x-6 py-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">銷售金額強度：</span>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-red-50 border-2 border-gray-300 rounded"></div>
                <span className="text-sm text-gray-600">低</span>
              </div>
              <div className="flex space-x-1">
                {[0.2, 0.4, 0.6, 0.8, 1.0].map(intensity => (
                  <div 
                    key={intensity}
                    className="w-5 h-5 border border-gray-300 rounded"
                    style={{ backgroundColor: getHeatmapColor(intensity * maxValue, maxValue) }}
                  ></div>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">高</span>
                <div 
                  className="w-5 h-5 border-2 border-gray-300 rounded"
                  style={{ backgroundColor: getHeatmapColor(maxValue, maxValue) }}
                ></div>
              </div>
            </div>
          </div>

          {/* 熱力圖表格 - 優化版本 */}
          <div className="w-full overflow-x-auto bg-white rounded-lg shadow-sm border">
            <div className="inline-block min-w-full">
              <table className="border-collapse border border-gray-300" style={{ minWidth: '1300px', width: '100%' }}>
                <thead>
                  <tr>
                    <th className="border-2 border-gray-300 p-4 bg-gradient-to-b from-gray-100 to-gray-200 text-sm font-semibold sticky left-0 z-20 shadow-md" style={{ minWidth: '120px', width: '120px' }}>
                      <div className="text-center">
                        {useDistrict ? '區域' : '縣市'}
                      </div>
                    </th>
                    {areaRanges.map(range => (
                      <th 
                        key={range.label} 
                        className="border-2 border-gray-300 p-5 bg-gradient-to-b from-gray-100 to-gray-200 text-sm font-semibold h-28 relative"
                        style={{ minWidth: '130px', width: '130px' }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="transform -rotate-45 whitespace-nowrap text-center font-medium">
                            {range.label}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {locations.map((location, index) => (
                    <tr key={location} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                      <td className="border-2 border-gray-300 p-4 bg-gradient-to-r from-gray-50 to-gray-100 text-sm font-semibold sticky left-0 z-10 shadow-sm" style={{ minWidth: '120px', width: '120px' }}>
                        <div className="text-center truncate font-medium" title={location}>
                          {location}
                        </div>
                      </td>
                      {areaRanges.map(range => {
                        const cellData = data.find(d => 
                          d.location === location && d.areaRange === range.label
                        );
                        const value = cellData?.value || 0;
                        const backgroundColor = getHeatmapColor(value, maxValue);
                        const intensity = getColorIntensity(value, maxValue);
                        
                        return (
                          <td 
                            key={`${location}-${range.label}`}
                            className="border-2 border-gray-300 text-center relative h-16 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:z-30"
                            style={{ 
                              backgroundColor,
                              minWidth: '130px', 
                              width: '130px'
                            }}
                          >
                            <AntTooltip
                              title={
                                <div className="text-center space-y-1">
                                  <div className="font-bold text-blue-300">{location}</div>
                                  <div className="text-yellow-200">{range.label}</div>
                                  <div className="text-green-200">總銷售金額: {formatNumber(value)}</div>
                                  <div className="text-orange-200">佔最高值比例: {cellData?.percentage || 0}%</div>
                                </div>
                              }
                              overlayClassName="custom-tooltip"
                            >
                              <div className="cursor-pointer h-full w-full flex items-center justify-center px-2 py-3">
                                {value > 0 && (
                                  <span 
                                    className="text-sm font-bold text-center leading-tight px-1 py-1 rounded transition-all duration-200"
                                    style={{ 
                                      color: intensity > 0.5 ? 'white' : '#1f2937',
                                      textShadow: intensity > 0.5 ? '0 1px 3px rgba(0,0,0,0.4)' : '0 1px 1px rgba(255,255,255,0.8)',
                                      backgroundColor: intensity > 0.3 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.3)'
                                    }}
                                  >
                                    {value >= 1000 ? `${(value/1000).toFixed(0)}K` : value.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </AntTooltip>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 統計摘要 - 優化版本 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-blue-100">
              <div className="text-2xl font-bold text-blue-600 mb-1">{locations.length}</div>
              <div className="text-sm text-gray-600 font-medium">{useDistrict ? '分析區域數' : '分析縣市數'}</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-green-100">
              <div className="text-2xl font-bold text-green-600 mb-1">{areaRanges.length}</div>
              <div className="text-sm text-gray-600 font-medium">面積區間數</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-orange-100">
              <div className="text-2xl font-bold text-orange-600 mb-1">{formatNumber(maxValue)}</div>
              <div className="text-sm text-gray-600 font-medium">最高銷售金額</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-red-100">
              <div className="text-2xl font-bold text-red-600 mb-1">{data.filter(d => d.value > 0).length}</div>
              <div className="text-sm text-gray-600 font-medium">有交易格數</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg">
          <div className="text-lg mb-2">📊</div>
          <div className="text-base font-medium">請選擇篩選條件以查看面積帶熱力圖</div>
          <div className="text-sm text-gray-400 mt-1">選擇城市或區域來開始分析</div>
        </div>
      )}
    </Card>
  );
};

export default AreaHeatmap;