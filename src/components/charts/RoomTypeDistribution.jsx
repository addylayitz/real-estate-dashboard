// src/components/charts/RoomTypeDistribution.jsx - 新增互動式表格
import { Card, Spin, Table } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Line } from 'recharts';
import { useStore } from '../../store/useStore';
import { useMemo, useState } from 'react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7300'];

const RoomTypeDistribution = () => {
  const { filteredData, loading } = useStore();
  
  // 選中的房型狀態
  const [selectedRoomType, setSelectedRoomType] = useState(null);

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

  // 互動式表格數據 - 支援房型篩選
  const interactiveTableData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    console.log('[RoomTypeDistribution] 開始計算互動表格數據...');
    
    // 根據選中的房型篩選數據
    let dataToProcess = filteredData;
    if (selectedRoomType) {
      console.log('[RoomTypeDistribution] 應用房型篩選:', selectedRoomType);
      
      dataToProcess = filteredData.filter(item => {
        const originalRoomType = item.roomType || '未知';
        const categorizedType = categorizeRoomType(originalRoomType);
        return categorizedType === selectedRoomType;
      });
      
      console.log(`[RoomTypeDistribution] 房型篩選後: ${filteredData.length} -> ${dataToProcess.length} 筆`);
    }
    
    // 按建案名稱分組
    const projectGroups = {};
    
    dataToProcess.forEach(item => {
      // 根據實際JSON結構取得欄位值
      const district = item.district || item['區域'] || '未知區域';
      const projectName = item.project || item['建案名稱'] || '未知建案';
      
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
      
      // 計算平均值
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

      // 取得房型（如果有篩選則固定顯示篩選的房型，否則顯示主要房型）
      let displayRoomType = selectedRoomType || '混合';
      if (!selectedRoomType) {
        // 找出該建案最常見的房型
        const roomTypeCounts = {};
        validTransactions.forEach(t => {
          const originalRoomType = t.roomType || t['房型'] || '未知';
          const categorizedType = categorizeRoomType(originalRoomType);
          roomTypeCounts[categorizedType] = (roomTypeCounts[categorizedType] || 0) + 1;
        });
        
        displayRoomType = Object.keys(roomTypeCounts).reduce((a, b) => 
          roomTypeCounts[a] > roomTypeCounts[b] ? a : b
        );
      }

      return {
        key: index,
        district: group.district,
        projectName: group.projectName,
        transactionCount: validTransactions.length,
        avgArea: Math.round(avgArea * 100) / 100, // 保留2位小數
        avgUnitPrice: Math.round(avgUnitPrice / 10000), // 除以10000，四捨五入取整數
        avgTotalPrice: Math.round(avgTotalPrice / 10000), // 除以10000，四捨五入取整數
        roomType: displayRoomType
      };
    }).filter(Boolean);

    console.log('[RoomTypeDistribution] 互動表格數據計算完成:', tableData.length, '個建案');
    return tableData;
  }, [filteredData, selectedRoomType]);

  // 處理長條圖點擊事件
  const handleBarClick = (data, index) => {
    console.log('[RoomTypeDistribution] 點擊長條圖:', data);
    
    if (!data || !data.roomType) return;
    
    // 切換選中狀態：如果點擊已選中的房型，則取消選擇
    if (selectedRoomType === data.roomType) {
      setSelectedRoomType(null);
      console.log('[RoomTypeDistribution] 取消房型篩選');
    } else {
      setSelectedRoomType(data.roomType);
      console.log('[RoomTypeDistribution] 選中房型:', data.roomType);
    }
  };

  // 表格欄位定義
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
      title: '房型',
      dataIndex: 'roomType',
      key: 'roomType',
      align: 'center',
      width: 80,
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          selectedRoomType ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      ),
    },
  ];

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
              {selectedRoomType && (
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                  <span className="text-sm text-blue-700">
                    🎯 已篩選房型: <strong>{selectedRoomType}</strong> 
                    <span className="ml-2 text-xs">(點擊同一長條圖可取消篩選)</span>
                  </span>
                </div>
              )}
              <div className="text-sm text-gray-600 mb-3">
                左軸：平均總價（萬元）｜右軸：平均單價（萬/坪）｜點擊長條圖篩選房型
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
                    fill={(entry, index) => selectedRoomType === entry?.roomType ? '#1890ff' : '#8ec5ff'}
                    name="平均總價"
                    opacity={0.8}
                    cursor="pointer"
                    onClick={handleBarClick}
                  >
                    {roomTypePriceData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={selectedRoomType === entry.roomType ? '#1890ff' : '#8ec5ff'}
                      />
                    ))}
                  </Bar>
                  
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

          {/* 互動式建案交易資訊表格 */}
          {interactiveTableData.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-4">
                建案交易資訊
                {selectedRoomType && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    (僅顯示 {selectedRoomType} 數據)
                  </span>
                )}
              </h4>
              <div className="text-sm text-gray-600 mb-3">
                {selectedRoomType 
                  ? `顯示 ${selectedRoomType} 的各建案統計數據，點擊欄位標題可排序`
                  : '顯示所有建案的統計數據，點擊上方長條圖可篩選特定房型'
                }
              </div>
              <Table
                columns={tableColumns}
                dataSource={interactiveTableData}
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