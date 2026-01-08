// src/components/filters/FilterPanel.jsx - 篩選面板元件
import { Select, DatePicker, InputNumber, Button, Tag, message } from 'antd';
import { SearchOutlined, ClearOutlined, FilterOutlined } from '@ant-design/icons';
import { useStore } from '../../store/useStore';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { getUniqueValues } from '../../utils/dataHelpers';;

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

  const [localFilters, setLocalFilters] = useState(() => ({
    city: '',
    district: [],
    project: [],
    roomType: [],
    startDate: '',
    endDate: '',
    minPrice: '',
    maxPrice: '',
    ...filters
  }));

  // 同步外部 filters 到本地狀態
  useEffect(() => {
    setLocalFilters(prev => ({
      ...prev,
      ...filters,
      district: Array.isArray(filters.district) ? filters.district : (filters.district ? filters.district.split(',').filter(d => d.trim()) : []),
      project: Array.isArray(filters.project) ? filters.project : (filters.project ? filters.project.split(',').filter(p => p.trim()) : []),
      roomType: Array.isArray(filters.roomType) ? filters.roomType : (filters.roomType ? filters.roomType.split(',').filter(rt => rt.trim()) : [])
    }));
  }, [filters]);

  // 處理篩選條件變更
  const handleFilterChange = (key, value) => {
    if ((key === 'district' || key === 'roomType' || key === 'project') && Array.isArray(value) && value.length > 3) {
      const fieldName = key === 'district' ? '區域' : key === 'roomType' ? '房型' : '建案';
      message.warning(`${fieldName}最多只能選擇 3 項`);
      return;
    }
    
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  // 應用篩選條件
  const handleApplyFilters = () => {
    const adaptedFilters = {
      ...localFilters,
      district: Array.isArray(localFilters.district) && localFilters.district.length > 0 
        ? localFilters.district.join(',') 
        : '',
      project: Array.isArray(localFilters.project) && localFilters.project.length > 0 
        ? localFilters.project.join(',') 
        : '',
      roomType: Array.isArray(localFilters.roomType) && localFilters.roomType.length > 0 
        ? localFilters.roomType.join(',') 
        : ''
    };
    setFilters(adaptedFilters);
    message.success('篩選條件已應用');
  };

  // 清除篩選條件
  const handleClearFilters = () => {
    const defaultFilters = {
      city: '',
      district: [],
      project: [],
      roomType: [],
      startDate: '',
      endDate: '',
      minPrice: '',
      maxPrice: ''
    };
    setLocalFilters(defaultFilters);
    clearFilters();
    message.info('已清除所有篩選條件');
  };

  // 安全的字串排序函數
  const safeStringSort = (a, b) => {
    const strA = String(a || '');
    const strB = String(b || '');
    return strA.localeCompare(strB, 'zh-TW');
  };

  // 取得區域選項
  const getDistrictOptions = () => {
    if (!localFilters.city || !allData) return [];
    const cityData = allData.filter(item => item.city === localFilters.city);
    const districts = getUniqueValues(cityData, item => item.district, { limit: 50 });
    return districts.sort(safeStringSort);
  };

  // 取得建案選項
  const getProjectOptions = () => {
    if (!allData) return [];
    let projectData = allData;
    if (localFilters.city) {
      projectData = projectData.filter(item => item.city === localFilters.city);
    }
    if (localFilters.district && localFilters.district.length > 0) {
      projectData = projectData.filter(item => localFilters.district.includes(item.district));
    }
    const projects = getUniqueValues(projectData, item => item.project, { limit: 100 });
    return projects.sort(safeStringSort);
  };

  // 取得房型選項
  const getRoomTypeOptions = () => {
    if (!allData) return options.roomTypes || [];
    let roomTypeData = allData;
    if (localFilters.city) {
      roomTypeData = roomTypeData.filter(item => item.city === localFilters.city);
    }
    const roomTypes = getUniqueValues(roomTypeData, item => item.roomType, { limit: 20 });
    return roomTypes.sort(safeStringSort);
  };

  return (
    <div 
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '2px solid transparent',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#93c5fd';
        e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(59, 130, 246, 0.1), 0 10px 10px -5px rgba(59, 130, 246, 0.04)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'transparent';
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
      }}
    >
      {/* 標題區域 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '2px solid #f1f5f9'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '12px',
          color: 'white',
          fontSize: '20px'
        }}>
          <FilterOutlined />
        </div>
        <div>
          <h3 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1e293b' 
          }}>
            篩選條件
          </h3>
          <p style={{ 
            margin: '2px 0 0 0', 
            fontSize: '13px', 
            color: '#64748b' 
          }}>
            設定分析條件以精準查詢數據
          </p>
        </div>
      </div>

      {/* 第一排：主要篩選 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontSize: '13px',
          fontWeight: '600',
          color: '#475569',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          📍 主要篩選
        </div>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
        }}>
          {/* 縣市選擇 */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '500', 
              color: '#475569', 
              marginBottom: '6px' 
            }}>
              縣市
            </label>
            <Select
              placeholder="選擇縣市"
              style={{ width: '100%' }}
              value={localFilters.city || undefined}
              onChange={(value) => {
                handleFilterChange('city', value || '');
                handleFilterChange('district', []);
                handleFilterChange('project', []);
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

          {/* 區域選擇 */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '500', 
              color: '#475569', 
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              區域
              <span style={{
                fontSize: '11px',
                backgroundColor: localFilters.district?.length > 0 ? '#f59e0b' : '#e2e8f0',
                color: localFilters.district?.length > 0 ? 'white' : '#64748b',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: '600'
              }}>
                {localFilters.district?.length || 0}/3
              </span>
            </label>
            <Select
              mode="multiple"
              placeholder="選擇區域"
              style={{ width: '100%' }}
              value={localFilters.district || []}
              onChange={(value) => {
                handleFilterChange('district', value || []);
                handleFilterChange('project', []);
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
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '500', 
              color: '#475569', 
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              建案
              <span style={{
                fontSize: '11px',
                backgroundColor: localFilters.project?.length > 0 ? '#8b5cf6' : '#e2e8f0',
                color: localFilters.project?.length > 0 ? 'white' : '#64748b',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: '600'
              }}>
                {localFilters.project?.length || 0}/3
              </span>
            </label>
            <Select
              mode="multiple"
              placeholder="選擇建案"
              style={{ width: '100%' }}
              value={localFilters.project || []}
              onChange={(value) => handleFilterChange('project', value || [])}
              showSearch
              optionFilterProp="children"
              disabled={!dataLoaded}
              allowClear
              maxTagCount={1}
              maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
            >
              {getProjectOptions().map(project => (
                <Option key={project} value={project}>
                  {project}
                </Option>
              ))}
            </Select>
          </div>

          {/* 房型選擇 */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '500', 
              color: '#475569', 
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              房型
              <span style={{
                fontSize: '11px',
                backgroundColor: localFilters.roomType?.length > 0 ? '#10b981' : '#e2e8f0',
                color: localFilters.roomType?.length > 0 ? 'white' : '#64748b',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: '600'
              }}>
                {localFilters.roomType?.length || 0}/3
              </span>
            </label>
            <Select
              mode="multiple"
              placeholder="選擇房型"
              style={{ width: '100%' }}
              value={localFilters.roomType || []}
              onChange={(value) => handleFilterChange('roomType', value || [])}
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
      </div>

      {/* 第二排：輔助篩選 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontSize: '13px',
          fontWeight: '600',
          color: '#475569',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          🔧 輔助篩選
        </div>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'end'
        }}>
          {/* 交易日期 */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '500', 
              color: '#475569', 
              marginBottom: '6px' 
            }}>
              交易日期
            </label>
            <RangePicker
              style={{ width: '100%' }}
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
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '500', 
              color: '#475569', 
              marginBottom: '6px' 
            }}>
              最低價格 (萬)
            </label>
            <InputNumber
              placeholder="最低價格"
              style={{ width: '100%' }}
              value={localFilters.minPrice || undefined}
              onChange={(value) => handleFilterChange('minPrice', value)}
              min={0}
              disabled={!dataLoaded}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </div>

          {/* 最高價格 */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '500', 
              color: '#475569', 
              marginBottom: '6px' 
            }}>
              最高價格 (萬)
            </label>
            <InputNumber
              placeholder="最高價格"
              style={{ width: '100%' }}
              value={localFilters.maxPrice || undefined}
              onChange={(value) => handleFilterChange('maxPrice', value)}
              min={0}
              disabled={!dataLoaded}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </div>
        </div>
      </div>

      {/* 已選擇的複選項目顯示 */}
      {(localFilters.district?.length > 0 || localFilters.project?.length > 0 || localFilters.roomType?.length > 0) && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '16px', 
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          borderRadius: '12px', 
          border: '2px solid #bfdbfe' 
        }}>
          <div style={{ 
            fontSize: '13px', 
            fontWeight: '600', 
            color: '#1e40af', 
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            ✓ 已選擇的條件
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
                style={{ 
                  fontSize: '13px', 
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none'
                }}
              >
                📍 {district}
              </Tag>
            ))}
            {localFilters.project?.map(project => (
              <Tag 
                key={project} 
                color="purple" 
                closable 
                onClose={() => {
                  const newProjects = localFilters.project.filter(p => p !== project);
                  handleFilterChange('project', newProjects);
                }}
                style={{ 
                  fontSize: '13px', 
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none'
                }}
              >
                🏗️ {project}
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
                style={{ 
                  fontSize: '13px', 
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none'
                }}
              >
                🏠 {roomType}
              </Tag>
            ))}
          </div>
        </div>
      )}

      {/* 操作按鈕區域 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingTop: '20px',
        borderTop: '2px solid #f1f5f9'
      }}>
        {/* 左側：結果統計 */}
        <div>
          {filteredData && filteredData.length > 0 ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
            }}>
              <span style={{ fontSize: '18px' }}>📊</span>
              找到 {filteredData.length.toLocaleString()} 筆交易資料
            </div>
          ) : dataLoaded ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: '#fef3c7',
              borderRadius: '8px',
              color: '#92400e',
              fontSize: '13px',
              fontWeight: '500'
            }}>
              <span>💡</span>
              請設定篩選條件
            </div>
          ) : null}
        </div>

        {/* 右側：操作按鈕 */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            icon={<ClearOutlined />}
            onClick={handleClearFilters}
            disabled={!dataLoaded}
            size="large"
            style={{
              borderRadius: '8px',
              fontWeight: '500',
              height: '44px',
              padding: '0 24px'
            }}
          >
            清除條件
          </Button>
          <Button
            icon={<SearchOutlined />}
            type="primary"
            onClick={handleApplyFilters}
            disabled={!dataLoaded}
            size="large"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              height: '44px',
              padding: '0 32px',
              boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.3)',
            }}
          >
            查詢分析
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;