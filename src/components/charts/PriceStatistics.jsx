// src/components/charts/PriceStatistics.jsx - 新增建案交易資訊表格
import { Card, Statistic, Row, Col, Spin, Table } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useStore } from '../../store/useStore';
import { useMemo, useState } from 'react';

const PriceStatistics = () => {
  const { filteredData, loading } = useStore();
  
  // 價格區間篩選狀態
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);

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

  // 計算月度趨勢數據 - 支援多條折線
  const monthlyData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return { chartData: [], groupType: 'total' };

    console.log('[PriceStatistics] 開始計算月度趨勢，資料筆數:', filteredData.length);
    
    // 從 useStore 取得當前篩選條件
    const { filters } = useStore.getState();
    
    // 決定分組方式：建案 > 區域 > 總計
    let groupType = 'total';
    let groupKeys = ['總計'];
    
    // 檢查建案篩選（最高優先級）
    if (filters.project && filters.project.trim() !== '') {
      const projects = filters.project.split(',').map(p => p.trim()).filter(p => p);
      if (projects.length > 0) {
        groupType = 'project';
        groupKeys = projects.slice(0, 3); // 最多3個建案
        console.log('[PriceStatistics] 使用建案分組:', groupKeys);
      }
    }
    // 檢查區域篩選（次優先級）
    else if (filters.district && filters.district.trim() !== '') {
      const districts = filters.district.split(',').map(d => d.trim()).filter(d => d);
      if (districts.length > 0) {
        groupType = 'district';
        groupKeys = districts.slice(0, 3); // 最多3個區域
        console.log('[PriceStatistics] 使用區域分組:', groupKeys);
      }
    }
    
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
        
        // 根據分組類型決定數據歸類
        let itemGroupKeys = [];
        
        if (groupType === 'project') {
          const itemProject = item.project || item['建案名稱'] || '未知建案';
          if (groupKeys.includes(itemProject)) {
            itemGroupKeys = [itemProject];
          }
        } else if (groupType === 'district') {
          const itemDistrict = item.district || item['區域'] || '未知區域';
          if (groupKeys.includes(itemDistrict)) {
            itemGroupKeys = [itemDistrict];
          }
        } else {
          itemGroupKeys = ['總計'];
        }
        
        // 為每個符合的分組建立月份統計
        itemGroupKeys.forEach(groupKey => {
          const key = `${monthKey}-${groupKey}`;
          
          if (!monthlyStats[key]) {
            monthlyStats[key] = {
              month: monthKey,
              year: year,
              monthNum: month,
              groupKey: groupKey,
              prices: [],
              unitPrices: [],
              count: 0
            };
          }
          
          monthlyStats[key].prices.push(item.totalPrice);
          monthlyStats[key].unitPrices.push(item.unitPrice);
          monthlyStats[key].count++;
          validDateCount++;
        });
        
      } catch (error) {
        console.error('[PriceStatistics] 處理日期時發生錯誤:', error, item.transactionDate);
      }
    });

    console.log('[PriceStatistics] 有效日期筆數:', validDateCount);
    console.log('[PriceStatistics] 月份統計:', Object.keys(monthlyStats));

    // 取得所有月份並排序 - 使用 Array.from 避免展開運算符
    const allMonths = Array.from(new Set(Object.values(monthlyStats).map(item => item.month)))
      .sort((a, b) => {
        const [yearA, monthA] = a.split('-').map(Number);
        const [yearB, monthB] = b.split('-').map(Number);
        if (yearA !== yearB) return yearA - yearB;
        return monthA - monthB;
      })
      .slice(-12); // 最近12個月

    // 為每個分組和月份生成完整數據
    const chartData = allMonths.map(month => {
      const [year, monthNum] = month.split('-').map(Number);
      const result = {
        month,
        year,
        monthNum,
        displayMonth: `${year}/${String(monthNum).padStart(2, '0')}`
      };
      
      // 為每個分組添加該月份的數據
      groupKeys.forEach(groupKey => {
        const key = `${month}-${groupKey}`;
        const stat = monthlyStats[key];
        
        if (stat && stat.count >= 3) { // 至少3筆交易才計算
          const avgPrice = Math.round(stat.prices.reduce((sum, p) => sum + p, 0) / stat.prices.length / 10000);
          const avgUnitPrice = Math.round(stat.unitPrices.reduce((sum, p) => sum + p, 0) / stat.unitPrices.length / 10000);
          
          result[`${groupKey}_avgPrice`] = avgPrice;
          result[`${groupKey}_avgUnitPrice`] = avgUnitPrice;
          result[`${groupKey}_count`] = stat.count;
        } else {
          result[`${groupKey}_avgPrice`] = null;
          result[`${groupKey}_avgUnitPrice`] = null;
          result[`${groupKey}_count`] = 0;
        }
      });
      
      return result;
    });

    console.log('[PriceStatistics] 最終圖表資料 (多折線):', { chartData, groupType, groupKeys });
    return { chartData, groupType, groupKeys };
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

  // 建案交易資訊表格數據 - 支援價格區間篩選
  const projectTableData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    console.log('[PriceStatistics] 開始計算建案表格數據...');
    console.log('[PriceStatistics] 第一筆數據示例:', filteredData[0]);
    
    // 根據選中的價格區間篩選數據
    let dataToProcess = filteredData;
    if (selectedPriceRange) {
      console.log('[PriceStatistics] 應用價格區間篩選:', selectedPriceRange);
      
      // 解析價格區間
      let minPrice = 0;
      let maxPrice = Infinity;
      
      if (selectedPriceRange === '500萬以下') {
        maxPrice = 500;
      } else if (selectedPriceRange === '500-1000萬') {
        minPrice = 500;
        maxPrice = 1000;
      } else if (selectedPriceRange === '1000-1500萬') {
        minPrice = 1000;
        maxPrice = 1500;
      } else if (selectedPriceRange === '1500-2000萬') {
        minPrice = 1500;
        maxPrice = 2000;
      } else if (selectedPriceRange === '2000-3000萬') {
        minPrice = 2000;
        maxPrice = 3000;
      } else if (selectedPriceRange === '3000-5000萬') {
        minPrice = 3000;
        maxPrice = 5000;
      } else if (selectedPriceRange === '5000萬以上') {
        minPrice = 5000;
      }
      
      // 篩選符合價格區間的交易
      dataToProcess = filteredData.filter(item => {
        const totalPriceInWan = parseFloat(item.totalPrice || item['總價(萬)'] || 0) / 10000;
        return totalPriceInWan >= minPrice && totalPriceInWan < maxPrice;
      });
      
      console.log(`[PriceStatistics] 價格區間篩選後: ${filteredData.length} -> ${dataToProcess.length} 筆`);
    }
    
    // 按建案名稱分組
    const projectGroups = {};
    
    dataToProcess.forEach(item => {
      // 根據實際JSON結構取得欄位值
      const district = item.district || item['區域'];
      const projectName = item.project || item['建案名稱'];
      
      if (!projectName || !district) return;
      
      const projectKey = `${district}-${projectName}`;
      
      if (!projectGroups[projectKey]) {
        projectGroups[projectKey] = {
          district,
          projectName,
          transactions: []
        };
      }
      
      projectGroups[projectKey].transactions.push(item);
    });

    // 計算每個建案的統計數據
    const tableData = Object.values(projectGroups).map((group, index) => {
      const { transactions } = group;
      
      // 過濾有效交易數據
      const validTransactions = transactions.filter(t => {
        const totalPrice = parseFloat(t.totalPrice || t['總價(萬)'] || 0);
        const unitPrice = parseFloat(t.unitPrice || t['單價(萬/坪)'] || 0);
        const area = parseFloat(t.area || t['面積(坪)'] || 0);
        return totalPrice > 0 && unitPrice > 0 && area > 0;
      });
      
      if (validTransactions.length === 0) return null;
      
      // 計算平均值 - 根據實際欄位名稱
      const avgArea = validTransactions.reduce((sum, t) => {
        const area = parseFloat(t.area || t['面積(坪)'] || 0);
        return sum + area;
      }, 0) / validTransactions.length;
      
      const avgUnitPrice = validTransactions.reduce((sum, t) => {
        const unitPrice = parseFloat(t.unitPrice || t['單價(萬/坪)'] || 0);
        return sum + unitPrice;
      }, 0) / validTransactions.length;
      
      const avgTotalPrice = validTransactions.reduce((sum, t) => {
        const totalPrice = parseFloat(t.totalPrice || t['總價(萬)'] || 0);
        return sum + totalPrice;
      }, 0) / validTransactions.length;
      
      // 計算平均車位總價 - 修正欄位名稱
      const parkingTransactions = validTransactions.filter(t => {
        const parkingPrice = parseFloat(t.parkingPrice || t['車位總價'] || 0);
        return parkingPrice > 0;
      });
      
      const avgParkingPrice = parkingTransactions.length > 0 
        ? parkingTransactions.reduce((sum, t) => {
            const parkingPrice = parseFloat(t.parkingPrice || t['車位總價'] || 0);
            return sum + parkingPrice;
          }, 0) / parkingTransactions.length
        : 0;

      console.log(`[PriceStatistics] 建案: ${group.projectName}, 車位交易數: ${parkingTransactions.length}, 平均車位價格: ${avgParkingPrice}`);

      return {
        key: index,
        district: group.district,
        projectName: group.projectName,
        transactionCount: validTransactions.length,
        avgArea: Math.round(avgArea * 100) / 100, // 保留2位小數
        avgUnitPrice: Math.round(avgUnitPrice / 10000), // 除以10000，四捨五入取整數
        avgTotalPrice: Math.round(avgTotalPrice / 10000), // 除以10000，四捨五入取整數
        avgParkingPrice: Math.round(avgParkingPrice * 100) / 100 // 車位總價已經是萬元，保留2位小數
      };
    }).filter(Boolean);

    console.log('[PriceStatistics] 建案表格數據計算完成:', tableData.length, '個建案');
    return tableData;
  }, [filteredData, selectedPriceRange]);

  // 處理長條圖點擊事件
  const handleBarClick = (data) => {
    console.log('[PriceStatistics] 點擊長條圖:', data);
    
    if (!data || !data.range) return;
    
    // 切換選中狀態：如果點擊已選中的區間，則取消選擇
    if (selectedPriceRange === data.range) {
      setSelectedPriceRange(null);
      console.log('[PriceStatistics] 取消價格區間篩選');
    } else {
      setSelectedPriceRange(data.range);
      console.log('[PriceStatistics] 選中價格區間:', data.range);
    }
  };
  const tableColumns = [
    {
      title: '區域',
      dataIndex: 'district',
      key: 'district',
      sorter: (a, b) => a.district.localeCompare(b.district, 'zh-TW'),
      width: 100,
    },
    {
      title: '建案名稱',
      dataIndex: 'projectName',
      key: 'projectName',
      sorter: (a, b) => a.projectName.localeCompare(b.projectName, 'zh-TW'),
      ellipsis: true,
      width: 150,
    },
    {
      title: '交易筆數',
      dataIndex: 'transactionCount',
      key: 'transactionCount',
      sorter: (a, b) => a.transactionCount - b.transactionCount,
      render: (value) => `${value} 筆`,
      align: 'center',
      width: 90,
    },
    {
      title: '平均面積',
      dataIndex: 'avgArea',
      key: 'avgArea',
      sorter: (a, b) => a.avgArea - b.avgArea,
      render: (value) => `${value} 坪`,
      align: 'right',
      width: 90,
    },
    {
      title: '平均單價',
      dataIndex: 'avgUnitPrice',
      key: 'avgUnitPrice',
      sorter: (a, b) => a.avgUnitPrice - b.avgUnitPrice,
      render: (value) => `${value} 萬/坪`,
      align: 'right',
      width: 100,
    },
    {
      title: '平均總價',
      dataIndex: 'avgTotalPrice',
      key: 'avgTotalPrice',
      sorter: (a, b) => a.avgTotalPrice - b.avgTotalPrice,
      render: (value) => `${value} 萬`,
      align: 'right',
      width: 90,
    },
    {
      title: '平均車位總價',
      dataIndex: 'avgParkingPrice',
      key: 'avgParkingPrice',
      sorter: (a, b) => a.avgParkingPrice - b.avgParkingPrice,
      render: (value) => value > 0 ? `${value} 萬` : '-',
      align: 'right',
      width: 120,
    },
  ];

  // 總價趨勢工具提示 - 支援多折線
  const TotalPriceTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-medium text-gray-800">{label}</p>
          <hr className="my-2" />
          {payload.map((entry, index) => {
            const groupKey = entry.dataKey.replace('_avgPrice', '');
            const countKey = `${groupKey}_count`;
            const count = entry.payload[countKey] || 0;
            
            return (
              <div key={index} className="mb-1">
                <p className="text-sm font-medium" style={{ color: entry.color }}>
                  {groupKey}: {entry.value} 萬元
                </p>
                <p className="text-xs text-gray-600 ml-2">
                  交易筆數: {count} 筆
                </p>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // 單價趨勢工具提示 - 支援多折線
  const UnitPriceTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-medium text-gray-800">{label}</p>
          <hr className="my-2" />
          {payload.map((entry, index) => {
            const groupKey = entry.dataKey.replace('_avgUnitPrice', '');
            const countKey = `${groupKey}_count`;
            const count = entry.payload[countKey] || 0;
            
            return (
              <div key={index} className="mb-1">
                <p className="text-sm font-medium" style={{ color: entry.color }}>
                  {groupKey}: {entry.value} 萬/坪
                </p>
                <p className="text-xs text-gray-600 ml-2">
                  交易筆數: {count} 筆
                </p>
              </div>
            );
          })}
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

      {/* 兩個獨立的價格趨勢圖 - 支援多條折線 */}
      {monthlyData.chartData.length > 0 ? (
        <div className="mb-6">
          {/* 總價價格趨勢圖 */}
          <div className="mb-8">
            <h4 className="text-lg font-medium mb-4">
              總價價格趨勢
              {monthlyData.groupType !== 'total' && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({monthlyData.groupType === 'project' ? '按建案分組' : '按區域分組'})
                </span>
              )}
            </h4>
            <div className="text-sm text-gray-600 mb-3">
              {monthlyData.groupType === 'total' 
                ? '顯示各月份平均總價變化趨勢'
                : `顯示 ${monthlyData.groupKeys.join('、')} 的總價趨勢比較`
              }
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="displayMonth" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ 
                    value: '平均總價 (萬元)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                  domain={['dataMin - 100', 'dataMax + 100']}
                />
                <Tooltip content={<TotalPriceTooltip />} />
                
                {/* 根據分組動態渲染總價折線 */}
                {monthlyData.groupKeys.map((groupKey, index) => {
                  // 為不同的折線定義不同顏色
                  const colors = ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96'];
                  const color = colors[index % colors.length];
                  
                  return (
                    <Line 
                      key={`${groupKey}_avgPrice`}
                      type="monotone" 
                      dataKey={`${groupKey}_avgPrice`}
                      stroke={color}
                      strokeWidth={3}
                      dot={{ fill: color, strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: color, strokeWidth: 3, fill: '#fff' }}
                      connectNulls={false}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
            
            {/* 總價圖例 */}
            <div className="flex justify-center mt-3 flex-wrap gap-4">
              {monthlyData.groupKeys.map((groupKey, index) => {
                const colors = ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96'];
                const color = colors[index % colors.length];
                
                return (
                  <div key={groupKey} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: color }}
                    ></div>
                    <span className="text-sm text-gray-600">{groupKey}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 單價價格趨勢圖 */}
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-4">
              單價價格趨勢
              {monthlyData.groupType !== 'total' && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({monthlyData.groupType === 'project' ? '按建案分組' : '按區域分組'})
                </span>
              )}
            </h4>
            <div className="text-sm text-gray-600 mb-3">
              {monthlyData.groupType === 'total' 
                ? '顯示各月份平均單價變化趨勢'
                : `顯示 ${monthlyData.groupKeys.join('、')} 的單價趨勢比較`
              }
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="displayMonth" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ 
                    value: '平均單價 (萬/坪)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <Tooltip content={<UnitPriceTooltip />} />
                
                {/* 根據分組動態渲染單價折線 */}
                {monthlyData.groupKeys.map((groupKey, index) => {
                  // 為不同的折線定義不同顏色
                  const colors = ['#52c41a', '#1890ff', '#fa8c16', '#722ed1', '#eb2f96'];
                  const color = colors[index % colors.length];
                  
                  return (
                    <Line 
                      key={`${groupKey}_avgUnitPrice`}
                      type="monotone" 
                      dataKey={`${groupKey}_avgUnitPrice`}
                      stroke={color}
                      strokeWidth={3}
                      dot={{ fill: color, strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: color, strokeWidth: 3, fill: '#fff' }}
                      connectNulls={false}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
            
            {/* 單價圖例 */}
            <div className="flex justify-center mt-3 flex-wrap gap-4">
              {monthlyData.groupKeys.map((groupKey, index) => {
                const colors = ['#52c41a', '#1890ff', '#fa8c16', '#722ed1', '#eb2f96'];
                const color = colors[index % colors.length];
                
                return (
                  <div key={groupKey} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: color }}
                    ></div>
                    <span className="text-sm text-gray-600">{groupKey}</span>
                  </div>
                );
              })}
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
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-4">價格區間分布</h4>
          {selectedPriceRange && (
            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
              <span className="text-sm text-blue-700">
                🎯 已篩選價格區間: <strong>{selectedPriceRange}</strong> 
                <span className="ml-2 text-xs">(點擊同一區間可取消篩選)</span>
              </span>
            </div>
          )}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priceRangeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value} 筆`, '交易數量']}
                cursor={{ fill: 'rgba(24, 144, 255, 0.1)' }}
              />
              <Bar dataKey="count" cursor="pointer" onClick={handleBarClick}>
                {priceRangeData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={selectedPriceRange === entry.range ? '#1890ff' : '#8884d8'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 建案交易資訊表格 */}
      {projectTableData.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-4">建案交易資訊</h4>
          <div className="text-sm text-gray-600 mb-3">
            顯示篩選條件下各建案的交易統計，點擊欄位標題可排序
          </div>
          <Table
            columns={tableColumns}
            dataSource={projectTableData}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showQuickJumper: true,
              showTotal: (total, range) => `顯示 ${range[0]}-${range[1]} 項，共 ${total} 個建案`,
            }}
            scroll={{ x: 750 }}
            size="middle"
            className="bg-white rounded border"
          />
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