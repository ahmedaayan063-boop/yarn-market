import React, { useEffect, useState } from 'react';
import {
  Table, Button, Space, Typography, Tag, Popconfirm,
  message, Input, Card, Alert
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, UserOutlined, BankOutlined,
  TeamOutlined, DollarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { partyAPI } from '../services/api';

const { Text } = Typography;

const TYPE_CONFIG = {
  CASH:             { label: 'Cash',             color: '#1B4F8A', icon: <UserOutlined /> },
  GST:              { label: 'GST',              color: '#1D6A3A', icon: <BankOutlined /> },
  BROKER:           { label: 'Broker',           color: '#7A4F00', icon: <TeamOutlined /> },
  COMMISSION_AGENT: { label: 'Comm. Agent',      color: '#6B3AA0', icon: <DollarOutlined /> },
};

export default function PartyList() {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [error,   setError]   = useState(null);
  const [filter,  setFilter]  = useState('ALL');

  const fetchParties = () => {
    setLoading(true);
    partyAPI.getAll().then(setParties).catch(e => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchParties(); }, []);

  const handleDelete = async (id) => {
    try { await partyAPI.delete(id); message.success('Deleted'); fetchParties(); }
    catch (e) { message.error(e.message); }
  };

  const filtered = parties.filter(p => {
    const n = p.cashPartyName || p.gstPartyName || '';
    const matchSearch = n.toLowerCase().includes(search.toLowerCase()) ||
      p.code?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || p.type === filter;
    return matchSearch && matchFilter;
  });

  const cols = [
    {
      title: 'Code', dataIndex: 'code', width: 100,
      render: v => <Text code style={{ fontSize: 11 }}>{v?.slice(0, 8)}</Text>
    },
    {
      title: 'Type', dataIndex: 'type', width: 120,
      render: v => {
        const cfg = TYPE_CONFIG[v] || { label: v, color: '#888' };
        return (
          <Tag color={cfg.color} icon={cfg.icon} style={{ fontSize: 11 }}>
            {cfg.label}
          </Tag>
        );
      }
    },
    { title: 'Party name', render: (_, r) => r.cashPartyName || r.gstPartyName || '—' },
    { title: 'Cell',       render: (_, r) => r.cashCell || r.gstCell || '—' },
    { title: 'IP Person',  dataIndex: 'ipConcernPerson', render: v => v || '—' },
    { title: 'STRN',       render: (_, r) => r.strn || '—' },
    {
      title: 'Date', dataIndex: 'createdAt', width: 100,
      render: v => new Date(v).toLocaleDateString('en-PK')
    },
    {
      title: '', width: 90,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/parties/${r.id}/edit`)} />
          <Popconfirm title="Delete this party?" onConfirm={() => handleDelete(r.id)} okText="Yes" cancelText="No">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Count by type
  const counts = parties.reduce((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 className="page-title">Party Registration</h1>
        <Button type="primary" icon={<PlusOutlined />} size="large"
          style={{ background: '#1B4F8A', borderColor: '#1B4F8A' }}
          onClick={() => navigate('/parties/new')}>
          New party
        </Button>
      </div>

      {error && <Alert type="error" message={error} style={{ marginBottom: 10 }} />}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { key: 'ALL',             label: 'All Parties' },
          { key: 'CASH',            label: 'Cash' },
          { key: 'GST',             label: 'GST' },
          { key: 'BROKER',         label: 'Broker' },
          { key: 'COMMISSION_AGENT', label: 'Commission Agent' },
        ].map(f => {
          const cfg = TYPE_CONFIG[f.key];
          const count = f.key === 'ALL' ? parties.length : (counts[f.key] || 0);
          return (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '5px 14px',
              border: `1.5px solid ${filter === f.key ? (cfg?.color || '#1B4F8A') : '#D9D9D9'}`,
              borderRadius: 4,
              background: filter === f.key ? (cfg?.bg || '#EEF4FF') : '#fff',
              cursor: 'pointer',
              fontFamily: 'Verdana,sans-serif',
              fontSize: 11,
              fontWeight: filter === f.key ? 700 : 400,
              color: filter === f.key ? (cfg?.color || '#1B4F8A') : '#555',
            }}>
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      <Card>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search by name or code..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 300, marginBottom: 12 }}
          allowClear
        />
        <Table
          columns={cols}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          size="middle"
          pagination={{ pageSize: 15, showTotal: t => `${t} parties` }}
          locale={{ emptyText: 'No parties yet. Click "New party" to add one.' }}
        />
      </Card>
    </div>
  );
}
