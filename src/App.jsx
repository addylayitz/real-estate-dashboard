// src/App.jsx - 分頁功能整合版本
import { Layout, Button, Typography } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
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
  const [activeTab, setActiveTab] = useState('overview'); // 默認顯示數據總覽
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

  return (
    <Layout className="min-h-screen">
      {/* 頁面標題 - 優化版本 */}
      <Header style={{ 
        backgroundColor: '#1890ff', 
        borderBottom: '1px solid #d9d9d9',
        padding: '0 24px',  // 增加左右內邊距
        height: '64px'      // 確保足夠高度
      }}>
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
          {/* 標題部分 */}
          <div style={{ 
            flex: '1', 
            minWidth: '0',  // 允許縮小
            marginRight: '16px' 
          }}>
            <Title 
              level={3} 
              style={{ 
                color: 'white', 
                margin: 0, 
                fontWeight: 'bold',
                fontSize: '18px',  // 稍微縮小字體確保空間
                whiteSpace: 'nowrap',  // 不換行
                overflow: 'hidden',
                textOverflow: 'ellipsis'  // 超出時顯示省略號
              }}
            >
              📊 預售屋數據儀表板
            </Title>
          </div>

          {/* 按鈕部分 */}
          <div style={{ 
            flexShrink: 0,  // 不縮小
            minWidth: '120px'  // 確保按鈕有足夠空間
          }}>
            <Button
              type="primary"
              ghost
              icon={<DatabaseOutlined />}
              onClick={() => setDataLoaderVisible(true)}
              style={{ 
                borderColor: 'white', 
                color: 'white',
                minWidth: '100px',  // 確保按鈕最小寬度
                fontSize: '14px'    // 確保文字大小適中
              }}
            >
              資料管理
            </Button>
          </div>
        </div>
      </Header>

      {/* 主要內容 */}
      <Content className="bg-gray-50">
        {dataLoaded ? (
          <div>
            {/* 篩選面板 - 固定在頂部 */}
            <div className="p-6 pb-0">
              <FilterPanel />
            </div>

            {/* 分頁導航 - 固定在篩選面板下方 */}
            <TabNavigation 
              activeTab={activeTab} 
              onTabChange={handleTabChange} 
            />

            {/* 分頁內容 - 動態切換 */}
            <TabContent activeTab={activeTab} />
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📊</div>
            <Title level={2} className="text-gray-600">
              首次使用需要載入資料
            </Title>
            <p className="text-gray-500 mb-6">
              這個過程將載入約 16 萬筆預售屋資料到您的瀏覽器本地儲存。
              <br />
              載入完成後即可離線使用分析功能。
            </p>
            <Button
              type="primary"
              size="large"
              icon={<DatabaseOutlined />}
              onClick={() => setDataLoaderVisible(true)}
            >
              開始載入資料
            </Button>
          </div>
        )}
      </Content>

      {/* 頁面底部 */}
      <Footer className="text-center text-gray-500">
        預售屋數據儀表板 ©2025 - 基於 IndexedDB + Web Worker 技術
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