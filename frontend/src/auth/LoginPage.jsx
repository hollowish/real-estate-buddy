import { useState } from 'react';
import { signIn, confirmSignIn } from 'aws-amplify/auth';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

export default function LoginPage() {
  const [step, setStep] = useState('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleCredentials = async () => {
    setError(''); setLoading(true);
    try {
      const result = await signIn({ username: email, password });
      if (result.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE') {
        setStep('mfa');
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
        window.location.href = '/';
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">HomeScore AI</h1>

        {step === 'credentials' && (
          <>
            <p className="text-sm text-gray-500 mb-6">Sign in to your account</p>
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
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
                className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium
                           hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </div>
            <p className="text-center text-sm text-gray-500 mt-5">
              No account?{' '}
              <Link to="/signup" className="text-indigo-600 hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </>
        )}

        {step === 'mfa' && (
          <>
            <p className="text-sm text-gray-500 mb-6">Enter your 6-digit authenticator code</p>
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            <div className="space-y-4">
              <input
                type="text" placeholder="6-digit code" value={mfaCode} maxLength={6}
                onChange={e => setMfaCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleMFA()}
                className={inputClass + ' text-center text-lg tracking-widest'}
                autoFocus
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
