import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Space, Alert } from 'antd';
import {
  TeamOutlined, AppstoreOutlined, FileTextOutlined,
  PlusOutlined, CheckCircleOutlined, SwapOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { partyAPI, itemAPI, contractAPI, transactionAPI } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ parties: 0, items: 0, contracts: 0, transactions: 0 });
  const [connected, setConnected] = useState(null);

  useEffect(() => {
    fetch((process.env.REACT_APP_API_URL || 'http://localhost:5000/api') + '/health')
      .then(r => r.json()).then(() => setConnected(true)).catch(() => setConnected(false));
    Promise.all([partyAPI.getAll(), itemAPI.getAll(), contractAPI.getAll(), transactionAPI.getAll()])
      .then(([p, i, c, t]) => setStats({ parties: p.length, items: i.length, contracts: c.length, transactions: t.length }))
      .catch(() => {});
  }, []);

  const metrics = [
    { label: 'Parties',      value: stats.parties,      icon: <TeamOutlined />,      path: '/parties',      color: '#1B4F8A' },
    { label: 'Items',        value: stats.items,        icon: <AppstoreOutlined />,  path: '/items',        color: '#1D6A3A' },
    { label: 'Contracts',    value: stats.contracts,    icon: <FileTextOutlined />,  path: '/contracts',    color: '#6B3AA0' },
    { label: 'Transactions', value: stats.transactions, icon: <SwapOutlined />,      path: '/transactions', color: '#8B4513' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 className="page-title">Dashboard</h1>
        <span style={{ fontSize: 13, color: '#64748B', fontFamily: 'Verdana,sans-serif' }}>
          Company ABC XYZ — Yarn Market, Faisalabad
        </span>
      </div>

      {connected === false && (
        <Alert type="error" message="Cannot connect to server. Make sure the backend is running."
          style={{ marginBottom: 12 }} showIcon />
      )}
      {connected === true && (
        <Alert type="success" icon={<CheckCircleOutlined />} message="Server connected"
          style={{ marginBottom: 12 }} showIcon closable />
      )}

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {metrics.map(m => (
          <Col xs={12} sm={6} key={m.label}>
            <Card hoverable onClick={() => navigate(m.path)} style={{ textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: 26, color: m.color, marginBottom: 4 }}>{m.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', fontFamily: 'Verdana,sans-serif' }}>{m.value}</div>
              <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'Verdana,sans-serif' }}>{m.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="Quick actions">
        <Space wrap>
          <Button icon={<PlusOutlined />} onClick={() => navigate('/parties/new')}>Register party</Button>
          <Button icon={<PlusOutlined />} onClick={() => navigate('/items')}>Add item</Button>
          <Button icon={<PlusOutlined />} onClick={() => navigate('/contracts/new')}>New contract</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/transactions')}
            style={{ background: '#1B4F8A', borderColor: '#1B4F8A' }}>
            New transaction
          </Button>
        </Space>
      </Card>
    </div>
  );
}
