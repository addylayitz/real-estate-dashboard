// src/components/filters/FilterPanel.jsx - 強制水平佈局版本
import { Card, Select, DatePicker, InputNumber, Button, Space, Tag, message } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { useStore } from '../../store/useStore';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const FilterPanel = () => {
  const { 
    filters, 
    options, 
    filteredData,
    allData,
    setFilters, 
    clearFilters,
    dataLoaded 
  } = useStore();

  // 修正：確保初始狀態正確，支援陣列格式
  const [localFilters, setLocalFilters] = useState(() => ({
    city: '',
    district: [], // 改為陣列支援複選
    project: '',
    roomType: [], // 改為陣列支援複選
    startDate: '',
    endDate: '',
    minPrice: '',
    maxPrice: '',
    ...filters // 合併外部 filters
  }));

  // 同步外部 filters 到本地狀態
  useEffect(() => {
    console.log('[FilterPanel] 外部 filters 變更:', filters);
    setLocalFilters(prev => ({
      ...prev,
      ...filters,
      // 確保陣列格式
      district: Array.isArray(filters.district) ? filters.district : (filters.district ? [filters.district] : []),
      roomType: Array.isArray(filters.roomType) ? filters.roomType : (filters.roomType ? [filters.roomType] : [])
    }));
  }, [filters]);

  // 處理篩選條件變更 - 修正：立即更新本地狀態
  const handleFilterChange = (key, value) => {
    console.log(`[FilterPanel] 變更 ${key}:`, value);
    
    // 複選欄位的數量限制檢查
    if ((key === 'district' || key === 'roomType') && Array.isArray(value) && value.length > 3) {
      message.warning(`${key === 'district' ? '區域' : '房型'}最多只能選擇 3 項`);
      return;
    }
    
    setLocalFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      console.log('[FilterPanel] 新的 localFilters:', newFilters);
      return newFilters;
    });
  };

  // 應用篩選條件
  const handleApplyFilters = () => {
    console.log('[FilterPanel] 應用篩選條件:', localFilters);
    // 轉換陣列為字串格式以相容現有系統
    const adaptedFilters = {
      ...localFilters,
      // 如果是陣列且有值，轉為逗號分隔的字串；否則保持空字串
      district: Array.isArray(localFilters.district) && localFilters.district.length > 0 
        ? localFilters.district.join(',') 
        : '',
      roomType: Array.isArray(localFilters.roomType) && localFilters.roomType.length > 0 
        ? localFilters.roomType.join(',') 
        : ''
    };
    setFilters(adaptedFilters);
  };

  // 清除篩選條件
  const handleClearFilters = () => {
    console.log('[FilterPanel] 清除篩選條件');
    const defaultFilters = {
      city: '',
      district: [],
      project: '',
      roomType: [],
      startDate: '',
      endDate: '',
      minPrice: '',
      maxPrice: ''
    };
    setLocalFilters(defaultFilters);
    clearFilters();
  };

  // 安全的字串排序函數
  const safeStringSort = (a, b) => {
    const strA = String(a || '');
    const strB = String(b || '');
    return strA.localeCompare(strB, 'zh-TW');
  };

  // 取得區域選項（根據選中的城市）
  const getDistrictOptions = () => {
    console.log('[FilterPanel] getDistrictOptions 被呼叫:', {
      selectedCity: localFilters.city,
      hasAllData: !!allData,
      allDataLength: allData?.length
    });

    if (!localFilters.city || !allData) {
      console.log('[FilterPanel] 無法取得區域選項:', { 
        city: localFilters.city, 
        hasData: !!allData,
        reason: !localFilters.city ? '沒有選擇城市' : '沒有資料'
      });
      return [];
    }
    
    // 檢查資料中實際的城市 ID
    const availableCities = [...new Set(allData.map(item => item.city))];
    console.log('[FilterPanel] 資料中可用的城市 ID:', availableCities.slice(0, 10));
    console.log('[FilterPanel] 選擇的城市 ID:', localFilters.city);
    
    const cityData = allData.filter(item => item.city === localFilters.city);
    console.log('[FilterPanel] 該城市資料筆數:', cityData.length);
    
    if (cityData.length === 0) {
      console.warn('[FilterPanel] 找不到該城市的資料，可能城市 ID 不符');
      return [];
    }
    
    const districts = [...new Set(cityData.map(item => item.district).filter(item => item && String(item).trim()))];
    console.log('[FilterPanel] 該城市區域:', districts.slice(0, 10));
    
    return districts.sort(safeStringSort).slice(0, 50);
  };

  // 取得建案選項（根據選中的城市和區域）
  const getProjectOptions = () => {
    if (!allData) return [];
    
    let projectData = allData;
    
    if (localFilters.city) {
      projectData = projectData.filter(item => item.city === localFilters.city);
    }
    
    if (localFilters.district && localFilters.district.length > 0) {
      projectData = projectData.filter(item => localFilters.district.includes(item.district));
    }
    
    const projects = [...new Set(projectData.map(item => item.project).filter(item => item && String(item).trim()))];
    return projects.sort(safeStringSort).slice(0, 100);
  };

  // 取得房型選項（根據選中的城市）
  const getRoomTypeOptions = () => {
    if (!allData) return options.roomTypes || [];
    
    let roomTypeData = allData;
    
    if (localFilters.city) {
      roomTypeData = roomTypeData.filter(item => item.city === localFilters.city);
    }
    
    const roomTypes = [...new Set(roomTypeData.map(item => item.roomType).filter(item => item && String(item).trim()))];
    return roomTypes.sort(safeStringSort).slice(0, 20);
  };

  // 除錯：顯示目前狀態
  console.log('[FilterPanel] 目前狀態:', {
    localFilters,
    externalFilters: filters,
    hasOptions: !!options.cities,
    optionsCount: options.cities?.length
  });

  return (
    <Card title="篩選條件" className="mb-6">
      {/* 強制內聯樣式確保水平佈局 */}
      <div style={{ display: 'block' }}>
        {/* 第一行：所有篩選欄位 */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '12px', 
          alignItems: 'flex-end',
          marginBottom: '16px'
        }}>
          {/* 縣市選擇 */}
          <div style={{ minWidth: '140px', flexShrink: 0 }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '4px' 
            }}>
              縣市
            </label>
            <Select
              placeholder="選擇縣市"
              style={{ width: '140px' }}
              value={localFilters.city || undefined}
              onChange={(value) => {
                console.log('[FilterPanel] 選擇城市原始值:', value);
                console.log('[FilterPanel] 選擇城市類型:', typeof value);
                handleFilterChange('city', value || '');
                // 清除下級選項
                handleFilterChange('district', []);
                handleFilterChange('project', '');
              }}
              showSearch
              optionFilterProp="children"
              disabled={!dataLoaded}
              allowClear
            >
              {(options.cities || []).map(city => (
                <Option key={city.value} value={city.value}>
                  {city.label}
                </Option>
              ))}
            </Select>
          </div>

          {/* 區域選擇 - 複選版本 */}
          <div style={{ minWidth: '160px', flexShrink: 0 }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '4px' 
            }}>
              區域 ({localFilters.district?.length || 0}/3)
            </label>
            <Select
              mode="multiple"
              placeholder="選擇區域"
              style={{ width: '160px' }}
              value={localFilters.district || []}
              onChange={(value) => {
                console.log('[FilterPanel] 選擇區域:', value);
                handleFilterChange('district', value || []);
                // 清除下級選項
                handleFilterChange('project', '');
              }}
              showSearch
              optionFilterProp="children"
              disabled={!dataLoaded || !localFilters.city}
              allowClear
              maxTagCount={1}
              maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
            >
              {getDistrictOptions().map(district => (
                <Option key={district} value={district}>
                  {district}
                </Option>
              ))}
            </Select>
          </div>

          {/* 建案選擇 */}
          <div style={{ minWidth: '140px', flexShrink: 0 }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '4px' 
            }}>
              建案
            </label>
            <Select
              placeholder="選擇建案"
              style={{ width: '140px' }}
              value={localFilters.project || undefined}
              onChange={(value) => {
                console.log('[FilterPanel] 選擇建案:', value);
                handleFilterChange('project', value || '');
              }}
              showSearch
              optionFilterProp="children"
              disabled={!dataLoaded}
              allowClear
            >
              {getProjectOptions().map(project => (
                <Option key={project} value={project}>
                  {project}
                </Option>
              ))}
            </Select>
          </div>

          {/* 房型選擇 - 複選版本 */}
          <div style={{ minWidth: '140px', flexShrink: 0 }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '4px' 
            }}>
              房型 ({localFilters.roomType?.length || 0}/3)
            </label>
            <Select
              mode="multiple"
              placeholder="選擇房型"
              style={{ width: '140px' }}
              value={localFilters.roomType || []}
              onChange={(value) => {
                console.log('[FilterPanel] 選擇房型:', value);
                handleFilterChange('roomType', value || []);
              }}
              showSearch
              optionFilterProp="children"
              disabled={!dataLoaded}
              allowClear
              maxTagCount={1}
              maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
            >
              {getRoomTypeOptions().map(roomType => (
                <Option key={roomType} value={roomType}>
                  {roomType}
                </Option>
              ))}
            </Select>
          </div>
        </div>

        {/* 第二行：日期、價格和按鈕 */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '12px', 
          alignItems: 'flex-end',
          marginBottom: '16px'
        }}>
          {/* 交易日期 */}
          <div style={{ minWidth: '260px', flexShrink: 0 }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '4px' 
            }}>
              交易日期
            </label>
            <RangePicker
              style={{ width: '260px' }}
              value={[
                localFilters.startDate ? dayjs(localFilters.startDate) : null,
                localFilters.endDate ? dayjs(localFilters.endDate) : null
              ]}
              onChange={(dates) => {
                if (dates) {
                  handleFilterChange('startDate', dates[0]?.format('YYYY-MM-DD') || '');
                  handleFilterChange('endDate', dates[1]?.format('YYYY-MM-DD') || '');
                } else {
                  handleFilterChange('startDate', '');
                  handleFilterChange('endDate', '');
                }
              }}
              disabled={!dataLoaded}
              placeholder={['開始日期', '結束日期']}
            />
          </div>

          {/* 最低價格 */}
          <div style={{ minWidth: '120px', flexShrink: 0 }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '4px' 
            }}>
              最低價格 (萬)
            </label>
            <InputNumber
              placeholder="最低價格"
              style={{ width: '120px' }}
              value={localFilters.minPrice || undefined}
              onChange={(value) => handleFilterChange('minPrice', value)}
              min={0}
              disabled={!dataLoaded}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </div>

          {/* 最高價格 */}
          <div style={{ minWidth: '120px', flexShrink: 0 }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '4px' 
            }}>
              最高價格 (萬)
            </label>
            <InputNumber
              placeholder="最高價格"
              style={{ width: '120px' }}
              value={localFilters.maxPrice || undefined}
              onChange={(value) => handleFilterChange('maxPrice', value)}
              min={0}
              disabled={!dataLoaded}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </div>

          {/* 操作按鈕 */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <Button
              icon={<SearchOutlined />}
              type="primary"
              onClick={handleApplyFilters}
              disabled={!dataLoaded}
            >
              查詢分析
            </Button>
            <Button
              icon={<ClearOutlined />}
              onClick={handleClearFilters}
              disabled={!dataLoaded}
            >
              清除條件
            </Button>
          </div>
        </div>

        {/* 已選擇的複選項目顯示 */}
        {(localFilters.district?.length > 0 || localFilters.roomType?.length > 0) && (
          <div style={{ 
            marginBottom: '16px', 
            padding: '12px', 
            backgroundColor: '#EBF8FF', 
            borderRadius: '8px', 
            border: '1px solid #BEE3F8' 
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '8px' 
            }}>
              已選擇的條件：
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {localFilters.district?.map(district => (
                <Tag 
                  key={district} 
                  color="blue" 
                  closable 
                  onClose={() => {
                    const newDistricts = localFilters.district.filter(d => d !== district);
                    handleFilterChange('district', newDistricts);
                  }}
                >
                  📍 {district}
                </Tag>
              ))}
              {localFilters.roomType?.map(roomType => (
                <Tag 
                  key={roomType} 
                  color="green" 
                  closable 
                  onClose={() => {
                    const newRoomTypes = localFilters.roomType.filter(rt => rt !== roomType);
                    handleFilterChange('roomType', newRoomTypes);
                  }}
                >
                  🏠 {roomType}
                </Tag>
              ))}
            </div>
          </div>
        )}

        {/* 操作結果和狀態 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {filteredData && filteredData.length > 0 && (
              <Tag color="blue" className="text-sm">
                📊 找到 {filteredData.length.toLocaleString()} 筆交易資料
              </Tag>
            )}
            {dataLoaded && (!filteredData || filteredData.length === 0) && (
              <Tag color="orange" className="text-sm">
                🔍 請設定篩選條件
              </Tag>
            )}
          </div>
        </div>

        {/* 強化的除錯資訊 */}
        <div style={{ 
          marginTop: '16px', 
          fontSize: '12px', 
          color: '#6B7280', 
          backgroundColor: '#F9FAFB', 
          padding: '8px', 
          borderRadius: '4px' 
        }}>
          <div>除錯資訊:</div>
          <div>• 選中城市: '{localFilters.city}' (長度: {localFilters.city?.length || 0})</div>
          <div>• 選中區域: {JSON.stringify(localFilters.district)} (數量: {localFilters.district?.length || 0})</div>
          <div>• 選中房型: {JSON.stringify(localFilters.roomType)} (數量: {localFilters.roomType?.length || 0})</div>
          <div>• 可用區域數: {getDistrictOptions().length}</div>
          <div>• 可用建案數: {getProjectOptions().length}</div>
          <div>• 總資料筆數: {allData?.length || 0}</div>
          <div>• 城市選項數: {options.cities?.length || 0}</div>
        </div>
      </div>
    </Card>
  );
};

export default FilterPanel;