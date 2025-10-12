// src/components/navigation/TabNavigation.jsx - 現代商務風版本
import React from 'react';
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
      icon: <DashboardOutlined />,
      label: '數據總覽',
      description: '地圖視覺化 & 建案分析',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      key: 'transaction',
      icon: <BarChartOutlined />,
      label: '交易分析',
      description: '價格統計 & 交易熱力圖',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      key: 'roomtype',
      icon: <HomeOutlined />,
      label: '房型分析',
      description: '房型分布 & 面積分析',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      key: 'forecast',
      icon: <LineChartOutlined />,
      label: '預測分析',
      description: '時間序列 & 趨勢預測',
      gradient: 'from-orange-500 to-amber-600'
    }
  ];

  return (
    <div 
      style={{
        backgroundColor: 'transparent',
        padding: '0 24px 16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* 卡片式分頁導航 */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        {tabItems.map((tab) => {
          const isActive = activeTab === tab.key;
          
          return (
            <div
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: isActive 
                  ? '2px solid #f59e0b' 
                  : '2px solid transparent',
                boxShadow: isActive
                  ? '0 10px 15px -3px rgba(245, 158, 11, 0.2), 0 4px 6px -2px rgba(245, 158, 11, 0.1)'
                  : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                }
              }}
            >
              {/* 頂部金色條（僅在選中時顯示） */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, #f59e0b, #fcd34d)',
                    borderRadius: '12px 12px 0 0',
                  }}
                />
              )}

              {/* 圖標區域 */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  background: isActive
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                    : 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  color: isActive ? 'white' : '#64748b',
                  marginBottom: '12px',
                  transition: 'all 0.2s ease',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {tab.icon}
              </div>

              {/* 標籤文字 */}
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: isActive ? '#1e293b' : '#475569',
                  marginBottom: '4px',
                  transition: 'color 0.2s ease'
                }}
              >
                {tab.label}
              </div>

              {/* 描述文字 */}
              <div
                style={{
                  fontSize: '12px',
                  color: isActive ? '#64748b' : '#94a3b8',
                  lineHeight: '1.4',
                  transition: 'color 0.2s ease'
                }}
              >
                {tab.description}
              </div>

              {/* 選中標記（右上角徽章） */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#f59e0b',
                    boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.2)',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default TabNavigation;