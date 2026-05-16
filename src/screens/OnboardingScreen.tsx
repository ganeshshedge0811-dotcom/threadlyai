import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Save, CheckCircle, Plus, X, Shield, Key, Globe, Zap } from 'lucide-react';

const PLATFORM_COLORS: Record<string, string> = {
  Reddit: '#ff4500',
  Twitter: '#1da1f2',
  LinkedIn: '#0077b5',
  HackerNews: '#ff6600',
};

const TONES = [
  { value: 'Friendly Expert', label: 'Friendly Expert', desc: 'Warm and knowledgeable. Shares advice like a senior colleague.' },
  { value: 'Peer Founder', label: 'Peer Founder', desc: 'Relatable and casual. Sounds like a fellow builder sharing experiences.' },
  { value: 'Power User', label: 'Power User', desc: 'Enthusiastic product advocate. Deep technical knowledge.' },
  { value: 'Professional', label: 'Professional', desc: 'Polished and corporate. Best for LinkedIn and B2B audiences.' },
  { value: 'Technical', label: 'Technical', desc: 'Detail-oriented and precise. Great for HackerNews and dev communities.' },
];

const OnboardingScreen: React.FC = () => {
  const { settings, saveSettings } = useAppContext();
  const [formData, setFormData] = useState(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>(
    settings.keywords ? settings.keywords.split(',').map((k: string) => k.trim()).filter(Boolean) : []
  );
  const [activeSection, setActiveSection] = useState<'product' | 'platforms' | 'api'>('product');
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: typeof settings) => ({ ...prev, [name]: value }));
  };

  const addKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      const newKeywords = [...keywords, trimmed];
      setKeywords(newKeywords);
      setFormData((prev: typeof settings) => ({ ...prev, keywords: newKeywords.join(', ') }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    const newKeywords = keywords.filter(k => k !== keyword);
    setKeywords(newKeywords);
    setFormData((prev: typeof settings) => ({ ...prev, keywords: newKeywords.join(', ') }));
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeyword();
    }
  };

  const togglePlatform = (platform: string) => {
    const newPlatforms = formData.platforms.includes(platform)
      ? formData.platforms.filter((p: string) => p !== platform)
      : [...formData.platforms, platform];
    setFormData((prev: typeof settings) => ({ ...prev, platforms: newPlatforms }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await saveSettings(formData);
    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const sections = [
    { key: 'product' as const, label: 'Product & Targeting', icon: <Zap size={16} /> },
    { key: 'platforms' as const, label: 'Platforms & Tone', icon: <Globe size={16} /> },
    { key: 'api' as const, label: 'API Integrations', icon: <Key size={16} /> },
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2>Settings</h2>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Configure your product, platforms, and API keys</p>
        </div>
        {isSaved && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: 'rgba(0, 210, 106, 0.1)', color: 'var(--primary-green)',
            padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500,
            animation: 'fadeIn 0.3s ease'
          }}>
            <CheckCircle size={16} /> Settings saved successfully!
          </div>
        )}
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {sections.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`btn ${activeSection === s.key ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Product & Targeting */}
        {activeSection === 'product' && (
          <div className="card hover-pop" style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={18} className="text-green" /> Product Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="productName">Product Name</label>
                <input
                  type="text" id="productName" name="productName"
                  value={formData.productName} onChange={handleChange}
                  placeholder="e.g. ThreadlyAI"
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="productDescription">Product Description</label>
                <textarea
                  id="productDescription" name="productDescription"
                  value={formData.productDescription} onChange={handleChange}
                  rows={3}
                  placeholder="e.g. AI tool that monitors Reddit 24/7 to find high-intent users asking about problems your product solves..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="targetAudience">Target Audience</label>
                <input
                  type="text" id="targetAudience" name="targetAudience"
                  value={formData.targetAudience} onChange={handleChange}
                  placeholder="e.g. Indie hackers, SaaS founders"
                />
              </div>

              <div className="form-group">
                <label htmlFor="competitors">Top Competitors</label>
                <input
                  type="text" id="competitors" name="competitors"
                  value={formData.competitors} onChange={handleChange}
                  placeholder="e.g. F5Bot, Syften, Mention"
                />
              </div>

              {/* Keyword Tags */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Keywords to Track</label>
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem',
                  minHeight: keywords.length > 0 ? '36px' : '0'
                }}>
                  {keywords.map(kw => (
                    <span key={kw} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      backgroundColor: 'rgba(0, 210, 106, 0.12)', color: 'var(--primary-green)',
                      padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 500,
                      border: '1px solid rgba(0, 210, 106, 0.25)'
                    }}>
                      {kw}
                      <button type="button" onClick={() => removeKeyword(kw)} style={{
                        background: 'none', border: 'none', color: 'var(--primary-green)',
                        cursor: 'pointer', display: 'flex', padding: 0
                      }}>
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={e => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    placeholder='Type a keyword and press Enter (e.g. "recommend", "alternative to")'
                    style={{ flex: 1 }}
                  />
                  <button type="button" onClick={addKeyword} className="btn btn-outline" style={{ padding: '0.5rem 0.75rem', flexShrink: 0 }}>
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="sources">Specific Sources (comma-separated)</label>
                <input
                  type="text" id="sources" name="sources"
                  value={formData.sources} onChange={handleChange}
                  placeholder="e.g. r/SaaS, r/startups, @startupfounder"
                />
              </div>
            </div>
          </div>
        )}

        {/* Platforms & Tone */}
        {activeSection === 'platforms' && (
          <div className="card hover-pop" style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={18} className="text-green" /> Platforms & Voice
            </h3>

            {/* Platform Toggles */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>Platforms to Monitor</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {['Reddit', 'Twitter', 'LinkedIn', 'HackerNews'].map(platform => {
                  const isActive = formData.platforms.includes(platform);
                  const color = PLATFORM_COLORS[platform];
                  return (
                    <button
                      type="button"
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.875rem 1rem', borderRadius: '10px', cursor: 'pointer',
                        border: `1px solid ${isActive ? color : 'var(--border-color)'}`,
                        backgroundColor: isActive ? `${color}12` : 'var(--bg-dark)',
                        color: 'var(--text-main)', fontFamily: 'var(--font-family)',
                        fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ color: isActive ? color : 'var(--text-muted)' }}>{platform}</span>
                      {/* Toggle switch */}
                      <div style={{
                        width: '36px', height: '20px', borderRadius: '10px',
                        backgroundColor: isActive ? color : 'rgba(255,255,255,0.1)',
                        position: 'relative', transition: 'background-color 0.2s'
                      }}>
                        <div style={{
                          width: '16px', height: '16px', borderRadius: '50%',
                          backgroundColor: '#fff', position: 'absolute', top: '2px',
                          left: isActive ? '18px' : '2px', transition: 'left 0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                        }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tone Selector */}
            <div>
              <label style={{ display: 'block', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>AI Tone of Voice</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {TONES.map(tone => (
                  <button
                    type="button"
                    key={tone.value}
                    onClick={() => setFormData((prev: typeof settings) => ({ ...prev, tone: tone.value }))}
                    style={{
                      display: 'flex', flexDirection: 'column', gap: '0.25rem',
                      padding: '0.875rem 1rem', borderRadius: '10px', cursor: 'pointer',
                      border: `1px solid ${formData.tone === tone.value ? 'var(--primary-green)' : 'var(--border-color)'}`,
                      backgroundColor: formData.tone === tone.value ? 'rgba(0, 210, 106, 0.08)' : 'var(--bg-dark)',
                      color: 'var(--text-main)', fontFamily: 'var(--font-family)', textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ 
                      fontSize: '0.875rem', fontWeight: 600,
                      color: formData.tone === tone.value ? 'var(--primary-green)' : 'var(--text-main)'
                    }}>
                      {formData.tone === tone.value && '● '}{tone.label}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tone.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* API Integrations */}
        {activeSection === 'api' && (
          <div className="card hover-pop" style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={18} className="text-green" /> Platform API Keys
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Connect your accounts. Add backup keys to ensure campaigns never stop.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {[
                { label: 'Reddit Client ID (Primary)', name: 'redditClientId', color: '#ff4500' },
                { label: 'Reddit Client ID (Backup)', name: 'redditBackupClientId', color: '#ff4500' },
                { label: 'Twitter / X API Key (Primary)', name: 'twitterApiKey', color: '#1da1f2' },
                { label: 'Twitter / X API Key (Backup)', name: 'twitterBackupApiKey', color: '#1da1f2' },
              ].map(field => (
                <div key={field.name} className="form-group">
                  <label htmlFor={field.name} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: field.color, display: 'inline-block' }} />
                    {field.label}
                  </label>
                  <input
                    type="password" id={field.name} name={field.name}
                    value={(formData as any)[field.name]} onChange={handleChange}
                    placeholder={field.name.includes('Backup') ? 'Optional — auto switches on failure' : ''}
                  />
                </div>
              ))}

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="linkedinApiKey" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0077b5', display: 'inline-block' }} />
                  LinkedIn API Key
                </label>
                <input
                  type="password" id="linkedinApiKey" name="linkedinApiKey"
                  value={formData.linkedinApiKey} onChange={handleChange}
                />
              </div>
            </div>

            <div style={{ 
              marginTop: '1.5rem', padding: '1rem', borderRadius: '8px',
              backgroundColor: 'rgba(0, 210, 106, 0.06)', border: '1px solid rgba(0, 210, 106, 0.15)',
              display: 'flex', alignItems: 'flex-start', gap: '0.75rem'
            }}>
              <Shield size={18} className="text-green" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-main)' }}>Your keys are encrypted.</strong> We use AES-256 encryption and never store plaintext credentials. Keys are only decrypted at the moment of posting.
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ padding: '0.65rem 2rem', opacity: isSaving ? 0.7 : 1 }}>
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default OnboardingScreen;
