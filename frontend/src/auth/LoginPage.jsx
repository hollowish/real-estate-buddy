import { useState, useRef, useEffect } from 'react';
import { signIn, signOut, confirmSignIn } from 'aws-amplify/auth';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const inputClass = 'w-full rounded-lg border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-500 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-xl shadow-xl shadow-gray-900/50 p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-100 mb-3">HomeScore AI</h1>

        {step === 'credentials' && (
          <>
            <p className="text-sm text-gray-400 mb-6">Sign in to your account</p>
            {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
            <div className="space-y-4">
              <input
                type="email" placeholder="Email" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCredentials()}
                className={inputClass}
              />
              <input
                type="password" placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCredentials()}
                className={inputClass}
              />
              <button
                onClick={handleCredentials} disabled={loading}
                className="w-full py-3 rounded-lg bg-indigo-600 text-white text-sm font-medium
                           hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </div>
            <p className="text-center text-sm text-gray-400 mt-6">
              No account?{' '}
              <Link to="/signup" className="text-indigo-400 hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </>
        )}

        {step === 'mfa' && (
          <>
            <p className="text-sm text-gray-400 mb-6">Enter your 6-digit authenticator code</p>
            {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
            <div className="space-y-4">
              <input
                ref={mfaRef}
                type="text" placeholder="6-digit code" value={mfaCode} maxLength={6}
                inputMode="numeric"
                onChange={e => setMfaCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleMFA()}
                className={inputClass + ' text-center text-lg tracking-widest'}
              />
              <button
                onClick={handleMFA} disabled={loading}
                className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium
                           hover:bg-indigo-700 disabled:opacity-50 transition-colors"
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
