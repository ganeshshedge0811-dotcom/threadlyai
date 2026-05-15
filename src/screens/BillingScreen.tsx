import React from 'react';
import { Check, AlertTriangle, CreditCard, Zap, Star } from 'lucide-react';

const PlanCard: React.FC<{
  name: string; price: string; credits: number; features: string[];
  isPopular?: boolean; comingSoon?: boolean; accentColor?: string;
}> = ({ name, price, credits, features, isPopular, comingSoon, accentColor = 'var(--primary-indigo)' }) => (
  <div style={{
    flex: 1, minWidth: '260px', maxWidth: '320px',
    background: isPopular ? 'linear-gradient(145deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))' : 'var(--bg-card)',
    borderRadius: '20px', padding: '2rem',
    border: isPopular ? '2px solid var(--primary-indigo)' : '1px solid var(--border-color)',
    position: 'relative', overflow: 'hidden',
    opacity: comingSoon ? 0.6 : 1, filter: comingSoon ? 'grayscale(0.3)' : 'none',
    boxShadow: isPopular ? '0 0 40px rgba(99,102,241,0.15)' : 'none',
    transition: 'transform 0.2s, box-shadow 0.2s',
  }}
    onMouseEnter={e => { if (!comingSoon) { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; } }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
  >
    {/* Glow blob */}
    {isPopular && <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px', background: 'var(--primary-indigo)', filter: 'blur(60px)', opacity: 0.2 }} />}

    {/* Badge */}
    {isPopular && !comingSoon && (
      <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, var(--primary-indigo), var(--primary-purple))', color: '#fff', padding: '4px 14px', borderRadius: '0 0 10px 10px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}>
        ✦ CURRENT PLAN
      </div>
    )}
    {comingSoon && (
      <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', background: '#1f2937', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '4px 14px', borderRadius: '0 0 10px 10px', fontSize: '0.7rem', fontWeight: 700 }}>
        COMING SOON
      </div>
    )}

    {/* Plan name */}
    <div style={{ marginTop: isPopular || comingSoon ? '1.25rem' : '0', marginBottom: '1.25rem' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColor, marginBottom: '0.25rem' }}>
        {name === 'Free Limited Trial' ? 'STARTER' : name === 'Growth' ? 'GROWTH' : 'SCALE'}
      </div>
      <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>{name}</h3>
    </div>

    {/* Price */}
    <div style={{ marginBottom: '1.5rem' }}>
      <span style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-main)' }}>{price}</span>
      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>/mo</span>
    </div>

    {/* Credits */}
    <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: `1px solid ${accentColor}30` }}>
      <Zap size={18} color={accentColor} fill={accentColor} />
      <div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: accentColor, lineHeight: 1 }}>{credits.toLocaleString()}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>total credits included</div>
      </div>
    </div>

    {/* Features */}
    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {features.map((feature, idx) => (
        <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ background: `${accentColor}20`, borderRadius: '50%', padding: '2px', display: 'flex', marginTop: '1px', flexShrink: 0 }}>
            <Check size={14} color={accentColor} strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.5 }}>{feature}</span>
        </li>
      ))}
    </ul>

    <button
      disabled
      style={{
        width: '100%', padding: '0.875rem', borderRadius: '12px', border: 'none', cursor: comingSoon ? 'not-allowed' : 'default',
        background: isPopular && !comingSoon ? 'linear-gradient(135deg, var(--primary-indigo), var(--primary-purple))' : 'rgba(255,255,255,0.05)',
        color: isPopular && !comingSoon ? '#fff' : 'var(--text-muted)',
        fontFamily: 'var(--font-family)', fontWeight: 700, fontSize: '0.9rem',
        boxShadow: isPopular && !comingSoon ? '0 4px 15px rgba(99,102,241,0.3)' : 'none',
      }}
    >
      {comingSoon ? '🔒 Coming Soon' : '✓ Active Plan'}
    </button>
  </div>
);

const BillingScreen: React.FC = () => (
  <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg, var(--primary-green), #00b4d8)', borderRadius: '10px', padding: '8px', display: 'flex' }}>
        <CreditCard size={18} color="white" />
      </div>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Billing & Plans</h2>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manage your subscription and credits</p>
      </div>
    </div>

    {/* Active Plan Banner */}
    <div style={{ background: 'linear-gradient(135deg, rgba(0,210,106,0.1), rgba(0,180,216,0.08))', border: '1px solid rgba(0,210,106,0.25)', borderRadius: '16px', padding: '1.25rem 1.75rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Star size={20} color="var(--primary-green)" fill="rgba(0,210,106,0.2)" />
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Free Limited Trial — Active</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Test our platform's capabilities with starter credits</div>
        </div>
      </div>
      <div style={{ background: 'rgba(0,210,106,0.15)', color: 'var(--primary-green)', padding: '0.4rem 1rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 700 }}>
        🎉 Free Trial Active
      </div>
    </div>

    {/* Plans */}
    <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
      <PlanCard
        name="Free Limited Trial" price="$0" credits={450} isPopular accentColor="var(--primary-indigo)"
        features={['150 Reddit + 150 Twitter Credits', '100 LinkedIn + 50 HackerNews Credits', 'AI-Drafted Replies (Claude AI)', 'Human Approval on Every Reply', 'Ban Protection & Account Rotation']}
      />
      <PlanCard
        name="Growth" price="$49" credits={1500} comingSoon accentColor="#3b82f6"
        features={['1,500 credits split across all platforms', 'Custom platform credit allocation', 'Priority AI reply generation', 'Advanced keyword targeting', 'Priority Email Support']}
      />
      <PlanCard
        name="Scale" price="$149" credits={5000} comingSoon accentColor="#a855f7"
        features={['5,000 credits split across all platforms', 'Multi-product workspaces', 'Dedicated Account Manager', 'White-label reporting', 'SLA-backed uptime guarantee']}
      />
    </div>

    {/* Credit System Explainer */}
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '2rem', marginBottom: '1.5rem' }}>
      <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 700 }}>How Platform Credits Work</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '14px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Zap size={18} color="var(--primary-green)" />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary-green)' }}>1 Credit</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>= Find 1 Lead</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
            We scan thousands of subreddits to find a single relevant discussion where a user is asking for your product. You only pay when we find a match.
          </p>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '14px', padding: '1.5rem', border: '1px solid var(--primary-indigo)', borderLeft: '3px solid var(--primary-indigo)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <CreditCard size={18} color="var(--primary-indigo)" />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary-indigo)' }}>15 Credits</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>= 1 Auto Post</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
            Posting via our network of aged, high-karma Reddit accounts prevents shadowbans and ensures your link stays visible. (Growth Plan & up).
          </p>
        </div>
      </div>
    </div>

    {/* Safety Disclaimer */}
    <div style={{ borderRadius: '16px', padding: '1.25rem 1.5rem', border: '1px solid rgba(234,179,8,0.25)', background: 'rgba(234,179,8,0.05)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <AlertTriangle size={20} style={{ color: '#facc15', flexShrink: 0, marginTop: '2px' }} />
      <div>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#facc15', margin: '0 0 0.5rem 0' }}>Safety & Anti-Ban Disclaimer</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
          Always provide <strong>90% genuine value</strong> and 10% pitch. Avoid dropping your link in every reply. Only reply when users are explicitly asking for solutions related to your keywords. If you aggressively spam irrelevant threads, your domain URL may be globally blacklisted. <strong>Use automation responsibly.</strong>
        </p>
      </div>
    </div>
  </div>
);

export default BillingScreen;
