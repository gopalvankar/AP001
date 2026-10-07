import React, { useState, useEffect } from 'react';

export default function ComplianceDashboard() {
  const [summary, setSummary] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/reporting/GrantSummaryByStatus').then(r => r.json()).then(d => d.value || []),
      fetch('/reporting/PaymentHistory?$orderby=disbursedAt desc&$top=50').then(r => r.json()).then(d => d.value || [])
    ]).then(([s, p]) => {
      setSummary(s);
      setPayments(p);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function exportCsv() {
    const headers = ['Application ID', 'Grant ID', 'Applicant', 'Organization', 'Amount', 'Currency', 'Status', 'Disbursed At', 'S/4 Reference'];
    const rows = payments.map(p => [p.application_ID, p.grantId, p.applicantName, p.orgName, p.amount, p.currency, p.applicationStatus, p.disbursedAt, p.s4Reference].map(v => `"${v || ''}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `grant-payments-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading compliance data...</div>;

  const totalApps = summary.reduce((s, r) => s + (r.count || 0), 0);
  const totalDisbursed = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const awardedCount = summary.find(s => s.status === 'awarded')?.count || 0;
  const complianceRate = totalApps > 0 ? Math.round((awardedCount / totalApps) * 100) : 0;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <h2>Compliance & Reporting Dashboard</h2>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <MetricCard title="Total Applications" value={totalApps} icon="📋" />
        <MetricCard title="Total Disbursed (EUR)" value={`€${totalDisbursed.toLocaleString()}`} icon="💶" />
        <MetricCard title="Grants Awarded" value={awardedCount} icon="🏆" />
        <MetricCard title="Award Rate" value={`${complianceRate}%`} icon="📈" color={complianceRate >= 50 ? '#1e8e3e' : '#e87500'} />
      </div>

      {/* Status Distribution */}
      <div style={{ background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Applications by Status</h3>
        {summary.length === 0 ? <p style={{ color: '#666' }}>No data available.</p> : (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {summary.map(row => (
              <div key={row.status} style={{ textAlign: 'center', minWidth: 100 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#0070f2' }}>{row.count}</div>
                <div style={{ fontSize: 12, color: '#666', textTransform: 'uppercase' }}>{row.status?.replace(/_/g, ' ')}</div>
                <div style={{ fontSize: 11, color: '#999' }}>€{parseFloat(row.totalRequested || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment History */}
      <div style={{ background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Payment Disbursement History</h3>
          <button onClick={exportCsv} style={{ padding: '8px 16px', background: '#0070f2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
            ⬇ Export CSV
          </button>
        </div>
        {payments.length === 0 ? <p style={{ color: '#666' }}>No payment records yet.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f5f6fa' }}>
              <tr>{['Applicant', 'Organization', 'Grant ID', 'Amount', 'Disbursed', 'S/4 Reference', 'Status'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#555', borderBottom: '1px solid #e0e0e0' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={p.ID} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={cellStyle}>{p.applicantName || '—'}</td>
                  <td style={cellStyle}>{p.orgName || '—'}</td>
                  <td style={cellStyle}>{p.grantId || '—'}</td>
                  <td style={cellStyle}>{parseFloat(p.amount || 0).toLocaleString()} {p.currency}</td>
                  <td style={cellStyle}>{p.disbursedAt ? new Date(p.disbursedAt).toLocaleDateString() : '—'}</td>
                  <td style={cellStyle}><code style={{ fontSize: 11 }}>{p.s4Reference || '—'}</code></td>
                  <td style={cellStyle}>
                    <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, background: p.status === 'processed' ? '#e8f5e9' : '#fff8e1', color: p.status === 'processed' ? '#1e8e3e' : '#e87500' }}>{p.status || 'pending'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color = '#0070f2' }) {
  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{title}</div>
    </div>
  );
}

const cellStyle = { padding: '10px 12px', fontSize: 12, borderBottom: '1px solid #f0f0f0' };
