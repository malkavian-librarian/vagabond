"use client";

export default function Navbar({ activeTab, setActiveTab, activeModel, setActiveModel, allModels, t }) {
  return (
    <header className="brand-navbar">
      <div className="nav-tabs">
        <div 
          className={`nav-tab ${activeTab === 'generator' ? 'active' : ''}`}
          onClick={() => setActiveTab('generator')}
        >
          {t?.("nav_generator") || "Generator"}
        </div>
        <div 
          className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          {t?.("nav_history") || "History"}
        </div>
        <div 
          className={`nav-tab ${activeTab === 'models' ? 'active' : ''}`}
          onClick={() => setActiveTab('models')}
        >
          {t?.("nav_models") || "Models"}
        </div>
        <div 
          className={`nav-tab ${activeTab === 'errors' ? 'active' : ''}`}
          onClick={() => setActiveTab('errors')}
        >
          Error Log
        </div>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div className="model-selector-wrapper">
          <select 
            value={activeModel} 
            onChange={(e) => setActiveModel(e.target.value)}
            className="navbar-select"
          >
            {allModels?.map(model => (
              <option key={model.modelId} value={model.modelId}>
                {model.custom ? model.modelId : (model.name || model.modelId)}
              </option>
            ))}
          </select>
        </div>
        <div className="brand-logo">Vagabond: Anki Card Local Generator</div>
      </div>
    </header>
  );
}
