"use client";
import React from 'react';
import { Trash2, History as HistoryIcon, Search } from 'lucide-react';

export default function HistoryView({ history, onClear, t }) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredHistory = [...history].filter(item => 
    item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subtopic.toLowerCase().includes(searchTerm.toLowerCase())
  ).reverse();

  return (
    <div className="history-container brand-card">
      <div className="history-header">
        <div>
          <h2>{t("history_title") || "Generation History"}</h2>
          <p className="subtitle">{t("history_subtitle") || "Every word you've mastered, logged for your review."}</p>
        </div>
        <button 
          className="brand-btn btn-danger-ghost"
          onClick={() => {
            if (window.confirm(t("confirm_clear_history") || "Are you sure you want to clear your entire generation history?")) {
              onClear();
            }
          }}
        >
          <Trash2 size={18} />
          {t("btn_clear_history") || "Clear History"}
        </button>
      </div>

      <div style={{ marginBottom: '2rem', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
          <Search size={20} />
        </div>
        <input 
          type="text" 
          placeholder={t("placeholder_search_history") || "Search by word, topic, or subtopic..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ paddingLeft: '3.5rem' }}
        />
      </div>

      <div className="history-table-wrapper">
        {filteredHistory.length > 0 ? (
          <table className="history-table">
            <thead>
              <tr>
                <th>{t("th_timestamp") || "Date"}</th>
                <th>{t("th_topic") || "Context"}</th>
                <th>{t("th_word") || "Word"}</th>
                <th>{t("th_language") || "Language"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((entry, idx) => (
                <tr key={idx}>
                  <td className="timestamp-cell">
                    {new Date(entry.timestamp).toLocaleDateString()}
                    <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '700', fontSize: '1rem' }}>{entry.query}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{entry.subtopic}</div>
                  </td>
                  <td>
                    <div style={{ color: 'var(--brand-teal)', fontWeight: '800', fontSize: '1.1rem' }}>{entry.word}</div>
                  </td>
                  <td className="tag-cell">
                    <span>{entry.targetLanguage}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-history">
            <HistoryIcon size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>{searchTerm ? (t("no_results_search") || "No history matches your search.") : (t("empty_history_msg") || "Your generation history is empty. Start creating decks to populate it!")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
