// src/components/charts/ProjectAnalysis.jsx - 散布圖優化版本
import { Card, Spin, Table, Tag } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { useStore } from '../../store/useStore';
import { useMemo } from 'react';

const ProjectAnalysis = () => {
  const { filteredData, loading } = useStore();

  // 計算建案分析數據
  const projectData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    const projectStats = {};
    
    filteredData.forEach(item => {
      const project = item.project || '未知建案';
      const city = item.cityName || item.city || '未知城市';
      const district = item.district || '未知區域';
      
      if (!projectStats[project]) {
        projectStats[project] = {
          name: project,
          city: city,
          district: district,
          count: 0,
          prices: [],
          unitPrices: [],
          areas: [],
          transactions: []
        };
      }
      
      projectStats[project].count++;
      
      if (item.totalPrice > 0) {
        projectStats[project].prices.push(item.totalPrice);
      }
      if (item.unitPrice > 0) {
        projectStats[project].unitPrices.push(item.unitPrice);
      }
      if (item.area > 0) {
        projectStats[project].areas.push(item.area);
      }
      
      projectStats[project].transactions.push(item);
    });

    return Object.values(projectStats)
      .map(project => ({
        ...project,
        avgPrice: project.prices.length > 0 
          ? Math.round(project.prices.reduce((sum, p) => sum + p, 0) / project.prices.length / 10000)
          : 0,
        avgUnitPrice: project.unitPrices.length > 0 
          ? Math.round(project.unitPrices.reduce((sum, p) => sum + p, 0) / project.unitPrices.length / 10000)
          : 0,
        avgArea: project.areas.length > 0 
          ? Math.round(project.areas.reduce((sum, a) => sum + a, 0) / project.areas.length)
          : 0,
        maxPrice: project.prices.length > 0 ? Math.max(...project.prices) / 10000 : 0,
        minPrice: project.prices.length > 0 ? Math.min(...project.prices) / 10000 : 0
      }))
      .filter(project => project.count >= 3) // 至少3筆交易才顯示
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  // 準備圖表數據 - 交易量排行
  const topProjectsByCount = useMemo(() => {
    return projectData.slice(0, 10); // 前10個建案
  }, [projectData]);

  // 準備圖表數據 - 平均單價排行
  const topProjectsByPrice = useMemo(() => {
    return projectData
      .filter(project => project.avgUnitPrice > 0)
      .sort((a, b) => b.avgUnitPrice - a.avgUnitPrice)
      .slice(0, 10);
  }, [projectData]);

  // 準備散點圖數據 - 單價vs面積（限制150坪以下）
  const scatterData = useMemo(() => {
    return projectData
      .filter(project => 
        project.avgUnitPrice > 0 && 
        project.avgArea > 0 && 
        project.avgArea <= 150  // 只顯示150坪以下的建案
      )
      .map(project => ({
        x: project.avgArea,
        y: project.avgUnitPrice,
        name: project.name,
        count: project.count,
        city: project.city,
        district: project.district
      }));
  }, [projectData]);

  // 自定義散點圖工具提示
  const CustomScatterTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-medium text-gray-800">{data.name}</p>
          <p className="text-sm text-gray-600">{data.city} {data.district}</p>
          <hr className="my-2" />
          <p className="text-sm">平均面積: {data.x} 坪</p>
          <p className="text-sm">平均單價: {data.y} 萬/坪</p>
          <p className="text-sm text-gray-500">交易筆數: {data.count} 筆</p>
        </div>
      );
    }
    return null;
  };

  // 表格欄位定義
  const columns = [
    {
      title: '建案名稱',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text) => <span className="font-medium">{text}</span>
    },
    {
      title: '地區',
      key: 'location',
      width: 120,
      render: (record) => (
        <div>
          <div className="text-sm">{record.city}</div>
          <div className="text-xs text-gray-500">{record.district}</div>
        </div>
      )
    },
    {
      title: '交易數量',
      dataIndex: 'count',
      key: 'count',
      width: 80,
      render: (count) => <Tag color="blue">{count} 筆</Tag>
    },
    {
      title: '平均總價',
      dataIndex: 'avgPrice',
      key: 'avgPrice',
      width: 100,
      render: (price) => price > 0 ? `${price} 萬` : '-'
    },
    {
      title: '平均單價',
      dataIndex: 'avgUnitPrice',
      key: 'avgUnitPrice',
      width: 100,
      render: (price) => price > 0 ? `${price} 萬/坪` : '-'
    },
    {
      title: '平均面積',
      dataIndex: 'avgArea',
      key: 'avgArea',
      width: 80,
      render: (area) => area > 0 ? `${area} 坪` : '-'
    },
    {
      title: '價格區間',
      key: 'priceRange',
      width: 120,
      render: (record) => {
        if (record.maxPrice > 0 && record.minPrice > 0) {
          return `${Math.round(record.minPrice)}-${Math.round(record.maxPrice)} 萬`;
        }
        return '-';
      }
    }
  ];

  if (loading) {
    return (
      <Card title="建案綜合分析" className="h-full">
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Card title="建案綜合分析" className="h-full">
      {projectData.length > 0 ? (
        <div className="space-y-6">
          {/* 交易量排行 */}
          {topProjectsByCount.length > 0 && (
            <div>
              <h4 className="text-lg font-medium mb-4">建案交易量排行</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topProjectsByCount} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} 筆`, '交易數量']} />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 平均單價排行 */}
          {topProjectsByPrice.length > 0 && (
            <div>
              <h4 className="text-lg font-medium mb-4">建案平均單價排行</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topProjectsByPrice} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} 萬/坪`, '平均單價']} />
                  <Bar dataKey="avgUnitPrice" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 單價vs面積散點圖 - 限制150坪以下 */}
          {scatterData.length > 0 && (
            <div>
              <h4 className="text-lg font-medium mb-4">平均單價 vs 平均面積（150坪以下）</h4>
              <div className="text-sm text-gray-600 mb-3">
                散點圖顯示建案的面積與單價關係，僅顯示150坪以下的建案
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="面積" 
                    unit="坪"
                    domain={[0, 150]}  // 固定X軸範圍為0-150坪
                    tick={{ fontSize: 12 }}
                    label={{ value: '平均面積 (坪)', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="單價" 
                    unit="萬/坪"
                    tick={{ fontSize: 12 }}
                    label={{ value: '平均單價 (萬/坪)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<CustomScatterTooltip />} />
                  <Scatter 
                    name="建案" 
                    data={scatterData} 
                    fill="#1890ff"
                    fillOpacity={0.6}
                    stroke="#1890ff"
                    strokeWidth={1}
                    r={6}  // 固定點的大小
                  />
                </ScatterChart>
              </ResponsiveContainer>
              
              {/* 散點圖說明 */}
              <div className="text-sm text-gray-600 mt-3 bg-gray-50 p-3 rounded">
                <div className="font-medium mb-1">圖表說明：</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>每個點代表一個建案，橫軸為平均面積，縱軸為平均單價</li>
                  <li>僅顯示平均面積150坪以下且至少有3筆交易的建案</li>
                  <li>滑鼠懸停可查看建案詳細資訊</li>
                  <li>共顯示 {scatterData.length} 個建案</li>
                </ul>
              </div>
            </div>
          )}

          {/* 建案詳細數據表格 */}
          <div>
            <h4 className="text-lg font-medium mb-4">建案詳細數據</h4>
            <Table
              columns={columns}
              dataSource={projectData.slice(0, 20)} // 顯示前20個建案
              rowKey="name"
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showTotal: (total) => `共 ${total} 個建案`
              }}
              scroll={{ x: 800 }}
              size="small"
            />
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          請選擇篩選條件以查看建案分析數據
        </div>
      )}
    </Card>
  );
};

export default ProjectAnalysis;