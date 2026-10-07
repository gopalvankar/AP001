import React, { useState, useEffect } from 'react';

const STATUS_COLOR = {
  draft: '#8e8e8e', submitted: '#0070f2', under_review: '#e87500',
  approved: '#1e8e3e', rejected: '#b00020', awarded: '#6200ea'
};

export default function MyApplicationsList() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState(null);

  function loadApplications() {
    setLoading(true);
    fetch('/applicant/Applications?$orderby=createdAt desc')
      .then(r => r.json())
      .then(d => { setApplications(d.value || []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    loadApplications();
    const interval = setInterval(loadApplications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  async function handleWithdraw(applicationId) {
    if (!confirm('Are you sure you want to withdraw this application?')) return;
    try {
      const res = await fetch('/applicant/withdrawApplication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId })
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage({ type: 'success', text: 'Application withdrawn successfully.' });
      loadApplications();
    } catch (e) {
      setMessage({ type: 'error', text: `Failed to withdraw: ${e.message}` });
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading your applications...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>My Applications</h2>
        <button onClick={loadApplications} style={{ padding: '8px 16px', background: '#f5f6fa', border: '1px solid #d0d0d0', borderRadius: 4, cursor: 'pointer' }}>⟳ Refresh</button>
      </div>

      {message && (
        <div style={{ background: message.type === 'success' ? '#e8f5e9' : '#fff0f0', border: '1px solid', borderColor: message.type === 'success' ? '#a5d6a7' : '#ffcdd2', borderRadius: 4, padding: '8px 16px', marginBottom: 16, color: message.type === 'success' ? '#1e8e3e' : '#b00020' }}>
          {message.text}
        </div>
      )}

      {applications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666', background: '#fff', borderRadius: 8 }}>
          <p>You have no applications yet.</p>
          <p>Go to <strong>Apply for Grant</strong> to submit your first application.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f5f6fa' }}>
              <tr>
                {['Reference', 'Grant ID', 'Organization', 'Amount', 'Status', 'Submitted', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#555', borderBottom: '1px solid #e0e0e0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applications.map((app, i) => (
                <tr key={app.ID} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', cursor: 'pointer' }}
                    onClick={() => setSelected(selected?.ID === app.ID ? null : app)}>
                  <td style={cellStyle}><code style={{ fontSize: 12 }}>{app.ID?.slice(0, 8)}...</code></td>
                  <td style={cellStyle}>{app.grantId}</td>
                  <td style={cellStyle}>{app.orgName}</td>
                  <td style={cellStyle}>{app.requestedAmount?.toLocaleString()} {app.currency}</td>
                  <td style={cellStyle}>
                    <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#fff', background: STATUS_COLOR[app.status] || '#999' }}>
                      {app.status?.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td style={cellStyle}>{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '—'}</td>
                  <td style={cellStyle} onClick={e => e.stopPropagation()}>
                    {['submitted', 'under_review'].includes(app.status) && (
                      <button onClick={() => handleWithdraw(app.ID)} style={{ fontSize: 12, padding: '4px 10px', color: '#b00020', border: '1px solid #ffcdd2', background: '#fff0f0', borderRadius: 4, cursor: 'pointer' }}>
                        Withdraw
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {selected && (
            <div style={{ borderTop: '2px solid #0070f2', padding: 24, background: '#f0f7ff' }}>
              <h3 style={{ marginTop: 0 }}>Application Detail — {selected.ID?.slice(0, 8)}...</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Detail label="Applicant" value={selected.applicantName} />
                <Detail label="Email" value={selected.applicantEmail} />
                <Detail label="Organization" value={selected.orgName} />
                <Detail label="Grant ID" value={selected.grantId} />
                <Detail label="Amount" value={`${selected.requestedAmount?.toLocaleString()} ${selected.currency}`} />
                <Detail label="Status" value={selected.status?.replace(/_/g, ' ')} />
              </div>
              {selected.purpose && (
                <div style={{ marginTop: 12 }}>
                  <strong style={{ fontSize: 12, color: '#555' }}>Purpose:</strong>
                  <p style={{ margin: '4px 0', fontSize: 13 }}>{selected.purpose}</p>
                </div>
              )}
              {selected.rejectionReason && (
                <div style={{ marginTop: 12, background: '#fff0f0', border: '1px solid #ffcdd2', borderRadius: 4, padding: 12 }}>
                  <strong style={{ fontSize: 12, color: '#b00020' }}>Rejection Reason:</strong>
                  <p style={{ margin: '4px 0', fontSize: 13 }}>{selected.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const cellStyle = { padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #f0f0f0' };

function Detail({ label, value }) {
  return (
    <div>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ fontSize: 13, marginTop: 2 }}>{value || '—'}</div>
    </div>
  );
}
