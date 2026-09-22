import React, { useState } from 'react';
import { Layout, Menu, Typography, Avatar } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined, TeamOutlined, AppstoreOutlined,
  FileTextOutlined, SwapOutlined, MenuFoldOutlined, MenuUnfoldOutlined
} from '@ant-design/icons';
import '../../styles/global.css';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/',            icon: <DashboardOutlined />, label: 'Dashboard'         },
  { key: '/parties',     icon: <TeamOutlined />,      label: 'Parties'           },
  { key: '/items',       icon: <AppstoreOutlined />,  label: 'Items'             },
  { key: '/contracts',   icon: <FileTextOutlined />,  label: 'Contracts'         },
  { key: '/transactions',icon: <SwapOutlined />,      label: 'Transactions'      },
];

export default function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  const activeKey = menuItems
    .slice().reverse()
    .find(m => location.pathname === m.key || location.pathname.startsWith(m.key + '/'))?.key || '/';

  return (
    <Layout style={{ minHeight: '100vh', background: '#F0F2F5' }}>
      <Sider
        collapsible collapsed={collapsed} onCollapse={setCollapsed} trigger={null}
        width={180}
        style={{
          background: '#1A1A2E', position: 'sticky', top: 0,
          height: '100vh', overflow: 'auto',
          boxShadow: '2px 0 6px rgba(0,0,0,0.2)'
        }}
      >
        {/* Logo */}
        <div style={{
          padding: collapsed ? '12px 8px' : '12px 14px',
          borderBottom: '1px solid #2D2D44',
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <Avatar style={{ background: '#1B4F8A', flexShrink: 0, fontWeight: 700, fontSize: 13 }} size={32}>AZ</Avatar>
          {!collapsed && (
            <div>
              <div style={{ color: '#F0F0F0', fontWeight: 700, fontSize: 13, lineHeight: 1.2, fontFamily: 'Verdana, sans-serif' }}>ABC XYZ</div>
              <div style={{ color: '#888', fontSize: 10, marginTop: 1, fontFamily: 'Verdana, sans-serif' }}>Yarn Market</div>
            </div>
          )}
        </div>

        <Menu
          mode="inline" selectedKeys={[activeKey]} items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', border: 'none', marginTop: 6, fontSize: 12 }}
          theme="dark"
        />

        <div onClick={() => setCollapsed(!collapsed)} style={{
          position: 'absolute', bottom: 14, left: 0, right: 0,
          display: 'flex', justifyContent: 'center',
          cursor: 'pointer', color: '#666', fontSize: 14
        }}>
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </div>
      </Sider>

      <Layout style={{ background: '#F0F2F5' }}>
        <Header style={{
          background: '#1B4F8A', padding: '0 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 10,
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)', height: 44,
        }}>
          <Text style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'Verdana, sans-serif' }}>
            Company ABC XYZ &mdash; Yarn Market, Faisalabad
          </Text>
          <Text style={{ fontSize: 11, color: '#B8D4F0', fontFamily: 'Verdana, sans-serif' }}>
            {new Date().toLocaleDateString('en-PK', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </Text>
        </Header>

        <Content style={{ margin: '10px 12px', minHeight: 'calc(100vh - 64px)' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
