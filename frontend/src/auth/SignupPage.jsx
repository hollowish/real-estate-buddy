import { useState } from 'react';
import { signUp, confirmSignUp, signIn, setUpTOTP, verifyTOTPSetup } from 'aws-amplify/auth';

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setError(''); setLoading(true);
    try {
      await signUp({ username: email, password, options: { userAttributes: { email } } });
      setStep(2);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleConfirmEmail = async () => {
    setError(''); setLoading(true);
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      await signIn({ username: email, password });
      const totpSetup = await setUpTOTP();
      setQrCode(totpSetup.getSetupUri('HomeScore AI', email).toString());
      setStep(3);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleVerifyMFA = async () => {
    setError(''); setLoading(true);
    try {
      await verifyTOTPSetup({ code: totpCode });
      window.location.href = '/login';
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      {error && <p style={{color:'red'}}>{error}</p>}
      {step === 1 && (
        <div>
          <h2>Create Account</h2>
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          <input type="password" placeholder="Confirm Password" value={confirm} onChange={e => setConfirm(e.target.value)} />
          <button onClick={handleSignup} disabled={loading}>{loading ? 'Creating...' : 'Sign Up'}</button>
        </div>
      )}
      {step === 2 && (
        <div>
          <h2>Check Your Email</h2>
          <p>We sent a 6-digit code to {email}</p>
          <input placeholder="Enter code" value={code} onChange={e => setCode(e.target.value)} />
          <button onClick={handleConfirmEmail} disabled={loading}>Verify Email</button>
        </div>
      )}
      {step === 3 && (
        <div>
          <h2>Set Up Authenticator App</h2>
          <p>Scan this QR code with Google Authenticator or Authy</p>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=` + encodeURIComponent(qrCode)} alt="MFA QR Code" />
          <p>Then enter the 6-digit code from the app:</p>
          <input placeholder="Code from app" value={totpCode} onChange={e => setTotpCode(e.target.value)} />
          <button onClick={handleVerifyMFA} disabled={loading}>Finish Setup</button>
        </div>
      )}
    </div>
  );
}
