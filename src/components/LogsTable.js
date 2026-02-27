import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Input,
  Modal,
  Table,
  Tabs,
  Tag,
  Toast,
  Typography,
  Skeleton,
} from '@douyinfe/semi-ui';
import { IconCopy, IconDownload, IconSearch, IconKey, IconCreditCard, IconBox, IconClock, IconTickCircle } from '@douyinfe/semi-icons';
import Papa from 'papaparse';

import { API, timestamp2string } from '../helpers';
import { ITEMS_PER_PAGE } from '../constants';
import { renderModelPrice, renderQuota, stringToColor } from '../helpers/render';

const { Text } = Typography;
const { TabPane } = Tabs;

// Simple countUp hook for animated numbers
function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  const prevTarget = React.useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    const start = prevTarget.current;
    const diff = target - start;
    if (diff === 0) return;

    const startTime = performance.now();
    let raf;
    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + diff * eased);
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        prevTarget.current = target;
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

const CountUpValue = ({ value, precision = 3, prefix = '' }) => {
  const animated = useCountUp(value);
  return (
    <span className="stats-card-value">
      {prefix}{animated.toFixed(precision)}
    </span>
  );
};

function renderTimestamp(timestamp) {
  return timestamp2string(timestamp);
}

function renderIsStream(bool) {
  return bool ? '流式' : '非流式';
}

function renderUseTime(type) {
  const time = Number.parseInt(type, 10);
  if (Number.isNaN(time)) return '-';
  return `${time} 秒`;
}

function compareLogsByLatest(a, b) {
  const createdAtDiff = Number(b?.created_at || 0) - Number(a?.created_at || 0);
  if (createdAtDiff !== 0) return createdAtDiff;

  const aIdNum = Number(a?.id);
  const bIdNum = Number(b?.id);
  if (Number.isFinite(aIdNum) && Number.isFinite(bIdNum)) {
    return bIdNum - aIdNum;
  }

  return String(b?.id ?? '').localeCompare(String(a?.id ?? ''));
}

const MOBILE_BREAKPOINT = 768;

const LogsTable = () => {
  const [apikey, setAPIKey] = useState('');
  const [activeTabKey, setActiveTabKey] = useState('');
  const [tabData, setTabData] = useState({});
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [baseUrl, setBaseUrl] = useState('');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT);

  // ✅ 让 baseUrls 引用稳定，并且避免 JSON.parse 崩溃
  const baseUrls = useMemo(() => {
    try {
      const parsed = JSON.parse(process.env.REACT_APP_BASE_URL || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }, []);

  // ✅ 修复 exhaustive-deps：把 baseUrls 放进依赖
  useEffect(() => {
    const keys = Object.keys(baseUrls);
    if (keys.length > 0) {
      const firstKey = keys[0];
      setActiveTabKey(firstKey);
      setBaseUrl(baseUrls[firstKey]);
    }
  }, [baseUrls]);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleTabChange = (key) => {
    setActiveTabKey(key);
    setBaseUrl(baseUrls[key]);
  };

  const resetData = (key) => {
    setTabData((prev) => ({
      ...prev,
      [key]: {
        totalGranted: 0,
        totalUsed: 0,
        totalAvailable: 0,
        unlimitedQuota: false,
        expiresAt: 0,
        tokenName: '',
        logs: [],
        tokenValid: false,
      },
    }));
  };

  const copyText = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        Toast.success(`已复制：${text}`);
        return;
      }

      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand('copy');
        textArea.remove();
        Toast.success(`已复制：${text}`);
      } catch (err) {
        textArea.remove();
        Modal.error({ title: '无法复制到剪贴板，请手动复制', content: text });
      }
    } catch (err) {
      Modal.error({ title: '无法复制到剪贴板，请手动复制', content: text });
    }
  };

  const fetchData = async () => {
    if (!baseUrl) {
      Toast.error('Base URL 未配置或解析失败，请检查 REACT_APP_BASE_URL');
      return;
    }

    if (apikey === '') {
      Toast.warning('请先输入令牌，再进行查询');
      return;
    }

    if (!/^sk-[a-zA-Z0-9]{48}$/.test(apikey)) {
      Toast.error('令牌格式非法！');
      return;
    }

    setLoading(true);

    const prev = tabData[activeTabKey] || {};
    const newTabData = {
      ...prev,
      totalGranted: 0,
      totalUsed: 0,
      totalAvailable: 0,
      unlimitedQuota: false,
      expiresAt: 0,
      tokenName: '',
      logs: [],
      tokenValid: false,
    };

    // 余额信息
    try {
      if (process.env.REACT_APP_SHOW_BALANCE === 'true') {
        const usageRes = await API.get(`${baseUrl}/api/usage/token/`, {
          headers: { Authorization: `Bearer ${apikey}` },
        });

        const usageData = usageRes.data;
        if (usageData && usageData.code) {
          const d = usageData.data;
          newTabData.unlimitedQuota = d.unlimited_quota;
          newTabData.totalGranted = d.total_granted;
          newTabData.totalUsed = d.total_used;
          newTabData.totalAvailable = d.total_available;
          newTabData.expiresAt = d.expires_at;
          newTabData.tokenName = d.name;
          newTabData.tokenValid = true;
        } else {
          Toast.error((usageData && usageData.message) || '查询令牌信息失败');
        }
      }
    } catch (e) {
      Toast.error('查询令牌信息失败，请检查令牌是否正确');
      resetData(activeTabKey);
      setLoading(false);
      return;
    }

    // 调用详情
    try {
      if (process.env.REACT_APP_SHOW_DETAIL === 'true') {
        const logRes = await API.get(`${baseUrl}/api/log/token`, {
          headers: { Authorization: `Bearer ${apikey}` },
        });

        // ✅ 去掉未使用的 message（eslint no-unused-vars）
        const { success, data: logData } = logRes.data || {};
        if (success) {
          const logs = Array.isArray(logData) ? logData.slice().sort(compareLogsByLatest) : [];
          newTabData.logs = logs;
        } else {
          Toast.error('查询调用详情失败，请输入正确的令牌');
        }
      }
    } catch (e) {
      Toast.error('查询失败，请输入正确的令牌');
      resetData(activeTabKey);
      setLoading(false);
      return;
    }

    setTabData((prevData) => ({ ...prevData, [activeTabKey]: newTabData }));
    setLoading(false);
  };

  const copyTokenInfo = (e) => {
    e.stopPropagation();
    const active = tabData[activeTabKey] || {};
    const {
      totalGranted,
      totalUsed,
      totalAvailable,
      unlimitedQuota,
      expiresAt,
      tokenName,
    } = active;

    const info = `令牌名称: ${tokenName || '未知'}
令牌总额: ${unlimitedQuota ? '无限' : renderQuota(totalGranted, 3)}
剩余额度: ${unlimitedQuota ? '无限制' : renderQuota(totalAvailable, 3)}
已用额度: ${unlimitedQuota ? '不进行计算' : renderQuota(totalUsed, 3)}
有效期至: ${expiresAt === 0 ? '永不过期' : renderTimestamp(expiresAt)}`;

    copyText(info);
  };

  const exportCSV = (e) => {
    e.stopPropagation();
    const active = tabData[activeTabKey] || { logs: [] };
    const { logs } = active;

    const csvData = (logs || []).map((log) => ({
      时间: renderTimestamp(log.created_at),
      模型: log.model_name,
      用时: log.use_time,
      提示: log.prompt_tokens,
      补全: log.completion_tokens,
      花费: log.quota,
      详情: log.content,
    }));

    const csvString = '\ufeff' + Papa.unparse(csvData);

    try {
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'data.csv';

      if (
        navigator.userAgent.includes('Safari') &&
        !navigator.userAgent.includes('Chrome')
      ) {
        link.target = '_blank';
        link.setAttribute('target', '_blank');
      }

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      Toast.error('导出失败，请稍后重试');
      // eslint-disable-next-line no-console
      console.error('Export failed:', err);
    }
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      render: renderTimestamp,
      sorter: (a, b) => a.created_at - b.created_at,
      defaultSortOrder: 'descend',
    },
    {
      title: '令牌名称',
      dataIndex: 'token_name',
      ellipsis: true,
      render: (text, record) => {
        const displayText = text || '-';
        return record.type === 0 || record.type === 2 ? (
          <Text
            link
            onClick={() => copyText(displayText)}
            ellipsis={{ showTooltip: { opts: { content: displayText } } }}
            style={{ maxWidth: '100%' }}
          >
            {displayText}
          </Text>
        ) : (
          <Text
            ellipsis={{ showTooltip: { opts: { content: displayText } } }}
            style={{ maxWidth: '100%' }}
          >
            {displayText}
          </Text>
        );
      },
      sorter: (a, b) => ('' + a.token_name).localeCompare(b.token_name),
    },
    {
      title: '模型',
      dataIndex: 'model_name',
      ellipsis: true,
      render: (text, record) => {
        const displayText = text || '-';
        return record.type === 0 || record.type === 2 ? (
          <Tag
            color={stringToColor(displayText)}
            shape="circle"
            type="light"
            style={{ cursor: 'pointer', maxWidth: '100%', overflow: 'hidden', borderRadius: '6px' }}
            onClick={() => copyText(displayText)}
          >
            <span className="model-dot" />
            <span className="table-ellipsis-text" title={displayText}>{displayText}</span>
          </Tag>
        ) : (
          <span className="table-ellipsis-text" title={displayText}>{displayText}</span>
        );
      },
      sorter: (a, b) => ('' + a.model_name).localeCompare(b.model_name),
    },
    {
      title: '用时',
      dataIndex: 'use_time',
      className: 'hide-on-mobile',
      render: (text, record) =>
        record.model_name && record.model_name.startsWith('mj_') ? null : (
          <span className="table-compact-meta">
            {renderUseTime(text)} {renderIsStream(record.is_stream)}
          </span>
        ),
      sorter: (a, b) => a.use_time - b.use_time,
    },
    {
      title: '提示',
      dataIndex: 'prompt_tokens',
      className: 'hide-on-mobile',
      render: (text, record) =>
        record.model_name && record.model_name.startsWith('mj_')
          ? null
          : record.type === 0 || record.type === 2
          ? text
          : null,
      sorter: (a, b) => a.prompt_tokens - b.prompt_tokens,
    },
    {
      title: '补全',
      dataIndex: 'completion_tokens',
      className: 'hide-on-mobile',
      render: (text, record) => {
        const n = Number.parseInt(text, 10);
        if (!Number.isFinite(n) || n <= 0) return null;
        return record.type === 0 || record.type === 2 ? text : null;
      },
      sorter: (a, b) => a.completion_tokens - b.completion_tokens,
    },
    {
      title: '花费',
      dataIndex: 'quota',
      render: (text, record) =>
        record.type === 0 || record.type === 2 ? renderQuota(text, 6) : null,
      sorter: (a, b) => a.quota - b.quota,
    },
    {
      title: '详情摘要',
      dataIndex: 'content',
      ellipsis: true,
      render: (text) => {
        const summary = text || '-';
        return (
          <span className="table-ellipsis-text" title={summary}>
            {summary}
          </span>
        );
      },
    },
  ];

  const expandRowRender = (record) => {
    let other = null;
    try {
      const raw = record.other === '' ? '{}' : record.other;
      other = JSON.parse(raw);
    } catch {}

    const kvRows = [
      ['模型', record.model_name || '-'],
      ['Stream参数', renderIsStream(record.is_stream)],
      ['用时', renderUseTime(record.use_time)],
      ['提示 Token', record.prompt_tokens ?? '-'],
      ['补全 Token', record.completion_tokens ?? '-'],
      ['总花费', renderQuota(record.quota, 6)],
    ];

    if (other && typeof other === 'object') {
      kvRows.push(
        ['模型基础倍率（model_ratio）', other.model_ratio ?? '-'],
        ['补全倍率（completion_ratio）', other.completion_ratio ?? '-'],
        ['分组倍率（group_ratio）', other.group_ratio ?? '-'],
        ['模型单价（model_price）', other.model_price ?? '-']
      );
    }

    let priceInfo = null;
    if (other && typeof other === 'object') {
      priceInfo = renderModelPrice(
        record.prompt_tokens,
        record.completion_tokens,
        other.model_ratio,
        other.model_price,
        other.completion_ratio,
        other.group_ratio
      );
    }

    return (
      <div className="log-expand-panel">
        {priceInfo && <div className="log-expand-price">{priceInfo}</div>}

        <div className="log-expand-grid">
          {kvRows.map(([label, value]) => (
            <div className="log-expand-item" key={label}>
              <Text type="tertiary" size="small" className="log-expand-label">{label}</Text>
              <Text className="log-expand-value">{String(value)}</Text>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const activeTabData = tabData[activeTabKey] || {
    logs: [],
    totalGranted: 0,
    totalUsed: 0,
    totalAvailable: 0,
    unlimitedQuota: false,
    expiresAt: 0,
    tokenName: '',
    tokenValid: false,
  };

  const renderStatsCard = (title, value, icon, accentColor, unit = '', isCounter = false) => (
    <Card shadows="hover" className="stats-card" style={{ '--card-accent': accentColor }} bodyStyle={{ padding: '16px 20px' }}>
      <Skeleton
        loading={loading}
        placeholder={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Skeleton.Avatar shape="square" size="small" />
              <Skeleton.Title style={{ width: '80px' }} />
            </div>
            <Skeleton.Paragraph rows={1} style={{ width: '100px' }} />
          </div>
        }
      >
        <div className="stats-card-header">
          <div className="stats-icon-wrapper" style={{ background: `${accentColor}15` }}>
            {React.cloneElement(icon, { style: { color: accentColor } })}
          </div>
          <Text type="tertiary" size="normal">{title}</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          {isCounter && typeof value === 'number' ? (
            <CountUpValue value={value} precision={3} prefix={unit} />
          ) : (
            <Text className="stats-card-value">{value}</Text>
          )}
        </div>
      </Skeleton>
    </Card>
  );

  const renderContent = () => (
    <div style={{ paddingBottom: '24px' }}>
      {/* Compact Search Bar */}
      <div className="compact-search-bar">
        <Input
          size="large"
          value={apikey}
          onChange={(value) => setAPIKey(value)}
          placeholder="输入您的令牌查询余额与调用明细 (sk-...)"
          prefix={<IconSearch style={{ color: 'var(--aurora-text-tertiary)', marginLeft: 8 }} />}
          suffix={
            <Button
              type="primary"
              onClick={fetchData}
              loading={loading}
              icon={<IconSearch />}
              theme="solid"
              style={{ borderRadius: '8px', padding: '0 20px', marginRight: 8, height: '34px' }}
            >
              查询
            </Button>
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') fetchData();
          }}
          className="compact-search-input"
        />
      </div>

      {(activeTabData.tokenValid || loading) && (
        <div className="result-container">
          {process.env.REACT_APP_SHOW_BALANCE === 'true' && (
            <div className="section-block">
              <div className="section-header">
                <Typography.Title heading={4} style={{ margin: 0 }}>令牌信息</Typography.Title>
                <Button
                  theme="light"
                  type="primary"
                  disabled={loading || !activeTabData.tokenValid}
                  onClick={copyTokenInfo}
                  icon={<IconCopy />}
                  style={{ borderRadius: '8px' }}
                >
                  复制信息
                </Button>
              </div>
              <div className="stats-grid">
                {renderStatsCard('令牌名称', activeTabData.tokenName || '未知', <IconKey />, '#00D2FF')}
                {renderStatsCard(
                  '令牌总额',
                  activeTabData.unlimitedQuota ? '无限' : activeTabData.totalGranted / 500000,
                  <IconCreditCard />,
                  '#10B981',
                  '$',
                  !activeTabData.unlimitedQuota
                )}
                {renderStatsCard(
                  '剩余额度',
                  activeTabData.unlimitedQuota ? '无限制' : activeTabData.totalAvailable / 500000,
                  <IconBox />,
                  '#F59E0B',
                  '$',
                  !activeTabData.unlimitedQuota
                )}
                {renderStatsCard(
                  '已用额度',
                  activeTabData.unlimitedQuota ? '不进行计算' : activeTabData.totalUsed / 500000,
                  <IconTickCircle />,
                  '#FF6B9D',
                  '$',
                  !activeTabData.unlimitedQuota
                )}
                <Card shadows="hover" className="stats-card" style={{ '--card-accent': '#7B61FF' }} bodyStyle={{ padding: '16px 20px' }}>
                  <Skeleton loading={loading} placeholder={<Skeleton.Paragraph rows={2} />}>
                    <div className="stats-card-header">
                      <div className="stats-icon-wrapper" style={{ background: '#7B61FF15' }}>
                        <IconClock style={{ color: '#7B61FF' }} />
                      </div>
                      <Text type="tertiary" size="normal">有效期至</Text>
                    </div>
                    <Text className="stats-card-value">
                      {activeTabData.expiresAt === 0 ? '永不过期' : renderTimestamp(activeTabData.expiresAt)}
                    </Text>
                  </Skeleton>
                </Card>
              </div>
            </div>
          )}

          {process.env.REACT_APP_SHOW_DETAIL === 'true' && (
            <div className="section-block" style={{ marginTop: '16px' }}>
              <div className="section-header">
                <Typography.Title heading={4} style={{ margin: 0 }}>调用详情</Typography.Title>
                <div className="detail-actions">
                  <Button
                    theme="light"
                    type="primary"
                    onClick={exportCSV}
                    disabled={loading || activeTabData.logs.length === 0}
                    icon={<IconDownload />}
                    style={{ borderRadius: '8px' }}
                  >
                    导出 CSV
                  </Button>
                </div>
              </div>
              <div className="table-wrapper">
                <Skeleton loading={loading} placeholder={<Skeleton.Paragraph rows={10} style={{ padding: '20px' }} />}>
                  <Table
                    columns={columns}
                    dataSource={activeTabData.logs}
                    expandedRowRender={expandRowRender}
                    rowKey={(record, index) => (record?.id || index || 0).toString()}
                    scroll={{ x: 900 }}
                    pagination={{
                      pageSize,
                      onPageSizeChange: (ps) => setPageSize(ps),
                      showTotal: (total, range) =>
                        isMobile ? `${range[0]}-${range[1]}` : `${range[0]}-${range[1]} 条，共 ${total} 条`,
                      showQuickJumper: !isMobile,
                      total: activeTabData.logs.length,
                      style: isMobile
                        ? { marginTop: 8, marginRight: 10, marginLeft: 10 }
                        : { marginTop: 12, marginRight: 24, marginLeft: 24 },
                    }}
                    className="custom-table"
                  />
                </Skeleton>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const keys = Object.keys(baseUrls);

  return (
    <>
      {keys.length > 1 ? (
        <Tabs type="line" activeKey={activeTabKey} onChange={handleTabChange}>
          {Object.entries(baseUrls).map(([key]) => (
            <TabPane tab={key} itemKey={key} key={key}>
              {renderContent()}
            </TabPane>
          ))}
        </Tabs>
      ) : (
        renderContent()
      )}
    </>
  );
};

export default LogsTable;
