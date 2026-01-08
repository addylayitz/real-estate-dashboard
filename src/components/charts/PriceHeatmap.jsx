// src/components/charts/PriceHeatmap.jsx - 總價帶熱力圖
import { Card, Spin, Tooltip as AntTooltip } from 'antd';
import { useStore } from '../../store/useStore';
import { useMemo } from 'react';
import { getUniqueValues } from '../../utils/dataHelpers';

const PriceHeatmap = () => {
  const { filteredData, loading, filters } = useStore();

  // 定義總價區間
  const priceRanges = [
    { min: 0, max: 1000, label: '1000萬以下' },
    { min: 1000, max: 2000, label: '1000-2000萬' },
    { min: 2000, max: 3000, label: '2000-3000萬' },
    { min: 3000, max: 4000, label: '3000-4000萬' },
    { min: 4000, max: 5000, label: '4000-5000萬' },
    { min: 5000, max: 6000, label: '5000-6000萬' },
    { min: 6000, max: 7000, label: '6000-7000萬' },
    { min: 7000, max: 10000, label: '7000-10000萬' },
    { min: 10000, max: Infinity, label: '10000萬以上' }
  ];

  // 計算熱力圖數據
  const heatmapData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return { data: [], locations: [], maxValue: 0 };

    console.log('[PriceHeatmap] 開始計算熱力圖數據，資料筆數:', filteredData.length);
    
    // 決定使用縣市還是區域
    const useDistrict = filters.city && filters.city !== '';
    console.log('[PriceHeatmap] 使用區域模式:', useDistrict, '篩選城市:', filters.city);

    // 篩選有效價格資料
    const validData = filteredData.filter(item => item.totalPrice && item.totalPrice > 0);
    console.log('[PriceHeatmap] 有效價格資料筆數:', validData.length);

    // 取得位置列表（縣市或區域）- 使用安全方法避免堆疊溢位
    const locations = useDistrict 
      ? getUniqueValues(validData, item => item.district)
      : getUniqueValues(validData, item => item.cityName || item.city);
    
    console.log('[PriceHeatmap] 位置列表:', locations);

    // 建立熱力圖數據矩陣
    const matrix = {};
    let maxValue = 0;

    // 初始化矩陣
    locations.forEach(location => {
      matrix[location] = {};
      priceRanges.forEach(range => {
        matrix[location][range.label] = 0;
      });
    });

    // 填充數據
    validData.forEach(item => {
      const location = useDistrict 
        ? item.district 
        : (item.cityName || item.city);
      
      if (!location) return;

      const priceInWan = item.totalPrice / 10000;
      
      // 找到對應的價格區間
      const priceRange = priceRanges.find(range => {
        if (range.max === Infinity) {
          return priceInWan >= range.min;
        }
        return priceInWan >= range.min && priceInWan < range.max;
      });

      if (priceRange && matrix[location]) {
        matrix[location][priceRange.label] += priceInWan;
        maxValue = Math.max(maxValue, matrix[location][priceRange.label]);
      }
    });

    // 轉換為數組格式並四捨五入
    const data = [];
    locations.forEach((location, locationIndex) => {
      priceRanges.forEach((range, rangeIndex) => {
        const value = Math.round(matrix[location][range.label]);
        data.push({
          location,
          priceRange: range.label,
          value,
          locationIndex,
          rangeIndex,
          percentage: maxValue > 0 ? (value / maxValue * 100).toFixed(1) : 0
        });
      });
    });

    console.log('[PriceHeatmap] 熱力圖數據完成:', { 
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

  // 取得顏色
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
      <Card title="總價帶熱力圖" className="h-full">
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  const { data, locations, maxValue, useDistrict } = heatmapData;

  return (
    <Card title="總價帶熱力圖" className="h-full">
      {data.length > 0 ? (
        <div className="space-y-4">
          {/* 標題和說明 */}
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-medium">
              {useDistrict ? '各區域' : '各縣市'}總價帶分布熱力圖
            </h4>
            <div className="text-sm text-gray-600">
              顏色越深表示該價格帶的總銷售金額越高
            </div>
          </div>

          {/* 圖例 */}
          <div className="flex items-center justify-center space-x-4 py-2">
            <span className="text-sm text-gray-600">銷售金額：</span>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-50 border border-gray-300"></div>
              <span className="text-xs">低</span>
            </div>
            <div className="flex space-x-1">
              {[0.2, 0.4, 0.6, 0.8, 1.0].map(intensity => (
                <div 
                  key={intensity}
                  className="w-4 h-4 border border-gray-300"
                  style={{ backgroundColor: getHeatmapColor(intensity * maxValue, maxValue) }}
                ></div>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs">高</span>
              <div 
                className="w-4 h-4 border border-gray-300"
                style={{ backgroundColor: getHeatmapColor(maxValue, maxValue) }}
              ></div>
            </div>
          </div>

          {/* 熱力圖表格 */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <table className="border-collapse border border-gray-300 w-full">
                <thead>
                  <tr>
                    <th className="border border-gray-300 p-3 bg-gray-50 text-sm font-medium min-w-[120px] sticky left-0 z-20">
                      {useDistrict ? '區域' : '縣市'}
                    </th>
                    {priceRanges.map(range => (
                      <th 
                        key={range.label} 
                        className="border border-gray-300 p-4 bg-gray-50 text-xs font-medium min-w-[110px] h-24 relative"
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="transform -rotate-45 whitespace-nowrap text-center">
                            {range.label}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {locations.map(location => (
                    <tr key={location}>
                      <td className="border border-gray-300 p-3 bg-gray-50 text-sm font-medium sticky left-0 z-10 min-w-[120px]">
                        <div className="truncate" title={location}>
                          {location}
                        </div>
                      </td>
                      {priceRanges.map(range => {
                        const cellData = data.find(d => 
                          d.location === location && d.priceRange === range.label
                        );
                        const value = cellData?.value || 0;
                        const backgroundColor = getHeatmapColor(value, maxValue);
                        
                        return (
                          <td 
                            key={`${location}-${range.label}`}
                            className="border border-gray-300 text-center relative min-w-[110px] h-12"
                            style={{ backgroundColor }}
                          >
                            <AntTooltip
                              title={
                                <div>
                                  <div><strong>{location}</strong></div>
                                  <div>{range.label}</div>
                                  <div>總銷售金額: {formatNumber(value)}</div>
                                  <div>佔最高值比例: {cellData?.percentage || 0}%</div>
                                </div>
                              }
                            >
                              <div className="cursor-pointer h-full w-full flex items-center justify-center px-1">
                                {value > 0 && (
                                  <span 
                                    className="text-xs font-semibold text-center leading-tight"
                                    style={{ 
                                      color: getColorIntensity(value, maxValue) > 0.6 ? 'white' : '#1f2937',
                                      textShadow: getColorIntensity(value, maxValue) > 0.6 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
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

          {/* 統計摘要 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{locations.length}</div>
              <div className="text-sm text-gray-600">{useDistrict ? '分析區域數' : '分析縣市數'}</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{priceRanges.length}</div>
              <div className="text-sm text-gray-600">價格區間數</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">{formatNumber(maxValue)}</div>
              <div className="text-sm text-gray-600">最高銷售金額</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">{data.filter(d => d.value > 0).length}</div>
              <div className="text-sm text-gray-600">有交易格數</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          請選擇篩選條件以查看總價帶熱力圖
        </div>
      )}
    </Card>
  );
};

export default PriceHeatmap;