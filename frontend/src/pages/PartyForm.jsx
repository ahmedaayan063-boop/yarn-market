import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Button, Card, Row, Col, Typography, Divider, Space, message, Spin, Alert } from 'antd';
import { SaveOutlined, ReloadOutlined, ArrowLeftOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { partyAPI } from '../services/api';

const { Text } = Typography;
const { Option } = Select;
const A = () => <span className="badge-auto">Auto</span>;
const M = () => <span className="badge-manual">Manual</span>;

export default function PartyForm() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
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

  if (fetching) return <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />;

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => navigate('/parties')} />
          <h1 className="page-title">{isEdit ? 'Edit Party' : 'Party Registration'}</h1>
        </Space>
        <div className="ref-bar" style={{ margin: 0 }}>
          <span>Code: <A /></span>
          <span>Ref: <strong>1</strong> <A /></span>
          <span>Date: <strong>{new Date().toLocaleDateString('en-PK')}</strong> <A /></span>
        </div>
      </div>

      {error && <Alert type="error" message={error} style={{ marginBottom: 8 }} closable onClose={() => setError(null)} />}

      <Form form={form} layout="vertical" onFinish={onFinish} scrollToFirstError>

        {/* Row 1: Type + Cash + GST all on one card */}
        <Card title="Party Details">
          <Row gutter={10}>
            <Col span={4}>
              <Form.Item name="type" label={<>Type <M /></>} rules={[{ required: true, message: 'Required' }]}>
                <Select placeholder="Select" onChange={setPartyType}>
                  <Option value="CASH">Cash</Option>
                  <Option value="GST">GST</Option>
                </Select>
              </Form.Item>
            </Col>
            {partyType === 'CASH' && <>
              <Col span={5}><Form.Item name="cashPartyName" label="Cash Party Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col span={5}><Form.Item name="cashAddress" label="Address"><Input /></Form.Item></Col>
              <Col span={5}><Form.Item name="cashCell" label="Cell" rules={[{ pattern: /^03[0-9]{9}$/, message: 'Invalid' }]}><Input prefix={<PhoneOutlined />} placeholder="03xxxxxxxxx" maxLength={11} /></Form.Item></Col>
              <Col span={5}><Form.Item name="cashEmail" label="Email" rules={[{ type: 'email' }]}><Input prefix={<MailOutlined />} /></Form.Item></Col>
            </>}
            {partyType === 'GST' && <>
              <Col span={4}><Form.Item name="gstPartyName" label="GST Party Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col span={3}><Form.Item name="strn" label="STRN"><Input /></Form.Item></Col>
              <Col span={3}><Form.Item name="ntn" label="NTN"><Input /></Form.Item></Col>
              <Col span={4}><Form.Item name="gstAddress" label="Address"><Input /></Form.Item></Col>
              <Col span={3}><Form.Item name="gstCell" label="Cell" rules={[{ pattern: /^03[0-9]{9}$/, message: 'Invalid' }]}><Input prefix={<PhoneOutlined />} maxLength={11} /></Form.Item></Col>
              <Col span={3}><Form.Item name="gstEmail" label="Email" rules={[{ type: 'email' }]}><Input prefix={<MailOutlined />} /></Form.Item></Col>
            </>}
          </Row>
        </Card>

        {/* Row 2: IP + CP concern persons side by side */}
        {partyType && (
          <Card title="Concern Persons & Reference">
            <Row gutter={10}>
              <Col span={1} style={{ display: 'flex', alignItems: 'center', paddingTop: 18 }}>
                <Text style={{ fontSize: 10, fontWeight: 700, color: '#1B4F8A', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>IP PERSON</Text>
              </Col>
              <Col span={5}><Form.Item name="ipConcernPerson" label="IP Concern Person"><Input /></Form.Item></Col>
              <Col span={4}><Form.Item name="ipCell" label="Cell" rules={[{ pattern: /^03[0-9]{9}$/, message: 'Invalid' }]}><Input prefix={<PhoneOutlined />} maxLength={11} /></Form.Item></Col>
              <Col span={4}><Form.Item name="ipEmail" label="Email" rules={[{ type: 'email' }]}><Input prefix={<MailOutlined />} /></Form.Item></Col>

              <Col span={1} style={{ display: 'flex', alignItems: 'center', paddingTop: 18, paddingLeft: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: 700, color: '#7A4F00', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>CP PERSON</Text>
              </Col>
              <Col span={4}><Form.Item name="cpConcernPerson" label="CP Concern Person"><Input /></Form.Item></Col>
              <Col span={4}><Form.Item name="cpCell" label="Cell" rules={[{ pattern: /^03[0-9]{9}$/, message: 'Invalid' }]}><Input prefix={<PhoneOutlined />} maxLength={11} /></Form.Item></Col>
            </Row>

            <Divider style={{ margin: '4px 0 6px' }} />

            <Row gutter={10}>
              <Col span={1} style={{ display: 'flex', alignItems: 'center', paddingTop: 18 }}>
                <Text style={{ fontSize: 10, fontWeight: 700, color: '#333', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>REF</Text>
              </Col>
              <Col span={5}><Form.Item name="refPersonName" label="Ref. Person Name"><Input /></Form.Item></Col>
              <Col span={4}><Form.Item name="refPersonCell" label="Ref. Cell" rules={[{ pattern: /^03[0-9]{9}$/, message: 'Invalid' }]}><Input prefix={<PhoneOutlined />} maxLength={11} /></Form.Item></Col>
              <Col span={5}><Form.Item name="others" label="Others / Notes"><Input /></Form.Item></Col>
            </Row>
          </Card>
        )}

        <div className="form-actions">
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>{isEdit ? 'Update' : 'Save Party'}</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { form.resetFields(); setPartyType(null); }}>Reset</Button>
          <Button onClick={() => navigate('/parties')}>Cancel</Button>
        </div>
      </Form>
    </div>
  );
}
