import React, { useState, useEffect } from 'react';
import { Card, Button, Progress, Space, Statistic, Row, Col, Alert, Table } from 'antd';
import { 
  UploadOutlined, 
  DatabaseOutlined, 
  SearchOutlined, 
  DeleteOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';
import IndexedDBManager from '../services/IndexedDBManager';

const DataImporter = () => {
  const [dbManager] = useState(() => new IndexedDBManager());
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [dbStats, setDbStats] = useState({
    totalRecords: 0,
    totalCities: 0,
    lastUpdate: null,
    isLoaded: false
  });
  const [queryResults, setQueryResults] = useState([]);
  const [currentStats, setCurrentStats] = useState({
    count: 0,
    avgPrice: 0,
    avgUnitPrice: 0,
    avgArea: 0
  });

  // 初始化資料庫
  useEffect(() => {
    initDB();
    
    // 在開發環境下暴露除錯工具
    if (import.meta.env.DEV) {
      window.dbManager = dbManager;
      window.IndexedDBManager = IndexedDBManager;
      console.log('🔧 除錯工具已載入：window.dbManager');
    }
  }, []);

  const initDB = async () => {
    try {
      await dbManager.init();
      await updateDBStats();
    } catch (error) {
      console.error('初始化資料庫失敗:', error);
    }
  };

  // 更新資料庫統計資訊
  const updateDBStats = async () => {
    try {
      console.log('🔄 更新統計資訊中...');
      const stats = await dbManager.getDatabaseStats();
      console.log('📊 資料庫統計:', stats);
      setDbStats(stats);
      
      // 更新統計數據
      if (stats.totalRecords > 0) {
        // 取樣更多資料來計算統計（但限制在 5000 筆以內避免效能問題）
        const sampleSize = Math.min(5000, stats.totalRecords);
        console.log(`📈 準備取樣 ${sampleSize} 筆資料計算統計`);
        
        const sampleData = await dbManager.queryData({}, sampleSize);
        console.log(`📊 實際取得 ${sampleData.length} 筆資料`);
        
        if (sampleData.length > 0) {
          const validData = sampleData.filter(item => 
            item.totalPrice > 0 && item.unitPrice > 0 && item.area > 0
          );
          
          console.log(`✅ 有效資料: ${validData.length} 筆`);
          
          if (validData.length > 0) {
            const totalPrice = validData.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
            const totalUnitPrice = validData.reduce((sum, item) => sum + (item.unitPrice || 0), 0);
            const totalArea = validData.reduce((sum, item) => sum + (item.area || 0), 0);
            
            const newStats = {
              count: stats.totalRecords,
              avgPrice: Math.round(totalPrice / validData.length),
              avgUnitPrice: Math.round(totalUnitPrice / validData.length),
              avgArea: Math.round(totalArea / validData.length)
            };
            
            console.log('📊 計算的統計數據:', newStats);
            console.log(`💰 平均總價: ${(newStats.avgPrice / 10000).toFixed(0)} 萬`);
            console.log(`💰 平均單價: ${(newStats.avgUnitPrice / 10000).toFixed(1)} 萬/坪`);
            console.log(`📏 平均面積: ${newStats.avgArea} 坪`);
            
            // 強制更新 state
            setCurrentStats(prevStats => {
              console.log('🔄 更新 React state:', newStats);
              return newStats;
            });
            
            // 額外確保更新
            setTimeout(() => {
              setCurrentStats(newStats);
              console.log('🔄 延遲更新 React state 完成');
            }, 100);
          } else {
            console.warn('⚠️ 沒有有效的統計資料');
            setCurrentStats({ count: stats.totalRecords, avgPrice: 0, avgUnitPrice: 0, avgArea: 0 });
          }
        }
      } else {
        console.log('⚠️ 沒有資料，重置統計');
        setCurrentStats({ count: 0, avgPrice: 0, avgUnitPrice: 0, avgArea: 0 });
      }
    } catch (error) {
      console.error('❌ 更新統計失敗:', error);
    }
  };

  // 從預設檔案載入資料
  const loadFromDefaultFiles = async () => {
    setIsLoading(true);
    setProgress(0);
    setLoadingStatus('準備載入資料...');

    try {
      const worker = new Worker('/dataWorker_v2.js'); // 改為新檔案名稱
      
      worker.onmessage = async (e) => {
        const { type, data, progress: currentProgress, totalCount, currentCount } = e.data;
        
        switch (type) {
          case 'LOAD_START':
            setLoadingStatus(`開始載入 ${data?.totalCities || 21} 個縣市資料...`);
            break;
            
          case 'LOADING_CITY':
            setLoadingStatus(`載入 ${data?.cityName}...`);
            setProgress(currentProgress || 0);
            break;
            
          case 'CITY_LOADED':
            console.log(`✅ ${e.data.cityName} 載入完成: ${e.data.count} 筆`);
            if (e.data.data && e.data.data.length > 0) {
              try {
                console.log(`📥 開始將 ${e.data.cityName} 的 ${e.data.data.length} 筆資料寫入資料庫`);
                const addedCount = await dbManager.addData(e.data.data);
                console.log(`✅ ${e.data.cityName} 寫入完成: ${addedCount} 筆`);
              } catch (error) {
                console.error(`❌ 寫入 ${e.data.cityName} 資料失敗:`, error);
                // 即使某個城市失敗，也繼續處理其他城市
              }
            } else {
              console.warn(`⚠️ ${e.data.cityName} 沒有有效資料`);
            }
            break;
            
          case 'CITY_ERROR':
            console.error(`載入 ${data?.cityName} 失敗:`, data?.error);
            break;
            
          case 'PROGRESS':
            setProgress(currentProgress || 0);
            setLoadingStatus(`已載入 ${data?.loaded}/${data?.total} 個縣市 (${currentCount || 0} 筆)`);
            break;
            
          case 'LOAD_COMPLETE':
            setLoadingStatus(`載入完成！共 ${totalCount} 筆資料`);
            setProgress(100);
            worker.terminate();
            
            // 延遲更新統計，確保所有資料都已寫入
            setTimeout(async () => {
              console.log('🔄 開始更新最終統計...');
              await updateDBStats();
              setIsLoading(false);
              console.log('✅ 統計資訊已更新完成');
            }, 2000); // 增加延遲時間
            break;
        }
      };

      worker.onerror = (error) => {
        console.error('Worker 錯誤:', error);
        setLoadingStatus('載入失敗');
        setIsLoading(false);
        worker.terminate();
      };

      // 開始載入
      worker.postMessage({ type: 'LOAD_ALL_DATA' });
      
    } catch (error) {
      console.error('載入資料失敗:', error);
      setLoadingStatus('載入失敗: ' + error.message);
      setIsLoading(false);
    }
  };

  // 清除所有資料
  const clearAllData = async () => {
    try {
      console.log('🗑️ 開始清除所有資料...');
      await dbManager.clearAllData();
      
      // 清除後重新初始化統計
      setDbStats({
        totalRecords: 0,
        totalCities: 0,
        lastUpdate: null,
        isLoaded: false
      });
      
      setQueryResults([]);
      setCurrentStats({ count: 0, avgPrice: 0, avgUnitPrice: 0, avgArea: 0 });
      
      console.log('✅ 資料已清除完成');
    } catch (error) {
      console.error('❌ 清除資料失敗:', error);
      
      // 如果清除失敗，嘗試重新初始化整個資料庫
      try {
        console.log('🔄 嘗試重新初始化資料庫...');
        await dbManager.close();
        await dbManager.init();
        console.log('✅ 資料庫重新初始化完成');
      } catch (reinitError) {
        console.error('❌ 重新初始化失敗:', reinitError);
      }
    }
  };

  // 查詢資料
  const queryData = async (filter = {}, limit = 100) => {
    try {
      const results = await dbManager.queryData(filter, limit);
      setQueryResults(results);
      console.log(`查詢結果: ${results.length} 筆`);
      
      // 計算查詢結果的統計
      if (results.length > 0) {
        const totalPrice = results.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        const totalUnitPrice = results.reduce((sum, item) => sum + (item.unitPrice || 0), 0);
        const totalArea = results.reduce((sum, item) => sum + (item.area || 0), 0);
        
        setCurrentStats({
          count: results.length,
          avgPrice: Math.round(totalPrice / results.length),
          avgUnitPrice: Math.round(totalUnitPrice / results.length),
          avgArea: Math.round(totalArea / results.length)
        });
      }
    } catch (error) {
      console.error('查詢資料失敗:', error);
    }
  };

  // 表格欄位定義
  const columns = [
    {
      title: '城市',
      dataIndex: 'cityName', // 改為顯示中文城市名稱
      key: 'cityName',
      width: 80,
    },
    {
      title: '區域',
      dataIndex: 'district',
      key: 'district',
      width: 100,
    },
    {
      title: '建案',
      dataIndex: 'project',
      key: 'project',
      width: 150,
    },
    {
      title: '房型',
      dataIndex: 'roomType',
      key: 'roomType',
      width: 100,
    },
    {
      title: '面積(坪)',
      dataIndex: 'area',
      key: 'area',
      width: 80,
      render: (value) => value > 0 ? `${value.toFixed(1)}坪` : '-',
    },
    {
      title: '總價(萬)',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 100,
      render: (value) => value > 0 ? `${(value / 10000).toFixed(0)}萬` : '-',
    },
    {
      title: '單價(萬/坪)',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      render: (value) => value > 0 ? `${(value / 10000).toFixed(1)}萬/坪` : '-',
    },
    {
      title: '交易日期',
      dataIndex: 'transactionDate',
      key: 'transactionDate',
      width: 100,
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      {/* 標題 */}
      <Card style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#1890ff' }}>
          <DatabaseOutlined /> 資料庫狀態
        </h2>
      </Card>

      {/* 資料庫狀態 */}
      <Row gutter={16} style={{ marginBottom: '20px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="資料庫狀態"
              value={dbStats.isLoaded ? "已載入" : "未載入"}
              prefix={dbStats.isLoaded ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : null}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="資料筆數" value={dbStats.totalRecords.toLocaleString()} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="城市數" value={dbStats.totalCities} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="最後更新" value={dbStats.lastUpdate || '2025/8/15'} />
          </Card>
        </Col>
      </Row>

      {/* 資料載入選項 */}
      <Card title="資料載入選項" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button 
            type="primary" 
            icon={<UploadOutlined />}
            onClick={loadFromDefaultFiles}
            loading={isLoading}
            size="large"
            block
          >
            從預設檔案載入
          </Button>
          
          <Button 
            icon={<UploadOutlined />}
            disabled
            size="large"
            block
          >
            上傳自訂 JSON 檔案
          </Button>
          
          <Button 
            danger
            icon={<DeleteOutlined />}
            onClick={clearAllData}
            block
          >
            清除所有資料
          </Button>
        </Space>

        {/* 載入進度 */}
        {isLoading && (
          <div style={{ marginTop: '20px' }}>
            <Progress percent={Math.round(progress)} status="active" />
            <p style={{ marginTop: '10px', color: '#666' }}>{loadingStatus}</p>
          </div>
        )}
      </Card>

      {/* 資料統計 */}
      <Card title="資料統計" style={{ marginBottom: '20px' }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="資料筆數" value={currentStats.count} />
          </Col>
          <Col span={6}>
            <Statistic 
              title="平均總價" 
              value={currentStats.avgPrice > 0 ? `${Math.round(currentStats.avgPrice / 10000)}萬` : '0萬'} 
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="平均單價" 
              value={currentStats.avgUnitPrice > 0 ? `${Math.round(currentStats.avgUnitPrice / 10000)}萬/坪` : '0萬/坪'} 
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="平均面積" 
              value={currentStats.avgArea > 0 ? `${currentStats.avgArea}坪` : '0坪'} 
            />
          </Col>
        </Row>
      </Card>

      {/* 測試功能 */}
      <Card title="測試功能" style={{ marginBottom: '20px' }}>
        <Space>
          <Button 
            icon={<SearchOutlined />} 
            onClick={() => queryData({}, 100)}
            type="primary"
          >
            查詢前 100 筆
          </Button>
          <Button 
            onClick={() => queryData({ city: 'taipei' }, 100)}
          >
            篩選台北市
          </Button>
          <Button 
            onClick={() => queryData({ city: 'newtaipei' }, 100)}
          >
            篩選新北市
          </Button>
          <Button 
            onClick={() => queryData({ city: 'taichung' }, 100)}
          >
            測試台中市
          </Button>
          <Button 
            onClick={() => setQueryResults([])}
            type="dashed"
          >
            清除顯示
          </Button>
        </Space>
      </Card>

      {/* 資料預覽 */}
      {queryResults.length > 0 && (
        <Card title={`資料預覽 (${queryResults.length} 筆)`}>
          <Table
            columns={columns}
            dataSource={queryResults.map(item => ({ ...item, key: item.id }))}
            scroll={{ x: 800, y: 400 }}
            size="small"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 筆，共 ${total} 筆`
            }}
          />
        </Card>
      )}
    </div>
  );
};

export default DataImporter;