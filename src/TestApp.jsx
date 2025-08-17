import React from 'react';
import { ConfigProvider } from 'antd';
import DataImporter from './components/DataImporter';

function TestApp() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f0f2f5',
        padding: '20px 0'
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto',
          padding: '0 20px'
        }}>
          <h1 style={{ 
            textAlign: 'center', 
            color: '#1890ff',
            marginBottom: '30px',
            fontSize: '32px'
          }}>
            📊 IndexedDB + Web Worker 測試
          </h1>
          
          <DataImporter />
        </div>
      </div>
    </ConfigProvider>
  );
}

export default TestApp;