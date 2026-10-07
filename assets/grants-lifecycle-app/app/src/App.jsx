import React, { useState } from 'react';
import GrantApplicationForm from './pages/GrantApplicationForm.jsx';
import MyApplicationsList from './pages/MyApplicationsList.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ComplianceDashboard from './pages/ComplianceDashboard.jsx';

// Simple role simulation — in production this comes from XSUAA token
const ROLES = ['GrantApplicant', 'GrantAdmin', 'FinanceOfficer', 'ComplianceOfficer', 'ProgramManager'];

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [activeRole, setActiveRole] = useState('GrantApplicant');

  const isAdmin = ['GrantAdmin', 'FinanceOfficer'].includes(activeRole);
  const isCompliance = ['ComplianceOfficer', 'ProgramManager'].includes(activeRole);

  function renderPage() {
    switch (currentPage) {
      case 'apply':        return <GrantApplicationForm />;
      case 'my-apps':      return <MyApplicationsList />;
      case 'admin':        return isAdmin ? <AdminDashboard /> : <AccessDenied />;
      case 'compliance':   return isCompliance ? <ComplianceDashboard /> : <AccessDenied />;
      default:             return <LandingPage role={activeRole} onNavigate={setCurrentPage} />;
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      {/* Shell Bar */}
      <ui5-shellbar
        primary-title="Grants Lifecycle Management"
        secondary-title={`Logged in as: ${activeRole}`}
      />

      {/* Role Switcher (dev only) */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '8px 24px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#666' }}>Role (demo):</span>
        {ROLES.map(r => (
          <button
            key={r}
            onClick={() => { setActiveRole(r); setCurrentPage('home'); }}
            style={{
              padding: '4px 12px', borderRadius: 4, border: '1px solid',
              borderColor: activeRole === r ? '#0070f2' : '#ccc',
              background: activeRole === r ? '#0070f2' : '#fff',
              color: activeRole === r ? '#fff' : '#333',
              cursor: 'pointer', fontSize: 12
            }}
          >{r}</button>
        ))}
      </div>

      {/* Navigation */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '0 24px', display: 'flex', gap: 4 }}>
        <NavButton label="Home" page="home" current={currentPage} onClick={setCurrentPage} />
        {activeRole === 'GrantApplicant' && <>
          <NavButton label="Apply for Grant" page="apply" current={currentPage} onClick={setCurrentPage} />
          <NavButton label="My Applications" page="my-apps" current={currentPage} onClick={setCurrentPage} />
        </>}
        {isAdmin && <NavButton label="Administration" page="admin" current={currentPage} onClick={setCurrentPage} />}
        {isCompliance && <NavButton label="Compliance & Reports" page="compliance" current={currentPage} onClick={setCurrentPage} />}
      </nav>

      {/* Page Content */}
      <main style={{ padding: 24 }}>
        {renderPage()}
      </main>
    </div>
  );
}

function NavButton({ label, page, current, onClick }) {
  const active = page === current;
  return (
    <button onClick={() => onClick(page)} style={{
      padding: '12px 20px', border: 'none', borderBottom: active ? '3px solid #0070f2' : '3px solid transparent',
      background: 'none', cursor: 'pointer', fontWeight: active ? 600 : 400,
      color: active ? '#0070f2' : '#333', fontSize: 14
    }}>{label}</button>
  );
}

function LandingPage({ role, onNavigate }) {
  const cards = role === 'GrantApplicant'
    ? [
        { title: 'Apply for a Grant', desc: 'Submit a new grant application online', page: 'apply', icon: '📝' },
        { title: 'My Applications', desc: 'Track the status of your submissions', page: 'my-apps', icon: '📋' }
      ]
    : ['GrantAdmin','FinanceOfficer'].includes(role)
    ? [{ title: 'Administration Console', desc: 'Review, approve and process grant applications', page: 'admin', icon: '⚙️' }]
    : [{ title: 'Compliance & Reports', desc: 'Monitor grant performance and compliance', page: 'compliance', icon: '📊' }];

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Welcome to Grants Lifecycle Management</h2>
      <p style={{ color: '#666', marginBottom: 24 }}>Streamline your grant journey from application to award.</p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {cards.map(c => (
          <div key={c.page} onClick={() => onNavigate(c.page)} style={{
            background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8,
            padding: 24, cursor: 'pointer', minWidth: 220, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            transition: 'box-shadow 0.2s'
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{c.icon}</div>
            <h3 style={{ margin: '0 0 8px', color: '#0070f2' }}>{c.title}</h3>
            <p style={{ margin: 0, color: '#666', fontSize: 13 }}>{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccessDenied() {
  return <div style={{ padding: 40, textAlign: 'center', color: '#b00020' }}>
    <h2>Access Denied</h2>
    <p>You do not have permission to view this page. Please switch to the correct role.</p>
  </div>;
}
