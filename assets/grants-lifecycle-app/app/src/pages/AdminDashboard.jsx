import React, { useState, useEffect } from 'react';

const STATUS_COLOR = {
  draft: '#8e8e8e', submitted: '#0070f2', under_review: '#e87500',
  approved: '#1e8e3e', rejected: '#b00020', awarded: '#6200ea'
};

export default function AdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [budgetInfo, setBudgetInfo] = useState(null);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  function loadApplications() {
    setLoading(true);
    const filter = statusFilter !== 'all' ? `?$filter=status eq '${statusFilter}'&$orderby=submittedAt desc` : '?$orderby=submittedAt desc';
    fetch(`/admin/Applications${filter}`)
      .then(r => r.json())
      .then(d => { setApplications(d.value || []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { loadApplications(); }, [statusFilter]);

  async function checkBudget(app) {
    setBudgetLoading(true);
    setBudgetInfo(null);
    try {
      const res = await fetch(`/admin/checkBudget(grantId='${encodeURIComponent(app.grantId)}',requestedAmount=${app.requestedAmount})`);
      const data = await res.json();
      setBudgetInfo(data.value || data);
    } catch (e) {
      setMessage({ type: 'error', text: `Budget check failed: ${e.message}` });
    } finally {
      setBudgetLoading(false);
    }
  }

  async function approve(applicationId) {
    try {
      const res = await fetch('/admin/approveApplication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, budgetFund: budgetInfo?.budgetAccountId || '' })
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage({ type: 'success', text: 'Application approved successfully.' });
      setSelected(null); setBudgetInfo(null); loadApplications();
    } catch (e) {
      setMessage({ type: 'error', text: `Approval failed: ${e.message}` });
    }
  }

  async function reject(applicationId) {
    if (!rejectReason || rejectReason.length < 10) return setMessage({ type: 'error', text: 'Please provide a rejection reason (min 10 characters).' });
    try {
      const res = await fetch('/admin/rejectApplication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, reason: rejectReason })
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage({ type: 'success', text: 'Application rejected.' });
      setSelected(null); setRejectReason(''); loadApplications();
    } catch (e) {
      setMessage({ type: 'error', text: `Rejection failed: ${e.message}` });
    }
  }

  async function triggerPayment(applicationId, amount, currency) {
    setPaymentLoading(true);
    try {
      const res = await fetch('/admin/triggerPayment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, amount, currency })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMessage({ type: 'success', text: `Payment triggered. Earmarked Fund: ${data.value?.earmarkedFundDoc}` });
      setSelected(null); loadApplications();
    } catch (e) {
      setMessage({ type: 'error', text: `Payment failed: ${e.message}` });
    } finally {
      setPaymentLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <h2>Grant Administration Console</h2>

      {message && (
        <div style={{ background: message.type === 'success' ? '#e8f5e9' : '#fff0f0', border: '1px solid', borderColor: message.type === 'success' ? '#a5d6a7' : '#ffcdd2', borderRadius: 4, padding: '8px 16px', marginBottom: 16, color: message.type === 'success' ? '#1e8e3e' : '#b00020', display: 'flex', justifyContent: 'space-between' }}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', 'submitted', 'under_review', 'approved', 'rejected', 'awarded'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: '6px 14px', fontSize: 12, borderRadius: 14, cursor: 'pointer', border: 'none',
            background: statusFilter === s ? '#0070f2' : '#e0e0e0', color: statusFilter === s ? '#fff' : '#333'
          }}>{s.replace(/_/g, ' ').toUpperCase()}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* Application List */}
        <div style={{ flex: 2, background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {loading ? <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div> : applications.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>No applications found for the selected filter.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f5f6fa' }}>
                <tr>{['Applicant', 'Organization', 'Grant', 'Amount', 'Status', 'Submitted'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#555', borderBottom: '1px solid #e0e0e0' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {applications.map((app, i) => (
                  <tr key={app.ID} onClick={() => { setSelected(app); setBudgetInfo(null); setRejectReason(''); }}
                      style={{ background: selected?.ID === app.ID ? '#e8f0fe' : i % 2 === 0 ? '#fff' : '#fafafa', cursor: 'pointer' }}>
                    <td style={cellStyle}>{app.applicantName}</td>
                    <td style={cellStyle}>{app.orgName}</td>
                    <td style={cellStyle}>{app.grantId}</td>
                    <td style={cellStyle}>{app.requestedAmount?.toLocaleString()} {app.currency}</td>
                    <td style={cellStyle}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, color: '#fff', background: STATUS_COLOR[app.status] || '#999' }}>{app.status?.replace(/_/g, ' ')}</span></td>
                    <td style={cellStyle}>{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={{ flex: 1, background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', maxHeight: 600, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Application Detail</h3>
              <button onClick={() => setSelected(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            {[['Applicant', selected.applicantName], ['Email', selected.applicantEmail], ['Organization', selected.orgName], ['Grant ID', selected.grantId], ['Amount', `${selected.requestedAmount?.toLocaleString()} ${selected.currency}`], ['Status', selected.status]].map(([k, v]) => (
              <div key={k} style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>{k}: </span>
                <span style={{ fontSize: 13 }}>{v}</span>
              </div>
            ))}

            {selected.purpose && <div style={{ marginTop: 8, fontSize: 13, background: '#f5f6fa', padding: 10, borderRadius: 4 }}><strong>Purpose:</strong><br />{selected.purpose}</div>}

            {/* Budget Check */}
            {['submitted', 'under_review', 'approved'].includes(selected.status) && (
              <div style={{ marginTop: 16 }}>
                <button onClick={() => checkBudget(selected)} disabled={budgetLoading} style={{ width: '100%', padding: '8px', background: '#f0f4ff', border: '1px solid #0070f2', borderRadius: 4, cursor: 'pointer', fontSize: 13, color: '#0070f2' }}>
                  {budgetLoading ? 'Checking...' : '💰 Check S/4HANA Budget Availability'}
                </button>
                {budgetInfo && (
                  <div style={{ marginTop: 8, padding: 12, borderRadius: 4, background: budgetInfo.sufficient ? '#e8f5e9' : '#fff0f0', border: `1px solid ${budgetInfo.sufficient ? '#a5d6a7' : '#ffcdd2'}` }}>
                    <div style={{ fontWeight: 700, color: budgetInfo.sufficient ? '#1e8e3e' : '#b00020', marginBottom: 4 }}>
                      {budgetInfo.sufficient ? '✅ Budget Available' : '⚠️ Insufficient Budget'}
                    </div>
                    <div style={{ fontSize: 12 }}>Available: {budgetInfo.available?.toLocaleString()} | Requested: {budgetInfo.requested?.toLocaleString()}</div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {['submitted', 'under_review'].includes(selected.status) && (
              <div style={{ marginTop: 16 }}>
                <button onClick={() => approve(selected.ID)} style={{ width: '100%', padding: 10, background: '#1e8e3e', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', marginBottom: 8 }}>✓ Approve Application</button>
                <textarea placeholder="Rejection reason (required, min 10 chars)..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2} style={{ width: '100%', padding: 8, border: '1px solid #d0d0d0', borderRadius: 4, fontSize: 12, marginBottom: 4, boxSizing: 'border-box' }} />
                <button onClick={() => reject(selected.ID)} style={{ width: '100%', padding: 10, background: '#b00020', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>✕ Reject Application</button>
              </div>
            )}

            {selected.status === 'approved' && (
              <div style={{ marginTop: 16 }}>
                <button onClick={() => triggerPayment(selected.ID, selected.requestedAmount, selected.currency)} disabled={paymentLoading} style={{ width: '100%', padding: 10, background: '#6200ea', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                  {paymentLoading ? 'Processing...' : '💸 Trigger Payment Disbursement'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const cellStyle = { padding: '10px 14px', fontSize: 13, borderBottom: '1px solid #f0f0f0' };
