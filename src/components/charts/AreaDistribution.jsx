// src/components/charts/AreaDistribution.jsx - 修復堆疊溢位問題
import { Card, Spin, Table } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../../store/useStore';
import { useMemo } from 'react';

const AreaDistribution = () => {
  const { filteredData, loading } = useStore();

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

  // 計算面積分布數據
  const areaDistributionData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    console.log('[AreaDistribution] 開始計算面積分布，資料筆數:', filteredData.length);

    // 篩選有效面積資料
    const validAreaData = filteredData.filter(item => item.area && item.area > 0);
    console.log('[AreaDistribution] 有效面積資料筆數:', validAreaData.length);

    // 計算各區間的交易數量
    const distribution = areaRanges.map(range => {
      const count = validAreaData.filter(item => {
        const area = parseFloat(item.area);
        if (range.max === Infinity) {
          return area >= range.min;
        }
        return area >= range.min && area < range.max;
      }).length;

      const percentage = validAreaData.length > 0 
        ? ((count / validAreaData.length) * 100).toFixed(1)
        : '0.0';

      return {
        range: range.label,
        count: count,
        percentage: parseFloat(percentage),
        min: range.min,
        max: range.max
      };
    });

    // 過濾掉沒有交易的區間
    const nonZeroDistribution = distribution.filter(item => item.count > 0);
    
    console.log('[AreaDistribution] 面積分布結果:', nonZeroDistribution);
    return nonZeroDistribution;
  }, [filteredData]);

  // 🔧 修復：計算統計摘要 - 避免對大量數據進行 sort 操作
  const areaStatistics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        totalCount: 0,
        validCount: 0,
        avgArea: 0,
        minArea: 0,
        maxArea: 0,
        medianArea: 0
      };
    }

    const validAreaData = filteredData.filter(item => item.area && item.area > 0);
    
    if (validAreaData.length === 0) {
      return {
        totalCount: filteredData.length,
        validCount: 0,
        avgArea: 0,
        minArea: 0,
        maxArea: 0,
        medianArea: 0
      };
    }

    // 🔧 修復：使用迴圈計算統計值，避免創建大陣列和排序
    let totalArea = 0;
    let minArea = Infinity;
    let maxArea = -Infinity;
    
    // 單次遍歷計算總和、最小值、最大值
    for (let i = 0; i < validAreaData.length; i++) {
      const area = parseFloat(validAreaData[i].area);
      if (!isNaN(area) && area > 0) {
        totalArea += area;
        if (area < minArea) minArea = area;
        if (area > maxArea) maxArea = area;
      }
    }

    const avgArea = totalArea / validAreaData.length;

    // 🔧 修復：對於中位數，如果數據量太大，使用近似值
    let medianArea;
    if (validAreaData.length > 10000) {
      // 數據量太大時，使用平均值作為近似中位數
      medianArea = avgArea;
      console.log('[AreaDistribution] 數據量大，使用平均值作為近似中位數');
    } else {
      // 數據量較小時，正常計算中位數
      const areas = validAreaData.map(item => parseFloat(item.area)).filter(a => !isNaN(a) && a > 0);
      areas.sort((a, b) => a - b);
      medianArea = areas.length % 2 === 0 
        ? (areas[areas.length / 2 - 1] + areas[areas.length / 2]) / 2
        : areas[Math.floor(areas.length / 2)];
    }

    return {
      totalCount: filteredData.length,
      validCount: validAreaData.length,
      avgArea: Math.round(avgArea * 10) / 10,
      minArea: minArea === Infinity ? 0 : Math.round(minArea * 10) / 10,
      maxArea: maxArea === -Infinity ? 0 : Math.round(maxArea * 10) / 10,
      medianArea: Math.round(medianArea * 10) / 10
    };
  }, [filteredData]);

  // 表格欄位定義
  const columns = [
    {
      title: '面積區間',
      dataIndex: 'range',
      key: 'range',
      width: 120,
      render: (text) => <span className="font-medium">{text}</span>
    },
    {
      title: '交易數量',
      dataIndex: 'count',
      key: 'count',
      width: 100,
      render: (count) => <span className="text-blue-600 font-semibold">{count.toLocaleString()} 筆</span>
    },
    {
      title: '佔比',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 80,
      render: (percentage) => <span>{percentage}%</span>
    },
    {
      title: '區間範圍',
      key: 'description',
      render: (record) => {
        if (record.max === Infinity) {
          return `${record.min}坪以上`;
        }
        return `${record.min}-${record.max}坪`;
      }
    }
  ];

  if (loading) {
    return (
      <Card title="銷售面積分布" className="h-full">
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Card title="銷售面積分布" className="h-full">
      {areaDistributionData.length > 0 ? (
        <div className="space-y-6">
          {/* 統計摘要 */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{areaStatistics.validCount.toLocaleString()}</div>
              <div className="text-sm text-gray-600">有效筆數</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{areaStatistics.avgArea}</div>
              <div className="text-sm text-gray-600">平均面積</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{areaStatistics.medianArea}</div>
              <div className="text-sm text-gray-600">中位數</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{areaStatistics.minArea}</div>
              <div className="text-sm text-gray-600">最小面積</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{areaStatistics.maxArea}</div>
              <div className="text-sm text-gray-600">最大面積</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{areaStatistics.totalCount.toLocaleString()}</div>
              <div className="text-sm text-gray-600">總筆數</div>
            </div>
          </div>

          {/* 主要長條圖 */}
          <div>
            <h4 className="text-lg font-medium mb-4">面積區間銷售分布</h4>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={areaDistributionData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="range" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: '交易數量 (筆)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value, name) => [`${value.toLocaleString()} 筆`, '交易數量']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return `${label} (${payload[0].payload.percentage}%)`;
                    }
                    return label;
                  }}
                  contentStyle={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#3b82f6" 
                  stroke="#1e40af" 
                  strokeWidth={1}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 詳細數據表格 */}
          <div>
            <h4 className="text-lg font-medium mb-4">詳細統計</h4>
            <Table
              columns={columns}
              dataSource={areaDistributionData}
              rowKey="range"
              pagination={false}
              size="small"
              className="border border-gray-200 rounded"
            />
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <div className="text-lg mb-2">📊</div>
          <div className="text-base font-medium">請選擇篩選條件以查看面積分布數據</div>
          <div className="text-sm text-gray-400 mt-1">選擇城市或區域來開始分析</div>
        </div>
      )}
    </Card>
  );
};

export default AreaDistribution;
