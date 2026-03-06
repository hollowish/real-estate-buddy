import { useState, useRef, useEffect } from 'react';
import { signIn, signOut, confirmSignIn } from 'aws-amplify/auth';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function LoginPage() {
  const [step, setStep] = useState('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const mfaRef = useRef(null);

  useEffect(() => {
    if (step === 'mfa') {
      setTimeout(() => mfaRef.current?.focus(), 50);
    }
  }, [step]);

  const handleCredentials = async () => {
    setError(''); setLoading(true);
    try {
      try { await signOut(); } catch {}
      const result = await signIn({ username: email, password });
      if (result.isSignedIn) {
        await login();
        navigate('/listings', { replace: true });
      } else if (result.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE') {
        setStep('mfa');
      } else {
        setError(`Unexpected sign-in step: ${result.nextStep.signInStep}`);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleMFA = async () => {
    setError(''); setLoading(true);
    try {
      const result = await confirmSignIn({ challengeResponse: mfaCode });
      if (result.isSignedIn) {
        await login();
        navigate('/listings', { replace: true });
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
      <div className="card p-10 shadow-lg w-full max-w-[440px]">
        <h1 className="text-3xl font-extrabold text-white mb-4">HomeScore AI</h1>

        {step === 'credentials' && (
          <>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Sign in to your account</p>
            {error && <p className="text-sm text-[var(--error)] mb-4">{error}</p>}
            <div className="space-y-5">
              <input
                type="email" placeholder="Email" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCredentials()}
              />
              <input
                type="password" placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCredentials()}
              />
              <button
                onClick={handleCredentials} disabled={loading}
                className="btn-primary btn-lg w-full"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </div>
            <p className="text-center text-sm text-[var(--text-secondary)] mt-8">
              No account?{' '}
              <Link to="/signup" className="font-medium">Sign up</Link>
            </p>
          </>
        )}

        {step === 'mfa' && (
          <>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Enter your 6-digit authenticator code</p>
            {error && <p className="text-sm text-[var(--error)] mb-4">{error}</p>}
            <div className="space-y-5">
              <input
                ref={mfaRef}
                type="text" placeholder="6-digit code" value={mfaCode} maxLength={6}
                inputMode="numeric"
                onChange={e => setMfaCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleMFA()}
                className="text-center text-lg tracking-widest"
              />
              <button
                onClick={handleMFA} disabled={loading}
                className="btn-primary btn-lg w-full"
              >
                {loading ? 'Verifying…' : 'Verify'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
