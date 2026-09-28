import React, { useEffect, useState } from 'react';
import {
  Form, Input, Select, Button, Card, Row, Col,
  Typography, Divider, Space, message, Spin, Alert
} from 'antd';
import {
  SaveOutlined, ReloadOutlined, ArrowLeftOutlined,
  PhoneOutlined, MailOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { partyAPI } from '../services/api';

const { Text } = Typography;
const { Option } = Select;

const PARTY_TYPES = [
  { value: 'CASH',             label: 'Cash Party',        color: '#1B4F8A', bg: '#EEF4FF' },
  { value: 'GST',              label: 'GST Party',         color: '#1D6A3A', bg: '#EDFFF4' },
  { value: 'BROKER',          label: 'Broker',            color: '#7A4F00', bg: '#FFF8EE' },
  { value: 'COMMISSION_AGENT', label: 'Commission Agent',  color: '#6B3AA0', bg: '#F5F0FF' },
];

const lbl = (t) => (
  <span style={{
    fontSize: 10, fontWeight: 700, color: '#555',
    textTransform: 'uppercase', letterSpacing: '0.04em',
    fontFamily: 'Verdana,sans-serif'
  }}>{t}</span>
);

export default function PartyForm() {
  const [form]      = Form.useForm();
  const navigate    = useNavigate();
  const { id }      = useParams();
  const isEdit      = Boolean(id);

  const [loading,   setLoading]   = useState(false);
  const [fetching,  setFetching]  = useState(false);
  const [partyType, setPartyType] = useState(null);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    if (isEdit) {
      setFetching(true);
      partyAPI.getById(id)
        .then(d => { form.setFieldsValue(d); setPartyType(d.type); })
        .catch(e => setError(e.message))
        .finally(() => setFetching(false));
    }
  }, [id, form, isEdit]);

  const onFinish = async (v) => {
    setLoading(true); setError(null);
    try {
      isEdit ? await partyAPI.update(id, v) : await partyAPI.create(v);
      message.success(isEdit ? 'Party updated' : 'Party saved');
      navigate('/parties');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const selType = PARTY_TYPES.find(t => t.value === partyType);

  if (fetching) return <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />;

  // Broker and Commission Agent use same fields as Cash
  const isCashLike = partyType === 'CASH' || partyType === 'BROKER' || partyType === 'COMMISSION_AGENT';
  const isGst      = partyType === 'GST';

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => navigate('/parties')} />
          <h1 className="page-title">{isEdit ? 'Edit Party' : 'Party Registration'}</h1>
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
        <div className="ref-bar" style={{ margin: 0 }}>
          <span>Date: <strong>{new Date().toLocaleDateString('en-PK')}</strong></span>
        </div>
      </div>

      {error && <Alert type="error" message={error} style={{ marginBottom: 8 }} closable onClose={() => setError(null)} />}

      <Form form={form} layout="vertical" onFinish={onFinish} scrollToFirstError>

        {/* Type selection */}
        <Card title="Party Type" style={{ marginBottom: 8 }}>
          <Form.Item name="type" rules={[{ required: true, message: 'Select party type' }]} style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PARTY_TYPES.map(t => (
                <div
                  key={t.value}
                  onClick={() => { setPartyType(t.value); form.setFieldValue('type', t.value); }}
                  style={{
                    padding: '10px 20px',
                    border: `2px solid ${partyType === t.value ? t.color : '#D9D9D9'}`,
                    borderRadius: 5,
                    background: partyType === t.value ? t.bg : '#fff',
                    cursor: 'pointer',
                    fontWeight: partyType === t.value ? 700 : 400,
                    color: partyType === t.value ? t.color : '#444',
                    fontSize: 13,
                    fontFamily: 'Verdana,sans-serif',
                    transition: 'all .12s',
                    minWidth: 140,
                    textAlign: 'center',
                  }}
                >
                  {t.label}
                </div>
              ))}
            </div>
          </Form.Item>
        </Card>

        {/* Party details */}
        {isCashLike && (
          <Card title={`${selType?.label} Details`} style={{ marginBottom: 8 }}>
            <Row gutter={10}>
              <Col xs={24} sm={8}>
                <Form.Item name="cashPartyName" label={lbl('Name')} rules={[{ required: true, message: 'Name is required' }]}>
                  <Input placeholder={`${selType?.label} name`} style={{ fontFamily: 'Verdana,sans-serif' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="cashAddress" label={lbl('Address')}>
                  <Input placeholder="Address" style={{ fontFamily: 'Verdana,sans-serif' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={4}>
                <Form.Item name="cashCell" label={lbl('Cell')}
                  rules={[{ pattern: /^03[0-9]{9}$/, message: 'Enter valid number' }]}>
                  <Input prefix={<PhoneOutlined />} placeholder="03xxxxxxxxx" maxLength={11} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={4}>
                <Form.Item name="cashEmail" label={lbl('Email')} rules={[{ type: 'email' }]}>
                  <Input prefix={<MailOutlined />} placeholder="email@example.com" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        )}

        {isGst && (
          <Card title="GST Party Details" style={{ marginBottom: 8 }}>
            <Row gutter={10}>
              <Col xs={24} sm={6}>
                <Form.Item name="gstPartyName" label={lbl('GST Party Name')} rules={[{ required: true }]}>
                  <Input placeholder="Registered name" style={{ fontFamily: 'Verdana,sans-serif' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={4}>
                <Form.Item name="strn" label={lbl('STRN')}>
                  <Input placeholder="Sales Tax Reg. No." />
                </Form.Item>
              </Col>
              <Col xs={24} sm={4}>
                <Form.Item name="ntn" label={lbl('NTN')}>
                  <Input placeholder="National Tax No." />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item name="gstAddress" label={lbl('Address')}>
                  <Input placeholder="Registered address" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={4}>
                <Form.Item name="gstCell" label={lbl('Cell')}
                  rules={[{ pattern: /^03[0-9]{9}$/, message: 'Enter valid number' }]}>
                  <Input prefix={<PhoneOutlined />} placeholder="03xxxxxxxxx" maxLength={11} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={4}>
                <Form.Item name="gstEmail" label={lbl('Email')} rules={[{ type: 'email' }]}>
                  <Input prefix={<MailOutlined />} />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        )}

        {/* Concern persons — for all types */}
        {partyType && (
          <Card title="Concern Persons & Reference" style={{ marginBottom: 8 }}>
            <Row gutter={10}>
              <Col span={1} style={{ display: 'flex', alignItems: 'center', paddingTop: 18 }}>
                <Text style={{ fontSize: 9, fontWeight: 700, color: '#1B4F8A', writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontFamily: 'Verdana,sans-serif' }}>IP</Text>
              </Col>
              <Col xs={24} sm={5}>
                <Form.Item name="ipConcernPerson" label={lbl('IP Concern Person')}>
                  <Input placeholder="Name" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={4}>
                <Form.Item name="ipCell" label={lbl('Cell')}
                  rules={[{ pattern: /^03[0-9]{9}$/, message: 'Invalid' }]}>
                  <Input prefix={<PhoneOutlined />} placeholder="03xxxxxxxxx" maxLength={11} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={4}>
                <Form.Item name="ipEmail" label={lbl('Email')} rules={[{ type: 'email' }]}>
                  <Input prefix={<MailOutlined />} />
                </Form.Item>
              </Col>

              <Col span={1} style={{ display: 'flex', alignItems: 'center', paddingTop: 18, paddingLeft: 8 }}>
                <Text style={{ fontSize: 9, fontWeight: 700, color: '#7A4F00', writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontFamily: 'Verdana,sans-serif' }}>CP</Text>
              </Col>
              <Col xs={24} sm={5}>
                <Form.Item name="cpConcernPerson" label={lbl('CP Concern Person')}>
                  <Input placeholder="Name" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={4}>
                <Form.Item name="cpCell" label={lbl('Cell')}
                  rules={[{ pattern: /^03[0-9]{9}$/, message: 'Invalid' }]}>
                  <Input prefix={<PhoneOutlined />} placeholder="03xxxxxxxxx" maxLength={11} />
                </Form.Item>
              </Col>
            </Row>

            <Divider style={{ margin: '4px 0 8px' }} />

            <Row gutter={10}>
              <Col span={1} style={{ display: 'flex', alignItems: 'center', paddingTop: 18 }}>
                <Text style={{ fontSize: 9, fontWeight: 700, color: '#444', writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontFamily: 'Verdana,sans-serif' }}>REF</Text>
              </Col>
              <Col xs={24} sm={5}>
                <Form.Item name="refPersonName" label={lbl('Ref. Person Name')}>
                  <Input placeholder="Name" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={4}>
                <Form.Item name="refPersonCell" label={lbl('Ref. Cell')}
                  rules={[{ pattern: /^03[0-9]{9}$/, message: 'Invalid' }]}>
                  <Input prefix={<PhoneOutlined />} placeholder="03xxxxxxxxx" maxLength={11} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={5}>
                <Form.Item name="others" label={lbl('Others / Notes')}>
                  <Input placeholder="Additional notes" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        )}

        <div className="form-actions">
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}
            style={{ background: '#1B4F8A', borderColor: '#1B4F8A' }}>
            {isEdit ? 'Update Party' : 'Save Party'}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => { form.resetFields(); setPartyType(null); }}>
            Reset
          </Button>
          <Button onClick={() => navigate('/parties')}>Cancel</Button>
        </div>
      </Form>
    </div>
  );
}
