// src/components/navigation/TabContent.jsx - 分頁內容組件
import React from 'react';

// 導入所有圖表組件
import TaiwanMapVisualization from '../charts/TaiwanMapVisualization';
import ProjectAnalysis from '../charts/ProjectAnalysis';
import PriceStatistics from '../charts/PriceStatistics';
import RegionComparison from '../charts/RegionComparison';
import PriceHeatmap from '../charts/PriceHeatmap';
import RoomTypeDistribution from '../charts/RoomTypeDistribution';
import AreaDistribution from '../charts/AreaDistribution';
import AreaHeatmap from '../charts/AreaHeatmap';
import TimeSeriesAnalysis from '../charts/TimeSeriesAnalysis';

const TabContent = ({ activeTab }) => {
  // 渲染數據總覽頁面
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* 台灣地圖視覺化 */}
      <div className="h-[700px]">
        <TaiwanMapVisualization />
      </div>

      {/* 建案綜合分析 */}
      <div className="h-[800px]">
        <ProjectAnalysis />
      </div>
    </div>
  );

  // 渲染交易分析頁面
  const renderTransactionTab = () => (
    <div className="space-y-6">
      {/* 價格統計分析 */}
      <div className="h-[600px]">
        <PriceStatistics />
      </div>

      {/* 地區交易筆數比較 */}
      <div className="h-[700px]">
        <RegionComparison />
      </div>

      {/* 總價帶熱力圖 */}
      <div className="h-[700px]">
        <PriceHeatmap />
      </div>
    </div>
  );

  // 渲染房型分析頁面
  const renderRoomTypeTab = () => (
    <div className="space-y-6">
      {/* 房型分布數據 */}
      <div className="h-[600px]">
        <RoomTypeDistribution />
      </div>

      {/* 銷售面積分布 */}
      <div className="h-[800px]">
        <AreaDistribution />
      </div>

      {/* 面積帶熱力圖 */}
      <div className="h-[700px]">
        <AreaHeatmap />
      </div>
    </div>
  );

  // 渲染預測分析頁面
  const renderForecastTab = () => (
    <div className="space-y-6">
      {/* 時間序列分析 */}
      <div className="h-[800px]">
        <TimeSeriesAnalysis />
      </div>
    </div>
  );

  // 根據當前分頁渲染對應內容
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'transaction':
        return renderTransactionTab();
      case 'roomtype':
        return renderRoomTypeTab();
      case 'forecast':
        return renderForecastTab();
      default:
        return renderOverviewTab(); // 默認顯示數據總覽
    }
  };

  return (
    <div className="p-6 bg-gray-50">
      {renderContent()}
    </div>
  );
};

export default TabContent;