// src/components/charts/TaiwanMapVisualization.jsx - 台灣地圖視覺化（動態統計版）
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Card, Spin, Select, Radio, message } from 'antd';
import { useStore } from '../../store/useStore';

const { Option } = Select;

const TaiwanMapVisualization = () => {
  const { allData, filteredData, setFilters, filters, loading } = useStore();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const [mapStyle, setMapStyle] = useState('heatmap');
  const [dataMetric, setDataMetric] = useState('volume');
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [leafletReady, setLeafletReady] = useState(false);

  // 台灣主要城市座標資料
  const cityCoordinates = {
    'taipei': { lat: 25.0330, lng: 121.5654, name: '台北市' },
    'newtaipei': { lat: 25.0173, lng: 121.4467, name: '新北市' },
    'taoyuan': { lat: 24.9936, lng: 121.3010, name: '桃園市' },
    'taichung': { lat: 24.1477, lng: 120.6736, name: '台中市' },
    'tainan': { lat: 22.9997, lng: 120.2270, name: '台南市' },
    'kaohsiung': { lat: 22.6273, lng: 120.3014, name: '高雄市' },
    'keelung': { lat: 25.1276, lng: 121.7391, name: '基隆市' },
    'hsinchu': { lat: 24.8138, lng: 120.9675, name: '新竹市' },
    'chiayi': { lat: 23.4801, lng: 120.4491, name: '嘉義市' },
    'hsinchu-county': { lat: 24.7006, lng: 121.1017, name: '新竹縣' },
    'miaoli': { lat: 24.4887, lng: 120.7654, name: '苗栗縣' },
    'changhua': { lat: 24.0518, lng: 120.5161, name: '彰化縣' },
    'nantou': { lat: 23.9609, lng: 120.9718, name: '南投縣' },
    'yunlin': { lat: 23.7092, lng: 120.4313, name: '雲林縣' },
    'chiayi-county': { lat: 23.4518, lng: 120.2554, name: '嘉義縣' },
    'pingtung': { lat: 22.5519, lng: 120.5487, name: '屏東縣' },
    'yilan': { lat: 24.7021, lng: 121.7378, name: '宜蘭縣' },
    'hualien': { lat: 23.9871, lng: 121.6015, name: '花蓮縣' },
    'taitung': { lat: 22.7972, lng: 121.1713, name: '台東縣' },
    'penghu': { lat: 23.5712, lng: 119.5789, name: '澎湖縣' },
    'kinmen': { lat: 24.4494, lng: 118.3773, name: '金門縣' },
    'lienchiang': { lat: 26.1972, lng: 119.9408, name: '連江縣' }
  };

  // 計算地圖數據（用於地圖顯示，使用 allData）
  const mapData = useMemo(() => {
    if (!allData || allData.length === 0) return [];
    
    const cityStats = {};
    
    allData.forEach(item => {
      if (!item.city || !item.totalPrice || item.totalPrice <= 0) return;
      
      const cityKey = item.city;
      
      if (!cityStats[cityKey]) {
        cityStats[cityKey] = {
          cityKey,
          transactions: [],
          totalVolume: 0,
          totalSales: 0
        };
      }
      
      cityStats[cityKey].transactions.push({
        price: item.totalPrice,
        unitPrice: item.unitPrice || 0,
        area: item.area || 0
      });
      cityStats[cityKey].totalVolume++;
      cityStats[cityKey].totalSales += item.totalPrice;
    });

    const mapDataArray = Object.values(cityStats)
      .filter(city => cityCoordinates[city.cityKey])
      .map(city => {
        const coords = cityCoordinates[city.cityKey];
        const avgPrice = city.transactions.length > 0
          ? city.transactions.reduce((sum, t) => sum + t.price, 0) / city.transactions.length
          : 0;
        const avgUnitPrice = city.transactions.length > 0
          ? city.transactions.reduce((sum, t) => sum + t.unitPrice, 0) / city.transactions.length
          : 0;

        return {
          cityKey: city.cityKey,
          cityName: coords.name,
          lat: coords.lat,
          lng: coords.lng,
          volume: city.totalVolume,
          avgPrice: Math.round(avgPrice / 10000),
          avgUnitPrice: Math.round(avgUnitPrice / 10000),
          totalSales: Math.round(city.totalSales / 10000),
          isFiltered: filters.city === city.cityKey
        };
      })
      .sort((a, b) => b.volume - a.volume);

    return mapDataArray;
  }, [allData, filters.city]);

  // 🎯 新增：計算統計數據（基於 filteredData，跟隨篩選變化）
  const statistics = useMemo(() => {
    // 如果沒有篩選數據，使用全部數據
    const dataToUse = (filteredData && filteredData.length > 0) ? filteredData : allData;
    
    if (!dataToUse || dataToUse.length === 0) return null;

    // 計算城市統計
    const cityStats = {};
    dataToUse.forEach(item => {
      if (!item.city || !item.totalPrice || item.totalPrice <= 0) return;
      
      const cityKey = item.city;
      if (!cityStats[cityKey]) {
        cityStats[cityKey] = {
          cityKey,
          cityName: cityCoordinates[cityKey]?.name || cityKey,
          volume: 0,
          totalSales: 0
        };
      }
      cityStats[cityKey].volume++;
      cityStats[cityKey].totalSales += item.totalPrice;
    });

    const cities = Object.values(cityStats);
    const totalVolume = cities.reduce((sum, city) => sum + city.volume, 0);
    const totalSales = cities.reduce((sum, city) => sum + city.totalSales, 0);
    const maxVolumeCity = cities.length > 0 
      ? cities.reduce((max, city) => city.volume > max.volume ? city : max, cities[0])
      : null;

    return {
      cityCount: cities.length,
      totalVolume,
      totalSales: Math.round(totalSales / 10000),
      maxVolumeCity
    };
  }, [filteredData, allData]);

  // 簡化的 Leaflet 載入
  const ensureLeafletLoaded = () => {
    return new Promise((resolve) => {
      if (window.L) {
        setLeafletReady(true);
        resolve(true);
        return;
      }

      if (document.querySelector('script[src*="leaflet"]')) {
        const checkInterval = setInterval(() => {
          if (window.L) {
            clearInterval(checkInterval);
            setLeafletReady(true);
            resolve(true);
          }
        }, 100);
        return;
      }

      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        setLeafletReady(true);
        resolve(true);
      };
      script.onerror = () => {
        console.error('Leaflet 載入失敗');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  };

  // 簡化的地圖初始化
  const initMap = async () => {
    if (!mapRef.current) return;

    if (mapInstance.current) {
      try {
        mapInstance.current.remove();
      } catch (e) {
        console.warn('清理地圖錯誤:', e);
      }
      mapInstance.current = null;
    }

    try {
      const loaded = await ensureLeafletLoaded();
      if (!loaded || !window.L) {
        throw new Error('Leaflet 載入失敗');
      }

      const container = mapRef.current;
      
      if (container._leaflet_id) {
        delete container._leaflet_id;
      }
      container.innerHTML = '';

      const map = window.L.map(container, {
        center: [23.8, 121.0],
        zoom: 7,
        zoomControl: true,
        attributionControl: true
      });

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      mapInstance.current = map;
      setIsMapLoading(false);

    } catch (error) {
      console.error('[TaiwanMap] 初始化失敗:', error);
      setIsMapLoading(false);
      message.error('地圖載入失敗');
    }
  };

  // 手動重試
  const handleRetry = () => {
    setIsMapLoading(true);
    setLeafletReady(false);
    
    if (mapInstance.current) {
      try {
        mapInstance.current.remove();
      } catch (e) {
        // 忽略錯誤
      }
      mapInstance.current = null;
    }

    setTimeout(initMap, 500);
  };

  // 載入地圖
  useEffect(() => {
    let mounted = true;
    
    const loadMap = async () => {
      if (!mounted) return;
      await initMap();
    };

    loadMap();

    return () => {
      mounted = false;
      if (mapInstance.current) {
        try {
          mapInstance.current.remove();
        } catch (e) {
          // 忽略清理錯誤
        }
        mapInstance.current = null;
      }
    };
  }, []);

  // 更新地圖標記
  useEffect(() => {
    if (!mapInstance.current || !window.L || mapData.length === 0 || isMapLoading) {
      return;
    }

    const L = window.L;
    const map = mapInstance.current;

    markersRef.current.forEach(marker => {
      try {
        map.removeLayer(marker);
      } catch (e) {
        // 忽略移除錯誤
      }
    });
    markersRef.current = [];

    const values = mapData.map(city => {
      switch (dataMetric) {
        case 'volume': return city.volume;
        case 'avgPrice': return city.avgPrice;
        case 'totalSales': return city.totalSales;
        default: return city.volume;
      }
    });
    
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);

    mapData.forEach(city => {
      let value;
      
      switch (dataMetric) {
        case 'volume':
          value = city.volume;
          break;
        case 'avgPrice':
          value = city.avgPrice;
          break;
        case 'totalSales':
          value = city.totalSales;
          break;
        default:
          value = city.volume;
      }

      const colorIntensity = maxValue > minValue ? (value - minValue) / (maxValue - minValue) : 0;
      const size = Math.max(10, Math.min(30, 10 + colorIntensity * 20));

      let marker;
      
      if (mapStyle === 'heatmap' || mapStyle === 'bubble') {
        const color = city.isFiltered ? '#ff4d4f' : `hsl(${(1 - colorIntensity) * 240}, 70%, 50%)`;
        
        marker = L.circleMarker([city.lat, city.lng], {
          radius: mapStyle === 'bubble' ? size : 10,
          fillColor: color,
          color: color,
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.6
        });
      } else {
        const iconColor = city.isFiltered ? '#ff4d4f' : 
          colorIntensity > 0.7 ? '#d32f2f' :
          colorIntensity > 0.4 ? '#ff9800' : '#4caf50';
          
        marker = L.marker([city.lat, city.lng], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div style="
              background-color: ${iconColor}; 
              width: ${size}px; 
              height: ${size}px; 
              border-radius: 50%; 
              border: 2px solid white;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 10px;
              font-weight: bold;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">${value >= 1000 ? Math.round(value/1000) + 'K' : value}</div>`,
            iconSize: [size, size],
            iconAnchor: [size/2, size/2]
          })
        });
      }

      marker.bindTooltip(`
        <div style="text-align: center; font-size: 12px;">
          <strong>${city.cityName}</strong><br/>
          交易量: ${city.volume.toLocaleString()} 筆<br/>
          平均總價: ${city.avgPrice.toLocaleString()} 萬<br/>
          總銷售額: ${city.totalSales.toLocaleString()} 萬<br/>
          <small>點擊選擇此地區</small>
        </div>
      `);

      marker.on('click', () => {
        setFilters({
          ...filters,
          city: city.cityKey,
          district: '',
          project: ''
        });
        message.success(`已選擇 ${city.cityName}`);
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });

  }, [mapData, mapStyle, dataMetric, filters, setFilters, isMapLoading]);

  if (loading) {
    return (
      <Card title="台灣地圖視覺化" className="h-full">
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Card title="台灣地圖視覺化" className="h-full">
      <div className="space-y-4">
        {/* 控制面板 */}
        <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-sm font-medium text-gray-700 mr-2">顯示方式：</span>
              <Radio.Group value={mapStyle} onChange={(e) => setMapStyle(e.target.value)}>
                <Radio.Button value="heatmap">熱力圓點</Radio.Button>
                <Radio.Button value="bubble">氣泡大小</Radio.Button>
                <Radio.Button value="choropleth">標記圖示</Radio.Button>
              </Radio.Group>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-700 mr-2">數據指標：</span>
              <Select
                value={dataMetric}
                onChange={setDataMetric}
                style={{ width: 120 }}
              >
                <Option value="volume">交易量</Option>
                <Option value="avgPrice">平均總價</Option>
                <Option value="totalSales">總銷售額</Option>
              </Select>
            </div>
          </div>

          <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded">
            💡 點擊地圖上的城市可進行篩選
          </div>
        </div>

        {/* 🎯 動態統計卡片 - 會跟隨篩選結果變化 */}
        {statistics && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '20px'
          }}>
            {/* 卡片 1：覆蓋城市 */}
            <div
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                borderRadius: '12px',
                padding: '16px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.3s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-20%',
                width: '150px',
                height: '150px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                filter: 'blur(30px)'
              }} />
              
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                marginBottom: '12px',
                backdropFilter: 'blur(10px)'
              }}>
                📍
              </div>
              
              <div style={{
                fontSize: '12px',
                opacity: 0.9,
                marginBottom: '6px',
                fontWeight: '500'
              }}>
                覆蓋城市
              </div>
              
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                marginBottom: '2px',
                display: 'flex',
                alignItems: 'baseline',
                gap: '6px'
              }}>
                {statistics.cityCount}
                <span style={{ fontSize: '14px', opacity: 0.8 }}>個</span>
              </div>
              
              <div style={{
                fontSize: '11px',
                opacity: 0.8
              }}>
                {filteredData && filteredData.length > 0 ? '篩選結果' : '全台灣主要城市'}
              </div>
            </div>

            {/* 卡片 2：總交易量 */}
            <div
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '12px',
                padding: '16px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.3s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(16, 185, 129, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(16, 185, 129, 0.3)';
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-20%',
                width: '150px',
                height: '150px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                filter: 'blur(30px)'
              }} />
              
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                marginBottom: '12px',
                backdropFilter: 'blur(10px)'
              }}>
                📊
              </div>
              
              <div style={{
                fontSize: '12px',
                opacity: 0.9,
                marginBottom: '6px',
                fontWeight: '500'
              }}>
                總交易量
              </div>
              
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                marginBottom: '2px',
                display: 'flex',
                alignItems: 'baseline',
                gap: '6px'
              }}>
                {statistics.totalVolume.toLocaleString()}
                <span style={{ fontSize: '14px', opacity: 0.8 }}>筆</span>
              </div>
              
              <div style={{
                fontSize: '11px',
                opacity: 0.8
              }}>
                預售屋交易記錄
              </div>
            </div>

            {/* 卡片 3：總銷售額 */}
            <div
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: '12px',
                padding: '16px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.3)',
                transition: 'all 0.3s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(245, 158, 11, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(245, 158, 11, 0.3)';
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-20%',
                width: '150px',
                height: '150px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                filter: 'blur(30px)'
              }} />
              
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                marginBottom: '12px',
                backdropFilter: 'blur(10px)'
              }}>
                💰
              </div>
              
              <div style={{
                fontSize: '12px',
                opacity: 0.9,
                marginBottom: '6px',
                fontWeight: '500'
              }}>
                總銷售額
              </div>
              
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                marginBottom: '2px',
                display: 'flex',
                alignItems: 'baseline',
                gap: '6px'
              }}>
                {(statistics.totalSales / 10000).toFixed(1)}
                <span style={{ fontSize: '14px', opacity: 0.8 }}>億萬</span>
              </div>
              
              <div style={{
                fontSize: '11px',
                opacity: 0.8
              }}>
                累計交易金額
              </div>
            </div>

            {/* 卡片 4：交易最熱城市 */}
            <div
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '12px',
                padding: '16px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)',
                transition: 'all 0.3s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(139, 92, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(139, 92, 246, 0.3)';
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-20%',
                width: '150px',
                height: '150px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                filter: 'blur(30px)'
              }} />
              
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                marginBottom: '12px',
                backdropFilter: 'blur(10px)'
              }}>
                🏆
              </div>
              
              <div style={{
                fontSize: '12px',
                opacity: 0.9,
                marginBottom: '6px',
                fontWeight: '500'
              }}>
                交易最熱城市
              </div>
              
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                marginBottom: '2px',
                display: 'flex',
                alignItems: 'baseline',
                gap: '6px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {statistics.maxVolumeCity ? statistics.maxVolumeCity.cityName : '無'}
              </div>
              
              <div style={{
                fontSize: '11px',
                opacity: 0.8
              }}>
                {statistics.maxVolumeCity ? `${statistics.maxVolumeCity.volume.toLocaleString()} 筆交易` : '暫無數據'}
              </div>
            </div>
          </div>
        )}

        {/* 地圖容器 */}
        <div className="relative">
          <div 
            ref={mapRef} 
            style={{ 
              height: '500px', 
              width: '100%',
              borderRadius: '8px',
              backgroundColor: '#f0f0f0'
            }}
            className="border border-gray-300"
          />
          
          {/* 載入指示器 */}
          {isMapLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90 rounded-lg">
              <div className="text-center">
                <Spin size="large" />
                <div className="mt-2 text-gray-500">
                  {!leafletReady ? '載入地圖資源中...' : '地圖初始化中...'}
                </div>
                <button 
                  onClick={handleRetry}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  重試
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 說明文字 */}
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
          <div className="font-medium mb-1">使用說明：</div>
          <ul className="list-disc list-inside space-y-1">
            <li>地圖顯示全台各城市的房地產交易數據</li>
            <li>顏色深淺和圓點大小代表數據強度（紅色表示當前選中的城市）</li>
            <li>滑鼠懸停可查看詳細資訊，點擊可篩選該城市</li>
            <li>統計卡片會根據篩選條件自動更新數據</li>
          </ul>
        </div>
      </div>

      <style jsx global>{`
        .leaflet-container {
          height: 500px !important;
          width: 100% !important;
          background: #f0f0f0;
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-tooltip {
          background: rgba(0, 0, 0, 0.8) !important;
          color: white !important;
          border: none !important;
          border-radius: 4px !important;
        }
      `}</style>
    </Card>
  );
};

export default TaiwanMapVisualization;