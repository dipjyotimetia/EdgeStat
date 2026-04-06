import { useState } from 'react';
import { Logo } from '../layout/Logo';
import { createSite, getRealtime } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';

type Step = 'setup' | 'snippet' | 'verify';

export function OnboardingWizard() {
  const [step, setStep] = useState<Step>('setup');
  const [masterKey, setMasterKeyInput] = useState('');
  const [siteName, setSiteName] = useState('');
  const [siteDomain, setSiteDomain] = useState('');
  const [snippet, setSnippet] = useState('');
  const [siteId, setSiteIdLocal] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const { setMasterKey, setSiteId } = useAuth();

  const handleCreateSite = async () => {
    setError('');
    if (!masterKey || !siteName || !siteDomain) {
      setError('All fields are required');
      return;
    }

    // Store master key first
    setMasterKey(masterKey);

    try {
      const result = await createSite(siteName, siteDomain);
      setSnippet(result.snippet);
      setSiteIdLocal(result.site.id);
      setSiteId(result.site.id);
      setStep('snippet');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create site');
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    let attempts = 0;
    const maxAttempts = 30;

    const poll = async () => {
      try {
        const data = await getRealtime(siteId);
        if (data.active > 0) {
          setVerified(true);
          setVerifying(false);
          return;
        }
      } catch {
        // Ignore and retry
      }
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(poll, 2000);
      } else {
        setVerifying(false);
      }
    };

    poll();
  };

  return (
    <div className="min-h-screen bg-edge-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <Logo size={48} />
          </div>
          <p className="text-edge-600 font-mono text-sm tracking-wide uppercase">
            Analytics at the edge. Owned by you.
          </p>
        </div>

        {/* Step indicator */}
        <div
          className="flex items-center justify-center gap-2 mb-8"
          role="progressbar"
          aria-valuenow={step === 'setup' ? 1 : step === 'snippet' ? 2 : 3}
          aria-valuemin={1}
          aria-valuemax={3}
        >
          {(['setup', 'snippet', 'verify'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono ${
                  step === s
                    ? 'bg-edge-700 text-edge-950'
                    : i < ['setup', 'snippet', 'verify'].indexOf(step)
                      ? 'bg-edge-700/60 text-edge-950'
                      : 'bg-edge-900 text-edge-muted'
                }`}
              >
                {i + 1}
              </div>
              {i < 2 && <div className="w-12 h-px bg-edge-900" />}
            </div>
          ))}
        </div>

        {/* Step 1: Setup */}
        {step === 'setup' && (
          <div className="bg-edge-900/50 border border-edge-800 rounded-xl p-6 space-y-5">
            <h2 className="text-lg font-semibold text-edge-400 font-mono">Create your site</h2>

            <div>
              <label htmlFor="master-key" className="block text-sm text-edge-600 font-mono mb-1.5">
                Master API Key
              </label>
              <input
                id="master-key"
                type="password"
                value={masterKey}
                onChange={(e) => setMasterKeyInput(e.target.value)}
                placeholder="Your MASTER_KEY secret"
                className="w-full bg-edge-950 border border-edge-800 rounded-lg px-3 py-2.5 text-sm text-edge-400 font-mono placeholder:text-edge-muted focus:outline-none focus:ring-2 focus:ring-edge-700"
              />
              <p className="text-xs text-edge-muted mt-1">
                Set via: wrangler secret put MASTER_KEY
              </p>
            </div>

            <div>
              <label htmlFor="site-name" className="block text-sm text-edge-600 font-mono mb-1.5">
                Site Name
              </label>
              <input
                id="site-name"
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="My Website"
                className="w-full bg-edge-950 border border-edge-800 rounded-lg px-3 py-2.5 text-sm text-edge-400 font-mono placeholder:text-edge-muted focus:outline-none focus:ring-2 focus:ring-edge-700"
              />
            </div>

            <div>
              <label htmlFor="site-domain" className="block text-sm text-edge-600 font-mono mb-1.5">
                Domain
              </label>
              <input
                id="site-domain"
                type="text"
                value={siteDomain}
                onChange={(e) => setSiteDomain(e.target.value)}
                placeholder="example.com"
                className="w-full bg-edge-950 border border-edge-800 rounded-lg px-3 py-2.5 text-sm text-edge-400 font-mono placeholder:text-edge-muted focus:outline-none focus:ring-2 focus:ring-edge-700"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm font-mono" role="alert">
                {error}
              </p>
            )}

            <button
              onClick={handleCreateSite}
              className="w-full bg-edge-700 hover:bg-edge-600 text-edge-950 font-mono text-sm py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-edge-700 focus:ring-offset-2 focus:ring-offset-edge-950"
            >
              Create Site
            </button>
          </div>
        )}

        {/* Step 2: Copy snippet */}
        {step === 'snippet' && (
          <div className="bg-edge-900/50 border border-edge-800 rounded-xl p-6 space-y-5">
            <h2 className="text-lg font-semibold text-edge-400 font-mono">
              Install tracking snippet
            </h2>
            <p className="text-sm text-edge-600 font-mono">
              Add this script tag to your website&apos;s &lt;head&gt;:
            </p>

            <div className="relative">
              <pre className="bg-edge-950 border border-edge-800 rounded-lg p-4 text-sm text-edge-500 font-mono overflow-x-auto">
                <code>{snippet}</code>
              </pre>
              <button
                onClick={() => navigator.clipboard.writeText(snippet)}
                className="absolute top-2 right-2 text-xs bg-edge-700 hover:bg-edge-600 text-edge-950 px-2 py-1 rounded font-mono transition-colors"
                aria-label="Copy snippet to clipboard"
              >
                Copy
              </button>
            </div>

            <button
              onClick={() => {
                setStep('verify');
                handleVerify();
              }}
              className="w-full bg-edge-700 hover:bg-edge-600 text-edge-950 font-mono text-sm py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-edge-700 focus:ring-offset-2 focus:ring-offset-edge-950"
            >
              I&apos;ve added the snippet
            </button>
          </div>
        )}

        {/* Step 3: Verify */}
        {step === 'verify' && (
          <div className="bg-edge-900/50 border border-edge-800 rounded-xl p-6 space-y-5 text-center">
            {verified ? (
              <>
                <div className="text-4xl mb-2">&#10003;</div>
                <h2 className="text-lg font-semibold text-edge-400 font-mono">
                  First event received!
                </h2>
                <p className="text-sm text-edge-600 font-mono">Your analytics are now live.</p>
                <a
                  href={`/sites/${siteId}`}
                  className="inline-block bg-edge-700 hover:bg-edge-600 text-edge-950 font-mono text-sm py-2.5 px-6 rounded-lg transition-colors"
                >
                  Go to Dashboard
                </a>
              </>
            ) : (
              <>
                <div
                  className="inline-block w-8 h-8 border-2 border-edge-700 border-t-transparent rounded-full animate-spin"
                  role="status"
                >
                  <span className="sr-only">Waiting for first event...</span>
                </div>
                <h2 className="text-lg font-semibold text-edge-400 font-mono">
                  Waiting for first event...
                </h2>
                <p className="text-sm text-edge-600 font-mono">
                  Visit your website to trigger a pageview.
                </p>
                {!verifying && (
                  <button
                    onClick={handleVerify}
                    className="text-edge-700 hover:text-edge-600 font-mono text-sm underline"
                  >
                    Retry verification
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
