import { useState } from 'react';
import { signIn, confirmSignIn } from 'aws-amplify/auth';
import { useAuth } from './AuthContext';

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
    <div>
      {error && <p style={{color:'red'}}>{error}</p>}
      {step === 'credentials' && (
        <div>
          <h2>Log In</h2>
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          <button onClick={handleCredentials} disabled={loading}>{loading ? 'Checking...' : 'Log In'}</button>
        </div>
      )}
      {step === 'mfa' && (
        <div>
          <h2>Enter Authenticator Code</h2>
          <p>Open Google Authenticator and enter the 6-digit code for HomeScore AI</p>
          <input placeholder="6-digit code" value={mfaCode} onChange={e => setMfaCode(e.target.value)} maxLength={6} />
          <button onClick={handleMFA} disabled={loading}>Verify</button>
        </div>
      )}
    </div>
  );
}
