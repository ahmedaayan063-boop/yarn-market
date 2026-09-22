import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import MainLayout       from './components/common/MainLayout';
import Dashboard        from './pages/Dashboard';
import PartyList        from './pages/PartyList';
import PartyForm        from './pages/PartyForm';
import ItemList         from './pages/ItemList';
import ContractList     from './pages/ContractList';
import ContractForm     from './pages/ContractForm';
import TransactionList  from './pages/TransactionList';

const theme = {
  token: {
    colorPrimary:     '#1B4F8A',
    colorSuccess:     '#1D6A3A',
    colorWarning:     '#D97706',
    colorError:       '#DC2626',
    borderRadius:     4,
    fontFamily:       'Verdana, Geneva, Tahoma, sans-serif',
    fontSize:         13,
    colorBgContainer: '#ffffff',
    colorBorder:      '#D9D9D9',
  },
};

export default function App() {
  return (
    <ConfigProvider theme={theme}>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/"                   element={<Dashboard />}      />
            <Route path="/parties"            element={<PartyList />}      />
            <Route path="/parties/new"        element={<PartyForm />}      />
            <Route path="/parties/:id/edit"   element={<PartyForm />}      />
            <Route path="/items"              element={<ItemList />}       />
            <Route path="/contracts"          element={<ContractList />}   />
            <Route path="/contracts/new"      element={<ContractForm />}   />
            <Route path="/contracts/:id/edit" element={<ContractForm />}   />
            <Route path="/transactions"       element={<TransactionList />}/>
            <Route path="*"                   element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </ConfigProvider>
  );
}
