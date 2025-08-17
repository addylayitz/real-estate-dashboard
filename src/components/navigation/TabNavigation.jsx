// src/components/navigation/TabNavigation.jsx - 分頁導航組件
import React from 'react';
import { Tabs } from 'antd';
import { 
  DashboardOutlined, 
  BarChartOutlined, 
  HomeOutlined, 
  LineChartOutlined 
} from '@ant-design/icons';

const TabNavigation = ({ activeTab, onTabChange }) => {
  const tabItems = [
    {
      key: 'overview',
      label: (
        <span className="flex items-center gap-2 px-2 py-1">
          <DashboardOutlined />
          <span>數據總覽</span>
        </span>
      ),
      disabled: false
    },
    {
      key: 'transaction',
      label: (
        <span className="flex items-center gap-2 px-2 py-1">
          <BarChartOutlined />
          <span>交易分析</span>
        </span>
      ),
      disabled: false
    },
    {
      key: 'roomtype',
      label: (
        <span className="flex items-center gap-2 px-2 py-1">
          <HomeOutlined />
          <span>房型分析</span>
        </span>
      ),
      disabled: false
    },
    {
      key: 'forecast',
      label: (
        <span className="flex items-center gap-2 px-2 py-1">
          <LineChartOutlined />
          <span>預測分析</span>
        </span>
      ),
      disabled: false
    }
  ];

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-6 py-0">
        <Tabs
          activeKey={activeTab}
          onChange={onTabChange}
          items={tabItems}
          size="large"
          type="line"
          tabBarStyle={{
            marginBottom: 0,
            borderBottom: '2px solid #f0f0f0'
          }}
          tabBarExtraContent={{
            right: (
              <div className="text-sm text-gray-500 px-4">
                {getTabDescription(activeTab)}
              </div>
            )
          }}
        />
      </div>
    </div>
  );
};

// 獲取分頁描述
const getTabDescription = (activeTab) => {
  const descriptions = {
    'overview': '地圖視覺化 & 建案分析',
    'transaction': '價格統計 & 交易熱力圖',
    'roomtype': '房型分布 & 面積分析',
    'forecast': '時間序列 & 趨勢預測'
  };
  return descriptions[activeTab] || '';
};

export default TabNavigation;