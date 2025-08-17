// src/components/charts/RegionComparison.jsx - 地區交易筆數比較圖
import React from 'react';
import { Card, Spin } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../../store/useStore';
import { useMemo } from 'react';

const RegionComparison = () => {
  const { filteredData, loading, filters } = useStore();

  // 計算地區交易筆數數據
  const chartData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    console.log('[RegionComparison] 開始計算地區交易筆數，資料筆數:', filteredData.length);
    
    // 決定使用縣市還是區域
    const useDistrict = filters.city && filters.city !== '';
    console.log('[RegionComparison] 使用區域模式:', useDistrict, '篩選城市:', filters.city);

    // 統計交易筆數
    const regionStats = {};

    filteredData.forEach(item => {
      const region = useDistrict 
        ? item.district 
        : (item.cityName || item.city);
      
      if (!region) return;

      if (!regionStats[region]) {
        regionStats[region] = {
          region,
          count: 0,
          totalPrice: 0,
          avgPrice: 0
        };
      }

      regionStats[region].count += 1;
      regionStats[region].totalPrice += (item.totalPrice || 0) / 10000; // 轉換為萬元
    });

    // 計算平均單價並轉換為數組
    const data = Object.values(regionStats).map(item => ({
      ...item,
      avgPrice: item.count > 0 ? Math.round(item.totalPrice / item.count) : 0,
      totalPrice: Math.round(item.totalPrice)
    }));

    // 按交易筆數排序，取前15名
    const sortedData = data
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    console.log('[RegionComparison] 地區交易筆數統計完成:', {
      總地區數: data.length,
      顯示地區數: sortedData.length,
      使用模式: useDistrict ? '區域' : '縣市'
    });

    return sortedData;
  }, [filteredData, filters.city]);

  // 決定使用縣市還是區域
  const useDistrict = filters.city && filters.city !== '';
  const regionType = useDistrict ? '區域' : '縣市';

  // 自定義工具提示
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{regionType}：{label}</p>
          <p className="text-blue-600">交易筆數：{data.count.toLocaleString()} 筆</p>
          <p className="text-green-600">總銷售額：{data.totalPrice.toLocaleString()} 萬</p>
          <p className="text-orange-600">平均總價：{data.avgPrice.toLocaleString()} 萬</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card title="地區交易筆數比較" className="h-full">
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Card title="地區交易筆數比較" className="h-full">
      {chartData.length > 0 ? (
        <div className="space-y-6">
          {/* 標題和說明 */}
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-800">
              {regionType}交易筆數排行榜 (TOP 15)
            </h4>
            <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-lg">
              📊 顯示交易最活躍的{regionType}
            </div>
          </div>

          {/* 長條圖 - 修正版本 */}
          <div className="w-full bg-white p-4 rounded-lg border" style={{ height: '500px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="region" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 統計表格 */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 bg-white rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <th className="border border-gray-300 p-3 text-left font-semibold text-gray-700">排名</th>
                  <th className="border border-gray-300 p-3 text-left font-semibold text-gray-700">{regionType}</th>
                  <th className="border border-gray-300 p-3 text-center font-semibold text-gray-700">交易筆數</th>
                  <th className="border border-gray-300 p-3 text-center font-semibold text-gray-700">總銷售額 (萬)</th>
                  <th className="border border-gray-300 p-3 text-center font-semibold text-gray-700">平均總價 (萬)</th>
                  <th className="border border-gray-300 p-3 text-center font-semibold text-gray-700">市場佔比</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((item, index) => {
                  const marketShare = ((item.count / filteredData.length) * 100).toFixed(1);
                  return (
                    <tr 
                      key={item.region}
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-200`}
                    >
                      <td className="border border-gray-300 p-3 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-3 font-medium text-gray-800">
                        {item.region}
                      </td>
                      <td className="border border-gray-300 p-3 text-center font-semibold text-blue-600">
                        {item.count.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-3 text-center text-green-600">
                        {item.totalPrice.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-3 text-center text-orange-600">
                        {item.avgPrice.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-3 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(parseFloat(marketShare) * 2, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-600">{marketShare}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 統計摘要 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-blue-100">
              <div className="text-2xl font-bold text-blue-600 mb-1">{chartData.length}</div>
              <div className="text-sm text-gray-600 font-medium">活躍{regionType}數</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-green-100">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {chartData[0]?.count.toLocaleString() || 0}
              </div>
              <div className="text-sm text-gray-600 font-medium">最高交易筆數</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-orange-100">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {Math.round(chartData.reduce((sum, item) => sum + item.count, 0) / chartData.length).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 font-medium">平均交易筆數</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-purple-100">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {chartData.reduce((sum, item) => sum + item.count, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 font-medium">總交易筆數</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg">
          <div className="text-lg mb-2">📊</div>
          <div className="text-base font-medium">請選擇篩選條件以查看地區交易筆數比較</div>
          <div className="text-sm text-gray-400 mt-1">選擇城市或區域來開始分析</div>
        </div>
      )}
    </Card>
  );
};

export default RegionComparison;