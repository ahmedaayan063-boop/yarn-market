import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Tag, Popconfirm, message, Input, Card, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UserOutlined, BankOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { partyAPI } from '../services/api';

const { Text } = Typography;

export default function PartyList() {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [error,   setError]   = useState(null);

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
    return n.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase());
  });

  const cols = [
    { title: 'Code',     dataIndex: 'code',    width: 120, render: v => <Text code style={{ fontSize: 11 }}>{v?.slice(0, 8)}</Text> },
    { title: 'Type',     dataIndex: 'type',    width: 80,  render: v => v === 'GST' ? <Tag icon={<BankOutlined />} color="blue">GST</Tag> : <Tag icon={<UserOutlined />}>Cash</Tag> },
    { title: 'Party name',    render: (_, r) => r.cashPartyName || r.gstPartyName || '—' },
    { title: 'Cell',          render: (_, r) => r.cashCell || r.gstCell || '—' },
    { title: 'IP Person', dataIndex: 'ipConcernPerson', render: v => v || '—' },
    { title: 'STRN',          render: (_, r) => r.strn || '—' },
    { title: 'Date',     dataIndex: 'createdAt', width: 110, render: v => new Date(v).toLocaleDateString('en-PK') },
    {
      title: '', width: 90,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/parties/${r.id}/edit`)} />
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(r.id)} okText="Yes" cancelText="No">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

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
      <Card>
        <Input prefix={<SearchOutlined />} placeholder="Search by name or code..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 300, marginBottom: 12 }} allowClear />
        <Table columns={cols} dataSource={filtered} rowKey="id" loading={loading}
          size="middle" pagination={{ pageSize: 15, showTotal: t => `${t} parties` }}
          locale={{ emptyText: 'No parties yet. Click "New party" to add one.' }} />
      </Card>
    </div>
  );
}
