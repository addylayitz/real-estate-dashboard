// src/components/DataLoader.jsx - 修正版本
import { Modal, Button, Progress, Alert, Space } from 'antd';
import { DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { IndexedDBManager } from '../services/IndexedDBManager';

const DataLoader = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  
  const { clearAllData, loadData } = useStore();

  const handleLoadData = async () => {
    setLoading(true);
    setProgress(0);
    setStatus('初始化載入程序...');
    setError('');

    try {
      // 初始化資料庫管理器
      const dbManager = new IndexedDBManager();
      await dbManager.init();
      
      // 建立 Worker
      const worker = new Worker(`${import.meta.env.BASE_URL}dataWorker_v2.js`);
      
      worker.onmessage = async (e) => {
        const { type, data, error: workerError } = e.data;
        
        try {
          switch (type) {
            case 'progress':
              setProgress(data.progress);
              setStatus(data.status);
              break;
              
            case 'cityComplete':
              setStatus(`${data.cityName} 載入完成 (${data.count} 筆)`);
              
              // 將資料寫入 IndexedDB
              if (data.data && data.data.length > 0) {
                console.log(`[DataLoader] 開始將 ${data.cityName} 的 ${data.data.length} 筆資料寫入資料庫`);
                await dbManager.addData(data.data);
                console.log(`[DataLoader] ${data.cityName} 資料寫入完成`);
              }
              break;
              
            case 'complete':
              setProgress(100);
              setStatus('資料載入完成！正在更新介面...');
              
              // 結束 Worker
              worker.terminate();
              
              // 重新載入 store 中的資料
              setTimeout(async () => {
                try {
                  await loadData();
                  setStatus('介面更新完成！');
                  setLoading(false);
                  
                  // 1秒後關閉對話框
                  setTimeout(() => {
                    onClose();
                  }, 1000);
                } catch (loadError) {
                  console.error('重新載入資料失敗:', loadError);
                  setError(`介面更新失敗: ${loadError.message}`);
                  setLoading(false);
                }
              }, 500);
              break;
              
            case 'error':
              setError(workerError);
              setLoading(false);
              worker.terminate();
              break;
              
            default:
              console.warn('[DataLoader] 未知的訊息類型:', type);
          }
        } catch (messageError) {
          console.error('[DataLoader] 處理 Worker 訊息失敗:', messageError);
          setError(`處理載入訊息失敗: ${messageError.message}`);
          setLoading(false);
          worker.terminate();
        }
      };

      worker.onerror = (workerError) => {
        console.error('[DataLoader] Worker 錯誤:', workerError);
        setError('資料載入程序發生錯誤，請檢查 dataWorker_v2.js 檔案是否存在');
        setLoading(false);
        worker.terminate();
      };

      // 開始載入
      console.log('[DataLoader] 啟動 Worker 載入程序');
      worker.postMessage({ type: 'loadData' });

    } catch (error) {
      console.error('[DataLoader] 載入失敗:', error);
      setError(`載入失敗: ${error.message}`);
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    setLoading(true);
    setStatus('清除資料中...');
    setError('');
    
    try {
      await clearAllData();
      setStatus('資料清除完成');
      setProgress(0);
      setTimeout(() => {
        setLoading(false);
        setStatus('');
      }, 1000);
    } catch (error) {
      console.error('[DataLoader] 清除失敗:', error);
      setError(`清除失敗: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <Modal
      title="資料載入管理"
      open={visible}
      onCancel={() => {
        if (!loading) {
          onClose();
        }
      }}
      footer={[
        <Button 
          key="close" 
          onClick={onClose}
          disabled={loading}
        >
          {loading ? '載入中...' : '關閉'}
        </Button>
      ]}
      width={600}
      closable={!loading}
      maskClosable={!loading}
    >
      <div className="space-y-4">
        {/* 說明文字 */}
        <Alert
          message="首次使用需要載入預售屋資料。這個過程將載入約 16 萬筆資料到您的瀏覽器本地儲存。載入完成後即可離線使用分析功能。"
          type="info"
          showIcon
        />

        {/* 載入進度 */}
        {loading && (
          <div className="space-y-2">
            <Progress 
              percent={progress} 
              status={error ? 'exception' : 'active'}
              strokeColor={error ? '#ff4d4f' : '#1890ff'}
            />
            <div className="text-sm text-gray-600">{status}</div>
          </div>
        )}

        {/* 錯誤訊息 */}
        {error && (
          <Alert
            message="載入錯誤"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError('')}
          />
        )}

        {/* 操作按鈕 */}
        <div className="space-y-3">
          <div>
            <h4 className="font-medium mb-2">資料載入</h4>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleLoadData}
              loading={loading}
              size="large"
              block
            >
              {loading ? '載入中...' : '開始載入資料'}
            </Button>
          </div>

          <div>
            <h4 className="font-medium mb-2">資料管理</h4>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleClearData}
              loading={loading}
              block
              disabled={loading}
            >
              清除資料
            </Button>
          </div>
        </div>

        {/* 提示訊息 */}
        <div className="text-sm text-gray-500 space-y-1">
          <div>• 資料將儲存在瀏覽器本地，無需重複載入</div>
          <div>• 載入過程可以關閉瀏覽器，但建議完成後再關閉</div>
          <div>• 如需更新資料，請先清除舊資料再重新載入</div>
        </div>
      </div>
    </Modal>
  );
};

export default DataLoader;