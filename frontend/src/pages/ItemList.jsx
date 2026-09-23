import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Typography, Popconfirm, message, Card, Alert, Tabs, Input, Tooltip, Badge } from 'antd';
import { PlusOutlined, SaveOutlined, CloseOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { itemAPI } from '../services/api';

const { Text } = Typography;

const CATS = [
  { key: 'COUNT',      label: 'Count',      boxes: 7, ph: ['Count no.', 'Type', 'Finish', 'Ply', 'Grade', 'Brand', 'Notes'] },
  { key: 'QUALITY',    label: 'Quality',    boxes: 7, ph: ['Quality name', 'Grade', 'Spec', 'Origin', 'Finish', 'Brand', 'Notes'] },
  { key: 'BG_YARN',    label: 'BG Yarn',    boxes: 7, ph: ['BG code', 'Composition', 'Count', 'Color', 'Grade', 'Brand', 'Notes'] },
  { key: 'FABRIC',     label: 'Fabric',     boxes: 4, ph: ['Fabric type', 'Width', 'Weight', 'Notes'] },
  { key: 'CUTT_PIECE', label: 'Cutt Piece', boxes: 4, ph: ['Description', 'Size', 'Qty', 'Notes'] },
  { key: 'LEFT_OVER',  label: 'Left Over',  boxes: 4, ph: ['Description', 'Size', 'Qty', 'Notes'] },
  { key: 'GREY_CLOTH', label: 'Grey Cloth', boxes: 4, ph: ['Cloth type', 'Width', 'Weight', 'Notes'] },
];

const emptyRow = cat => ({
  _key: Date.now() + Math.random(), _isNew: true, id: null,
  category: cat, name: '', box1: '', box2: '', box3: '', box4: '', box5: '', box6: '', box7: ''
});

function CategoryPanel({ cat, allItems, onSaved, onDeleted }) {
  const catItems = allItems.filter(i => i.category === cat.key);
  const [rows,   setRows]   = useState([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState({});
  const [error,  setError]  = useState(null);

  useEffect(() => {
    setRows(catItems.map(i => ({ ...i, _key: i.id, _isNew: false })));
  }, [allItems, cat.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const addRow       = () => setRows(prev => [emptyRow(cat.key), ...prev]);
  const updateCell   = (key, field, value) => setRows(prev => prev.map(r => r._key === key ? { ...r, [field]: value } : r));
  const removeUnsaved = key => setRows(prev => prev.filter(r => r._key !== key));

  const saveRow = async (row) => {
    const name = row.name || row.box1 || `${cat.label} item`;
    const payload = {
      category: cat.key, name,
      box1: row.box1 || null, box2: row.box2 || null, box3: row.box3 || null, box4: row.box4 || null,
      box5: cat.boxes >= 5 ? (row.box5 || null) : null,
      box6: cat.boxes >= 6 ? (row.box6 || null) : null,
      box7: cat.boxes >= 7 ? (row.box7 || null) : null,
    };
    setSaving(s => ({ ...s, [row._key]: true })); setError(null);
    try {
      if (row._isNew) { const c = await itemAPI.create(payload); onSaved(c, row._key); }
      else { const u = await itemAPI.update(row.id, payload); onSaved(u, null); }
      message.success(`${cat.label} item saved`);
    } catch (e) { setError(e.message); }
    finally { setSaving(s => ({ ...s, [row._key]: false })); }
  };

  const deleteRow = async (row) => {
    if (row._isNew) { removeUnsaved(row._key); return; }
    try { await itemAPI.delete(row.id); onDeleted(row.id); message.success('Deleted'); }
    catch (e) { message.error(e.message); }
  };

  const filtered = rows.filter(r =>
    !search || Object.values(r).some(v => typeof v === 'string' && v.toLowerCase().includes(search.toLowerCase()))
  );

  const boxCols = Array.from({ length: cat.boxes }, (_, i) => ({
    title: <Text style={{ fontSize: 11 }} type="secondary">Box {i + 1} — {cat.ph[i]}</Text>,
    key: `box${i + 1}`, width: 130,
    render: (_, r) => (
      <Input value={r[`box${i + 1}`] || ''} onChange={e => updateCell(r._key, `box${i + 1}`, e.target.value)}
        placeholder={cat.ph[i]} size="small" style={{ fontSize: 12 }} />
    )
  }));

  const cols = [
    {
      title: <Text style={{ fontSize: 11 }} type="secondary">Item name</Text>,
      key: 'name', width: 140, fixed: 'left',
      render: (_, r) => (
        <Input value={r.name || ''} onChange={e => updateCell(r._key, 'name', e.target.value)}
          placeholder="Auto from Box 1" size="small" style={{ fontSize: 12 }} />
      )
    },
    ...boxCols,
    {
      title: '', key: 'actions', width: 90, fixed: 'right',
      render: (_, r) => (
        <Space>
          <Tooltip title="Save">
            <Button type="primary" size="small" icon={<SaveOutlined />}
              loading={saving[r._key]} onClick={() => saveRow(r)}
              style={{ background: '#1B4F8A', borderColor: '#1B4F8A' }} />
          </Tooltip>
          {r._isNew
            ? <Button size="small" danger icon={<CloseOutlined />} onClick={() => removeUnsaved(r._key)} />
            : <Popconfirm title="Delete?" onConfirm={() => deleteRow(r)} okText="Yes" cancelText="No">
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
          }
        </Space>
      )
    }
  ];

  return (
    <div>
      {error && <Alert type="error" message={error} style={{ marginBottom: 8 }} closable onClose={() => setError(null)} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={addRow} size="small"
          style={{ background: '#1B4F8A', borderColor: '#1B4F8A' }}>
          Add {cat.label} row
        </Button>
        <Input prefix={<SearchOutlined />} placeholder={`Search ${cat.label}...`}
          value={search} onChange={e => setSearch(e.target.value)} allowClear size="small" style={{ width: 200 }} />
        <Text type="secondary" style={{ fontSize: 11, marginLeft: 'auto' }}>
          {cat.boxes} boxes per row · click <SaveOutlined style={{ fontSize: 10 }} /> to save
        </Text>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <Table columns={cols} dataSource={filtered} rowKey="_key" size="small"
          pagination={filtered.length > 20 ? { pageSize: 20 } : false}
          scroll={{ x: cat.boxes * 135 + 240 }}
          locale={{ emptyText: `No ${cat.label} items yet.` }}
          rowClassName={r => r._isNew ? 'new-row' : ''} />
      </div>
    </div>
  );
}

export default function ItemList() {
  const [allItems, setAllItems] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchItems = useCallback(() => {
    setLoading(true);
    itemAPI.getAll().then(setAllItems).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSaved = (saved, tempKey) => setAllItems(prev => {
    const exists = prev.find(i => i.id === saved.id);
    if (exists) return prev.map(i => i.id === saved.id ? saved : i);
    const filtered = tempKey ? prev.filter(i => i.id !== null) : prev;
    return [saved, ...filtered];
  });

  const handleDeleted = id => setAllItems(prev => prev.filter(i => i.id !== id));
  const countByCategory = key => allItems.filter(i => i.category === key).length;

  const tabItems = CATS.map(cat => ({
    key: cat.key,
    label: (
      <span>
        {cat.label}
        {countByCategory(cat.key) > 0 && (
          <Badge count={countByCategory(cat.key)}
            style={{ marginLeft: 6, backgroundColor: '#1B4F8A', fontSize: 10, minWidth: 16, height: 16, lineHeight: '16px', padding: '0 4px' }} />
        )}
      </span>
    ),
    children: (
      <CategoryPanel cat={cat} allItems={allItems} onSaved={handleSaved} onDeleted={handleDeleted} />
    )
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 className="page-title">Item Registration</h1>
        <Space>
          <Text type="secondary" style={{ fontSize: 12 }}>{allItems.length} items total</Text>
          <Button onClick={fetchItems} size="small">Refresh</Button>
        </Space>
      </div>
      {error && <Alert type="error" message={error} style={{ marginBottom: 10 }} closable />}
      <Card bodyStyle={{ padding: '10px 14px' }}>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
          Edit cells directly. Click <SaveOutlined style={{ fontSize: 10 }} /> to save each row. Blue rows are unsaved.
        </Text>
        {loading
          ? <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>Loading...</div>
          : <Tabs items={tabItems} type="card" size="small" />
        }
      </Card>
      <style>{`.new-row td { background: #EFF6FF !important; }`}</style>
    </div>
  );
}
