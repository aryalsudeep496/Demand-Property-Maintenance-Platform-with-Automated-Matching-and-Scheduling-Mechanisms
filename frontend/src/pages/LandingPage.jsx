import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// ─── Theme tokens ──────────────────────────────────────────────────────────────
const themes = {
  light: {
    bg:           '#F5F0E8',
    bgAlt:        '#EDE8DC',
    bgCard:       '#FFFFFF',
    bgCardHover:  '#FDF9F3',
    text:         '#1C1A16',
    textSub:      '#5C5647',
    textMuted:    '#9C9080',
    accent:       '#C17B2A',
    accentLight:  '#F0D9B5',
    accentGlow:   'rgba(193,123,42,0.18)',
    navy:         '#1E3A5F',
    navyLight:    '#2A5080',
    border:       'rgba(28,26,22,0.1)',
    borderStrong: 'rgba(28,26,22,0.2)',
    navBg:        'rgba(245,240,232,0.85)',
    shadow:       '0 4px 32px rgba(28,26,22,0.1)',
    shadowLg:     '0 20px 60px rgba(28,26,22,0.15)',
    gradHero:     'radial-gradient(ellipse 80% 60% at 60% 40%, rgba(193,123,42,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 20% 80%, rgba(30,58,95,0.08) 0%, transparent 50%)',
  },
  dark: {
    bg:           '#0F0E0B',
    bgAlt:        '#161410',
    bgCard:       '#1C1A14',
    bgCardHover:  '#222018',
    text:         '#F0EBE0',
    textSub:      '#B8AD9E',
    textMuted:    '#6B6357',
    accent:       '#E09640',
    accentLight:  'rgba(224,150,64,0.15)',
    accentGlow:   'rgba(224,150,64,0.25)',
    navy:         '#4A90D9',
    navyLight:    '#6AAAE8',
    border:       'rgba(240,235,224,0.08)',
    borderStrong: 'rgba(240,235,224,0.15)',
    navBg:        'rgba(15,14,11,0.85)',
    shadow:       '0 4px 32px rgba(0,0,0,0.4)',
    shadowLg:     '0 20px 60px rgba(0,0,0,0.5)',
    gradHero:     'radial-gradient(ellipse 80% 60% at 60% 40%, rgba(224,150,64,0.1) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 20% 80%, rgba(74,144,217,0.08) 0%, transparent 50%)',
  },
};

const useCounter = (end, duration = 2000, start = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start || end === 0) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(end);
    };
    requestAnimationFrame(step);
  }, [end, duration, start]);
  return count;
};

const useInView = (threshold = 0.2) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
};

const StatItem = ({ value, suffix, label, t, delay }) => {
  const [ref, inView] = useInView(0.3);
  const count = useCounter(value, 2000, inView);
  return (
    <div ref={ref} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(24px)', transition: `all 0.6s ease ${delay}ms` }}>
      <span style={{ fontSize:'40px', fontWeight:'900', lineHeight:1, fontFamily:"'Outfit', sans-serif", color: t.accent }}>{count}{suffix}</span>
      <span style={{ fontSize:'13px', fontWeight:'500', color: t.textMuted }}>{label}</span>
    </div>
  );
};

// Decimal counter (e.g. 4.9) — animates tenths-precision value
const DecimalStatItem = ({ value, suffix, label, t, delay }) => {
  const [ref, inView] = useInView(0.3);
  // animate the value × 10 as an integer, then divide back for display
  const tenths = useCounter(Math.round(value * 10), 2000, inView);
  const display = value > 0 ? (tenths / 10).toFixed(1) : value.toFixed(1);
  return (
    <div ref={ref} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(24px)', transition: `all 0.6s ease ${delay}ms` }}>
      <span style={{ fontSize:'40px', fontWeight:'900', lineHeight:1, fontFamily:"'Outfit', sans-serif", color: t.accent }}>{display}{suffix}</span>
      <span style={{ fontSize:'13px', fontWeight:'500', color: t.textMuted }}>{label}</span>
    </div>
  );
};

const SectionLabel = ({ label, t }) => (
  <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
    <div style={{ width:'20px', height:'2px', background: t.accent }} />
    <span style={{ fontSize:'12px', fontWeight:'700', color: t.accent, letterSpacing:'1.5px', textTransform:'uppercase' }}>{label}</span>
  </div>
);

const StarRating = ({ rating, t }) => (
  <span style={{ letterSpacing: '2px' }}>
    {[1,2,3,4,5].map(i => (
      <span key={i} style={{ color: i <= rating ? '#f0c040' : t.border, fontSize: '18px' }}>★</span>
    ))}
  </span>
);

const CATEGORY_LABEL = {
  home_repair:  'Home Repair',
  home_upgrade: 'Home Upgrade',
  tech_digital: 'Tech & Digital',
};

// Fallback testimonials shown while loading or if no reviews exist yet
const FALLBACK_REVIEWS = [
  { customerName: 'Sarah M.',  providerRole: 'Homeowner',        comment: 'Got a plumber within 40 minutes of posting. Absolutely seamless experience.', rating: 5 },
  { customerName: 'James K.',  providerRole: 'Property Manager', comment: 'Managing 12 units is so much easier now. PropMaintain is my go-to platform.',  rating: 5 },
  { customerName: 'Priya L.',  providerRole: 'Service Provider', comment: 'My bookings tripled in the first month. The scheduling system is brilliant.',   rating: 5 },
];

const LandingPage = () => {
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'privacy' | 'terms' | 'contact'
  const t = dark ? themes.dark : themes.light;

  // ── Live stats ──────────────────────────────────────────────────────────────
  const [liveStats, setLiveStats] = useState({
    completedRequests:  0,
    verifiedProviders:  0,
    totalProviders:     0,
    avgRating:          0,
    totalReviews:       0,
    inProgressRequests: 0,
    recentReviews:      [],
    featuredRequest:    null,
  });
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStats = async () => {
    try {
      const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const { data } = await axios.get(`${BASE}/public/stats`);
      if (data.success) {
        setLiveStats(data.data);
        setLastUpdated(new Date());
        setStatsLoaded(true);
      }
    } catch {
      // silently fail — fallbacks stay visible
      setStatsLoaded(true);
    }
  };

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 100);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);

    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => {
      window.removeEventListener('scroll', onScroll);
      clearInterval(interval);
    };
  }, []);

  const displayReviews = (liveStats.recentReviews?.length >= 3)
    ? liveStats.recentReviews.slice(0, 3)
    : FALLBACK_REVIEWS.slice(0, 3);

  const services = [
    { icon: '🔧', title: 'Home Repair',    desc: 'Plumbing, electrical, carpentry — expert technicians dispatched to your door within hours.',  color: '#C17B2A' },
    { icon: '🏡', title: 'Home Upgrade',   desc: 'Renovation, painting, flooring — transform your space with vetted upgrade specialists.',       color: '#1E3A5F' },
    { icon: '💻', title: 'Tech & Digital', desc: 'Device repair, network setup, smart home — digital solutions handled by certified pros.',      color: '#2A7A4A' },
  ];

  const steps = [
    { num: '01', title: 'Post Your Request',     desc: 'Describe your issue, set your location, and choose urgency level in under 2 minutes.' },
    { num: '02', title: 'Get Matched Instantly', desc: 'Our algorithm finds the best available provider near you based on skill, rating, and proximity.' },
    { num: '03', title: 'Track & Communicate',   desc: 'Follow your job in real-time and chat directly with your assigned professional.' },
    { num: '04', title: 'Rate & Review',         desc: 'Once done, rate the service. Your feedback keeps quality high for the whole community.' },
  ];

  const features = [
    { icon: '⚡', title: 'Real-Time Matching',  desc: 'Instant assignment when a provider is nearby and available.' },
    { icon: '📅', title: 'Smart Scheduling',    desc: 'Auto-schedules for the next slot when no one is immediately free.' },
    { icon: '💬', title: 'In-App Messaging',    desc: 'Secure chat between customers and providers, no phone needed.' },
    { icon: '🔒', title: 'Verified Providers',  desc: 'Every professional is background-checked and skill-verified.' },
    { icon: '📍', title: 'Location Aware',      desc: 'Geo-based matching ensures the closest available pro is sent.' },
    { icon: '⭐', title: 'Quality Guaranteed',  desc: 'Transparent ratings and reviews on every completed job.' },
  ];

  const displayRating = liveStats.avgRating > 0
    ? liveStats.avgRating.toFixed(1)
    : '4.9';
  const displayReviewCount = liveStats.totalReviews > 0
    ? `${liveStats.totalReviews.toLocaleString()}+ verified reviews`
    : '2,400+ verified reviews';

  return (
    <div style={{ background: t.bg, color: t.text, fontFamily:"'Outfit', sans-serif", minHeight:'100vh', transition:'background 0.4s, color 0.4s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;1,600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        ::-webkit-scrollbar{width:6px;}
        ::-webkit-scrollbar-track{background:${t.bg};}
        ::-webkit-scrollbar-thumb{background:${t.accent};border-radius:3px;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(32px);}to{opacity:1;transform:translateY(0);}}
        @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-12px);}}
        @keyframes rotateSlow{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes pulse{0%,100%{opacity:0.6;transform:scale(1);}50%{opacity:1;transform:scale(1.05);}}
        @keyframes blink{0%,100%{opacity:1;}50%{opacity:0.4;}}
        .nav-link{transition:color 0.2s;text-decoration:none;}
        .nav-link:hover{color:${t.accent} !important;}
        .btn-primary{transition:all 0.25s;}
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 32px ${t.accentGlow} !important;}
        .btn-secondary{transition:all 0.25s;text-decoration:none;}
        .btn-secondary:hover{transform:translateY(-2px);}
        .service-card{transition:all 0.3s;cursor:default;}
        .service-card:hover{transform:translateY(-6px);}
        .feature-card{transition:all 0.3s;cursor:default;}
        .feature-card:hover{transform:translateY(-4px);}
        .step-card{transition:all 0.3s;cursor:default;}
        .step-card:hover{transform:translateX(6px);}
        .tcard{transition:all 0.3s;cursor:default;}
        .tcard:hover{transform:translateY(-4px);}
        .theme-btn{transition:all 0.3s;}
        .theme-btn:hover{transform:rotate(20deg) scale(1.1);}
      `}</style>

      {/* NAVBAR */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, padding:'0 48px', height:'68px', display:'flex', alignItems:'center', justifyContent:'space-between', background: scrolled ? t.navBg : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? `1px solid ${t.border}` : 'none', transition:'all 0.4s' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'36px', height:'36px', background:`linear-gradient(135deg, ${t.accent}, ${t.navy})`, borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>🏠</div>
          <span style={{ fontSize:'20px', fontWeight:'800', color:t.text, letterSpacing:'-0.5px' }}>Prop<span style={{ color:t.accent }}>Maintain</span></span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'32px' }}>
          {['Services','How It Works','Features','Testimonials'].map(link => (
            <a key={link} href={`#${link.toLowerCase().replace(/\s/g,'-')}`} className="nav-link" style={{ fontSize:'14px', fontWeight:'500', color:t.textSub }}>{link}</a>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <button className="theme-btn" onClick={() => setDark(!dark)} style={{ width:'40px', height:'40px', borderRadius:'50%', border:`1px solid ${t.border}`, background:t.bgCard, cursor:'pointer', fontSize:'18px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {dark ? '☀️' : '🌙'}
          </button>
          <Link to="/auth/login" className="btn-secondary" style={{ padding:'9px 20px', borderRadius:'8px', border:`1px solid ${t.borderStrong}`, color:t.text, textDecoration:'none', fontSize:'14px', fontWeight:'500' }}>Sign In</Link>
          <Link to="/auth/register" className="btn-primary" style={{ padding:'9px 20px', borderRadius:'8px', background:t.accent, color:'#fff', textDecoration:'none', fontSize:'14px', fontWeight:'600', boxShadow:`0 4px 16px ${t.accentGlow}` }}>Get Started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', padding:'120px 48px 80px' }}>
        <div style={{ position:'absolute', inset:0, background:t.gradHero, pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'15%', right:'8%', width:'400px', height:'400px', borderRadius:'50%', border:`1px solid ${t.border}`, opacity:0.5, animation:'rotateSlow 30s linear infinite' }} />
        <div style={{ position:'absolute', top:'20%', right:'13%', width:'280px', height:'280px', borderRadius:'50%', border:`1px dashed ${t.accentLight}`, animation:'rotateSlow 20s linear infinite reverse' }} />
        <div style={{ position:'absolute', top:'25%', right:'18%', width:'80px', height:'80px', borderRadius:'50%', background:`radial-gradient(circle, ${t.accentGlow}, transparent)`, animation:'float 6s ease-in-out infinite' }} />

        <div style={{ maxWidth:'1100px', width:'100%', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'80px', alignItems:'center', position:'relative', zIndex:1 }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'6px 14px', borderRadius:'20px', border:`1px solid ${t.accentLight}`, background:t.accentLight, marginBottom:'28px', opacity: heroVisible?1:0, transform: heroVisible?'translateY(0)':'translateY(16px)', transition:'all 0.6s ease' }}>
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:t.accent, animation:'pulse 2s infinite' }} />
              <span style={{ fontSize:'12px', fontWeight:'600', color:t.accent, letterSpacing:'0.5px', textTransform:'uppercase' }}>Now Live in the UK</span>
            </div>
            <h1 style={{ fontFamily:"'Playfair Display', serif", fontSize:'62px', fontWeight:'700', lineHeight:1.1, color:t.text, marginBottom:'24px', letterSpacing:'-1px', opacity: heroVisible?1:0, transform: heroVisible?'translateY(0)':'translateY(24px)', transition:'all 0.7s ease 0.1s' }}>
              Your Home,<br /><em style={{ color:t.accent, fontStyle:'italic' }}>Perfectly</em><br />Maintained.
            </h1>
            <p style={{ fontSize:'17px', lineHeight:1.7, color:t.textSub, marginBottom:'40px', maxWidth:'440px', opacity: heroVisible?1:0, transform: heroVisible?'translateY(0)':'translateY(24px)', transition:'all 0.7s ease 0.2s' }}>
              On-demand property maintenance connecting you with verified professionals for repairs, upgrades, and tech support — instantly or scheduled.
            </p>
            <div style={{ display:'flex', gap:'14px', marginBottom:'56px', opacity: heroVisible?1:0, transition:'all 0.7s ease 0.3s' }}>
              <Link to="/auth/register" className="btn-primary" style={{ padding:'14px 32px', borderRadius:'10px', background:t.accent, color:'#fff', textDecoration:'none', fontSize:'15px', fontWeight:'700', boxShadow:`0 8px 24px ${t.accentGlow}` }}>Book a Service →</Link>
              <Link to="/auth/register" className="btn-secondary" style={{ padding:'14px 28px', borderRadius:'10px', border:`1px solid ${t.borderStrong}`, color:t.text, textDecoration:'none', fontSize:'15px', fontWeight:'500' }}>Become a Provider</Link>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'16px', opacity: heroVisible?1:0, transition:'all 0.7s ease 0.4s' }}>
              <div style={{ display:'flex' }}>
                {['#C17B2A','#1E3A5F','#2A7A4A','#8B4B8B','#C44B4B'].map((c,i) => (
                  <div key={i} style={{ width:'32px', height:'32px', borderRadius:'50%', background:c, border:`2px solid ${t.bg}`, marginLeft: i>0?'-8px':0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'700', color:'#fff' }}>
                    {['S','J','P','A','M'][i]}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize:'13px', fontWeight:'600', color:t.text }}>⭐⭐⭐⭐⭐ <span style={{ color:t.accent }}>{displayRating}/5</span></div>
                <div style={{ fontSize:'12px', color:t.textMuted }}>from {displayReviewCount}</div>
              </div>
            </div>
          </div>

          {/* Hero card */}
          {(() => {
            const fr = liveStats.featuredRequest;
            const CATEGORY_ICON  = { home_repair: '🔧', home_upgrade: '🏡', tech_digital: '💻' };
            const STATUS_LABEL   = { in_progress: 'In Progress', matched: 'Matched', completed: 'Completed' };
            const STATUS_COLOR   = { in_progress: '#27ae60', matched: '#2980b9', completed: '#8e44ad' };
            const URGENCY_LABEL  = { low: 'Low', medium: 'Medium', high: 'High', emergency: 'Emergency' };
            const progressPct    = fr?.status === 'in_progress' ? 65 : fr?.status === 'matched' ? 30 : fr?.status === 'completed' ? 100 : 65;
            const statusColor    = fr ? (STATUS_COLOR[fr.status] || '#27ae60') : '#27ae60';
            const floatLabel     = fr?.status === 'completed' ? '✅ Job Completed' : fr?.status === 'matched' ? '🔗 Provider Matched' : '🔧 Work In Progress';
            const floatSub       = fr?.status === 'completed' ? `${CATEGORY_LABEL[fr.category] || 'Job'} done` : fr?.status === 'matched' ? 'Provider assigned' : 'Job underway';

            return (
              <div style={{ position:'relative', opacity: heroVisible?1:0, transform: heroVisible?'translateY(0)':'translateY(32px)', transition:'all 0.8s ease 0.3s' }}>
                <div style={{ background:t.bgCard, borderRadius:'20px', padding:'28px', boxShadow:t.shadowLg, border:`1px solid ${t.border}` }}>
                  <div style={{ fontSize:'13px', fontWeight:'600', color:t.textMuted, marginBottom:'16px', textTransform:'uppercase', letterSpacing:'1px' }}>
                    {fr ? 'Live on Platform' : 'Active Request'}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'20px' }}>
                    <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:t.accentLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px' }}>
                      {fr ? (CATEGORY_ICON[fr.category] || '🔧') : '🔧'}
                    </div>
                    <div>
                      <div style={{ fontSize:'16px', fontWeight:'700', color:t.text, maxWidth:'160px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {fr ? fr.title : 'Boiler Repair'}
                      </div>
                      <div style={{ fontSize:'13px', color:t.textMuted }}>
                        {fr ? `${CATEGORY_LABEL[fr.category] || fr.category} · ${URGENCY_LABEL[fr.urgency] || fr.urgency}` : 'Home Repair · Urgent'}
                      </div>
                    </div>
                    <div style={{ marginLeft:'auto', padding:'4px 10px', borderRadius:'20px', background:`${statusColor}18`, color: statusColor, fontSize:'12px', fontWeight:'600', whiteSpace:'nowrap' }}>
                      ● {fr ? (STATUS_LABEL[fr.status] || fr.status) : 'Live'}
                    </div>
                  </div>
                  <div style={{ marginBottom:'20px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                      <span style={{ fontSize:'12px', color:t.textMuted }}>
                        {fr?.status === 'completed' ? 'Job completed' : fr?.status === 'matched' ? 'Provider assigned' : 'Work in progress'}
                      </span>
                      <span style={{ fontSize:'12px', fontWeight:'600', color:t.accent }}>{progressPct}%</span>
                    </div>
                    <div style={{ height:'6px', borderRadius:'3px', background:t.border, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${progressPct}%`, background:`linear-gradient(90deg, ${t.accent}, ${t.navy})`, borderRadius:'3px', transition:'width 1s ease' }} />
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px', borderRadius:'12px', background:t.bgAlt }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:t.navy, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'700', color:'#fff', flexShrink:0 }}>
                      {fr ? fr.providerInitials : 'JD'}
                    </div>
                    <div>
                      <div style={{ fontSize:'13px', fontWeight:'600', color:t.text }}>
                        {fr ? fr.providerName : 'James Davies'}
                      </div>
                      <div style={{ fontSize:'11px', color:t.textMuted }}>
                        {fr
                          ? `⭐ ${fr.providerRating > 0 ? fr.providerRating.toFixed(1) : 'New'} · ${fr.providerJobs} jobs${fr.providerVerified ? ' · Verified' : ''}`
                          : '⭐ 4.9 · 340 jobs · Certified'}
                      </div>
                    </div>
                    <div style={{ marginLeft:'auto', width:'32px', height:'32px', borderRadius:'50%', background:t.accentLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>💬</div>
                  </div>
                </div>
                <div style={{ position:'absolute', top:'-20px', right:'-20px', background:t.bgCard, borderRadius:'14px', padding:'12px 16px', boxShadow:t.shadow, border:`1px solid ${t.border}`, animation:'float 5s ease-in-out infinite', whiteSpace:'nowrap' }}>
                  <div style={{ fontSize:'12px', fontWeight:'600', color:t.text }}>{floatLabel}</div>
                  <div style={{ fontSize:'11px', color:t.textMuted }}>{floatSub}</div>
                </div>
                <div style={{ position:'absolute', bottom:'-16px', left:'-20px', background:t.bgCard, borderRadius:'14px', padding:'12px 16px', boxShadow:t.shadow, border:`1px solid ${t.border}`, animation:'float 7s ease-in-out infinite 1s', whiteSpace:'nowrap' }}>
                  <div style={{ fontSize:'12px', fontWeight:'600', color:t.text }}>🔍 Provider Matched</div>
                  <div style={{ fontSize:'11px', color:t.textMuted }}>
                    {fr ? `${CATEGORY_LABEL[fr.category] || 'Job'} · Active` : '0.8 km away · 4 min'}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* LIVE STATS */}
      <section style={{ padding:'48px', background:t.bgAlt, borderTop:`1px solid ${t.border}`, borderBottom:`1px solid ${t.border}` }}>
        <div style={{ maxWidth:'1000px', margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'32px' }}>
            <StatItem        value={liveStats.completedRequests || 0}                    suffix="+"   label="Jobs Completed"    t={t} delay={0}   />
            <StatItem        value={liveStats.totalProviders || 0}                               suffix="+"   label="Active Providers"   t={t} delay={100} />
            <DecimalStatItem value={liveStats.avgRating > 0 ? liveStats.avgRating : 4.9} suffix="/5"  label="Avg Rating"        t={t} delay={200} />
            <StatItem        value={liveStats.totalReviews || 0}                          suffix="+"   label="Customer Reviews"  t={t} delay={300} />
          </div>
          {lastUpdated && (
            <div style={{ textAlign:'center', marginTop:'20px', fontSize:'11px', color:t.textMuted, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#27ae60', display:'inline-block', animation:'blink 2s ease-in-out infinite' }} />
              Live data · updated {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" style={{ padding:'100px 48px' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
          <SectionLabel label="What We Offer" t={t} />
          <h2 style={{ fontFamily:"'Outfit', sans-serif", fontSize:'40px', fontWeight:'800', lineHeight:1.15, letterSpacing:'-0.5px', color:t.text }}>Three service pillars,<br /><em style={{ color:t.accent, fontFamily:"'Playfair Display', serif", fontStyle:'italic' }}>one platform.</em></h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'24px', marginTop:'56px' }}>
            {services.map(({ icon, title, desc, color }) => (
              <div key={title} className="service-card" style={{ background:t.bgCard, borderRadius:'20px', padding:'36px 32px', border:`1px solid ${t.border}`, boxShadow:t.shadow }}>
                <div style={{ width:'60px', height:'60px', borderRadius:'16px', background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', marginBottom:'20px' }}>{icon}</div>
                <h3 style={{ fontSize:'20px', fontWeight:'700', color:t.text, marginBottom:'12px' }}>{title}</h3>
                <p style={{ fontSize:'14px', lineHeight:1.7, color:t.textSub }}>{desc}</p>
                <div style={{ marginTop:'24px', color, fontSize:'13px', fontWeight:'600' }}>Learn more →</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding:'100px 48px', background:t.bgAlt }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'80px', alignItems:'center' }}>
          <div>
            <SectionLabel label="The Process" t={t} />
            <h2 style={{ fontFamily:"'Outfit', sans-serif", fontSize:'40px', fontWeight:'800', lineHeight:1.15, color:t.text }}>Up and running<br /><em style={{ color:t.accent, fontFamily:"'Playfair Display', serif", fontStyle:'italic' }}>in four steps.</em></h2>
            <p style={{ fontSize:'15px', lineHeight:1.7, color:t.textSub, marginTop:'16px' }}>From posting your first request to watching a verified professional arrive — the whole process is designed to be effortless.</p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="step-card" style={{ display:'flex', gap:'20px', padding:'20px 24px', borderRadius:'14px', background:t.bgCard, border:`1px solid ${t.border}` }}>
                <div style={{ fontSize:'32px', fontWeight:'900', color:t.accentLight, fontFamily:"'Playfair Display', serif", lineHeight:1, minWidth:'40px' }}>{num}</div>
                <div>
                  <div style={{ fontSize:'15px', fontWeight:'700', color:t.text, marginBottom:'4px' }}>{title}</div>
                  <div style={{ fontSize:'13px', lineHeight:1.6, color:t.textSub }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding:'100px 48px' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
          <SectionLabel label="Platform Features" t={t} />
          <h2 style={{ fontFamily:"'Outfit', sans-serif", fontSize:'40px', fontWeight:'800', lineHeight:1.15, color:t.text }}>Built for speed,<br /><em style={{ color:t.accent, fontFamily:"'Playfair Display', serif", fontStyle:'italic' }}>trust, and scale.</em></h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'20px', marginTop:'56px' }}>
            {features.map(({ icon, title, desc }) => (
              <div key={title} className="feature-card" style={{ padding:'28px', borderRadius:'16px', background:t.bgCard, border:`1px solid ${t.border}` }}>
                <div style={{ fontSize:'28px', marginBottom:'14px' }}>{icon}</div>
                <div style={{ fontSize:'15px', fontWeight:'700', color:t.text, marginBottom:'8px' }}>{title}</div>
                <div style={{ fontSize:'13px', lineHeight:1.6, color:t.textSub }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" style={{ padding:'100px 48px', background:t.bgAlt }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:'16px', marginBottom:'56px' }}>
            <div>
              <SectionLabel label="What People Say" t={t} />
              <h2 style={{ fontFamily:"'Outfit', sans-serif", fontSize:'40px', fontWeight:'800', lineHeight:1.15, color:t.text }}>Loved by customers<br /><em style={{ color:t.accent, fontFamily:"'Playfair Display', serif", fontStyle:'italic' }}>and providers.</em></h2>
            </div>
            {liveStats.totalReviews > 0 && (
              <div style={{ padding:'12px 20px', borderRadius:'12px', background:t.bgCard, border:`1px solid ${t.border}`, textAlign:'center' }}>
                <div style={{ fontSize:'28px', fontWeight:'900', color:t.accent }}>{liveStats.avgRating.toFixed(1)}</div>
                <StarRating rating={Math.round(liveStats.avgRating)} t={t} />
                <div style={{ fontSize:'12px', color:t.textMuted, marginTop:'4px' }}>from {liveStats.totalReviews} reviews</div>
              </div>
            )}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'24px' }}>
            {displayReviews.map((review, idx) => (
              <div key={idx} className="tcard" style={{ background:t.bgCard, borderRadius:'20px', padding:'32px', border:`1px solid ${t.border}`, boxShadow:t.shadow, display:'flex', flexDirection:'column' }}>
                <StarRating rating={review.rating} t={t} />
                <p style={{ fontSize:'15px', lineHeight:1.7, color:t.textSub, margin:'16px 0 24px', fontStyle:'italic', flex:1 }}>"{review.comment}"</p>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:`linear-gradient(135deg, ${t.accent}, ${t.navy})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'700', color:'#fff', flexShrink:0 }}>
                    {review.customerName?.charAt(0) || '?'}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:'14px', fontWeight:'700', color:t.text }}>{review.customerName}</div>
                    <div style={{ fontSize:'12px', color:t.textMuted, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {review.jobTitle
                        ? `${review.jobTitle} · ${CATEGORY_LABEL[review.category] || review.providerRole}`
                        : review.providerRole}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {liveStats.recentReviews?.length < 3 && !statsLoaded && (
            <p style={{ textAlign:'center', color:t.textMuted, fontSize:'13px', marginTop:'24px' }}>Loading real reviews…</p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:'100px 48px' }}>
        <div style={{ maxWidth:'700px', margin:'0 auto', textAlign:'center' }}>
          <div style={{ display:'inline-block', padding:'6px 14px', borderRadius:'20px', background:t.accentLight, color:t.accent, fontSize:'12px', fontWeight:'700', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'24px' }}>Get Started Today</div>
          <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:'48px', fontWeight:'700', color:t.text, marginBottom:'20px', lineHeight:1.15 }}>Your first booking<br />is just minutes away.</h2>
          <p style={{ fontSize:'16px', color:t.textSub, lineHeight:1.7, marginBottom:'40px' }}>
            Join {liveStats.totalProviders > 0 ? `${liveStats.totalProviders}+ providers` : 'thousands of homeowners and providers'} already using PropMaintain to simplify property maintenance.
          </p>
          <div style={{ display:'flex', gap:'16px', justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/auth/register" className="btn-primary" style={{ padding:'15px 36px', borderRadius:'10px', background:t.accent, color:'#fff', textDecoration:'none', fontSize:'15px', fontWeight:'700', boxShadow:`0 8px 24px ${t.accentGlow}` }}>Book a Service →</Link>
            <Link to="/auth/register" className="btn-secondary" style={{ padding:'15px 32px', borderRadius:'10px', border:`1px solid ${t.borderStrong}`, color:t.text, textDecoration:'none', fontSize:'15px', fontWeight:'500' }}>Join as Provider</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding:'48px', borderTop:`1px solid ${t.border}`, background:t.bgAlt }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ width:'28px', height:'28px', background:`linear-gradient(135deg, ${t.accent}, ${t.navy})`, borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px' }}>🏠</div>
            <span style={{ fontSize:'16px', fontWeight:'800', color:t.text }}>Prop<span style={{ color:t.accent }}>Maintain</span></span>
          </div>
          <div style={{ fontSize:'13px', color:t.textMuted }}>© 2025 PropMaintain · MSc IT Web Development · University of the West of Scotland</div>
          <div style={{ display:'flex', gap:'20px' }}>
            {[['Privacy','privacy'],['Terms','terms'],['Contact','contact']].map(([label, key]) => (
              <button key={key} onClick={() => setActiveModal(key)} style={{ fontSize:'13px', color:t.textMuted, background:'none', border:'none', cursor:'pointer', fontFamily:"'Outfit', sans-serif", padding:0, textDecoration:'none' }}
                onMouseOver={e => e.currentTarget.style.color = t.accent}
                onMouseOut={e  => e.currentTarget.style.color = t.textMuted}
              >{label}</button>
            ))}
          </div>
        </div>
      </footer>

      {/* ── Modals ── */}
      {activeModal && (
        <div
          onClick={() => setActiveModal(null)}
          style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', overflowY:'auto' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background:t.bgCard, borderRadius:'20px', padding:'40px 44px', maxWidth:'680px', width:'100%', maxHeight:'85vh', overflowY:'auto', boxShadow:'0 32px 80px rgba(0,0,0,0.3)', border:`1px solid ${t.border}`, fontFamily:"'Outfit', sans-serif", position:'relative' }}
          >
            <button
              onClick={() => setActiveModal(null)}
              style={{ position:'absolute', top:'20px', right:'20px', width:'36px', height:'36px', borderRadius:'50%', border:`1px solid ${t.border}`, background:t.bgAlt, cursor:'pointer', fontSize:'18px', color:t.textMuted, display:'flex', alignItems:'center', justifyContent:'center' }}
            >×</button>

            {activeModal === 'privacy' && (
              <>
                <h2 style={{ fontSize:'26px', fontWeight:'800', color:t.text, marginBottom:'6px' }}>Privacy Policy</h2>
                <p style={{ fontSize:'13px', color:t.textMuted, marginBottom:'28px' }}>Last updated: January 2025</p>
                {[
                  { title:'1. Information We Collect', body:'We collect information you provide directly, such as your name, email address, phone number, and location when you register or submit a service request. We also collect usage data, including pages visited and actions taken on the platform.' },
                  { title:'2. How We Use Your Information', body:'Your information is used to match you with service providers, process service requests, send notifications about your bookings, improve platform performance, and comply with legal obligations. We do not sell your personal data to third parties.' },
                  { title:'3. Location Data', body:'Service requests and provider matching rely on location data you provide. Location is stored only for the purpose of matching and is not shared beyond the matched provider and the platform administrators.' },
                  { title:'4. Data Sharing', body:'We share your data only with your assigned service provider (name and job details only), platform administrators for support and moderation, and third-party services required to operate the platform (e.g. email delivery, database hosting). All third parties are contractually bound to protect your data.' },
                  { title:'5. Data Retention', body:'We retain your account data for as long as your account is active. You may request deletion of your account and associated data at any time by contacting support. Completed job records may be retained for up to 3 years for legal and audit purposes.' },
                  { title:'6. Your Rights', body:'You have the right to access, correct, or delete your personal data. You may also object to certain processing or request a copy of your data in a portable format. To exercise these rights, contact us at the address below.' },
                  { title:'7. Cookies', body:'We use essential cookies to maintain your session and authentication. No third-party advertising cookies are used. You can control cookie settings in your browser, though disabling essential cookies may affect platform functionality.' },
                  { title:'8. Security', body:'We use industry-standard security measures including HTTPS, encrypted password storage, and access controls. However, no method of internet transmission is 100% secure, and we cannot guarantee absolute security.' },
                  { title:'9. Contact', body:'For privacy-related enquiries, contact us at privacy@propmaintain.co.uk or write to: PropMaintain, University of the West of Scotland, Paisley, PA1 2BE, United Kingdom.' },
                ].map(({ title, body }) => (
                  <div key={title} style={{ marginBottom:'20px' }}>
                    <h3 style={{ fontSize:'15px', fontWeight:'700', color:t.text, marginBottom:'6px' }}>{title}</h3>
                    <p style={{ fontSize:'14px', lineHeight:1.7, color:t.textSub }}>{body}</p>
                  </div>
                ))}
              </>
            )}

            {activeModal === 'terms' && (
              <>
                <h2 style={{ fontSize:'26px', fontWeight:'800', color:t.text, marginBottom:'6px' }}>Terms of Service</h2>
                <p style={{ fontSize:'13px', color:t.textMuted, marginBottom:'28px' }}>Last updated: January 2025</p>
                {[
                  { title:'1. Acceptance of Terms', body:'By registering or using PropMaintain, you agree to these Terms of Service. If you do not agree, you may not use the platform. These terms apply to all users including customers, service providers, and administrators.' },
                  { title:'2. Platform Description', body:'PropMaintain is an on-demand property maintenance platform that connects customers with independent service providers. We facilitate the matching, scheduling, and communication between parties but are not a party to any service agreement between customer and provider.' },
                  { title:'3. User Accounts', body:'You must provide accurate information when registering. You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorised use of your account. Accounts must not be shared or transferred.' },
                  { title:'4. Customer Responsibilities', body:'Customers agree to provide accurate descriptions of service requests, grant reasonable access to their property at the agreed time, make payment as agreed, and treat service providers with respect. False or misleading requests may result in account suspension.' },
                  { title:'5. Provider Responsibilities', body:'Service providers agree to only accept jobs within their declared skill set, arrive at the agreed time, carry out work to a professional standard, hold any necessary licences or certifications required by law, and maintain appropriate insurance.' },
                  { title:'6. Prohibited Conduct', body:'Users must not use the platform to harass, defraud, or harm other users; circumvent the platform to arrange off-platform payments; post false reviews; attempt to reverse-engineer or disrupt the platform; or use the platform for any unlawful purpose.' },
                  { title:'7. Reviews and Ratings', body:'Reviews must be honest and based on genuine experiences. PropMaintain reserves the right to remove reviews that violate community standards, contain offensive content, or are demonstrably false.' },
                  { title:'8. Limitation of Liability', body:'PropMaintain is not liable for the quality of work carried out by providers, any damage or loss arising from a service, or any indirect or consequential loss. Our total liability to any user shall not exceed the fees paid in the preceding 3 months.' },
                  { title:'9. Termination', body:'We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or are inactive for more than 24 months. Users may delete their account at any time from the profile settings.' },
                  { title:'10. Governing Law', body:'These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.' },
                ].map(({ title, body }) => (
                  <div key={title} style={{ marginBottom:'20px' }}>
                    <h3 style={{ fontSize:'15px', fontWeight:'700', color:t.text, marginBottom:'6px' }}>{title}</h3>
                    <p style={{ fontSize:'14px', lineHeight:1.7, color:t.textSub }}>{body}</p>
                  </div>
                ))}
              </>
            )}

            {activeModal === 'contact' && (
              <>
                <h2 style={{ fontSize:'26px', fontWeight:'800', color:t.text, marginBottom:'6px' }}>Contact Us</h2>
                <p style={{ fontSize:'14px', color:t.textSub, marginBottom:'32px', lineHeight:1.7 }}>Have a question, feedback, or need support? We're here to help. Reach out through any of the channels below.</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'32px' }}>
                  {[
                    { icon:'📧', label:'General Enquiries',  value:'hello@propmaintain.co.uk' },
                    { icon:'🛠️', label:'Technical Support',  value:'support@propmaintain.co.uk' },
                    { icon:'🔒', label:'Privacy & Data',     value:'privacy@propmaintain.co.uk' },
                    { icon:'📋', label:'Provider Onboarding',value:'providers@propmaintain.co.uk' },
                  ].map(({ icon, label, value }) => (
                    <div key={label} style={{ padding:'18px', borderRadius:'12px', background:t.bgAlt, border:`1px solid ${t.border}` }}>
                      <div style={{ fontSize:'22px', marginBottom:'8px' }}>{icon}</div>
                      <div style={{ fontSize:'12px', fontWeight:'700', color:t.textMuted, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'4px' }}>{label}</div>
                      <div style={{ fontSize:'13px', fontWeight:'600', color:t.accent }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding:'20px', borderRadius:'12px', background:t.bgAlt, border:`1px solid ${t.border}`, marginBottom:'24px' }}>
                  <div style={{ fontSize:'15px', fontWeight:'700', color:t.text, marginBottom:'12px' }}>🏛️ Registered Address</div>
                  <p style={{ fontSize:'14px', lineHeight:1.8, color:t.textSub }}>
                    PropMaintain<br />
                    University of the West of Scotland<br />
                    Paisley Campus, High Street<br />
                    Paisley, PA1 2BE<br />
                    United Kingdom
                  </p>
                </div>
                <div style={{ padding:'20px', borderRadius:'12px', background:t.bgAlt, border:`1px solid ${t.border}` }}>
                  <div style={{ fontSize:'15px', fontWeight:'700', color:t.text, marginBottom:'8px' }}>⏰ Support Hours</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                    {[
                      ['Monday – Friday', '8:00 am – 8:00 pm'],
                      ['Saturday',        '9:00 am – 5:00 pm'],
                      ['Sunday',          '10:00 am – 4:00 pm'],
                      ['Emergency line',  '24 / 7'],
                    ].map(([day, hours]) => (
                      <div key={day} style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', padding:'6px 0', borderBottom:`1px solid ${t.border}` }}>
                        <span style={{ color:t.textSub }}>{day}</span>
                        <span style={{ fontWeight:'600', color:t.text }}>{hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
