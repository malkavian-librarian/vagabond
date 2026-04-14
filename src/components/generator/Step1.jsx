"use client";

export const EUROPEAN_LANGUAGES = [
  "Albanian", "Basque", "Belarusian", "Bosnian", "Bulgarian", "Catalan",
  "Croatian", "Czech", "Danish", "Dutch", "English", "Estonian", "Finnish",
  "French", "Galician", "German", "Greek", "Hungarian", "Icelandic", "Irish",
  "Italian", "Latvian", "Lithuanian", "Macedonian", "Maltese", "Norwegian",
  "Polish", "Portuguese", "Romanian", "Russian", "Scottish Gaelic", "Serbian",
  "Slovak", "Slovenian", "Spanish", "Swedish", "Ukrainian", "Welsh"
];

export default function Step1({ formData, setFormData, handleGenerateTopics, loading, cancelGeneration, t }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'subtopicCount' ? Number(value) : value 
    }));
  };

  return (
    <div className="brand-card">
      <h1>{t("hero_title")}</h1>
      <p className="subtitle">{t("hero_subtitle")}</p>

      <form onSubmit={handleGenerateTopics}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <label>{t("label_native")}</label>
            <select name="nativeLanguage" value={formData.nativeLanguage} onChange={handleChange}>
              {EUROPEAN_LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          <div>
            <label>{t("label_target")}</label>
            <select name="targetLanguage" value={formData.targetLanguage} onChange={handleChange}>
              {EUROPEAN_LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label>{t("label_topic")}</label>
          <input
            type="text"
            name="topic"
            placeholder={t("placeholder_topic")}
            value={formData.topic}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label>{t("label_subtopics")}</label>
          <input
            type="number"
            name="subtopicCount"
            min="1"
            max="100"
            value={formData.subtopicCount}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--brand-border)', fontFamily: 'inherit', fontSize: '1rem', marginTop: '0.5rem' }}
            required
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button type="submit" className="brand-btn btn-primary" disabled={loading} style={{ flex: 1 }}>
            {loading ? t("btn_discovering") : t("btn_discover")}
          </button>
          {loading && (
            <button type="button" className="brand-btn btn-ghost" onClick={cancelGeneration} style={{ flex: 1 }}>
              {t("btn_cancel") || "Cancel"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
