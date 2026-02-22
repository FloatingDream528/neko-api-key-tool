import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Collapse,
  Input,
  Modal,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Toast,
  Tooltip,
  Typography,
} from '@douyinfe/semi-ui';
import { IconCopy, IconDownload, IconSearch } from '@douyinfe/semi-icons';
import Papa from 'papaparse';

import { API, timestamp2string } from '../helpers';
import { ITEMS_PER_PAGE } from '../constants';
import { renderModelPrice, renderQuota, stringToColor } from '../helpers/render';

const { Text } = Typography;
const { Panel } = Collapse;
const { TabPane } = Tabs;

function renderTimestamp(timestamp) {
  return timestamp2string(timestamp);
}

function renderIsStream(bool) {
  return bool ? '流' : '非流';
}

function renderUseTime(type) {
  const time = Number.parseInt(type, 10);
  if (Number.isNaN(time)) return '-';
  return `${time} 秒`;
}

const LogsTable = () => {
  const [apikey, setAPIKey] = useState('');
  const [activeTabKey, setActiveTabKey] = useState('');
  const [tabData, setTabData] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeKeys, setActiveKeys] = useState([]);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [baseUrl, setBaseUrl] = useState('');

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
          const logs = Array.isArray(logData) ? logData.slice().reverse() : [];
          newTabData.logs = logs;

          // ✅ 去掉未使用的 quota（eslint no-unused-vars）
          setActiveKeys(['1', '2']);
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
    },
    {
      title: '令牌名称',
      dataIndex: 'token_name',
      render: (text, record) =>
        record.type === 0 || record.type === 2 ? (
          <Text link onClick={() => copyText(text)}>
            {text}
          </Text>
        ) : (
          <>{text}</>
        ),
      sorter: (a, b) => ('' + a.token_name).localeCompare(b.token_name),
    },
    {
      title: '模型',
      dataIndex: 'model_name',
      render: (text, record) =>
        record.type === 0 || record.type === 2 ? (
          <Tag color={stringToColor(text)} style={{ cursor: 'pointer' }}>
            <span onClick={() => copyText(text)}>{text}</span>
          </Tag>
        ) : (
          <>{text}</>
        ),
      sorter: (a, b) => ('' + a.model_name).localeCompare(b.model_name),
    },
    {
      title: '用时',
      dataIndex: 'use_time',
      render: (text, record) =>
        record.model_name && record.model_name.startsWith('mj_') ? null : (
          <>
            {renderUseTime(text)} {renderIsStream(record.is_stream)}
          </>
        ),
      sorter: (a, b) => a.use_time - b.use_time,
    },
    {
      title: '提示',
      dataIndex: 'prompt_tokens',
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
      title: '详情',
      dataIndex: 'content',
      render: (text, record) => {
        let other = null;
        try {
          const raw = record.other === '' ? '{}' : record.other;
          other = JSON.parse(raw);
        } catch {
          return <Text>{text}</Text>;
        }

        if (!other) return <Text>{text}</Text>;

        const priceInfo = renderModelPrice(
          record.prompt_tokens,
          record.completion_tokens,
          other.model_ratio,
          other.model_price,
          other.completion_ratio,
          other.group_ratio
        );

        return (
          <Tooltip content={<div style={{ maxWidth: 520 }}>{priceInfo}</div>}>
            <Text>{text}</Text>
          </Tooltip>
        );
      },
    },
  ];

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

  const renderContent = () => (
    <>
      <Space style={{ width: '100%' }} vertical>
        <Input
          value={apikey}
          onChange={(value) => setAPIKey(value)}
          placeholder="请输入要查询的令牌 sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          prefix={<IconSearch />}
          suffix={
            <Button
              type="primary"
              onClick={fetchData}
              icon={<IconSearch />}
              theme="solid"
            >
              查询
            </Button>
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') fetchData();
          }}
        />

        <Collapse activeKey={activeKeys} onChange={(keys) => setActiveKeys(keys)}>
          {process.env.REACT_APP_SHOW_BALANCE === 'true' && (
            <Panel header="令牌信息" itemKey="1">
              <Card>
                <Space vertical align="start">
                  <Button
                    theme="borderless"
                    type="primary"
                    onClick={copyTokenInfo}
                    disabled={!activeTabData.tokenValid}
                    icon={<IconCopy />}
                  >
                    复制令牌信息
                  </Button>

                  <div>令牌名称：{activeTabData.tokenName || '未知'}</div>
                  <div>
                    令牌总额：
                    {activeTabData.unlimitedQuota
                      ? '无限'
                      : !activeTabData.tokenValid
                      ? '未知'
                      : renderQuota(activeTabData.totalGranted, 3)}
                  </div>
                  <div>
                    剩余额度：
                    {activeTabData.unlimitedQuota
                      ? '无限制'
                      : !activeTabData.tokenValid
                      ? '未知'
                      : renderQuota(activeTabData.totalAvailable, 3)}
                  </div>
                  <div>
                    已用额度：
                    {activeTabData.unlimitedQuota
                      ? '不进行计算'
                      : !activeTabData.tokenValid
                      ? '未知'
                      : renderQuota(activeTabData.totalUsed, 3)}
                  </div>
                  <div>
                    有效期至：
                    {activeTabData.expiresAt === 0
                      ? '永不过期'
                      : !activeTabData.tokenValid
                      ? '未知'
                      : renderTimestamp(activeTabData.expiresAt)}
                  </div>
                </Space>
              </Card>
            </Panel>
          )}

          {process.env.REACT_APP_SHOW_DETAIL === 'true' && (
            <Panel header="调用详情" itemKey="2">
              <Space vertical style={{ width: '100%' }}>
                <Button
                  theme="borderless"
                  type="primary"
                  onClick={exportCSV}
                  disabled={!activeTabData.tokenValid || activeTabData.logs.length === 0}
                  icon={<IconDownload />}
                >
                  导出为CSV文件
                </Button>

                <Table
                  columns={columns}
                  dataSource={activeTabData.logs}
                  pagination={{
                    pageSize,
                    onPageSizeChange: (ps) => setPageSize(ps),
                    showTotal: (total) => `共 ${total} 条`,
                    showQuickJumper: true,
                    total: activeTabData.logs.length,
                    style: { marginTop: 12 },
                  }}
                />
              </Space>
            </Panel>
          )}
        </Collapse>
      </Space>
    </>
  );

  const keys = Object.keys(baseUrls);

  return (
    <Spin spinning={loading}>
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
    </Spin>
  );
};

export default LogsTable;
