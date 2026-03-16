import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

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
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
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

const SectionLabel = ({ label, t }) => (
  <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
    <div style={{ width:'20px', height:'2px', background: t.accent }} />
    <span style={{ fontSize:'12px', fontWeight:'700', color: t.accent, letterSpacing:'1.5px', textTransform:'uppercase' }}>{label}</span>
  </div>
);

const LandingPage = () => {
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const t = dark ? themes.dark : themes.light;

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 100);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  const testimonials = [
    { name: 'Sarah M.',  role: 'Homeowner',         text: 'Got a plumber within 40 minutes of posting. Absolutely seamless experience.', rating: 5 },
    { name: 'James K.',  role: 'Property Manager',  text: 'Managing 12 units is so much easier now. PropMaintain is my go-to platform.', rating: 5 },
    { name: 'Priya L.',  role: 'Service Provider',  text: 'My bookings tripled in the first month. The scheduling system is brilliant.',  rating: 5 },
  ];

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
                <div style={{ fontSize:'13px', fontWeight:'600', color:t.text }}>⭐⭐⭐⭐⭐ <span style={{ color:t.accent }}>4.9/5</span></div>
                <div style={{ fontSize:'12px', color:t.textMuted }}>from 2,400+ verified reviews</div>
              </div>
            </div>
          </div>

          {/* Hero card */}
          <div style={{ position:'relative', opacity: heroVisible?1:0, transform: heroVisible?'translateY(0)':'translateY(32px)', transition:'all 0.8s ease 0.3s' }}>
            <div style={{ background:t.bgCard, borderRadius:'20px', padding:'28px', boxShadow:t.shadowLg, border:`1px solid ${t.border}` }}>
              <div style={{ fontSize:'13px', fontWeight:'600', color:t.textMuted, marginBottom:'16px', textTransform:'uppercase', letterSpacing:'1px' }}>Active Request</div>
              <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'20px' }}>
                <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:t.accentLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px' }}>🔧</div>
                <div>
                  <div style={{ fontSize:'16px', fontWeight:'700', color:t.text }}>Boiler Repair</div>
                  <div style={{ fontSize:'13px', color:t.textMuted }}>Home Repair · Urgent</div>
                </div>
                <div style={{ marginLeft:'auto', padding:'4px 10px', borderRadius:'20px', background:'rgba(39,174,96,0.12)', color:'#27ae60', fontSize:'12px', fontWeight:'600' }}>● Live</div>
              </div>
              <div style={{ marginBottom:'20px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                  <span style={{ fontSize:'12px', color:t.textMuted }}>Provider en route</span>
                  <span style={{ fontSize:'12px', fontWeight:'600', color:t.accent }}>~12 min</span>
                </div>
                <div style={{ height:'6px', borderRadius:'3px', background:t.border, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:'65%', background:`linear-gradient(90deg, ${t.accent}, ${t.navy})`, borderRadius:'3px' }} />
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px', borderRadius:'12px', background:t.bgAlt }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:t.navy, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'700', color:'#fff' }}>JD</div>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:'600', color:t.text }}>James Davies</div>
                  <div style={{ fontSize:'11px', color:t.textMuted }}>⭐ 4.9 · 340 jobs · Certified</div>
                </div>
                <div style={{ marginLeft:'auto', width:'32px', height:'32px', borderRadius:'50%', background:t.accentLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>💬</div>
              </div>
            </div>
            <div style={{ position:'absolute', top:'-20px', right:'-20px', background:t.bgCard, borderRadius:'14px', padding:'12px 16px', boxShadow:t.shadow, border:`1px solid ${t.border}`, animation:'float 5s ease-in-out infinite', whiteSpace:'nowrap' }}>
              <div style={{ fontSize:'12px', fontWeight:'600', color:t.text }}>✅ Job Completed</div>
              <div style={{ fontSize:'11px', color:t.textMuted }}>Pipe fixed in 45 mins</div>
            </div>
            <div style={{ position:'absolute', bottom:'-16px', left:'-20px', background:t.bgCard, borderRadius:'14px', padding:'12px 16px', boxShadow:t.shadow, border:`1px solid ${t.border}`, animation:'float 7s ease-in-out infinite 1s', whiteSpace:'nowrap' }}>
              <div style={{ fontSize:'12px', fontWeight:'600', color:t.text }}>🔍 Provider Matched</div>
              <div style={{ fontSize:'11px', color:t.textMuted }}>0.8 km away · 4 min</div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding:'48px', background:t.bgAlt, borderTop:`1px solid ${t.border}`, borderBottom:`1px solid ${t.border}` }}>
        <div style={{ maxWidth:'900px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'32px' }}>
          <StatItem value={5000}  suffix="+"  label="Jobs Completed"    t={t} delay={0}   />
          <StatItem value={1200}  suffix="+"  label="Verified Providers" t={t} delay={100} />
          <StatItem value={98}    suffix="%"  label="Satisfaction Rate"  t={t} delay={200} />
          <StatItem value={24}    suffix="/7" label="Support Available"  t={t} delay={300} />
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
          <SectionLabel label="What People Say" t={t} />
          <h2 style={{ fontFamily:"'Outfit', sans-serif", fontSize:'40px', fontWeight:'800', lineHeight:1.15, color:t.text }}>Loved by customers<br /><em style={{ color:t.accent, fontFamily:"'Playfair Display', serif", fontStyle:'italic' }}>and providers.</em></h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'24px', marginTop:'56px' }}>
            {testimonials.map(({ name, role, text, rating }) => (
              <div key={name} className="tcard" style={{ background:t.bgCard, borderRadius:'20px', padding:'32px', border:`1px solid ${t.border}`, boxShadow:t.shadow }}>
                <div style={{ fontSize:'20px', marginBottom:'16px' }}>{'⭐'.repeat(rating)}</div>
                <p style={{ fontSize:'15px', lineHeight:1.7, color:t.textSub, marginBottom:'24px', fontStyle:'italic' }}>"{text}"</p>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:`linear-gradient(135deg, ${t.accent}, ${t.navy})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'700', color:'#fff' }}>{name.charAt(0)}</div>
                  <div>
                    <div style={{ fontSize:'14px', fontWeight:'700', color:t.text }}>{name}</div>
                    <div style={{ fontSize:'12px', color:t.textMuted }}>{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:'100px 48px' }}>
        <div style={{ maxWidth:'700px', margin:'0 auto', textAlign:'center' }}>
          <div style={{ display:'inline-block', padding:'6px 14px', borderRadius:'20px', background:t.accentLight, color:t.accent, fontSize:'12px', fontWeight:'700', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'24px' }}>Get Started Today</div>
          <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:'48px', fontWeight:'700', color:t.text, marginBottom:'20px', lineHeight:1.15 }}>Your first booking<br />is just minutes away.</h2>
          <p style={{ fontSize:'16px', color:t.textSub, lineHeight:1.7, marginBottom:'40px' }}>Join thousands of homeowners and providers already using PropMaintain to simplify property maintenance.</p>
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
            {['Privacy','Terms','Contact'].map(l => (
              <a key={l} href="#" style={{ fontSize:'13px', color:t.textMuted, textDecoration:'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
