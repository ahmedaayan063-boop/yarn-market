import React, { useEffect, useState, useCallback } from 'react';
import { Form, Input, Select, Button, Card, Row, Col, Typography, Space, message, Spin, Alert, InputNumber, Table, Radio, Tooltip } from 'antd';
import { SaveOutlined, ReloadOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined, SwapOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { transactionAPI, partyAPI, contractAPI, itemAPI } from '../services/api';

const { Text } = Typography;
const { Option } = Select;
const A = () => <span className="badge-auto">Auto</span>;
const M = () => <span className="badge-manual">Manual</span>;
const L = () => <span className="badge-lov">LOV</span>;

const NOTE_TYPES = [
  { value: 'YARN_RECEIPT_CASH', label: 'Receipt — CASH', doc: 'OGP', color: '#1B4F8A' },
  { value: 'YARN_RECEIPT_GST',  label: 'Receipt — GST',  doc: 'OGP', color: '#1B4F8A' },
  { value: 'YARN_ISSUE_CASH',   label: 'Issue — CASH',   doc: 'IGP', color: '#1D6A3A' },
  { value: 'YARN_ISSUE_GST',    label: 'Issue — GST',    doc: 'IGP', color: '#1D6A3A' },
  { value: 'SERVICES_NOTE',     label: 'Services Note',  doc: 'Invoice', color: '#6B3AA0' },
  { value: 'TRANSACTION_NOTE',  label: 'Transaction',    doc: 'auto', color: '#8B4513' },
];

const emptyRow = () => ({ _key: Date.now() + Math.random(), itemId: null, quality: '', bags: null, rate: null, amount: null });

export default function TransactionForm() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading,       setLoading]       = useState(false);
  const [fetching,      setFetching]      = useState(false);
  const [error,         setError]         = useState(null);
  const [parties,       setParties]       = useState([]);
  const [contracts,     setContracts]     = useState([]);
  const [items,         setItems]         = useState([]);
  const [rows,          setRows]          = useState([emptyRow(), emptyRow(), emptyRow()]);
  const [noteType,      setNoteType]      = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);
  const [savedCode,     setSavedCode]     = useState(null);

  const isGst = noteType?.includes('GST');
  const noteConf = NOTE_TYPES.find(n => n.value === noteType);

  useEffect(() => {
    partyAPI.getAll().then(setParties).catch(() => {});
    itemAPI.getAll().then(setItems).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedParty) { setContracts([]); return; }
    contractAPI.getAll().then(all => setContracts(all.filter(c => c.bookingPartyId === selectedParty || c.chequePartyId === selectedParty))).catch(() => {});
  }, [selectedParty]);

  useEffect(() => {
    if (!isEdit) return;
    setFetching(true);
    transactionAPI.getById(id).then(data => {
      const { items: ti, ...rest } = data;
      form.setFieldsValue(rest);
      setNoteType(data.noteType);
      setSelectedParty(data.partyId);
      setSavedCode(data.code);
      if (ti?.length) setRows(ti.map(i => ({ ...i, _key: i.id })));
    }).catch(e => setError(e.message)).finally(() => setFetching(false));
  }, [id, form, isEdit]);

  const addRow = () => setRows(r => [...r, emptyRow()]);
  const removeRow = key => setRows(r => r.filter(x => x._key !== key));
  const updateRow = (key, field, value) => setRows(prev => prev.map(r => {
    if (r._key !== key) return r;
    const u = { ...r, [field]: value };
    if (field === 'bags' || field === 'rate') {
      const b = field === 'bags' ? value : r.bags;
      const rt = field === 'rate' ? value : r.rate;
      if (b && rt) u.amount = parseFloat((b * rt).toFixed(2));
    }
    return u;
  }));

  const total = rows.reduce((s, r) => s + (r.amount || 0), 0);
  const totalBags = rows.reduce((s, r) => s + (r.bags || 0), 0);

  const onFinish = async (values) => {
    if (!rows.some(r => r.bags || r.rate)) { message.warning('Add at least one item row'); return; }
    setLoading(true); setError(null);
    try {
      const payload = { ...values, items: rows.filter(r => r.bags || r.rate || r.itemId).map(({ _key, ...r }) => r) };
      isEdit ? await transactionAPI.update(id, payload) : await transactionAPI.create(payload);
      message.success(isEdit ? 'Updated' : 'Saved');
      navigate('/transactions');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const pOpts = parties.map(p => <Option key={p.id} value={p.id}>{p.cashPartyName || p.gstPartyName}</Option>);
  const iOpts = items.map(i => <Option key={i.id} value={i.id}>{i.name}</Option>);
  const cOpts = contracts.map(c => <Option key={c.id} value={c.id}>{c.code?.slice(0, 8)} — {c.contractType?.replace(/_/g, ' ')}</Option>);

  const rowCols = [
    { title: <>Count <L /></>, width: 150, render: (_, r) => <Select value={r.itemId} onChange={v => updateRow(r._key, 'itemId', v)} size="small" style={{ width: '100%' }} allowClear>{iOpts}</Select> },
    { title: <>Quality <M /></>, width: 110, render: (_, r) => <Input value={r.quality} onChange={e => updateRow(r._key, 'quality', e.target.value)} size="small" /> },
    { title: <>Bags <M /></>, width: 80, render: (_, r) => <InputNumber value={r.bags} onChange={v => updateRow(r._key, 'bags', v)} min={0} size="small" style={{ width: '100%' }} /> },
    { title: <>Rate <M /></>, width: 95, render: (_, r) => <InputNumber value={r.rate} onChange={v => updateRow(r._key, 'rate', v)} min={0} precision={2} size="small" style={{ width: '100%' }} /> },
    { title: <>Amount (Rs) <A /></>, width: 120, render: (_, r) => <InputNumber value={r.amount} readOnly size="small" style={{ width: '100%', background: '#f5f5f5' }} formatter={v => v ? `Rs ${Number(v).toLocaleString('en-PK')}` : ''} /> },
    { title: '', width: 32, render: (_, r) => <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeRow(r._key)} disabled={rows.length === 1} /> }
  ];

  if (fetching) return <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => navigate('/transactions')} />
          <h1 className="page-title"><SwapOutlined style={{ marginRight: 6, color: '#1B4F8A' }} />{isEdit ? 'Edit Transaction' : 'Yarn Transaction'}</h1>
        </Space>
        <div className="ref-bar" style={{ margin: 0 }}>
          <span>Ref. No: <strong>{savedCode?.slice(0, 10) || 'DOC-System default'}</strong></span>
          <span>Date: <strong>{new Date().toLocaleDateString('en-PK')}</strong></span>
          {noteConf && <span style={{ color: noteConf.color, fontWeight: 700 }}>{noteConf.doc} <A /></span>}
        </div>
      </div>

      {error && <Alert type="error" message={error} style={{ marginBottom: 8 }} closable onClose={() => setError(null)} />}

      <Form form={form} layout="vertical" onFinish={onFinish} scrollToFirstError>

        {/* ── Row 1: Note type ── */}
        <Card title="Yarn Transaction — Note Type">
          <Form.Item name="noteType" rules={[{ required: true, message: 'Select note type' }]} style={{ marginBottom: 0 }}>
            <Radio.Group onChange={e => setNoteType(e.target.value)} style={{ width: '100%' }}>
              <Row gutter={8}>
                {NOTE_TYPES.map(n => (
                  <Col span={4} key={n.value}>
                    <div style={{
                      border: `1.5px solid ${noteType === n.value ? n.color : '#D9D9D9'}`,
                      borderRadius: 4, padding: '6px 8px',
                      background: noteType === n.value ? '#F0F5FF' : '#fff',
                      cursor: 'pointer', transition: 'all .15s'
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: n.color, marginBottom: 3 }}>{n.doc} {n.doc !== 'Invoice' ? '(auto)' : ''}</div>
                      <Radio value={n.value} style={{ fontSize: 11, fontWeight: 600 }}>{n.label}</Radio>
                    </div>
                  </Col>
                ))}
              </Row>
            </Radio.Group>
          </Form.Item>
        </Card>

        {/* ── Row 2: Party + Contract ── */}
        <Card title="Party & Contract">
          <Row gutter={10}>
            <Col span={8}>
              <Form.Item name="partyId" label={<>Party <L /> <span style={{ color: '#c00', fontSize: 10 }}>Only valid contracts shown</span></>} rules={[{ required: true, message: 'Required' }]}>
                <Select showSearch placeholder="Select party" onChange={v => { setSelectedParty(v); form.setFieldsValue({ contractId: undefined }); }} filterOption={(i, o) => o?.children?.toString().toLowerCase().includes(i.toLowerCase())}>{pOpts}</Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="contractId" label={<>Contract <L /> — Only concerned valid contract</>}>
                <Select showSearch placeholder={selectedParty ? 'Select contract' : 'Select party first'} disabled={!selectedParty} allowClear>{cOpts}</Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ── Row 3: Items table ── */}
        <Card title={<Space>Items — Count / Quality / Bags / Rate / Amount <Tooltip title="Amount = Bags × Rate"><InfoCircleOutlined /></Tooltip></Space>} extra={<Button size="small" icon={<PlusOutlined />} onClick={addRow}>Add row</Button>}>
          <div style={{ overflowX: 'auto' }}>
            <Table dataSource={rows} columns={rowCols} rowKey="_key" pagination={false} size="small" bordered
              footer={() => (
                <Row justify="end" gutter={16}>
                  <Col><Text style={{ fontSize: 12 }}>Total bags: <strong>{totalBags}</strong></Text></Col>
                  <Col><Text style={{ fontSize: 12 }}>Total: <strong style={{ color: '#1B4F8A' }}>Rs {total.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong></Text></Col>
                </Row>
              )}
            />
          </div>
        </Card>

        {/* ── Row 4: Taxes (GST only) + Signatories ── */}
        <Card title={isGst ? 'Taxes & Signatories' : 'Signatories'}>
          <Row gutter={10}>
            {isGst && <>
              <Col span={1} style={{ display: 'flex', alignItems: 'center', paddingTop: 18 }}>
                <Text style={{ fontSize: 9, fontWeight: 700, color: '#1B4F8A', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>TAXES</Text>
              </Col>
              <Col span={3}><Form.Item name="salesTax" label={<>Sales Tax% <M /></>}><InputNumber min={0} max={100} precision={2} style={{ width: '100%' }} addonAfter="%" /></Form.Item></Col>
              <Col span={2}><Form.Item name="fTax" label={<>F-Tax% <M /></>}><InputNumber min={0} max={100} precision={2} style={{ width: '100%' }} addonAfter="%" /></Form.Item></Col>
              <Col span={2}><Form.Item name="aTax" label={<>A-Tax% <M /></>}><InputNumber min={0} max={100} precision={2} style={{ width: '100%' }} addonAfter="%" /></Form.Item></Col>
              <Col span={2}><Form.Item name="iTax" label={<>I-Tax% <M /></>}><InputNumber min={0} max={100} precision={2} style={{ width: '100%' }} addonAfter="%" /></Form.Item></Col>
              <Col span={1}><div style={{ borderLeft: '1px solid #D9D9D9', height: 40, margin: '18px 0 0 8px' }} /></Col>
            </>}
            <Col span={1} style={{ display: 'flex', alignItems: 'center', paddingTop: 18 }}>
              <Text style={{ fontSize: 9, fontWeight: 700, color: '#333', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>SIGN</Text>
            </Col>
            <Col span={4}><Form.Item name="preparedBy" label={<>Prepared <A /></>}><Input readOnly className="readonly-field" placeholder="Name & Date" /></Form.Item></Col>
            <Col span={4}><Form.Item name="checkedBy" label="Checked"><Input placeholder="Name & Date" /></Form.Item></Col>
            <Col span={4}><Form.Item name="approvedBy" label="Approved"><Input placeholder="Name & Date" /></Form.Item></Col>
          </Row>
        </Card>

        <div className="form-actions">
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>{isEdit ? 'Update' : 'Save Transaction'}</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { form.resetFields(); setRows([emptyRow(), emptyRow(), emptyRow()]); setNoteType(null); setSelectedParty(null); }}>Reset</Button>
          <Button onClick={() => navigate('/transactions')}>Cancel</Button>
          {noteConf && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: noteConf.color, background: '#F0F5FF', padding: '3px 10px', borderRadius: 4, border: `1px solid ${noteConf.color}` }}>{noteConf.label} — {noteConf.doc}</span>}
        </div>
      </Form>
    </div>
  );
}
