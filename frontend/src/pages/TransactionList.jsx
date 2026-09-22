import React, { useEffect, useState, useCallback } from 'react';
import {
  Tabs, Card, Row, Col, Select, Button, Table, Typography,
  Tag, Space, Alert, Spin, InputNumber, message, Divider,
  Modal, Descriptions, Input
} from 'antd';
import {
  PrinterOutlined, FileTextOutlined, SwapOutlined,
  CheckCircleOutlined, UserOutlined, ReloadOutlined,
  RetweetOutlined, FileDoneOutlined, DollarOutlined
} from '@ant-design/icons';
import { partyAPI, contractAPI, transactionAPI } from '../services/api';

const { Text } = Typography;
const { Option } = Select;

const IS = { fontFamily: 'Verdana,sans-serif', fontSize: 13 };
const lbl = (t) => (
  <span style={{ fontSize: 10, fontWeight: 700, color: '#555',
    textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'Verdana,sans-serif' }}>
    {t}
  </span>
);

// ─── Shared header for all print previews ────────────────────────────────────
function PrintHeader({ title, refNo, color }) {
  return (
    <div style={{ borderBottom: '2px solid #333', paddingBottom: 8, marginBottom: 12 }}>
      <Row justify="space-between" align="top">
        <Col>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Verdana,sans-serif' }}>Company ABC XYZ</div>
          <div style={{ fontSize: 12, color: '#555', fontFamily: 'Verdana,sans-serif' }}>Yarn Market, Faisalabad</div>
        </Col>
        <Col style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color, fontFamily: 'Verdana,sans-serif',
            border: `2px solid ${color}`, borderRadius: 4, padding: '2px 12px' }}>
            {title}
          </div>
        </Col>
        <Col style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, fontFamily: 'Verdana,sans-serif' }}>
            Ref. No: <strong>{refNo || 'DOC-System default'}</strong>
          </div>
          <div style={{ fontSize: 12, fontFamily: 'Verdana,sans-serif' }}>
            Date: <strong>{new Date().toLocaleDateString('en-PK')}</strong>
          </div>
        </Col>
      </Row>
    </div>
  );
}

// ─── Shared print signature row ───────────────────────────────────────────────
function PrintSignatures() {
  return (
    <Row gutter={16} style={{ marginTop: 36 }}>
      {['Prepared', 'Checked', 'Approved'].map(s => (
        <Col span={8} key={s} style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #333', paddingTop: 6, fontFamily: 'Verdana,sans-serif', fontSize: 12 }}>{s}</div>
          <div style={{ fontSize: 11, color: '#888', fontFamily: 'Verdana,sans-serif' }}>Name & Date</div>
        </Col>
      ))}
    </Row>
  );
}

// ─── Shared items table for print ─────────────────────────────────────────────
function PrintItemsTable({ rows, totalBags, totalValue }) {
  return (
    <Table
      dataSource={rows.filter(r => r.bags > 0)}
      rowKey="_key"
      size="small"
      bordered
      pagination={false}
      columns={[
        { title: 'Count/Yarn', render: (_, r) => r.yarnName, width: 160 },
        { title: 'Quality',    dataIndex: 'quality',  width: 100 },
        { title: 'Bags',       dataIndex: 'bags',     width: 70  },
        { title: 'Rate (Rs)',  render: (_, r) => `Rs ${r.rate?.toLocaleString('en-PK')}`, width: 100 },
        { title: 'Amount (Rs)', render: (_, r) => `Rs ${r.value?.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`, width: 120 },
      ]}
      footer={() => (
        <Row justify="end" gutter={20} style={{ fontFamily: 'Verdana,sans-serif' }}>
          <Col><strong>Total Bags: {totalBags}</strong></Col>
          <Col><strong>Total: Rs {totalValue?.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong></Col>
        </Row>
      )}
    />
  );
}

// ─── PANEL: Yarn Receipt / Yarn Issue ─────────────────────────────────────────
function YarnPanel({ noteType, docLabel, color, bgColor }) {
  const [step,          setStep]          = useState(1);
  const [cashGst,       setCashGst]       = useState(null);
  const [parties,       setParties]       = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [partyObj,      setPartyObj]      = useState(null);
  const [rows,          setRows]          = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState(null);
  const [printModal,    setPrintModal]    = useState(false);
  const [savedTxn,      setSavedTxn]      = useState(null);

  useEffect(() => {
    if (!cashGst) return;
    setLoading(true);
    partyAPI.getAll()
      .then(all => setParties(all.filter(p => p.type === cashGst)))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [cashGst]);

  useEffect(() => {
    if (!selectedParty) return;
    setLoading(true);
    contractAPI.getAll()
      .then(all => {
        const relevant = all.filter(c =>
          c.bookingPartyId === selectedParty || c.chequePartyId === selectedParty
        );
        const built = relevant.flatMap(c =>
          (c.items || []).map(ci => ({
            _key: `${c.id}-${ci.id}`,
            contractId: c.id,
            contractCode: c.code?.slice(0, 8),
            contractType: c.contractType?.replace(/_/g, ' '),
            itemId: ci.itemId,
            yarnName: ci.item?.name || '—',
            quality: ci.quality || '—',
            rate: ci.rate ? Number(ci.rate) : 0,
            maxBags: ci.bags || 0,
            bags: null, value: null,
          }))
        );
        setRows(built);
        setStep(3);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedParty]);

  const onPartySelect = pid => {
    setSelectedParty(pid);
    setPartyObj(parties.find(x => x.id === pid));
  };

  const updateBags = (key, bags) => {
    setRows(prev => prev.map(r => {
      if (r._key !== key) return r;
      const value = bags && r.rate ? parseFloat((bags * r.rate).toFixed(2)) : null;
      return { ...r, bags, value };
    }));
  };

  const totalBags  = rows.reduce((s, r) => s + (r.bags  || 0), 0);
  const totalValue = rows.reduce((s, r) => s + (r.value || 0), 0);
  const filledRows = rows.filter(r => r.bags > 0);
  const partyName  = partyObj?.cashPartyName || partyObj?.gstPartyName || '';

  const handleSave = async () => {
    if (!filledRows.length) { message.warning('Enter bags for at least one item'); return; }
    setSaving(true); setError(null);
    try {
      const saved = await transactionAPI.create({
        noteType: noteType + '_' + cashGst,
        partyId: selectedParty,
        items: filledRows.map(r => ({ itemId: r.itemId, quality: r.quality, bags: r.bags, rate: r.rate, amount: r.value })),
      });
      setSavedTxn(saved); setStep(4);
      message.success(`${docLabel} saved`);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleReset = () => {
    setStep(1); setCashGst(null); setSelectedParty(null);
    setPartyObj(null); setRows([]); setError(null); setSavedTxn(null);
  };

  const rowCols = [
    { title: 'Contract', width: 110, render: (_, r) => <><Text code style={{ fontSize: 11 }}>{r.contractCode}</Text><br /><Text style={{ fontSize: 10, color: '#888' }}>{r.contractType}</Text></> },
    { title: 'Yarn / Count', width: 140, render: (_, r) => <strong>{r.yarnName}</strong> },
    { title: 'Quality', dataIndex: 'quality', width: 90 },
    { title: 'Rate (Rs)', width: 90, render: (_, r) => <Text style={{ color: '#1B4F8A', fontWeight: 700 }}>Rs {r.rate?.toLocaleString('en-PK')}</Text> },
    {
      title: <span>Bags <Tag color="orange" style={{ fontSize: 10 }}>ENTER</Tag></span>,
      width: 120,
      render: (_, r) => (
        <InputNumber value={r.bags} onChange={v => updateBags(r._key, v)}
          min={0} placeholder={`Max ${r.maxBags}`} size="small"
          style={{ width: '100%', borderColor: r.bags ? color : undefined }} />
      )
    },
    {
      title: <span>Value (Rs) <Tag color="blue" style={{ fontSize: 10 }}>AUTO</Tag></span>,
      width: 130,
      render: (_, r) => r.value
        ? <Text style={{ color: '#1D6A3A', fontWeight: 700 }}>Rs {r.value.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</Text>
        : <Text type="secondary">—</Text>
    },
  ];

  return (
    <div>
      {error && <Alert type="error" message={error} style={{ marginBottom: 8 }} closable onClose={() => setError(null)} />}

      {/* Step 1: Cash/GST */}
      <Card size="small" style={{ marginBottom: 8, borderLeft: `4px solid ${color}` }}
        title={<span style={{ color, fontWeight: 700, fontSize: 12, fontFamily: 'Verdana,sans-serif' }}>Step 1 — Cash or GST?</span>}>
        <Space size={10}>
          {['CASH', 'GST'].map(t => (
            <div key={t} onClick={() => { setCashGst(t); setStep(2); setSelectedParty(null); setPartyObj(null); setRows([]); setStep(2); }}
              style={{ padding: '8px 26px', border: `2px solid ${cashGst === t ? color : '#D9D9D9'}`,
                borderRadius: 5, background: cashGst === t ? bgColor : '#fff',
                cursor: 'pointer', fontWeight: 700, fontSize: 14, color: cashGst === t ? color : '#555',
                fontFamily: 'Verdana,sans-serif', transition: 'all .12s' }}>
              {t === 'CASH' ? '💵 CASH' : '🧾 GST'}
            </div>
          ))}
        </Space>
      </Card>

      {/* Step 2: Party */}
      {step >= 2 && cashGst && (
        <Card size="small" style={{ marginBottom: 8, borderLeft: `4px solid ${color}` }}
          title={<span style={{ color, fontWeight: 700, fontSize: 12, fontFamily: 'Verdana,sans-serif' }}>Step 2 — Select Party</span>}>
          {loading ? <Spin size="small" /> : (
            <Row gutter={10} align="middle">
              <Col span={10}>
                <Select showSearch style={{ width: '100%', ...IS }} size="large"
                  placeholder={`Select ${cashGst} party...`} value={selectedParty}
                  onChange={onPartySelect}
                  filterOption={(i, o) => o?.children?.toString().toLowerCase().includes(i.toLowerCase())}>
                  {parties.map(p => (
                    <Option key={p.id} value={p.id}>
                      <UserOutlined style={{ marginRight: 6, color: '#888' }} />
                      {p.cashPartyName || p.gstPartyName}
                    </Option>
                  ))}
                </Select>
              </Col>
              {partyObj && (
                <Col>
                  <Tag color="green" style={{ fontSize: 12, padding: '3px 10px' }}>
                    <CheckCircleOutlined /> {partyName} {partyObj.ipCell && `— ${partyObj.ipCell}`}
                  </Tag>
                </Col>
              )}
            </Row>
          )}
        </Card>
      )}

      {/* Step 3: Items */}
      {step >= 3 && (
        <Card size="small" style={{ marginBottom: 8, borderLeft: `4px solid ${color}` }}
          title={
            <Row justify="space-between">
              <Col><span style={{ color, fontWeight: 700, fontSize: 12, fontFamily: 'Verdana,sans-serif' }}>Step 3 — Enter Bags (Rate & Value auto from contracts)</span></Col>
              <Col><Space><Text style={{ fontSize: 12, fontFamily: 'Verdana,sans-serif' }}>Bags: <strong>{totalBags}</strong></Text><Text style={{ fontSize: 12, fontFamily: 'Verdana,sans-serif' }}>Total: <strong style={{ color }}>Rs {totalValue.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong></Text></Space></Col>
            </Row>
          }>
          {rows.length === 0
            ? <Alert type="warning" message="No contract items found for this party. Add contracts first." />
            : <div style={{ overflowX: 'auto' }}>
                <Table dataSource={rows} columns={rowCols} rowKey="_key" size="small" pagination={false} bordered
                  rowClassName={r => r.bags > 0 ? 'new-row' : ''}
                  footer={() => (
                    <Row justify="end" gutter={20}>
                      <Col><Text style={{ fontSize: 12, fontFamily: 'Verdana,sans-serif' }}>Total bags: <strong>{totalBags}</strong></Text></Col>
                      <Col><Text style={{ fontSize: 13, fontFamily: 'Verdana,sans-serif' }}>Grand total: <strong style={{ color, fontSize: 14 }}>Rs {totalValue.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong></Text></Col>
                    </Row>
                  )} />
              </div>
          }
        </Card>
      )}

      {/* Step 4: Done */}
      {step === 4 && savedTxn && (
        <Card size="small" style={{ marginBottom: 8, borderLeft: '4px solid #1D6A3A', background: '#F0FFF4' }}>
          <Row align="middle" gutter={10}>
            <Col><CheckCircleOutlined style={{ fontSize: 22, color: '#1D6A3A' }} /></Col>
            <Col flex={1}>
              <Text style={{ fontSize: 13, fontWeight: 700, color: '#1D6A3A', fontFamily: 'Verdana,sans-serif' }}>{docLabel} saved!</Text>
              <Text style={{ fontSize: 12, display: 'block', fontFamily: 'Verdana,sans-serif' }}>
                Ref: <strong>{savedTxn.code?.slice(0, 10)}</strong> · Party: <strong>{partyName}</strong> · Bags: <strong>{totalBags}</strong> · Rs <strong>{totalValue.toLocaleString('en-PK')}</strong>
              </Text>
            </Col>
          </Row>
        </Card>
      )}

      {/* Actions */}
      {step >= 3 && (
        <div className="form-actions">
          <Button type="primary" size="large" icon={<FileTextOutlined />} loading={saving}
            onClick={step < 4 ? handleSave : undefined} disabled={step === 4}
            style={{ background: color, borderColor: color, minWidth: 130 }}>
            {step === 4 ? `${docLabel} Saved ✓` : `Save ${docLabel}`}
          </Button>
          {step === 4 && (
            <Button size="large" icon={<PrinterOutlined />} onClick={() => setPrintModal(true)}
              style={{ borderColor: color, color }}>
              Print {docLabel}
            </Button>
          )}
          <Button icon={<ReloadOutlined />} onClick={handleReset}>New {docLabel}</Button>
        </div>
      )}

      {/* Print modal */}
      <Modal open={printModal} onCancel={() => setPrintModal(false)} width={720}
        title={<span style={{ fontFamily: 'Verdana,sans-serif', fontWeight: 700 }}>Gate Pass — {docLabel} Preview</span>}
        footer={[
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => window.print()} style={{ background: color, borderColor: color }}>Print</Button>,
          <Button key="close" onClick={() => setPrintModal(false)}>Close</Button>
        ]}>
        <div style={{ fontFamily: 'Verdana,sans-serif', fontSize: 13 }}>
          <PrintHeader title={`GATE PASS (${docLabel})`} refNo={savedTxn?.code?.slice(0, 10)} color={color} />
          <Descriptions size="small" bordered column={2} style={{ marginBottom: 10 }}>
            <Descriptions.Item label="Party">{partyName}</Descriptions.Item>
            <Descriptions.Item label="Type"><Tag color={cashGst === 'GST' ? 'blue' : 'default'}>{cashGst}</Tag></Descriptions.Item>
            <Descriptions.Item label="Pally Dar Name (if any)">—</Descriptions.Item>
            <Descriptions.Item label="Godown Ref. No">—</Descriptions.Item>
          </Descriptions>
          <PrintItemsTable rows={rows} totalBags={totalBags} totalValue={totalValue} />
          {cashGst === 'GST' && (
            <div style={{ marginTop: 8, padding: '6px 10px', background: '#F0F8FF', border: '1px solid #B0D0F0', borderRadius: 4, fontSize: 12 }}>
              Taxes Calculation (auto show only in case of GST select)
            </div>
          )}
          <PrintSignatures />
        </div>
      </Modal>
    </div>
  );
}

// ─── PANEL: Return Note ───────────────────────────────────────────────────────
function ReturnPanel() {
  const color = '#8B1A1A';
  const [returnType,    setReturnType]    = useState(null); // PURCHASE_RETURN | SALE_RETURN
  const [cashGst,       setCashGst]       = useState(null);
  const [parties,       setParties]       = useState([]);
  const [transactions,  setTransactions]  = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [partyObj,      setPartyObj]      = useState(null);
  const [rows,          setRows]          = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState(null);
  const [printModal,    setPrintModal]    = useState(false);
  const [savedTxn,      setSavedTxn]      = useState(null);

  // doc label based on return type
  const docLabel = returnType === 'PURCHASE_RETURN' ? 'OGP' : 'IGP';
  const stockEffect = returnType === 'PURCHASE_RETURN' ? 'Stock Less' : 'Stock Add';

  useEffect(() => {
    if (!cashGst) return;
    setLoading(true);
    partyAPI.getAll()
      .then(all => setParties(all.filter(p => p.type === cashGst)))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [cashGst]);

  useEffect(() => {
    if (!selectedParty || !returnType) return;
    setLoading(true);
    // Load only the relevant IGP/OGP transactions for this party
    transactionAPI.getAll()
      .then(all => {
        const noteFilter = returnType === 'PURCHASE_RETURN'
          ? ['YARN_RECEIPT_CASH', 'YARN_RECEIPT_GST']
          : ['YARN_ISSUE_CASH',   'YARN_ISSUE_GST'];
        const relevant = all.filter(t =>
          t.partyId === selectedParty && noteFilter.includes(t.noteType)
        );
        const built = relevant.flatMap(t =>
          (t.items || []).map(ti => ({
            _key:     `${t.id}-${ti.id}`,
            txnId:    t.id,
            txnCode:  t.code?.slice(0, 8),
            txnType:  t.noteType,
            itemId:   ti.itemId,
            yarnName: ti.item?.name || '—',
            quality:  ti.quality || '—',
            rate:     ti.rate ? Number(ti.rate) : 0,
            origBags: ti.bags || 0,
            bags:     null, value: null,
          }))
        );
        setRows(built);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedParty, returnType]);

  const onPartySelect = pid => {
    setSelectedParty(pid);
    setPartyObj(parties.find(x => x.id === pid));
    setRows([]);
  };

  const updateBags = (key, bags) => {
    setRows(prev => prev.map(r => {
      if (r._key !== key) return r;
      const value = bags && r.rate ? parseFloat((bags * r.rate).toFixed(2)) : null;
      return { ...r, bags, value };
    }));
  };

  const totalBags  = rows.reduce((s, r) => s + (r.bags  || 0), 0);
  const totalValue = rows.reduce((s, r) => s + (r.value || 0), 0);
  const filledRows = rows.filter(r => r.bags > 0);
  const partyName  = partyObj?.cashPartyName || partyObj?.gstPartyName || '';

  const handleSave = async () => {
    if (!filledRows.length) { message.warning('Enter bags to return'); return; }
    setSaving(true); setError(null);
    try {
      const noteType = returnType === 'PURCHASE_RETURN'
        ? (cashGst === 'GST' ? 'YARN_RECEIPT_GST' : 'YARN_RECEIPT_CASH')
        : (cashGst === 'GST' ? 'YARN_ISSUE_GST'   : 'YARN_ISSUE_CASH');
      const saved = await transactionAPI.create({
        noteType: `RETURN_${noteType}`,
        partyId: selectedParty,
        items: filledRows.map(r => ({ itemId: r.itemId, quality: r.quality, bags: r.bags, rate: r.rate, amount: r.value })),
      });
      setSavedTxn(saved);
      message.success('Return note saved');
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleReset = () => {
    setReturnType(null); setCashGst(null); setSelectedParty(null);
    setPartyObj(null); setRows([]); setError(null); setSavedTxn(null);
  };

  const rowCols = [
    { title: 'IGP/OGP Ref', width: 95, render: (_, r) => <Text code style={{ fontSize: 11 }}>{r.txnCode}</Text> },
    { title: 'Yarn / Count', width: 140, render: (_, r) => <strong>{r.yarnName}</strong> },
    { title: 'Quality', dataIndex: 'quality', width: 90 },
    { title: 'Rate (Rs)', width: 90, render: (_, r) => <Text style={{ color: '#1B4F8A', fontWeight: 700 }}>Rs {r.rate?.toLocaleString('en-PK')}</Text> },
    { title: `Orig Bags`, width: 80, render: (_, r) => <Text type="secondary">{r.origBags}</Text> },
    { title: <span>Return Bags <Tag color="red" style={{ fontSize: 10 }}>ENTER</Tag></span>, width: 120,
      render: (_, r) => <InputNumber value={r.bags} onChange={v => updateBags(r._key, v)} min={0} max={r.origBags} size="small" style={{ width: '100%', borderColor: r.bags ? color : undefined }} /> },
    { title: <span>Value (Rs) <Tag color="blue" style={{ fontSize: 10 }}>AUTO</Tag></span>, width: 120,
      render: (_, r) => r.value ? <Text style={{ color, fontWeight: 700 }}>Rs {r.value.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</Text> : <Text type="secondary">—</Text> },
  ];

  return (
    <div>
      {error && <Alert type="error" message={error} style={{ marginBottom: 8 }} closable onClose={() => setError(null)} />}

      {/* Step 1: Return type */}
      <Card size="small" style={{ marginBottom: 8, borderLeft: `4px solid ${color}` }}
        title={<span style={{ color, fontWeight: 700, fontSize: 12, fontFamily: 'Verdana,sans-serif' }}>Step 1 — Return Type</span>}>
        <Row gutter={10}>
          {[
            { val: 'PURCHASE_RETURN', label: 'Purchase Return Note', doc: 'OGP (auto)', effect: '→ Stock Less', bg: '#FFF0F0' },
            { val: 'SALE_RETURN',     label: 'Sale Return Note',     doc: 'IGP (auto)', effect: '→ Stock Add',  bg: '#F0FFF4' },
          ].map(t => (
            <Col span={12} key={t.val}>
              <div onClick={() => setReturnType(t.val)} style={{
                padding: '10px 14px', border: `2px solid ${returnType === t.val ? color : '#D9D9D9'}`,
                borderRadius: 5, background: returnType === t.val ? t.bg : '#fff',
                cursor: 'pointer', fontFamily: 'Verdana,sans-serif', transition: 'all .12s'
              }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: returnType === t.val ? color : '#333' }}>{t.label}</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>
                  CASH - GST &nbsp;|&nbsp; <span style={{ color: '#1B4F8A', fontWeight: 700 }}>{t.doc}</span>
                  &nbsp; <Tag color={t.val === 'PURCHASE_RETURN' ? 'red' : 'green'} style={{ fontSize: 10 }}>{t.effect}</Tag>
                </div>
              </div>
            </Col>
          ))}
        </Row>
        {returnType && (
          <div style={{ marginTop: 10, padding: '6px 10px', background: '#FFFBE6', border: '1px solid #FFD666', borderRadius: 4, fontSize: 12, fontFamily: 'Verdana,sans-serif' }}>
            Return Note ref: <strong>By Default Ref. as per above selection — {docLabel}</strong>
            &nbsp;&nbsp;|&nbsp;&nbsp; Effect: <strong>{stockEffect}</strong>
          </div>
        )}
      </Card>

      {/* Step 2: Cash/GST */}
      {returnType && (
        <Card size="small" style={{ marginBottom: 8, borderLeft: `4px solid ${color}` }}
          title={<span style={{ color, fontWeight: 700, fontSize: 12, fontFamily: 'Verdana,sans-serif' }}>Step 2 — Cash or GST?</span>}>
          <Space size={10}>
            {['CASH', 'GST'].map(t => (
              <div key={t} onClick={() => { setCashGst(t); setSelectedParty(null); setPartyObj(null); setRows([]); }}
                style={{ padding: '7px 22px', border: `2px solid ${cashGst === t ? color : '#D9D9D9'}`,
                  borderRadius: 5, background: cashGst === t ? '#FFF0F0' : '#fff',
                  cursor: 'pointer', fontWeight: 700, fontSize: 13, color: cashGst === t ? color : '#555',
                  fontFamily: 'Verdana,sans-serif', transition: 'all .12s' }}>
                {t === 'CASH' ? '💵 CASH' : '🧾 GST'}
              </div>
            ))}
          </Space>
        </Card>
      )}

      {/* Step 3: Party */}
      {returnType && cashGst && (
        <Card size="small" style={{ marginBottom: 8, borderLeft: `4px solid ${color}` }}
          title={<span style={{ color, fontWeight: 700, fontSize: 12, fontFamily: 'Verdana,sans-serif' }}>Step 3 — Select Party (LOV — only received/issued IGP/OGP parties)</span>}>
          {loading ? <Spin size="small" /> : (
            <Row gutter={10} align="middle">
              <Col span={10}>
                <Select showSearch style={{ width: '100%', ...IS }} size="large"
                  placeholder="Select party..." value={selectedParty} onChange={onPartySelect}
                  filterOption={(i, o) => o?.children?.toString().toLowerCase().includes(i.toLowerCase())}>
                  {parties.map(p => <Option key={p.id} value={p.id}>{p.cashPartyName || p.gstPartyName}</Option>)}
                </Select>
              </Col>
              {partyObj && <Col><Tag color="green" style={{ fontSize: 12, padding: '3px 10px' }}><CheckCircleOutlined /> {partyName}</Tag></Col>}
            </Row>
          )}
        </Card>
      )}

      {/* Step 4: Items from IGP/OGP */}
      {selectedParty && (
        <Card size="small" style={{ marginBottom: 8, borderLeft: `4px solid ${color}` }}
          title={
            <Row justify="space-between">
              <Col><span style={{ color, fontWeight: 700, fontSize: 12, fontFamily: 'Verdana,sans-serif' }}>Step 4 — Enter Return Bags (from {returnType === 'PURCHASE_RETURN' ? 'OGP' : 'IGP'} records)</span></Col>
              <Col><Text style={{ fontSize: 12, fontFamily: 'Verdana,sans-serif' }}>Total: <strong style={{ color }}>Rs {totalValue.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong></Text></Col>
            </Row>
          }>
          {rows.length === 0
            ? <Alert type="warning" message={`No ${returnType === 'PURCHASE_RETURN' ? 'OGP' : 'IGP'} records found for this party.`} />
            : <div style={{ overflowX: 'auto' }}>
                <Table dataSource={rows} columns={rowCols} rowKey="_key" size="small" pagination={false} bordered
                  rowClassName={r => r.bags > 0 ? 'new-row' : ''}
                  footer={() => (
                    <Row justify="end" gutter={20}>
                      <Col><Text style={{ fontSize: 12, fontFamily: 'Verdana,sans-serif' }}>Return bags: <strong>{totalBags}</strong></Text></Col>
                      <Col><Text style={{ fontSize: 12, fontFamily: 'Verdana,sans-serif' }}>Return value: <strong style={{ color }}>Rs {totalValue.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong></Text></Col>
                    </Row>
                  )} />
              </div>
          }
        </Card>
      )}

      {selectedParty && rows.length > 0 && (
        <div className="form-actions">
          <Button type="primary" icon={<RetweetOutlined />} loading={saving} onClick={handleSave}
            style={{ background: color, borderColor: color }}>
            Save Return Note ({docLabel})
          </Button>
          {savedTxn && <Button icon={<PrinterOutlined />} onClick={() => setPrintModal(true)} style={{ borderColor: color, color }}>Print Return Note</Button>}
          <Button icon={<ReloadOutlined />} onClick={handleReset}>Reset</Button>
        </div>
      )}

      <Modal open={printModal} onCancel={() => setPrintModal(false)} width={720}
        title={<span style={{ fontFamily: 'Verdana,sans-serif', fontWeight: 700 }}>Return Note — {docLabel}</span>}
        footer={[
          <Button key="p" type="primary" icon={<PrinterOutlined />} onClick={() => window.print()} style={{ background: color, borderColor: color }}>Print</Button>,
          <Button key="c" onClick={() => setPrintModal(false)}>Close</Button>
        ]}>
        <div style={{ fontFamily: 'Verdana,sans-serif', fontSize: 13 }}>
          <PrintHeader title={`YARN RETURN NOTE (${docLabel})`} refNo={savedTxn?.code?.slice(0, 10)} color={color} />
          <div style={{ marginBottom: 10, padding: '5px 10px', background: '#FFFBE6', border: '1px solid #FFD666', borderRadius: 4, fontSize: 12 }}>
            {returnType === 'PURCHASE_RETURN' ? 'Purchase Return Note' : 'Sale Return Note'} &nbsp;|&nbsp; <strong>{stockEffect}</strong>
          </div>
          <Descriptions size="small" bordered column={2} style={{ marginBottom: 10 }}>
            <Descriptions.Item label="Party">{partyName}</Descriptions.Item>
            <Descriptions.Item label="Type"><Tag color={cashGst === 'GST' ? 'blue' : 'default'}>{cashGst}</Tag></Descriptions.Item>
          </Descriptions>
          <PrintItemsTable rows={rows} totalBags={totalBags} totalValue={totalValue} />
          {cashGst === 'GST' && <div style={{ marginTop: 8, padding: '6px 10px', background: '#F0F8FF', border: '1px solid #B0D0F0', borderRadius: 4, fontSize: 12 }}>Taxes Calculation (auto show only in case of GST select)</div>}
          <PrintSignatures />
        </div>
      </Modal>
    </div>
  );
}

// ─── PANEL: Commission Bill ───────────────────────────────────────────────────
function CommissionPanel() {
  const color = '#5B2C8D';
  const [contractType, setContractType] = useState(null);
  const [contracts,    setContracts]    = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [data,         setData]         = useState(null);
  const [praRate,      setPraRate]      = useState(null);
  const [whRate,       setWhRate]       = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState(null);
  const [printModal,   setPrintModal]   = useState(false);

  const CONTRACT_TYPES = [
    'Cash Purchase', 'GST Purchase', 'Cash Sale', 'GST Sale', 'Services', 'Transaction'
  ];

  useEffect(() => {
    contractAPI.getAll()
      .then(all => setContracts(all.filter(c => c.commission > 0 || c.hasCommission)))
      .catch(() => {});
  }, []);

  const onSelectContract = cid => {
    const c = contracts.find(x => x.id === cid);
    setSelected(cid);
    if (!c) return;
    const totalBags  = (c.items || []).reduce((s, i) => s + (i.bags  || 0), 0);
    const totalValue = (c.items || []).reduce((s, i) => s + Number(i.amount || 0), 0);
    const commRate   = Number(c.commission || 0);
    const commAmount = parseFloat((totalValue * commRate / 100).toFixed(2));
    setData({ c, totalBags, totalValue, commRate, commAmount });
    setPraRate(null); setWhRate(null);
  };

  const praAmount = data && praRate ? parseFloat((data.commAmount * praRate / 100).toFixed(2)) : 0;
  const whAmount  = data && whRate  ? parseFloat((data.commAmount * whRate  / 100).toFixed(2)) : 0;
  const netComm   = data ? parseFloat((data.commAmount - praAmount - whAmount).toFixed(2)) : 0;

  const handleReset = () => { setContractType(null); setSelected(null); setData(null); setPraRate(null); setWhRate(null); setError(null); };

  const fieldRow = (label, value, highlight) => (
    <Row gutter={0} align="middle" style={{ borderBottom: '1px solid #F0F0F0', padding: '5px 0' }}>
      <Col span={10}><Text style={{ fontSize: 12, fontFamily: 'Verdana,sans-serif', color: '#555' }}>{label}</Text></Col>
      <Col span={14}>
        <Text style={{ fontSize: 13, fontFamily: 'Verdana,sans-serif', fontWeight: highlight ? 700 : 400, color: highlight ? color : '#111' }}>
          {value}
        </Text>
      </Col>
    </Row>
  );

  return (
    <div>
      {error && <Alert type="error" message={error} style={{ marginBottom: 8 }} closable onClose={() => setError(null)} />}

      <Row gutter={14}>
        {/* Left: Type + Contract selection */}
        <Col xs={24} sm={10}>
          <Card size="small" style={{ marginBottom: 8, borderLeft: `4px solid ${color}` }}
            title={<span style={{ color, fontWeight: 700, fontSize: 12, fontFamily: 'Verdana,sans-serif' }}>Step 1 — Type (LOV)</span>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {CONTRACT_TYPES.map(t => (
                <div key={t} onClick={() => setContractType(t)} style={{
                  padding: '6px 10px', border: `1.5px solid ${contractType === t ? color : '#D9D9D9'}`,
                  borderRadius: 4, background: contractType === t ? '#F5F0FF' : '#fff',
                  cursor: 'pointer', fontFamily: 'Verdana,sans-serif', fontSize: 12,
                  fontWeight: contractType === t ? 700 : 400, color: contractType === t ? color : '#333',
                  transition: 'all .12s', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  {t} {contractType === t && <CheckCircleOutlined style={{ fontSize: 11 }} />}
                </div>
              ))}
            </div>
          </Card>

          <Card size="small" style={{ borderLeft: `4px solid ${color}` }}
            title={<span style={{ color, fontWeight: 700, fontSize: 12, fontFamily: 'Verdana,sans-serif' }}>Step 2 — Select Contract</span>}>
            <Select showSearch style={{ width: '100%', fontFamily: 'Verdana,sans-serif' }}
              placeholder="Select contract..." value={selected} onChange={onSelectContract}
              filterOption={(i, o) => o?.children?.toString().toLowerCase().includes(i.toLowerCase())}>
              {contracts.map(c => (
                <Option key={c.id} value={c.id}>
                  {c.code?.slice(0, 8)} — {c.bookingParty?.cashPartyName || c.bookingParty?.gstPartyName || 'Party'}
                </Option>
              ))}
            </Select>
            <div style={{ marginTop: 6, fontSize: 11, color: '#999', fontFamily: 'Verdana,sans-serif' }}>
              Ref. Contract &amp; Date: auto from selection
            </div>
          </Card>
        </Col>

        {/* Right: Commission calculation */}
        <Col xs={24} sm={14}>
          {data ? (
            <Card size="small" style={{ borderLeft: `4px solid ${color}` }}
              title={<span style={{ color, fontWeight: 700, fontSize: 12, fontFamily: 'Verdana,sans-serif' }}>Commission Bill Calculation</span>}>
              {fieldRow('Contract Ref.', data.c.code?.slice(0, 8))}
              {fieldRow('Party', data.c.bookingParty?.cashPartyName || data.c.bookingParty?.gstPartyName || '—')}
              {fieldRow('Count (Total Bags)', `${data.totalBags.toLocaleString('en-PK')} bags`)}
              {fieldRow('Rate / Value (Rs)', `Rs ${data.totalValue.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`)}
              <Divider style={{ margin: '6px 0' }} />
              {fieldRow('Commission Rate', `${data.commRate}% (from contract)`)}
              {fieldRow('Commission Amount (Rs)', `Rs ${data.commAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`, true)}
              <Divider style={{ margin: '6px 0' }} />
              <Row gutter={8} style={{ marginBottom: 4 }}>
                <Col span={12}>
                  <Text style={{ fontSize: 11, fontFamily: 'Verdana,sans-serif', fontWeight: 700, color: '#555' }}>PRA RATE %</Text>
                  <InputNumber value={praRate} onChange={setPraRate} min={0} max={100} precision={2}
                    style={{ width: '100%', marginTop: 3 }} addonAfter="%" placeholder="0.00" />
                </Col>
                <Col span={12}>
                  <Text style={{ fontSize: 11, fontFamily: 'Verdana,sans-serif', color: '#555' }}>PRA Amount (Rs) — auto</Text>
                  <div style={{ marginTop: 3, padding: '4px 8px', background: '#F5F5F5', border: '1px solid #D9D9D9', borderRadius: 4, fontFamily: 'Verdana,sans-serif', fontSize: 13 }}>
                    Rs {praAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </div>
                </Col>
              </Row>
              <Row gutter={8} style={{ marginBottom: 8 }}>
                <Col span={12}>
                  <Text style={{ fontSize: 11, fontFamily: 'Verdana,sans-serif', fontWeight: 700, color: '#555' }}>WH TAX RATE %</Text>
                  <InputNumber value={whRate} onChange={setWhRate} min={0} max={100} precision={2}
                    style={{ width: '100%', marginTop: 3 }} addonAfter="%" placeholder="0.00" />
                </Col>
                <Col span={12}>
                  <Text style={{ fontSize: 11, fontFamily: 'Verdana,sans-serif', color: '#555' }}>WH Tax Amount (Rs) — auto</Text>
                  <div style={{ marginTop: 3, padding: '4px 8px', background: '#F5F5F5', border: '1px solid #D9D9D9', borderRadius: 4, fontFamily: 'Verdana,sans-serif', fontSize: 13 }}>
                    Rs {whAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </div>
                </Col>
              </Row>
              <Divider style={{ margin: '4px 0 6px' }} />
              <div style={{ padding: '8px 10px', background: '#F5F0FF', border: `1.5px solid ${color}`, borderRadius: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontFamily: 'Verdana,sans-serif', fontWeight: 700, color }}>Net Commission Amount R/A</Text>
                <Text style={{ fontSize: 15, fontFamily: 'Verdana,sans-serif', fontWeight: 700, color }}>Rs {netComm.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</Text>
              </div>
              <div className="form-actions" style={{ marginTop: 8, padding: '6px 0' }}>
                <Button type="primary" icon={<FileDoneOutlined />} onClick={() => setPrintModal(true)}
                  style={{ background: color, borderColor: color }}>
                  Print Commission Bill
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>Reset</Button>
              </div>
            </Card>
          ) : (
            <Card size="small" style={{ borderLeft: `4px solid ${color}`, minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text type="secondary" style={{ fontFamily: 'Verdana,sans-serif', fontSize: 12 }}>
                Select a contract on the left to calculate commission
              </Text>
            </Card>
          )}
        </Col>
      </Row>

      {/* Print modal */}
      <Modal open={printModal} onCancel={() => setPrintModal(false)} width={620}
        title={<span style={{ fontFamily: 'Verdana,sans-serif', fontWeight: 700 }}>Commission Bill — Preview</span>}
        footer={[
          <Button key="p" type="primary" icon={<PrinterOutlined />} onClick={() => window.print()} style={{ background: color, borderColor: color }}>Print</Button>,
          <Button key="c" onClick={() => setPrintModal(false)}>Close</Button>
        ]}>
        {data && (
          <div style={{ fontFamily: 'Verdana,sans-serif', fontSize: 13 }}>
            <PrintHeader title="COMMISSION BILL" refNo="DOC-System default" color={color} />
            <Descriptions size="small" bordered column={2} style={{ marginBottom: 10 }}>
              <Descriptions.Item label="Commission Invoice No">DOC-auto</Descriptions.Item>
              <Descriptions.Item label="Commission Bill No">— Select</Descriptions.Item>
              <Descriptions.Item label="Type">{contractType || '—'}</Descriptions.Item>
              <Descriptions.Item label="Ref. Contract">{data.c.code?.slice(0, 8)} (auto)</Descriptions.Item>
              <Descriptions.Item label="Party">{data.c.bookingParty?.cashPartyName || data.c.bookingParty?.gstPartyName || '—'}</Descriptions.Item>
              <Descriptions.Item label="Count — Total Bags">{data.totalBags.toLocaleString('en-PK')}</Descriptions.Item>
              <Descriptions.Item label="Rate — Value (Rs) Total">Rs {data.totalValue.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</Descriptions.Item>
              <Descriptions.Item label="Commission Rate">{data.commRate}% (auto)</Descriptions.Item>
              <Descriptions.Item label="Commission Amount (Rs)"><strong>Rs {data.commAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong> (auto)</Descriptions.Item>
              <Descriptions.Item label="PRA Rate">{praRate || 0}%</Descriptions.Item>
              <Descriptions.Item label="PRA Amount (Rs)">Rs {praAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })} (auto)</Descriptions.Item>
              <Descriptions.Item label="WH Tax Rate">{whRate || 0}%</Descriptions.Item>
              <Descriptions.Item label="WH Tax Amount (Rs)">Rs {whAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })} (auto)</Descriptions.Item>
            </Descriptions>
            <div style={{ padding: '10px 14px', background: '#F5F0FF', border: `2px solid ${color}`, borderRadius: 5, display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <strong>Net Commission Amount R/A</strong>
              <strong style={{ fontSize: 15, color }}>Rs {netComm.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div style={{ textAlign: 'center', borderTop: '1px solid #333', paddingTop: 8, marginTop: 30 }}>
              Authorized Signature &amp; Stamp
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function TransactionList() {
  const tabItems = [
    {
      key: 'receipt',
      label: <span style={{ fontFamily: 'Verdana,sans-serif', fontWeight: 700, fontSize: 12 }}>📥 Yarn Receipt</span>,
      children: <YarnPanel noteType="YARN_RECEIPT" docLabel="OGP" color="#1B4F8A" bgColor="#EEF4FF" />,
    },
    {
      key: 'issue',
      label: <span style={{ fontFamily: 'Verdana,sans-serif', fontWeight: 700, fontSize: 12 }}>📤 Yarn Issue</span>,
      children: <YarnPanel noteType="YARN_ISSUE" docLabel="IGP" color="#1D6A3A" bgColor="#EDFFF4" />,
    },
    {
      key: 'return',
      label: <span style={{ fontFamily: 'Verdana,sans-serif', fontWeight: 700, fontSize: 12 }}>🔄 Return Note</span>,
      children: <ReturnPanel />,
    },
    {
      key: 'commission',
      label: <span style={{ fontFamily: 'Verdana,sans-serif', fontWeight: 700, fontSize: 12 }}>💰 Commission Bill</span>,
      children: <CommissionPanel />,
    },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
        <SwapOutlined style={{ marginRight: 8, color: '#1B4F8A', fontSize: 16 }} />
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E', fontFamily: 'Verdana,sans-serif' }}>
          Yarn Transactions
        </span>
      </div>
      <Tabs items={tabItems} type="card" size="middle" defaultActiveKey="receipt" destroyInactiveTabPane={false} />
    </div>
  );
}
