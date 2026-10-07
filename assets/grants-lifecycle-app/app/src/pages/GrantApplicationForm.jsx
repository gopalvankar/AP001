import React, { useState, useEffect } from 'react';

const INITIAL_FORM = {
  grantId: '', applicantName: '', applicantEmail: '', orgName: '',
  requestedAmount: '', currency: 'EUR', purpose: '', documents: []
};

export default function GrantApplicationForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch available grant programs
    fetch('/applicant/GrantPrograms')
      .then(r => r.json())
      .then(d => setGrants(d.value || []))
      .catch(() => setGrants([]));
  }, []);

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSaveDraft() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/applicant/Applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setForm(f => ({ ...f, _id: data.ID }));
      setStep(s => s + 1);
    } catch (e) {
      setError(`Failed to save draft: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!form._id) return setError('Please save your draft first.');
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/applicant/submitApplication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: form._id })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSubmitted(data.reference);
    } catch (e) {
      setError(`Submission failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center', background: '#fff', borderRadius: 8, padding: 40, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: '#1e8e3e' }}>Application Submitted!</h2>
        <p>Your reference number is:</p>
        <code style={{ fontSize: 18, background: '#f0f4ff', padding: '8px 16px', borderRadius: 4, display: 'inline-block' }}>{submitted}</code>
        <p style={{ color: '#666', marginTop: 16 }}>You will receive email notifications as your application progresses. You can also track it under <strong>My Applications</strong>.</p>
        <button onClick={() => { setForm(INITIAL_FORM); setStep(0); setSubmitted(null); }}
          style={{ marginTop: 16, padding: '10px 24px', background: '#0070f2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Submit Another Application
        </button>
      </div>
    );
  }

  const steps = ['Grant Selection', 'Applicant Details', 'Project & Budget', 'Review & Submit'];

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h2>Apply for a Grant</h2>

      {/* Step progress */}
      <div style={{ display: 'flex', marginBottom: 32, gap: 0 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', margin: '0 auto 4px',
              background: i <= step ? '#0070f2' : '#e0e0e0',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: 14
            }}>{i + 1}</div>
            <div style={{ fontSize: 12, color: i === step ? '#0070f2' : '#999' }}>{s}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 8, padding: 32, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {error && <div style={{ background: '#fff0f0', border: '1px solid #ffcdd2', borderRadius: 4, padding: '8px 16px', marginBottom: 16, color: '#b00020' }}>{error}</div>}

        {step === 0 && (
          <div>
            <h3>Select Grant Program</h3>
            <label style={labelStyle}>Grant Program *</label>
            <select value={form.grantId} onChange={e => update('grantId', e.target.value)} style={inputStyle}>
              <option value="">-- Select a grant program --</option>
              {grants.map(g => <option key={g.GrantID} value={g.GrantID}>{g.GrantDescription || g.GrantID}</option>)}
              {grants.length === 0 && <option value="GRANT-001">Innovation Fund 2026</option>}
            </select>
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => form.grantId ? setStep(1) : setError('Please select a grant program.')} style={btnStyle}>Next →</button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h3>Applicant Details</h3>
            <FormField label="Your Full Name *" value={form.applicantName} onChange={v => update('applicantName', v)} />
            <FormField label="Your Email Address *" value={form.applicantEmail} type="email" onChange={v => update('applicantEmail', v)} />
            <FormField label="Organization Name *" value={form.orgName} onChange={v => update('orgName', v)} />
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(0)} style={secondaryBtnStyle}>← Back</button>
              <button onClick={() => (form.applicantName && form.applicantEmail && form.orgName) ? setStep(2) : setError('Please fill in all required fields.')} style={btnStyle}>Next →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3>Project Description & Budget</h3>
            <label style={labelStyle}>Project Purpose / Description *</label>
            <textarea
              value={form.purpose}
              onChange={e => update('purpose', e.target.value)}
              rows={5}
              placeholder="Describe your project goals and how the grant funds will be used..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 2 }}>
                <FormField label="Requested Amount *" value={form.requestedAmount} type="number" onChange={v => update('requestedAmount', v)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Currency</label>
                <select value={form.currency} onChange={e => update('currency', e.target.value)} style={inputStyle}>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(1)} style={secondaryBtnStyle}>← Back</button>
              <button onClick={() => (form.purpose && form.requestedAmount) ? handleSaveDraft() : setError('Please fill in all required fields.')} disabled={loading} style={btnStyle}>
                {loading ? 'Saving...' : 'Save & Review →'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3>Review & Submit</h3>
            <ReviewRow label="Grant Program" value={form.grantId} />
            <ReviewRow label="Applicant Name" value={form.applicantName} />
            <ReviewRow label="Email" value={form.applicantEmail} />
            <ReviewRow label="Organization" value={form.orgName} />
            <ReviewRow label="Requested Amount" value={`${form.requestedAmount} ${form.currency}`} />
            <ReviewRow label="Purpose" value={form.purpose} />
            <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 4, padding: 12, marginTop: 16, fontSize: 13 }}>
              By submitting this application, you confirm that all information provided is accurate and complete.
            </div>
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(2)} style={secondaryBtnStyle}>← Back</button>
              <button onClick={handleSubmit} disabled={loading} style={{ ...btnStyle, background: '#1e8e3e' }}>
                {loading ? 'Submitting...' : '✓ Submit Application'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text' }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', padding: '8px 0' }}>
      <span style={{ flex: 1, fontWeight: 600, color: '#555', fontSize: 13 }}>{label}</span>
      <span style={{ flex: 2, fontSize: 13 }}>{value}</span>
    </div>
  );
}

const labelStyle = { display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: '#555' };
const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #d0d0d0', borderRadius: 4, fontSize: 14, boxSizing: 'border-box', marginBottom: 16 };
const btnStyle = { padding: '10px 24px', background: '#0070f2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 };
const secondaryBtnStyle = { padding: '10px 24px', background: '#fff', color: '#0070f2', border: '1px solid #0070f2', borderRadius: 4, cursor: 'pointer', fontSize: 14 };
