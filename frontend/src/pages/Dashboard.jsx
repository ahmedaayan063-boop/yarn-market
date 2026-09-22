import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Space, Typography, Alert } from 'antd';
import { TeamOutlined, AppstoreOutlined, FileTextOutlined, PlusOutlined, CheckCircleOutlined, SwapOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { partyAPI, itemAPI, contractAPI, transactionAPI } from '../services/api';
const { Title, Text } = Typography;
export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ parties:0, items:0, contracts:0, transactions:0 });
  const [connected, setConnected] = useState(null);
  useEffect(() => {
    fetch((process.env.REACT_APP_API_URL||'http://localhost:5000/api')+'/health')
      .then(r=>r.json()).then(()=>setConnected(true)).catch(()=>setConnected(false));
    Promise.all([partyAPI.getAll(),itemAPI.getAll(),contractAPI.getAll(),transactionAPI.getAll()])
      .then(([p,i,c,t])=>setStats({parties:p.length,items:i.length,contracts:c.length,transactions:t.length}))
      .catch(()=>{});
  },[]);
  const metrics = [
    { label:'Parties',       value:stats.parties,      icon:<TeamOutlined />,      path:'/parties',      color:'#2563EB' },
    { label:'Items',         value:stats.items,        icon:<AppstoreOutlined />,  path:'/items',        color:'#059669' },
    { label:'Contracts',     value:stats.contracts,    icon:<FileTextOutlined />,  path:'/contracts',    color:'#7C3AED' },
    { label:'Transactions',  value:stats.transactions, icon:<SwapOutlined />,      path:'/transactions', color:'#B45309' },
  ];
  return (
    <div>
      <div style={{marginBottom:20}}>
        <h1 className="page-title">Dashboard</h1>
        <Text style={{fontSize:13,color:'#64748B'}}>Company ABC XYZ — Yarn Market, Faisalabad</Text>
      </div>
      {connected===false && <Alert type="error" message="Cannot connect to server. Make sure the backend is running." style={{marginBottom:16}} showIcon />}
      {connected===true  && <Alert type="success" icon={<CheckCircleOutlined />} message="Server connected" style={{marginBottom:16}} showIcon closable />}
      <Row gutter={[14,14]} style={{marginBottom:20}}>
        {metrics.map(m=>(
          <Col xs={12} sm={6} key={m.label}>
            <Card hoverable onClick={()=>navigate(m.path)} style={{textAlign:'center',cursor:'pointer'}}>
              <div style={{fontSize:28,color:m.color,marginBottom:4}}>{m.icon}</div>
              <div style={{fontSize:26,fontWeight:700,color:'#0F172A'}}>{m.value}</div>
              <div style={{fontSize:13,color:'#64748B',marginTop:2}}>{m.label}</div>
            </Card>
          </Col>
        ))}
      </Row>
      <Card title="Quick actions">
        <Space wrap>
          <Button icon={<PlusOutlined />} onClick={()=>navigate('/parties/new')}>Register party</Button>
          <Button icon={<PlusOutlined />} onClick={()=>navigate('/items')}>Add item</Button>
          <Button icon={<PlusOutlined />} onClick={()=>navigate('/contracts/new')}>New contract</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={()=>navigate('/transactions/new')}>New transaction</Button>
        </Space>
      </Card>
    </div>
  );
}
