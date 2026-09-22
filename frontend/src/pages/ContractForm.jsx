import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Form, Input, Select, Button, Row, Col,
  Typography, Space, message, Spin, Alert,
  InputNumber, Table, Divider, Switch
} from 'antd';
import {
  SaveOutlined, ReloadOutlined, ArrowLeftOutlined,
  PlusOutlined, DeleteOutlined, CheckOutlined,
  LeftOutlined, RightOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { contractAPI, partyAPI, itemAPI } from '../services/api';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CONTRACT_TYPES = [
  { value: 'CASH_PURCHASE', label: 'Cash Purchase', color: '#1B4F8A', bg: '#EEF4FF' },
  { value: 'GST_PURCHASE',  label: 'GST Purchase',  color: '#1D6A3A', bg: '#EDFFF4' },
  { value: 'CASH_SALE',     label: 'Cash Sale',     color: '#7A4F00', bg: '#FFF8EE' },
  { value: 'GST_SALE',      label: 'GST Sale',      color: '#6B3AA0', bg: '#F5F0FF' },
  { value: 'SERVICES',      label: 'Services',      color: '#8B4513', bg: '#FFF5EE' },
  { value: 'TRANSACTION',   label: 'Transaction',   color: '#444',    bg: '#F5F5F5' },
];

const TABS = ['Type', 'Items', 'DTC', 'Note/Sign'];

const emptyRow = () => ({
  _key: Date.now() + Math.random(),
  itemId: null, quality: '', bags: null,
  rate: null, clRate: null, amount: null
});

/* ── tiny style helper ── */
const label = (txt) => (
  <span style={{ fontSize: 10, fontWeight: 700, color: '#555',
    textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'Verdana,sans-serif' }}>
    {txt}
  </span>
);

export default function ContractForm() {
  const [form]          = Form.useForm();
  const navigate        = useNavigate();
  const { id }          = useParams();
  const isEdit          = Boolean(id);

  const [tab,          setTab]          = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [fetching,     setFetching]     = useState(false);
  const [error,        setError]        = useState(null);
  const [parties,      setParties]      = useState([]);
  const [items,        setItems]        = useState([]);
  const [rows,         setRows]         = useState([emptyRow(), emptyRow(), emptyRow()]);
  const [contractType, setContractType] = useState(null);
  const [savedCode,    setSavedCode]    = useState(null);

  // keyboard focus refs for type list
  const typeListRef = useRef(null);

  useEffect(() => {
    partyAPI.getAll().then(setParties).catch(() => {});
    itemAPI.getAll().then(setItems).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setFetching(true);
    contractAPI.getById(id).then(data => {
      const { items: ci, ...rest } = data;
      form.setFieldsValue({
        ...rest,
        salesTax:   rest.salesTax   ? Number(rest.salesTax)   : null,
        fTax:       rest.fTax       ? Number(rest.fTax)       : null,
        aTax:       rest.aTax       ? Number(rest.aTax)       : null,
        iTax:       rest.iTax       ? Number(rest.iTax)       : null,
        commission: rest.commission ? Number(rest.commission) : null,
        ocRate1:    rest.ocRate1    ? Number(rest.ocRate1)    : null,
        ocRate2:    rest.ocRate2    ? Number(rest.ocRate2)    : null,
        _bReg: data.bookingParty?.cashPartyName || data.bookingParty?.gstPartyName || '',
        _bIp:  data.bookingParty?.ipConcernPerson || '',
        _bC:   data.bookingParty?.ipCell || '',
        _cCp:  data.chequeParty?.cpConcernPerson || '',
        _cC:   data.chequeParty?.cpCell || '',
      });
      setContractType(data.contractType);
      setSavedCode(data.code);
      if (ci?.length) setRows(ci.map(r => ({
        _key: r.id, itemId: r.itemId, quality: r.quality || '',
        bags: r.bags, rate: r.rate ? Number(r.rate) : null,
        clRate: r.clRate ? Number(r.clRate) : null,
        amount: r.amount ? Number(r.amount) : null,
      })));
    }).catch(e => setError(e.message)).finally(() => setFetching(false));
  }, [id, form, isEdit]);

  const getP = useCallback(pid => parties.find(p => p.id === pid), [parties]);
  const onBP = pid => {
    const p = getP(pid);
    if (p) form.setFieldsValue({ _bReg: p.cashPartyName || p.gstPartyName || '', _bIp: p.ipConcernPerson || '', _bC: p.ipCell || p.cashCell || p.gstCell || '' });
  };
  const onCP = pid => {
    const p = getP(pid);
    if (p) form.setFieldsValue({ _cCp: p.cpConcernPerson || '', _cC: p.cpCell || p.gstCell || '' });
  };

  const addRow    = () => setRows(r => [...r, emptyRow()]);
  const removeRow = key => setRows(r => r.filter(x => x._key !== key));
  const updateRow = (key, field, value) => setRows(prev => prev.map(r => {
    if (r._key !== key) return r;
    const u = { ...r, [field]: value };
    if (field === 'bags' || field === 'rate') {
      const b = field === 'bags' ? value : r.bags;
      const rt = field === 'rate' ? value : r.rate;
      if (b && rt) u.amount = parseFloat((b * rt).toFixed(2));
      u.clRate = u.rate;
    }
    return u;
  }));

  const total     = rows.reduce((s, r) => s + (r.amount || 0), 0);
  const totalBags = rows.reduce((s, r) => s + (r.bags   || 0), 0);

  // Keyboard nav on type list
  const onTypeKeyDown = (e, idx) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); const next = typeListRef.current?.children[idx + 1]; next?.focus(); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); const prev = typeListRef.current?.children[idx - 1]; prev?.focus(); }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectType(CONTRACT_TYPES[idx].value); }
    if (e.key === 'Tab' && !e.shiftKey && idx === CONTRACT_TYPES.length - 1) { setTab(0); }
  };

  const selectType = val => {
    setContractType(val);
    form.setFieldValue('contractType', val);
  };

  const onFinish = async (values) => {
    if (!rows.some(r => r.bags || r.rate)) { message.warning('Add at least one item with bags and rate'); return; }
    setLoading(true); setError(null);
    const { _bReg, _bIp, _bC, _cCp, _cC, ...d } = values;
    try {
      const payload = { ...d, items: rows.filter(r => r.bags || r.rate || r.itemId).map(({ _key, ...r }) => r) };
      isEdit ? await contractAPI.update(id, payload) : await contractAPI.create(payload);
      message.success(isEdit ? 'Contract updated' : 'Contract saved');
      navigate('/contracts');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const pOpts = parties.map(p => (
    <Option key={p.id} value={p.id}>
      {p.cashPartyName || p.gstPartyName}
      <span style={{ fontSize: 10, color: '#888', marginLeft: 6 }}>[{p.type}]</span>
    </Option>
  ));
  const iOpts = items.map(i => <Option key={i.id} value={i.id}>{i.name}</Option>);
  const selType = CONTRACT_TYPES.find(t => t.value === contractType);

  // ── Shared input style ──
  const IS = { fontFamily: 'Verdana,sans-serif', fontSize: 13 };

  // ── Item columns ──
  const rowCols = [
    { title: 'Count', width: 150, render: (_, r) => <Select value={r.itemId} onChange={v => updateRow(r._key, 'itemId', v)} size="small" style={{ width: '100%' }} allowClear>{iOpts}</Select> },
    { title: 'Quality', width: 100, render: (_, r) => <Input value={r.quality} onChange={e => updateRow(r._key, 'quality', e.target.value)} size="small" /> },
    { title: 'Bags', width: 75, render: (_, r) => <InputNumber value={r.bags} onChange={v => updateRow(r._key, 'bags', v)} min={0} size="small" style={{ width: '100%' }} /> },
    { title: 'Rate', width: 90, render: (_, r) => <InputNumber value={r.rate} onChange={v => updateRow(r._key, 'rate', v)} min={0} precision={2} size="small" style={{ width: '100%' }} /> },
    { title: 'C.L Rate', width: 85, render: (_, r) => <InputNumber value={r.clRate} readOnly size="small" style={{ width: '100%', background: '#F5F5F5' }} /> },
    { title: 'Amount (Rs)', width: 115, render: (_, r) => <InputNumber value={r.amount} readOnly size="small" style={{ width: '100%', background: '#F5F5F5' }} formatter={v => v ? `Rs ${Number(v).toLocaleString('en-PK')}` : ''} /> },
    { title: '', width: 32, render: (_, r) => <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeRow(r._key)} disabled={rows.length === 1} tabIndex={-1} /> }
  ];

  if (fetching) return <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />;

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB PANELS
  // ─────────────────────────────────────────────────────────────────────────────

  const TabType = () => (
    <Row gutter={12} style={{ height: '100%' }}>
      {/* Left: Type list */}
      <Col xs={24} sm={6} style={{ borderRight: '1px solid #E8E8E8', paddingRight: 10 }}>
        {label('Contract Type')}
        <div ref={typeListRef} style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {CONTRACT_TYPES.map((t, idx) => (
            <div
              key={t.value}
              tabIndex={0}
              role="button"
              aria-pressed={contractType === t.value}
              onClick={() => selectType(t.value)}
              onKeyDown={e => onTypeKeyDown(e, idx)}
              style={{
                padding: '7px 10px',
                border: `1.5px solid ${contractType === t.value ? t.color : '#D9D9D9'}`,
                borderRadius: 4,
                background: contractType === t.value ? t.bg : '#fff',
                cursor: 'pointer',
                fontWeight: contractType === t.value ? 700 : 400,
                color: contractType === t.value ? t.color : '#333',
                fontSize: 12,
                fontFamily: 'Verdana,sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'all .12s',
                outline: 'none',
              }}
              onFocus={e => e.currentTarget.style.boxShadow = `0 0 0 2px ${t.color}44`}
              onBlur={e => e.currentTarget.style.boxShadow = 'none'}
            >
              {t.label}
              {contractType === t.value && <CheckOutlined style={{ fontSize: 11 }} />}
            </div>
          ))}
        </div>
      </Col>

      {/* Right: Options + Parties */}
      <Col xs={24} sm={18}>
        <Row gutter={8}>
          {/* Options row */}
          <Col span={7}>
            <Form.Item name="partyRefNo" label={label('Party Ref. No')} style={{ marginBottom: 6 }}>
              <Input style={IS} placeholder="Ref number" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="rateOption" label={label('Rate Option')} initialValue="FULL" style={{ marginBottom: 6 }}>
              <Select style={IS}>
                <Option value="FULL">Full</Option>
                <Option value="COM_LESS">Com Less</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={3} style={{ paddingTop: 2 }}>
            <Form.Item name="hasGst" label={label('GST')} valuePropName="checked" style={{ marginBottom: 6 }}>
              <Switch checkedChildren="Yes" unCheckedChildren="No" size="small" />
            </Form.Item>
          </Col>
          <Col span={4} style={{ paddingTop: 2 }}>
            <Form.Item name="hasCommission" label={label('Commission')} valuePropName="checked" style={{ marginBottom: 6 }}>
              <Switch checkedChildren="Yes" unCheckedChildren="No" size="small" />
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: '4px 0 6px' }} />

        {/* Booking party */}
        <div style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#1B4F8A', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'Verdana,sans-serif' }}>
            ▸ Booking Party
          </span>
        </div>
        <Row gutter={8}>
          <Col span={8}>
            <Form.Item name="bookingPartyId" label={label('Party')} rules={[{ required: true, message: 'Required' }]} style={{ marginBottom: 6 }}>
              <Select showSearch placeholder="Select party" onChange={onBP} style={IS}
                filterOption={(i, o) => o?.children?.toString().toLowerCase().includes(i.toLowerCase())}>
                {pOpts}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="_bReg" label={label('Registration')} style={{ marginBottom: 6 }}>
              <Input readOnly style={{ ...IS, background: '#F5F5F5' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="_bIp" label={label('IP Concern Person')} style={{ marginBottom: 6 }}>
              <Input readOnly style={{ ...IS, background: '#F5F5F5' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="_bC" label={label('Contact No.')} style={{ marginBottom: 6 }}>
              <Input readOnly style={{ ...IS, background: '#F5F5F5' }} />
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: '4px 0 6px' }} />

        {/* Cheque party */}
        <div style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#7A4F00', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'Verdana,sans-serif' }}>
            ▸ Cheque Party
          </span>
        </div>
        <Row gutter={8}>
          <Col span={8}>
            <Form.Item name="chequePartyId" label={label('Cheque Party')} style={{ marginBottom: 6 }}>
              <Select showSearch placeholder="Select" onChange={onCP} allowClear style={IS}
                filterOption={(i, o) => o?.children?.toString().toLowerCase().includes(i.toLowerCase())}>
                {pOpts}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="_cCp" label={label('CP Concern Person')} style={{ marginBottom: 6 }}>
              <Input readOnly style={{ ...IS, background: '#F5F5F5' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="_cC" label={label('Contact No.')} style={{ marginBottom: 6 }}>
              <Input readOnly style={{ ...IS, background: '#F5F5F5' }} />
            </Form.Item>
          </Col>
        </Row>
      </Col>
    </Row>
  );

  const TabItems = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        {label('Count · Quality · Bags · Rate → Amount auto-calculated')}
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={addRow}
          style={{ background: '#1B4F8A', borderColor: '#1B4F8A' }}>
          Add row
        </Button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <Table dataSource={rows} columns={rowCols} rowKey="_key" pagination={false} size="small" bordered
          footer={() => (
            <Row justify="end" gutter={24}>
              <Col><Text style={{ fontSize: 12, fontFamily: 'Verdana,sans-serif' }}>Bags: <strong>{totalBags.toLocaleString()}</strong></Text></Col>
              <Col><Text style={{ fontSize: 12, fontFamily: 'Verdana,sans-serif' }}>Total: <strong style={{ color: '#1B4F8A' }}>Rs {total.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong></Text></Col>
            </Row>
          )}
        />
      </div>
    </div>
  );

  const TabDTC = () => (
    <Row gutter={20}>
      {/* Days */}
      <Col xs={24} sm={4}>
        {label('Days')}
        <Form.Item name="creditDays" label={label('Credit Days')} style={{ marginTop: 6, marginBottom: 0 }}>
          <InputNumber min={0} style={{ width: '100%', fontFamily: 'Verdana,sans-serif' }} addonAfter="d" placeholder="0" />
        </Form.Item>
      </Col>

      <Col xs={0} sm={1} style={{ borderLeft: '1px solid #E8E8E8', padding: 0, margin: '0 4px' }} />

      {/* Taxes */}
      <Col xs={24} sm={9}>
        {label('Taxes')}
        <Row gutter={6} style={{ marginTop: 6 }}>
          {[['salesTax','Sales Tax %'],['fTax','F-Tax %'],['aTax','A-Tax %'],['iTax','I-Tax %']].map(([name, lbl]) => (
            <Col span={12} key={name}>
              <Form.Item name={name} label={label(lbl)} style={{ marginBottom: 6 }}>
                <InputNumber min={0} max={100} precision={2} style={{ width: '100%', fontFamily: 'Verdana,sans-serif' }} addonAfter="%" placeholder="0.00" />
              </Form.Item>
            </Col>
          ))}
        </Row>
      </Col>

      <Col xs={0} sm={1} style={{ borderLeft: '1px solid #E8E8E8', padding: 0, margin: '0 4px' }} />

      {/* Commission */}
      <Col xs={24} sm={9}>
        {label('Commission')}
        <Row gutter={6} style={{ marginTop: 6 }}>
          <Col span={12}>
            <Form.Item name="commission" label={label('Comm %')} style={{ marginBottom: 6 }}>
              <InputNumber min={0} max={100} precision={2} style={{ width: '100%', fontFamily: 'Verdana,sans-serif' }} addonAfter="%" placeholder="0.00" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="othersCom1Id" label={label('Others Com-1')} style={{ marginBottom: 4 }}>
              <Select showSearch placeholder="Select party" allowClear style={{ fontFamily: 'Verdana,sans-serif' }}
                filterOption={(i, o) => o?.children?.toString().toLowerCase().includes(i.toLowerCase())}>
                {pOpts}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="ocRate1" label={label('Rate-1')} style={{ marginBottom: 4 }}>
              <InputNumber min={0} precision={2} style={{ width: '100%', fontFamily: 'Verdana,sans-serif' }} placeholder="0.00" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="othersCom2Id" label={label('Others Com-2')} style={{ marginBottom: 4 }}>
              <Select showSearch placeholder="Select party" allowClear style={{ fontFamily: 'Verdana,sans-serif' }}
                filterOption={(i, o) => o?.children?.toString().toLowerCase().includes(i.toLowerCase())}>
                {pOpts}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="ocRate2" label={label('Rate-2')} style={{ marginBottom: 0 }}>
              <InputNumber min={0} precision={2} style={{ width: '100%', fontFamily: 'Verdana,sans-serif' }} placeholder="0.00" />
            </Form.Item>
          </Col>
        </Row>
      </Col>
    </Row>
  );

  const TabSign = () => (
    <Row gutter={16}>
      <Col xs={24} sm={10}>
        {label('Special Note')}
        <Form.Item name="specialNote" style={{ marginTop: 6, marginBottom: 0 }}>
          <TextArea rows={4} placeholder="Special instructions..." maxLength={500} showCount
            style={{ fontFamily: 'Verdana,sans-serif', fontSize: 13, resize: 'none' }} />
        </Form.Item>
      </Col>
      <Col xs={24} sm={14}>
        {label('Signatories')}
        <Row gutter={8} style={{ marginTop: 6 }}>
          {[['preparedBy','Prepared'],['checkedBy','Checked'],['approvedBy','Approved']].map(([name, lbl]) => (
            <Col span={8} key={name}>
              <div style={{ border: '1px solid #D9D9D9', borderRadius: 5, padding: '8px 10px', background: '#FAFAFA', textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, fontFamily: 'Verdana,sans-serif' }}>{lbl}</div>
                <Form.Item name={name} style={{ marginBottom: 0 }}>
                  <Input placeholder="Name & Date" style={{ textAlign: 'center', fontFamily: 'Verdana,sans-serif', fontSize: 12 }} />
                </Form.Item>
              </div>
            </Col>
          ))}
        </Row>
      </Col>
    </Row>
  );

  const panels = [<TabType />, <TabItems />, <TabDTC />, <TabSign />];

  // ── Tab keyboard navigation ──
  const onTabKeyDown = (e, idx) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); setTab(Math.min(idx + 1, TABS.length - 1)); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); setTab(Math.max(idx - 1, 0)); }
  };

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Space size={6}>
          <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => navigate('/contracts')} />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E', fontFamily: 'Verdana,sans-serif' }}>
            {isEdit ? 'Edit Contract' : 'Sale / Purchase Contract'}
          </span>
          {selType && (
            <span style={{
              background: selType.bg, color: selType.color,
              border: `1.5px solid ${selType.color}`,
              borderRadius: 3, padding: '1px 8px',
              fontSize: 11, fontWeight: 700, fontFamily: 'Verdana,sans-serif'
            }}>
              {selType.label}
            </span>
          )}
        </Space>
        <div className="ref-bar" style={{ margin: 0, padding: '4px 10px' }}>
          {savedCode && <span>Code: <strong>{savedCode.slice(0, 8)}</strong></span>}
          <span>Date: <strong>{new Date().toLocaleDateString('en-PK')}</strong></span>
          {total > 0 && <span style={{ color: '#1B4F8A', fontWeight: 700 }}>Rs {total.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>}
        </div>
      </div>

      {error && <Alert type="error" message={error} style={{ marginBottom: 8 }} closable onClose={() => setError(null)} />}

      <Form form={form} layout="vertical" onFinish={onFinish} scrollToFirstError>

        {/* ── Tab bar ── */}
        <div style={{ display: 'flex', alignItems: 'stretch', background: '#E8EDF2', borderRadius: '6px 6px 0 0', padding: '5px 8px 0', gap: 3, borderBottom: 'none' }} role="tablist">
          {TABS.map((t, idx) => {
            const active = tab === idx;
            const done   = idx < tab;
            return (
              <button
                key={t} role="tab" aria-selected={active}
                tabIndex={active ? 0 : -1}
                onClick={() => setTab(idx)}
                onKeyDown={e => onTabKeyDown(e, idx)}
                style={{
                  padding: '6px 18px',
                  border: `1.5px solid ${active ? '#1B4F8A' : '#C5CDD8'}`,
                  borderBottom: active ? '1.5px solid #fff' : '1.5px solid #C5CDD8',
                  borderRadius: '4px 4px 0 0',
                  background: active ? '#fff' : done ? '#D4E8D4' : '#F0F2F5',
                  cursor: 'pointer',
                  fontFamily: 'Verdana,sans-serif',
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#1B4F8A' : done ? '#1D6A3A' : '#555',
                  display: 'flex', alignItems: 'center', gap: 5,
                  transition: 'all .1s',
                  marginBottom: active ? -1 : 0,
                  outline: 'none',
                  whiteSpace: 'nowrap',
                }}
                onFocus={e => { if (!active) e.currentTarget.style.background = '#E0EAF5'; }}
                onBlur={e => { if (!active) e.currentTarget.style.background = done ? '#D4E8D4' : '#F0F2F5'; }}
              >
                {done && <CheckOutlined style={{ fontSize: 10 }} />}
                {idx + 1}. {t}
              </button>
            );
          })}

          {/* Prev / Next keyboard-friendly */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center', paddingBottom: 5 }}>
            <Button size="small" icon={<LeftOutlined />} disabled={tab === 0}
              onClick={() => setTab(t => Math.max(t - 1, 0))}
              title="Previous tab (←)" />
            <Button size="small" icon={<RightOutlined />} disabled={tab === TABS.length - 1}
              onClick={() => setTab(t => Math.min(t + 1, TABS.length - 1))}
              type={tab < TABS.length - 1 ? 'primary' : 'default'}
              style={tab < TABS.length - 1 ? { background: '#1B4F8A', borderColor: '#1B4F8A' } : {}}
              title="Next tab (→)" />
          </div>
        </div>

        {/* ── Panel ── */}
        <div role="tabpanel" style={{
          background: '#fff',
          border: '1.5px solid #C5CDD8',
          borderTop: 'none',
          borderRadius: '0 0 6px 6px',
          padding: '12px 14px',
          minHeight: 300,
        }}>
          {panels[tab]}
        </div>

        {/* ── Action bar ── */}
        <div className="form-actions" style={{ marginTop: 8, padding: '7px 12px' }}>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}
            style={{ background: '#1B4F8A', borderColor: '#1B4F8A' }}>
            {isEdit ? 'Update' : 'Save Contract'}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => { form.resetFields(); setRows([emptyRow(), emptyRow(), emptyRow()]); setContractType(null); setTab(0); }}>
            Reset
          </Button>
          <Button onClick={() => navigate('/contracts')}>Cancel</Button>

          {/* Shortcut hints */}
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#999', fontFamily: 'Verdana,sans-serif' }}>
            ← → Arrow keys to switch tabs &nbsp;|&nbsp; ↑ ↓ to navigate contract types &nbsp;|&nbsp; Enter to select
          </span>
        </div>
      </Form>
    </div>
  );
}
