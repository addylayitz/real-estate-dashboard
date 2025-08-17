// src/components/charts/PriceStatistics.jsx - 雙軸圖表版本
import { Card, Statistic, Row, Col, Spin } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart } from 'recharts';
import { useStore } from '../../store/useStore';
import { useMemo } from 'react';

const PriceStatistics = () => {
  const { filteredData, loading } = useStore();

  // 計算統計數據
  const statistics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        avgPrice: 0,
        avgUnitPrice: 0,
        avgArea: 0,
        totalCount: 0
      };
    }

    const validData = filteredData.filter(item => 
      item.totalPrice > 0 && item.unitPrice > 0 && item.area > 0
    );

    if (validData.length === 0) {
      return {
        avgPrice: 0,
        avgUnitPrice: 0,
        avgArea: 0,
        totalCount: filteredData.length
      };
    }

    const totalPrice = validData.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalUnitPrice = validData.reduce((sum, item) => sum + item.unitPrice, 0);
    const totalArea = validData.reduce((sum, item) => sum + item.area, 0);

    return {
      avgPrice: Math.round(totalPrice / validData.length / 10000), // 萬元
      avgUnitPrice: Math.round(totalUnitPrice / validData.length / 10000), // 萬/坪
      avgArea: Math.round(totalArea / validData.length), // 坪
      totalCount: filteredData.length,
      validCount: validData.length
    };
  }, [filteredData]);

  // 計算月度趨勢數據 - 優化版本
  const monthlyData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    console.log('[PriceStatistics] 開始計算月度趨勢，資料筆數:', filteredData.length);
    
    const monthlyStats = {};
    let validDateCount = 0;
    
    filteredData.forEach((item, index) => {
      if (!item.transactionDate || item.totalPrice <= 0) {
        if (index < 5) {
          console.log(`[PriceStatistics] 跳過第 ${index + 1} 筆:`, {
            date: item.transactionDate,
            price: item.totalPrice
          });
        }
        return;
      }
      
      try {
        const date = new Date(item.transactionDate);
        
        if (isNaN(date.getTime())) {
          if (validDateCount < 5) {
            console.warn(`[PriceStatistics] 無效日期:`, item.transactionDate);
          }
          return;
        }
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = {
            month: monthKey,
            year: year,
            monthNum: month,
            prices: [],
            unitPrices: [],
            count: 0
          };
        }
        
        monthlyStats[monthKey].prices.push(item.totalPrice);
        monthlyStats[monthKey].unitPrices.push(item.unitPrice);
        monthlyStats[monthKey].count++;
        validDateCount++;
        
      } catch (error) {
        console.error('[PriceStatistics] 處理日期時發生錯誤:', error, item.transactionDate);
      }
    });

    console.log('[PriceStatistics] 有效日期筆數:', validDateCount);
    console.log('[PriceStatistics] 月份統計:', Object.keys(monthlyStats));

    // 轉換為圖表資料
    const chartData = Object.values(monthlyStats)
      .filter(month => month.count >= 3) // 至少3筆交易才顯示
      .map(month => ({
        month: month.month,
        year: month.year,
        monthNum: month.monthNum,
        avgPrice: Math.round(month.prices.reduce((sum, p) => sum + p, 0) / month.prices.length / 10000), // 萬元
        avgUnitPrice: Math.round(month.unitPrices.reduce((sum, p) => sum + p, 0) / month.unitPrices.length / 10000), // 萬/坪
        count: month.count,
        displayMonth: `${month.year}/${String(month.monthNum).padStart(2, '0')}` // 顯示格式
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthNum - b.monthNum;
      })
      .slice(-12); // 只顯示最近12個月

    console.log('[PriceStatistics] 最終圖表資料:', chartData);
    return chartData;
  }, [filteredData]);

  // 計算價格區間分布
  const priceRangeData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    const ranges = [
      { min: 0, max: 500, label: '500萬以下' },
      { min: 500, max: 1000, label: '500-1000萬' },
      { min: 1000, max: 1500, label: '1000-1500萬' },
      { min: 1500, max: 2000, label: '1500-2000萬' },
      { min: 2000, max: 3000, label: '2000-3000萬' },
      { min: 3000, max: 5000, label: '3000-5000萬' },
      { min: 5000, max: Infinity, label: '5000萬以上' }
    ];

    const distribution = ranges.map(range => ({
      range: range.label,
      count: filteredData.filter(item => {
        const priceInWan = item.totalPrice / 10000;
        return priceInWan >= range.min && priceInWan < range.max;
      }).length
    }));

    return distribution.filter(item => item.count > 0);
  }, [filteredData]);

  // 自定義工具提示
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-medium text-gray-800">{`${label}`}</p>
          <p className="text-sm text-gray-600">{`交易筆數: ${data.count} 筆`}</p>
          <hr className="my-2" />
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.value} ${entry.dataKey === 'avgPrice' ? '萬' : '萬/坪'}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card title="價格統計分析" className="h-full">
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Card title="價格統計分析" className="h-full">
      {/* 統計數據概覽 */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Statistic
            title="總筆數"
            value={statistics.totalCount}
            suffix="筆"
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="平均總價"
            value={statistics.avgPrice}
            suffix="萬"
            precision={0}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="平均單價"
            value={statistics.avgUnitPrice}
            suffix="萬/坪"
            precision={0}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="平均面積"
            value={statistics.avgArea}
            suffix="坪"
            precision={0}
          />
        </Col>
      </Row>

      {/* 月度趨勢圖 - 雙軸版本 */}
      {monthlyData.length > 0 ? (
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-4">月度價格趨勢（雙軸圖）</h4>
          <div className="text-sm text-gray-600 mb-3">
            左軸：平均總價（萬元）｜右軸：平均單價（萬/坪）
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="displayMonth" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
              />
              
              {/* 左軸 - 平均總價 */}
              <YAxis 
                yAxisId="left"
                orientation="left"
                tick={{ fontSize: 12 }}
                label={{ 
                  value: '平均總價 (萬元)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }}
                domain={['dataMin - 100', 'dataMax + 100']}
              />
              
              {/* 右軸 - 平均單價 */}
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                label={{ 
                  value: '平均單價 (萬/坪)', 
                  angle: 90, 
                  position: 'insideRight',
                  style: { textAnchor: 'middle' }
                }}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              {/* 平均總價線 - 左軸 */}
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="avgPrice" 
                stroke="#1890ff" 
                strokeWidth={3}
                dot={{ fill: '#1890ff', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: '#1890ff', strokeWidth: 2 }}
                name="平均總價"
                connectNulls={false}
              />
              
              {/* 平均單價線 - 右軸 */}
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="avgUnitPrice" 
                stroke="#52c41a" 
                strokeWidth={3}
                dot={{ fill: '#52c41a', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: '#52c41a', strokeWidth: 2 }}
                name="平均單價"
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
          
          {/* 圖例說明 */}
          <div className="flex justify-center mt-3 space-x-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">平均總價（左軸）</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">平均單價（右軸）</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-4">月度價格趨勢</h4>
          <div className="text-center text-gray-500 py-8 border border-gray-200 rounded">
            資料中沒有足夠的有效交易日期資訊來繪製趨勢圖
          </div>
        </div>
      )}

      {/* 價格區間分布 */}
      {priceRangeData.length > 0 && (
        <div>
          <h4 className="text-lg font-medium mb-4">價格區間分布</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priceRangeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} 筆`, '交易數量']} />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {filteredData && filteredData.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          請選擇篩選條件以查看統計數據
        </div>
      )}
    </Card>
  );
};

export default PriceStatistics;