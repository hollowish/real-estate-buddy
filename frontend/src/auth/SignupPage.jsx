import { useState, useRef, useEffect } from 'react';
import { signUp, confirmSignUp, signIn, signOut, setUpTOTP, verifyTOTPSetup } from 'aws-amplify/auth';
import { Link } from 'react-router-dom';

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
  const codeRef = useRef(null);
  const totpRef = useRef(null);

  useEffect(() => {
    if (step === 2) setTimeout(() => codeRef.current?.focus(), 50);
    if (step === 3) setTimeout(() => totpRef.current?.focus(), 150);
  }, [step]);

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
      await signOut();
      window.location.href = '/login';
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const steps = ['Account', 'Verify Email', 'Set Up MFA'];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
      <div className="card p-8 shadow-lg w-full max-w-sm">
        <h1 className="text-3xl font-extrabold text-white mb-1">Create Account</h1>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 mt-2">
          {steps.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${i + 1 <= step ? 'bg-[var(--gold)] text-[var(--bg-primary)]' : 'bg-[var(--bg-navy)] text-[var(--text-muted)]'}`}>
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-6 ${i + 1 < step ? 'bg-[var(--gold)]' : 'bg-[var(--bg-navy)]'}`} />
              )}
            </div>
          ))}
          <span className="text-xs text-[var(--text-muted)] ml-1">{steps[step - 1]}</span>
        </div>

        {error && <p className="text-sm text-[var(--error)] mb-4">{error}</p>}

        {step === 1 && (
          <div className="space-y-4">
            <input type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} />
            <input type="password" placeholder="Confirm Password" value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignup()} />
            <button onClick={handleSignup} disabled={loading}
              className="btn-primary w-full">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">We sent a 6-digit code to <strong className="text-white">{email}</strong></p>
            <input
              ref={codeRef}
              type="text" placeholder="Verification code" value={code}
              autoComplete="one-time-code"
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirmEmail()}
              className="text-center text-lg"
            />
            <button onClick={handleConfirmEmail} disabled={loading}
              className="btn-primary w-full">
              {loading ? 'Verifying…' : 'Verify Email'}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Scan this QR code with <strong className="text-white">Google Authenticator</strong> or <strong className="text-white">Authy</strong>
            </p>
            {qrCode && (
              <div className="flex justify-center" style={{ minHeight: '180px' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&bgcolor=1f2937&color=f3f4f6&data=${encodeURIComponent(qrCode)}`}
                  alt="MFA QR Code"
                  className="rounded-lg border border-[var(--border)]"
                />
              </div>
            )}
            <p className="text-sm text-[var(--text-secondary)] text-center">Then enter the 6-digit code from the app:</p>
            <input
              ref={totpRef}
              type="text" placeholder="Code from app" value={totpCode} maxLength={6}
              inputMode="numeric"
              onChange={e => setTotpCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleVerifyMFA()}
              className="text-center text-lg tracking-widest"
            />
            <button onClick={handleVerifyMFA} disabled={loading}
              className="btn-primary w-full">
              {loading ? 'Finishing setup…' : 'Finish Setup'}
            </button>
          </div>
        )}

        {step === 1 && (
          <p className="text-center text-sm text-[var(--text-secondary)] mt-5">
            Already have an account?{' '}
            <Link to="/login" className="font-medium">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
