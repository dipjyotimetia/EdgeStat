import { Link } from 'react-router';
import { Logo } from '../components/layout/Logo';
import { useInView } from '../hooks/useInView';

/* ------------------------------------------------------------------ */
/*  SVG Illustrations                                                  */
/* ------------------------------------------------------------------ */

function HeroChart() {
  const bars = [
    { x: 80, h: 90, delay: 0.1 },
    { x: 130, h: 140, delay: 0.2 },
    { x: 180, h: 110, delay: 0.3 },
    { x: 230, h: 170, delay: 0.15 },
    { x: 280, h: 130, delay: 0.25 },
    { x: 330, h: 160, delay: 0.35 },
    { x: 380, h: 100, delay: 0.4 },
  ];
  const baseline = 220;

  return (
    <svg
      viewBox="0 0 480 280"
      fill="none"
      className="w-full max-w-md mx-auto"
      role="img"
      aria-label="Stylized analytics chart"
    >
      {/* Browser window frame */}
      <rect
        x="0"
        y="0"
        width="480"
        height="280"
        rx="16"
        fill="#0A2540"
        stroke="#1E4D44"
        strokeWidth="1.5"
      />
      {/* Window controls */}
      <circle cx="24" cy="20" r="5" fill="#1E4D44" />
      <circle cx="42" cy="20" r="5" fill="#1E4D44" />
      <circle cx="60" cy="20" r="5" fill="#1E4D44" />
      {/* Divider */}
      <line x1="0" y1="38" x2="480" y2="38" stroke="#1E4D44" strokeWidth="1" />
      {/* Grid lines */}
      {[80, 120, 160, 200].map((y) => (
        <line
          key={y}
          x1="60"
          y1={y}
          x2="420"
          y2={y}
          stroke="#1E4D44"
          strokeWidth="0.5"
          opacity="0.4"
        />
      ))}
      {/* Bars */}
      {bars.map((bar) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={baseline - bar.h}
          width="28"
          rx="4"
          height={bar.h}
          fill="url(#barGrad)"
          className="animate-grow-bar"
          style={{ animationDelay: `${bar.delay}s` }}
        />
      ))}
      {/* Baseline */}
      <line
        x1="60"
        y1={baseline}
        x2="420"
        y2={baseline}
        stroke="#1E4D44"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Gradient def */}
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00FFD1" />
          <stop offset="100%" stopColor="#00D4AA" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className="w-12 h-12"
      role="img"
      aria-label="Privacy shield"
    >
      <path
        d="M24 4L6 14v12c0 11 8 18 18 20 10-2 18-9 18-20V14L24 4z"
        stroke="#00D4AA"
        strokeWidth="2"
        fill="none"
      />
      {/* Crossed-out eye */}
      <ellipse cx="24" cy="24" rx="8" ry="5" stroke="#00FFD1" strokeWidth="1.5" fill="none" />
      <circle cx="24" cy="24" r="2.5" fill="#00FFD1" />
      <line
        x1="16"
        y1="30"
        x2="32"
        y2="18"
        stroke="#00D4AA"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LightweightIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className="w-12 h-12"
      role="img"
      aria-label="Lightweight 902 bytes"
    >
      <rect
        x="4"
        y="8"
        width="40"
        height="32"
        rx="6"
        stroke="#00D4AA"
        strokeWidth="1.5"
        fill="none"
      />
      <text
        x="24"
        y="29"
        textAnchor="middle"
        fill="#00FFD1"
        fontSize="13"
        fontFamily="'JetBrains Mono', monospace"
        fontWeight="600"
      >
        902B
      </text>
    </svg>
  );
}

function RealtimeIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className="w-12 h-12"
      role="img"
      aria-label="Real-time signal"
    >
      <circle cx="24" cy="24" r="4" fill="#00FFD1" />
      <circle
        cx="24"
        cy="24"
        r="12"
        stroke="#00D4AA"
        strokeWidth="1.5"
        fill="none"
        className="animate-pulse-ring"
      />
      <circle
        cx="24"
        cy="24"
        r="20"
        stroke="#00D4AA"
        strokeWidth="1"
        fill="none"
        className="animate-pulse-ring"
        style={{ animationDelay: '0.6s' }}
      />
    </svg>
  );
}

function CloudLockIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className="w-12 h-12"
      role="img"
      aria-label="Self-hosted cloud"
    >
      <path
        d="M12 32a8 8 0 0 1-.5-16A10 10 0 0 1 31 14a7 7 0 0 1 5 12H12z"
        stroke="#00D4AA"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Lock */}
      <rect
        x="19"
        y="30"
        width="10"
        height="9"
        rx="2"
        stroke="#00FFD1"
        strokeWidth="1.5"
        fill="none"
      />
      <path d="M22 30v-3a2 2 0 0 1 4 0v3" stroke="#00FFD1" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function DashboardPreview() {
  return (
    <svg
      viewBox="0 0 640 360"
      fill="none"
      className="w-full max-w-2xl mx-auto rounded-xl"
      role="img"
      aria-label="Dashboard preview"
    >
      {/* Background */}
      <rect width="640" height="360" rx="16" fill="#0A2540" stroke="#1E4D44" strokeWidth="1.5" />
      {/* Sidebar */}
      <rect x="0" y="0" width="140" height="360" rx="16" fill="#050b14" />
      <rect x="16" y="20" width="80" height="12" rx="3" fill="#1E4D44" />
      {[
        { y: 60, w: 90 },
        { y: 88, w: 70 },
        { y: 116, w: 100 },
        { y: 144, w: 65 },
        { y: 172, w: 85 },
        { y: 200, w: 75 },
      ].map((item) => (
        <rect
          key={item.y}
          x="16"
          y={item.y}
          width={item.w}
          height="8"
          rx="2"
          fill="#1E4D44"
          opacity="0.6"
        />
      ))}

      {/* Metric cards */}
      {[
        { x: 160, label: '1,247', sub: 'Visitors' },
        { x: 280, label: '3,891', sub: 'Pageviews' },
        { x: 400, label: '42%', sub: 'Bounce' },
        { x: 520, label: '2m 14s', sub: 'Avg. Session' },
      ].map((card) => (
        <g key={card.x}>
          <rect
            x={card.x}
            y="20"
            width="100"
            height="60"
            rx="8"
            fill="#050b14"
            stroke="#1E4D44"
            strokeWidth="1"
          />
          <text
            x={card.x + 12}
            y="48"
            fill="#00FFD1"
            fontSize="14"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="600"
          >
            {card.label}
          </text>
          <text
            x={card.x + 12}
            y="66"
            fill="#1E6B5A"
            fontSize="8"
            fontFamily="'JetBrains Mono', monospace"
          >
            {card.sub}
          </text>
        </g>
      ))}

      {/* Area chart */}
      <rect
        x="160"
        y="100"
        width="460"
        height="240"
        rx="8"
        fill="#050b14"
        stroke="#1E4D44"
        strokeWidth="1"
      />
      {/* Grid */}
      {[150, 190, 230, 270, 310].map((y) => (
        <line
          key={y}
          x1="180"
          y1={y}
          x2="600"
          y2={y}
          stroke="#1E4D44"
          strokeWidth="0.5"
          opacity="0.3"
        />
      ))}
      {/* Area path */}
      <path
        d="M180 300 L220 270 L260 280 L300 240 L340 220 L380 190 L420 200 L460 170 L500 160 L540 180 L580 150 L600 155 L600 320 L180 320Z"
        fill="url(#areaGrad)"
      />
      <path
        d="M180 300 L220 270 L260 280 L300 240 L340 220 L380 190 L420 200 L460 170 L500 160 L540 180 L580 150 L600 155"
        stroke="#00D4AA"
        strokeWidth="2"
        fill="none"
      />
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00D4AA" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00D4AA" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Section wrapper with scroll animation                              */
/* ------------------------------------------------------------------ */

function Section({
  children,
  className = '',
  delay = 0,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}) {
  const { ref, isInView } = useInView(0.1);
  return (
    <section
      ref={ref}
      id={id}
      className={`${className} ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
      style={isInView ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature card data                                                  */
/* ------------------------------------------------------------------ */

const features = [
  {
    Icon: ShieldIcon,
    title: 'Privacy-First',
    description:
      'No cookies. No PII. No consent banners. IP addresses are anonymized and session hashes rotate daily.',
  },
  {
    Icon: LightweightIcon,
    title: 'Lightweight',
    description:
      '902 bytes gzipped. Zero impact on your Core Web Vitals. Loads asynchronously, never blocks rendering.',
  },
  {
    Icon: RealtimeIcon,
    title: 'Real-Time',
    description:
      'Live visitor count streamed over SSE. See traffic as it happens, not hours later.',
  },
  {
    Icon: CloudLockIcon,
    title: 'Self-Hosted',
    description:
      "Runs entirely on Cloudflare's free tier. You own every byte of your data. No third-party access.",
  },
];

/* ------------------------------------------------------------------ */
/*  Landing Page                                                       */
/* ------------------------------------------------------------------ */

export function LandingPage() {
  return (
    <div className="min-h-screen bg-edge-950 text-edge-400 overflow-x-hidden">
      {/* ---- Hero ---- */}
      <header className="relative flex flex-col items-center justify-center px-6 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="animate-fade-in-up flex justify-center mb-6">
          <Logo size={64} />
        </div>

        <h1
          className="animate-fade-in-up text-3xl md:text-5xl font-bold text-center leading-tight max-w-2xl"
          style={{ animationDelay: '0.1s' }}
        >
          Analytics at the edge. <span className="text-edge-700">Owned by you.</span>
        </h1>

        <p
          className="animate-fade-in-up mt-5 text-base md:text-lg text-edge-muted text-center max-w-xl font-mono"
          style={{ animationDelay: '0.2s' }}
        >
          Privacy-first, self-hosted web analytics running entirely on Cloudflare&apos;s free tier.
          No cookies, no tracking, no compromise.
        </p>

        <div
          className="animate-fade-in-up mt-8 flex flex-col sm:flex-row items-center gap-4"
          style={{ animationDelay: '0.3s' }}
        >
          <Link
            to="/onboarding"
            className="animate-glow bg-edge-700 hover:bg-edge-600 text-edge-950 font-mono font-semibold text-base px-8 py-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-edge-700 focus:ring-offset-2 focus:ring-offset-edge-950"
          >
            Get Started
          </Link>
          <a
            href="#features"
            className="text-edge-muted hover:text-edge-700 font-mono text-sm underline underline-offset-4 transition-colors"
          >
            Learn more
          </a>
        </div>

        <div
          className="animate-fade-in-up mt-14 w-full max-w-lg"
          style={{ animationDelay: '0.4s' }}
        >
          <HeroChart />
        </div>
      </header>

      {/* ---- Features ---- */}
      <Section id="features" className="px-6 py-16 md:py-24 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Why <span className="text-edge-700">edge</span>
          <span className="text-edge-600">stat</span>?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="bg-edge-900/50 border border-edge-800 rounded-xl p-6 flex gap-4 items-start animate-fade-in-up"
              style={{ animationDelay: `${0.1 * i}s` }}
            >
              <div className="shrink-0">
                <f.Icon />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-edge-400 mb-1">{f.title}</h3>
                <p className="text-sm text-edge-muted leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ---- Dashboard Preview ---- */}
      <Section className="px-6 py-16 md:py-24" delay={0.1}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Everything you need. <span className="text-edge-muted">Nothing you don&apos;t.</span>
          </h2>
          <p className="text-sm text-edge-muted mb-10 max-w-lg mx-auto">
            Visitors, pageviews, bounce rate, session duration, traffic sources, custom events,
            funnels, and Web Vitals -- all in one dashboard.
          </p>
          <DashboardPreview />
        </div>
      </Section>

      {/* ---- How It Works ---- */}
      <Section className="px-6 py-16 md:py-24 max-w-3xl mx-auto" delay={0.1}>
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Three steps to <span className="text-edge-700">own</span> your analytics
        </h2>

        <div className="space-y-8">
          {[
            {
              num: 1,
              title: 'Deploy to Cloudflare',
              desc: 'One command. Zero config. Your analytics worker is live in seconds.',
              code: 'wrangler deploy',
            },
            {
              num: 2,
              title: 'Add the snippet',
              desc: 'A single script tag in your <head>. 902 bytes. No impact on performance.',
              code: '<script defer src="https://your-worker.dev/s.js"></script>',
            },
            {
              num: 3,
              title: 'Own your analytics',
              desc: 'Real-time dashboard, full data ownership, zero monthly cost.',
              code: null,
            },
          ].map((step) => (
            <div key={step.num} className="flex gap-5 items-start">
              <div className="shrink-0 w-10 h-10 rounded-full bg-edge-700 text-edge-950 flex items-center justify-center font-mono font-bold text-base">
                {step.num}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-edge-400 mb-1">{step.title}</h3>
                <p className="text-sm text-edge-muted leading-relaxed">{step.desc}</p>
                {step.code && (
                  <pre className="mt-3 bg-edge-950 border border-edge-800 rounded-lg px-4 py-2.5 text-sm text-edge-500 font-mono overflow-x-auto">
                    <code>{step.code}</code>
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ---- Final CTA ---- */}
      <Section className="px-6 py-16 md:py-24 text-center" delay={0.1}>
        <p className="text-edge-600 font-mono text-sm tracking-wide uppercase mb-4">
          Ready to take back your analytics?
        </p>
        <Link
          to="/onboarding"
          className="inline-block animate-glow bg-edge-700 hover:bg-edge-600 text-edge-950 font-mono font-semibold text-base px-10 py-3.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-edge-700 focus:ring-offset-2 focus:ring-offset-edge-950"
        >
          Get Started
        </Link>
      </Section>

      {/* ---- Footer ---- */}
      <footer className="border-t border-edge-800 px-6 py-8 text-center">
        <div className="flex justify-center mb-3">
          <Logo size={24} />
        </div>
        <p className="text-xs text-edge-muted font-mono">Analytics at the edge. Owned by you.</p>
      </footer>
    </div>
  );
}
