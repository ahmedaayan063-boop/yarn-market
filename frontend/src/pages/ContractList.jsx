import React,{useEffect,useState} from 'react';
import {Table,Button,Space,Typography,Tag,Popconfirm,message,Input,Card,Alert,Row,Col} from 'antd';
import {PlusOutlined,EditOutlined,DeleteOutlined,SearchOutlined} from '@ant-design/icons';
import {useNavigate} from 'react-router-dom';
import {contractAPI} from '../services/api';
const {Text}=Typography;
const TL={CASH_PURCHASE:'Cash Purchase',GST_PURCHASE:'GST Purchase',CASH_SALE:'Cash Sale',GST_SALE:'GST Sale',SERVICES:'Services',TRANSACTION:'Transaction'};
const TC={CASH_PURCHASE:'default',GST_PURCHASE:'blue',CASH_SALE:'green',GST_SALE:'cyan',SERVICES:'purple',TRANSACTION:'orange'};
const SC={PREPARED:'default',CHECKED:'processing',APPROVED:'success'};
export default function ContractList(){
  const navigate=useNavigate();
  const [data,setData]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState('');
  const [error,setError]=useState(null);
  const fetch=()=>{setLoading(true);contractAPI.getAll().then(setData).catch(e=>setError(e.message)).finally(()=>setLoading(false));};
  useEffect(()=>{fetch();},[]);
  const del=async(id)=>{try{await contractAPI.delete(id);message.success('Deleted');fetch();}catch(e){message.error(e.message);}};
  const filtered=data.filter(c=>{const p=c.bookingParty?.cashPartyName||c.bookingParty?.gstPartyName||'';return p.toLowerCase().includes(search.toLowerCase())||c.code?.toLowerCase().includes(search.toLowerCase())||TL[c.contractType]?.toLowerCase().includes(search.toLowerCase());});
  const totalVal=data.reduce((s,c)=>s+(c.items||[]).reduce((si,i)=>si+Number(i.amount||0),0),0);
  const cols=[
    {title:'Code',dataIndex:'code',width:100,render:v=><Text code style={{fontSize:11}}>{v?.slice(0,8)}</Text>},
    {title:'Type',dataIndex:'contractType',width:130,render:v=><Tag color={TC[v]}>{TL[v]}</Tag>},
    {title:'Booking party',render:(_,r)=>r.bookingParty?.cashPartyName||r.bookingParty?.gstPartyName||'—'},
    {title:'Total (Rs)',render:(_,r)=>{const t=(r.items||[]).reduce((s,i)=>s+Number(i.amount||0),0);return t?<Text strong style={{color:'#2563EB'}}>Rs {t.toLocaleString('en-PK')}</Text>:'—';},width:140},
    {title:'Status',dataIndex:'status',width:110,render:v=><Tag color={SC[v]}>{v}</Tag>},
    {title:'Date',dataIndex:'createdAt',width:110,render:v=>new Date(v).toLocaleDateString('en-PK')},
    {title:'',width:90,render:(_,r)=><Space><Button size="small" icon={<EditOutlined/>} onClick={()=>navigate(`/contracts/${r.id}/edit`)}/><Popconfirm title="Delete?" onConfirm={()=>del(r.id)} okText="Yes" cancelText="No"><Button size="small" danger icon={<DeleteOutlined/>}/></Popconfirm></Space>}
  ];
  return(<div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
      <h1 className="page-title">Sale / Purchase Contracts</h1>
      <Button type="primary" icon={<PlusOutlined/>} size="large" onClick={()=>navigate('/contracts/new')}>New contract</Button>
    </div>
    {error&&<Alert type="error" message={error} style={{marginBottom:12}}/>}
    <Row gutter={[12,12]} style={{marginBottom:14}}>
      {[{l:'Total contracts',v:data.length},{l:'Total value (Rs)',v:'Rs '+totalVal.toLocaleString('en-PK')},{l:'Approved',v:data.filter(c=>c.status==='APPROVED').length},{l:'Pending',v:data.filter(c=>c.status==='PREPARED').length}].map((s,i)=>(
        <Col xs={12} sm={6} key={i}><Card size="small" style={{textAlign:'center'}}><div style={{fontSize:22,fontWeight:700}}>{s.v}</div><div style={{fontSize:12,color:'#64748B'}}>{s.l}</div></Card></Col>
      ))}
    </Row>
    <Card>
      <Input prefix={<SearchOutlined/>} placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:320,marginBottom:14}} allowClear/>
      <Table columns={cols} dataSource={filtered} rowKey="id" loading={loading} size="middle" scroll={{x:800}} pagination={{pageSize:15}} locale={{emptyText:'No contracts yet.'}}/>
    </Card>
  </div>);
}
