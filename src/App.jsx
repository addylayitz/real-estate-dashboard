// src/App.jsx - 現代商務風版本
import { Layout, Button, Typography, Breadcrumb } from 'antd';
import { DatabaseOutlined, HomeOutlined, DashboardOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useStore } from './store/useStore';

// 元件 imports
import FilterPanel from './components/filters/FilterPanel';
import TabNavigation from './components/navigation/TabNavigation';
import TabContent from './components/navigation/TabContent';
import DataLoader from './components/DataLoader';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function App() {
  const [dataLoaderVisible, setDataLoaderVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { dataLoaded, checkDataStatus } = useStore();

  // 檢查資料載入狀態
  useEffect(() => {
    checkDataStatus();
  }, [checkDataStatus]);

  // 如果資料未載入，自動顯示載入對話框
  useEffect(() => {
    if (dataLoaded === false) {
      setDataLoaderVisible(true);
    }
  }, [dataLoaded]);

  // 處理分頁切換
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // 獲取當前分頁名稱
  const getTabName = (key) => {
    const tabNames = {
      'overview': '數據總覽',
      'transaction': '交易分析',
      'roomtype': '房型分析',
      'forecast': '預測分析'
    };
    return tabNames[key] || '數據總覽';
  };

  return (
    <Layout className="min-h-screen">
      {/* 🎨 現代商務風 Header - 深藍漸層 */}
      <Header 
        style={{ 
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          borderBottom: 'none',
          padding: '0 32px',
          height: '72px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
      >
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '100%',
            maxWidth: '100%',
            width: '100%'
          }}
        >
          {/* 左側：標題 + 麵包屑 */}
          <div style={{ 
            flex: '1', 
            minWidth: '0',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            {/* 主標題 */}
            <Title 
              level={3} 
              style={{ 
                color: 'white', 
                margin: 0, 
                fontWeight: 'bold',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              📊 預售屋數據儀表板
              <span style={{
                fontSize: '12px',
                fontWeight: 'normal',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                color: '#fcd34d',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                Pro
              </span>
            </Title>

            {/* 麵包屑導航 */}
            {dataLoaded && (
              <Breadcrumb
                style={{ 
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.85)'
                }}
                separator={
                  <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>›</span>
                }
              >
                <Breadcrumb.Item>
                  <HomeOutlined style={{ marginRight: '4px' }} />
                  首頁
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                  <DashboardOutlined style={{ marginRight: '4px' }} />
                  {getTabName(activeTab)}
                </Breadcrumb.Item>
              </Breadcrumb>
            )}
          </div>

          {/* 右側：資料管理按鈕 */}
          <div style={{ 
            flexShrink: 0,
            minWidth: '140px'
          }}>
            <Button
              type="default"
              size="large"
              icon={<DatabaseOutlined />}
              onClick={() => setDataLoaderVisible(true)}
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'white',
                fontWeight: '500',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
            >
              資料管理
            </Button>
          </div>
        </div>
      </Header>

      {/* 主要內容區域 */}
      <Content 
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          minHeight: 'calc(100vh - 72px - 70px)' // 扣除 Header 和 Footer 高度
        }}
      >
        {dataLoaded ? (
          <div className="animate-fade-in-up">
            {/* 篩選面板 */}
            <div className="p-6 pb-4">
              <FilterPanel />
            </div>

            {/* 分頁導航 */}
            <TabNavigation 
              activeTab={activeTab} 
              onTabChange={handleTabChange} 
            />

            {/* 分頁內容 */}
            <TabContent activeTab={activeTab} />
          </div>
        ) : (
          // 首次使用提示頁面
          <div 
            className="text-center py-20 animate-scale-in"
            style={{
              maxWidth: '600px',
              margin: '0 auto',
              padding: '40px 20px'
            }}
          >
            <div 
              style={{
                width: '120px',
                height: '120px',
                margin: '0 auto 32px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)',
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '56px',
                boxShadow: '0 20px 25px -5px rgba(30, 58, 138, 0.3)',
                animation: 'float 3s ease-in-out infinite'
              }}
            >
              📊
            </div>

            <Title 
              level={2} 
              style={{ 
                color: '#1e293b',
                fontWeight: '700',
                marginBottom: '16px'
              }}
            >
              歡迎使用預售屋數據儀表板
            </Title>

            <p 
              style={{
                color: '#64748b',
                fontSize: '16px',
                lineHeight: '1.6',
                marginBottom: '32px'
              }}
            >
              這個過程將載入約 <strong style={{ color: '#3b82f6' }}>16 萬筆</strong> 預售屋資料到您的瀏覽器本地儲存。
              <br />
              載入完成後即可離線使用所有分析功能。
            </p>

            <Button
              type="primary"
              size="large"
              icon={<DatabaseOutlined />}
              onClick={() => setDataLoaderVisible(true)}
              style={{
                height: '48px',
                padding: '0 32px',
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)',
                border: 'none',
                boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
              }}
            >
              開始載入資料
            </Button>

            <style jsx>{`
              @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
              }
            `}</style>
          </div>
        )}
      </Content>

      {/* 頁面底部 */}
      <Footer 
        style={{
          textAlign: 'center',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          padding: '24px 50px',
          color: '#64748b'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
          <span>預售屋數據儀表板 ©2025</span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            基於 
            <strong style={{ color: '#3b82f6' }}>IndexedDB + Web Worker</strong> 
            技術
          </span>
        </div>
      </Footer>

      {/* 資料載入對話框 */}
      <DataLoader
        visible={dataLoaderVisible}
        onClose={() => setDataLoaderVisible(false)}
      />
    </Layout>
  );
}

export default App;