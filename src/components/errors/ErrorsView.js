"use client";
import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorsView({ t }) {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchErrors = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/errors");
      const data = await res.json();
      if (Array.isArray(data)) setErrors(data);
    } catch (e) {
      console.error("Failed to fetch errors", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrors();
  }, []);

  const handleClear = async () => {
    if (window.confirm("Clear all error logs?")) {
      try {
        await fetch("/api/errors", { method: "DELETE" });
        setErrors([]);
      } catch (e) {
        console.error("Failed to clear errors", e);
      }
    }
  };

  return (
    <div className="history-container brand-card">
      <div className="history-header">
        <div>
          <h2>API Error Log</h2>
          <p className="subtitle">Diagnose failed requests from OpenRouter or Google.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="brand-btn btn-ghost" onClick={fetchErrors}>
            <RefreshCw size={18} /> Refresh
          </button>
          <button className="brand-btn btn-danger-ghost" onClick={handleClear}>
            <Trash2 size={18} /> Clear Log
          </button>
        </div>
      </div>

      <div className="history-table-wrapper" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--brand-muted)' }}>Loading...</div>
        ) : errors.length > 0 ? (
          <table className="history-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Context / Model</th>
                <th>Error Code / Message</th>
              </tr>
            </thead>
            <tbody>
              {errors.map(err => (
                <tr key={err.id}>
                  <td className="timestamp-cell" style={{ verticalAlign: 'top' }}>
                    {new Date(err.timestamp).toLocaleDateString()}
                    <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                      {new Date(err.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </td>
                  <td style={{ verticalAlign: 'top' }}>
                    <div style={{ fontWeight: '700' }}>{err.context || "Unknown"}</div>
                    {err.model && <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{err.model}</div>}
                  </td>
                  <td>
                    <div style={{ color: '#ef4444', fontWeight: 'bold' }}>{err.error_code || "Error"}</div>
                    <div style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: 'rgba(239, 68, 68, 0.05)', padding: '0.5rem', borderRadius: '6px', marginTop: '0.5rem' }}>
                      {err.message || JSON.stringify(err)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-history">
            <AlertTriangle size={48} style={{ opacity: 0.2, marginBottom: '1rem', color: '#10b981' }} />
            <p>No errors logged! The APIs are healthy.</p>
          </div>
        )}
      </div>
    </div>
  );
}
