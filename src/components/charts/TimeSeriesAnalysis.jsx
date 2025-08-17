// src/components/charts/TimeSeriesAnalysis.jsx - 時間序列分析
import React, { useState, useMemo } from 'react';
import { Card, Spin, Switch, Radio, Statistic, Row, Col, Alert } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, ComposedChart } from 'recharts';
import { useStore } from '../../store/useStore';

const TimeSeriesAnalysis = () => {
  const { filteredData, loading } = useStore();
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' or 'quarterly'
  const [showPrediction, setShowPrediction] = useState(true);
  const [analysisType, setAnalysisType] = useState('price'); // 'price', 'volume', 'combined'

  // 時間序列資料計算
  const timeSeriesData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    console.log('[TimeSeriesAnalysis] 開始計算時間序列資料，資料筆數:', filteredData.length);
    
    const timeStats = {};
    let validCount = 0;

    filteredData.forEach(item => {
      if (!item.transactionDate || item.totalPrice <= 0) return;

      try {
        const date = new Date(item.transactionDate);
        if (isNaN(date.getTime())) return;

        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        let timeKey;
        if (viewMode === 'monthly') {
          timeKey = `${year}-${String(month).padStart(2, '0')}`;
        } else {
          const quarter = Math.ceil(month / 3);
          timeKey = `${year}-Q${quarter}`;
        }

        if (!timeStats[timeKey]) {
          timeStats[timeKey] = {
            period: timeKey,
            year,
            month: viewMode === 'monthly' ? month : null,
            quarter: viewMode === 'quarterly' ? Math.ceil(month / 3) : null,
            prices: [],
            unitPrices: [],
            areas: [],
            count: 0
          };
        }

        timeStats[timeKey].prices.push(item.totalPrice);
        timeStats[timeKey].unitPrices.push(item.unitPrice);
        timeStats[timeKey].areas.push(item.area);
        timeStats[timeKey].count++;
        validCount++;

      } catch (error) {
        console.error('[TimeSeriesAnalysis] 處理日期錯誤:', error);
      }
    });

    console.log('[TimeSeriesAnalysis] 有效資料筆數:', validCount);

    // 轉換為圖表資料
    const chartData = Object.values(timeStats)
      .filter(period => period.count >= 2) // 至少2筆交易
      .map(period => ({
        period: period.period,
        year: period.year,
        month: period.month,
        quarter: period.quarter,
        avgPrice: Math.round(period.prices.reduce((sum, p) => sum + p, 0) / period.prices.length / 10000),
        avgUnitPrice: Math.round(period.unitPrices.reduce((sum, p) => sum + p, 0) / period.unitPrices.length / 10000),
        avgArea: Math.round(period.areas.reduce((sum, a) => sum + a, 0) / period.areas.length),
        volume: period.count,
        totalSales: Math.round(period.prices.reduce((sum, p) => sum + p, 0) / 10000),
        displayPeriod: viewMode === 'monthly' 
          ? `${period.year}/${String(period.month).padStart(2, '0')}`
          : `${period.year}Q${period.quarter}`
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        if (viewMode === 'monthly') {
          return a.month - b.month;
        } else {
          return a.quarter - b.quarter;
        }
      });

    console.log('[TimeSeriesAnalysis] 時間序列資料:', chartData);
    return chartData;
  }, [filteredData, viewMode]);

  // 預測資料計算（簡單線性回歸）
  const predictionData = useMemo(() => {
    if (!showPrediction || timeSeriesData.length < 3) return [];

    // 使用最近的資料點進行簡單趨勢預測
    const recentData = timeSeriesData.slice(-6); // 最近6個週期
    if (recentData.length < 3) return [];

    // 計算單價趨勢
    const n = recentData.length;
    const sumX = recentData.reduce((sum, _, i) => sum + i, 0);
    const sumY = recentData.reduce((sum, item) => sum + item.avgUnitPrice, 0);
    const sumXY = recentData.reduce((sum, item, i) => sum + i * item.avgUnitPrice, 0);
    const sumXX = recentData.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // 生成預測資料（未來3個週期）
    const predictions = [];
    for (let i = 1; i <= 3; i++) {
      const futureIndex = n + i - 1;
      const predictedUnitPrice = Math.round(slope * futureIndex + intercept);
      
      // 生成未來週期標籤
      const lastPeriod = recentData[recentData.length - 1];
      let futurePeriod;
      
      if (viewMode === 'monthly') {
        const futureMonth = lastPeriod.month + i;
        const futureYear = lastPeriod.year + Math.floor((futureMonth - 1) / 12);
        const adjustedMonth = ((futureMonth - 1) % 12) + 1;
        futurePeriod = `${futureYear}/${String(adjustedMonth).padStart(2, '0')}`;
      } else {
        const futureQuarter = lastPeriod.quarter + i;
        const futureYear = lastPeriod.year + Math.floor((futureQuarter - 1) / 4);
        const adjustedQuarter = ((futureQuarter - 1) % 4) + 1;
        futurePeriod = `${futureYear}Q${adjustedQuarter}`;
      }

      predictions.push({
        period: futurePeriod,
        displayPeriod: futurePeriod,
        avgUnitPrice: Math.max(predictedUnitPrice, 0), // 確保預測值不為負
        isPrediction: true
      });
    }

    return predictions;
  }, [timeSeriesData, showPrediction, viewMode]);

  // 合併實際資料和預測資料
  const combinedData = useMemo(() => {
    const combined = [...timeSeriesData];
    if (predictionData.length > 0) {
      combined.push(...predictionData);
    }
    return combined;
  }, [timeSeriesData, predictionData]);

  // 統計摘要計算
  const statistics = useMemo(() => {
    if (timeSeriesData.length === 0) return null;

    const latest = timeSeriesData[timeSeriesData.length - 1];
    const previous = timeSeriesData.length > 1 ? timeSeriesData[timeSeriesData.length - 2] : null;

    const priceChange = previous ? 
      ((latest.avgUnitPrice - previous.avgUnitPrice) / previous.avgUnitPrice * 100).toFixed(1) : 0;
    
    const volumeChange = previous ? 
      ((latest.volume - previous.volume) / previous.volume * 100).toFixed(1) : 0;

    const totalVolume = timeSeriesData.reduce((sum, item) => sum + item.volume, 0);
    const avgVolume = Math.round(totalVolume / timeSeriesData.length);

    return {
      latestPeriod: latest.displayPeriod,
      latestPrice: latest.avgUnitPrice,
      latestVolume: latest.volume,
      priceChange: parseFloat(priceChange),
      volumeChange: parseFloat(volumeChange),
      totalPeriods: timeSeriesData.length,
      avgVolume,
      totalVolume
    };
  }, [timeSeriesData]);

  // 自定義工具提示
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPredicted = data.isPrediction;
      
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">
            {label} {isPredicted && <span className="text-blue-500">(預測)</span>}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.dataKey === 'avgUnitPrice' && ' 萬/坪'}
              {entry.dataKey === 'avgPrice' && ' 萬'}
              {entry.dataKey === 'volume' && ' 筆'}
            </p>
          ))}
          {!isPredicted && data.totalSales && (
            <p className="text-gray-600">總銷售額: {data.totalSales.toLocaleString()} 萬</p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card title="時間序列分析" className="h-full">
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Card title="時間序列分析" className="h-full">
      <div className="space-y-6">
        {/* 控制面板 */}
        <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-sm font-medium text-gray-700 mr-2">時間維度：</span>
              <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
                <Radio.Button value="monthly">月度分析</Radio.Button>
                <Radio.Button value="quarterly">季度分析</Radio.Button>
              </Radio.Group>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-700 mr-2">分析類型：</span>
              <Radio.Group value={analysisType} onChange={(e) => setAnalysisType(e.target.value)}>
                <Radio.Button value="price">價格趨勢</Radio.Button>
                <Radio.Button value="volume">交易量</Radio.Button>
                <Radio.Button value="combined">綜合分析</Radio.Button>
              </Radio.Group>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">單價預測：</span>
            <Switch 
              checked={showPrediction} 
              onChange={setShowPrediction}
              disabled={timeSeriesData.length < 3}
            />
          </div>
        </div>

        {/* 統計摘要 */}
        {statistics && (
          <Row gutter={16} className="mb-6">
            <Col span={6}>
              <Statistic
                title={`最新${viewMode === 'monthly' ? '月份' : '季度'}`}
                value={statistics.latestPeriod}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="最新單價"
                value={statistics.latestPrice}
                suffix="萬/坪"
                valueStyle={{ color: statistics.priceChange >= 0 ? '#3f8600' : '#cf1322' }}
                prefix={statistics.priceChange >= 0 ? '↗' : '↘'}
              />
              <div className="text-xs text-gray-500">
                {statistics.priceChange >= 0 ? '+' : ''}{statistics.priceChange}% vs 上期
              </div>
            </Col>
            <Col span={6}>
              <Statistic
                title="最新交易量"
                value={statistics.latestVolume}
                suffix="筆"
                valueStyle={{ color: statistics.volumeChange >= 0 ? '#3f8600' : '#cf1322' }}
                prefix={statistics.volumeChange >= 0 ? '↗' : '↘'}
              />
              <div className="text-xs text-gray-500">
                {statistics.volumeChange >= 0 ? '+' : ''}{statistics.volumeChange}% vs 上期
              </div>
            </Col>
            <Col span={6}>
              <Statistic
                title={`總交易${viewMode === 'monthly' ? '月數' : '季數'}`}
                value={statistics.totalPeriods}
                suffix={viewMode === 'monthly' ? '月' : '季'}
              />
            </Col>
          </Row>
        )}

        {/* 主要圖表 */}
        {timeSeriesData.length > 0 ? (
          <div className="space-y-6">
            {/* 價格趨勢圖 */}
            {(analysisType === 'price' || analysisType === 'combined') && (
              <div>
                <h4 className="text-lg font-medium mb-4">
                  {viewMode === 'monthly' ? '月度' : '季度'}單價趨勢
                  {showPrediction && predictionData.length > 0 && (
                    <span className="text-sm text-blue-500 ml-2">（含預測）</span>
                  )}
                </h4>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={combinedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="displayPeriod" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      label={{ value: '單價 (萬/坪)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="avgUnitPrice" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="平均單價"
                      connectNulls={false}
                      strokeDasharray={(data) => data?.isPrediction ? "5 5" : "0"}
                      dot={(props) => {
                        const { payload } = props;
                        return (
                          <circle
                            cx={props.cx}
                            cy={props.cy}
                            r={4}
                            fill={payload?.isPrediction ? "#ff7300" : "#8884d8"}
                            stroke={payload?.isPrediction ? "#ff7300" : "#8884d8"}
                            strokeWidth={2}
                          />
                        );
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 交易量趨勢圖 */}
            {(analysisType === 'volume' || analysisType === 'combined') && (
              <div>
                <h4 className="text-lg font-medium mb-4">
                  {viewMode === 'monthly' ? '月度' : '季度'}交易量趨勢
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="displayPeriod" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      label={{ value: '交易量 (筆)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} 筆`, '交易量']}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          return `${label}`;
                        }
                        return label;
                      }}
                    />
                    <Bar dataKey="volume" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 綜合分析圖 */}
            {analysisType === 'combined' && (
              <div>
                <h4 className="text-lg font-medium mb-4">價格 vs 交易量綜合分析</h4>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="displayPeriod" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      yAxisId="price"
                      tick={{ fontSize: 12 }}
                      label={{ value: '單價 (萬/坪)', angle: -90, position: 'insideLeft' }}
                    />
                    <YAxis 
                      yAxisId="volume"
                      orientation="right"
                      tick={{ fontSize: 12 }}
                      label={{ value: '交易量 (筆)', angle: 90, position: 'insideRight' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      yAxisId="price"
                      type="monotone" 
                      dataKey="avgUnitPrice" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="平均單價"
                    />
                    <Bar 
                      yAxisId="volume"
                      dataKey="volume" 
                      fill="#82ca9d" 
                      name="交易量"
                      opacity={0.6}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 預測說明 */}
            {showPrediction && predictionData.length > 0 && (
              <Alert
                message="預測說明"
                description={`基於最近${Math.min(6, timeSeriesData.length)}個${viewMode === 'monthly' ? '月' : '季'}的趨勢進行線性回歸預測。預測結果僅供參考，實際市場可能受多種因素影響。`}
                type="info"
                showIcon
              />
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            <div className="text-lg mb-2">📈</div>
            <div className="text-base font-medium">請選擇篩選條件以查看時間序列分析</div>
            <div className="text-sm text-gray-400 mt-1">需要至少3筆不同時期的交易資料</div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TimeSeriesAnalysis;