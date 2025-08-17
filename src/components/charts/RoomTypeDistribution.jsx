// src/components/charts/RoomTypeDistribution.jsx - 雙軸圖表優化版本
import { Card, Spin } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Line } from 'recharts';
import { useStore } from '../../store/useStore';
import { useMemo } from 'react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7300'];

const RoomTypeDistribution = () => {
  const { filteredData, loading } = useStore();

  // 房型分類邏輯 - 轉換為1房、2房、3房、4房、其他
  const categorizeRoomType = (roomType) => {
    if (!roomType || roomType === '未知') return '其他';
    
    // 提取數字
    const match = roomType.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1]);
      if (num >= 1 && num <= 4) {
        return `${num}房`;
      }
    }
    
    // 處理特殊情況
    if (roomType.includes('1') || roomType.includes('一')) return '1房';
    if (roomType.includes('2') || roomType.includes('二')) return '2房';
    if (roomType.includes('3') || roomType.includes('三')) return '3房';
    if (roomType.includes('4') || roomType.includes('四')) return '4房';
    
    return '其他';
  };

  // 計算房型分布數據
  const roomTypeData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    const roomTypeCounts = {};
    
    filteredData.forEach(item => {
      const originalRoomType = item.roomType || '未知';
      const categorizedType = categorizeRoomType(originalRoomType);
      roomTypeCounts[categorizedType] = (roomTypeCounts[categorizedType] || 0) + 1;
    });

    // 確保所有房型都存在，按照指定順序排列
    const orderedTypes = ['1房', '2房', '3房', '4房', '其他'];
    return orderedTypes.map(type => ({
      name: type,
      value: roomTypeCounts[type] || 0,
      percentage: (((roomTypeCounts[type] || 0) / filteredData.length) * 100).toFixed(1)
    })).filter(item => item.value > 0); // 只顯示有數據的房型
  }, [filteredData]);

  // 計算房型價格分析 - 雙軸數據
  const roomTypePriceData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    const roomTypeStats = {};
    
    filteredData.forEach(item => {
      const originalRoomType = item.roomType || '未知';
      const categorizedType = categorizeRoomType(originalRoomType);
      
      if (item.totalPrice > 0 && item.unitPrice > 0) {
        if (!roomTypeStats[categorizedType]) {
          roomTypeStats[categorizedType] = {
            prices: [],
            unitPrices: [],
            count: 0
          };
        }
        roomTypeStats[categorizedType].prices.push(item.totalPrice);
        roomTypeStats[categorizedType].unitPrices.push(item.unitPrice);
        roomTypeStats[categorizedType].count++;
      }
    });

    // 按照指定順序排列房型
    const orderedTypes = ['1房', '2房', '3房', '4房', '其他'];
    return orderedTypes
      .filter(type => roomTypeStats[type] && roomTypeStats[type].count >= 3) // 至少3筆才顯示
      .map(type => {
        const stats = roomTypeStats[type];
        return {
          roomType: type,
          avgPrice: Math.round(stats.prices.reduce((sum, p) => sum + p, 0) / stats.prices.length / 10000),
          avgUnitPrice: Math.round(stats.unitPrices.reduce((sum, p) => sum + p, 0) / stats.unitPrices.length / 10000),
          count: stats.count
        };
      });
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
      <Card title="房型分布數據" className="h-full">
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Card title="房型分布數據" className="h-full">
      {roomTypeData.length > 0 ? (
        <div className="space-y-6">
          {/* 房型分布圓餅圖 */}
          <div>
            <h4 className="text-lg font-medium mb-4">房型分布比例</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={roomTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roomTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} 筆`, '交易數量']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 房型價格分析 - 雙軸圖表 */}
          {roomTypePriceData.length > 0 && (
            <div>
              <h4 className="text-lg font-medium mb-4">房型平均價格（雙軸圖）</h4>
              <div className="text-sm text-gray-600 mb-3">
                左軸：平均總價（萬元）｜右軸：平均單價（萬/坪）
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={roomTypePriceData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="roomType" 
                    tick={{ fontSize: 12 }}
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
                  
                  {/* 平均總價柱狀圖 - 左軸 */}
                  <Bar 
                    yAxisId="left"
                    dataKey="avgPrice" 
                    fill="#1890ff" 
                    name="平均總價"
                    opacity={0.8}
                  />
                  
                  {/* 平均單價線圖 - 右軸 */}
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="avgUnitPrice" 
                    stroke="#52c41a" 
                    strokeWidth={3}
                    dot={{ fill: '#52c41a', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#52c41a', strokeWidth: 2 }}
                    name="平均單價"
                  />
                </ComposedChart>
              </ResponsiveContainer>
              
              {/* 圖例說明 */}
              <div className="flex justify-center mt-3 space-x-6">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">平均總價（左軸）</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">平均單價（右軸）</span>
                </div>
              </div>
            </div>
          )}

          {/* 房型數據表格 */}
          <div>
            <h4 className="text-lg font-medium mb-4">房型統計詳情</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      房型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      交易數量
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      比例
                    </th>
                    {roomTypePriceData.length > 0 && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          平均總價
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          平均單價
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roomTypeData.map((item, index) => {
                    const priceData = roomTypePriceData.find(p => p.roomType === item.name);
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.value} 筆
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.percentage}%
                        </td>
                        {roomTypePriceData.length > 0 && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {priceData ? `${priceData.avgPrice} 萬` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {priceData ? `${priceData.avgUnitPrice} 萬/坪` : '-'}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          請選擇篩選條件以查看房型分布數據
        </div>
      )}
    </Card>
  );
};

export default RoomTypeDistribution;