import { useState } from 'react';
import { signUp, confirmSignUp, signIn, signOut, setUpTOTP, verifyTOTPSetup } from 'aws-amplify/auth';
import { Link } from 'react-router-dom';

const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

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
      await signOut();
      window.location.href = '/login';
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const steps = ['Account', 'Verify Email', 'Set Up MFA'];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h1>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 mt-2">
          {steps.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${i + 1 <= step ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-6 ${i + 1 < step ? 'bg-indigo-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
          <span className="text-xs text-gray-500 ml-1">{steps[step - 1]}</span>
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {step === 1 && (
          <div className="space-y-4">
            <input type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} className={inputClass} />
            <input type="password" placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} className={inputClass} />
            <input type="password" placeholder="Confirm Password" value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignup()}
              className={inputClass} />
            <button onClick={handleSignup} disabled={loading}
              className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium
                         hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">We sent a 6-digit code to <strong>{email}</strong></p>
            <input type="text" placeholder="Verification code" value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirmEmail()}
              className={inputClass + ' text-center text-lg tracking-widest'}
              autoFocus />
            <button onClick={handleConfirmEmail} disabled={loading}
              className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium
                         hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {loading ? 'Verifying…' : 'Verify Email'}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Scan this QR code with <strong>Google Authenticator</strong> or <strong>Authy</strong>
            </p>
            {qrCode && (
              <div className="flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrCode)}`}
                  alt="MFA QR Code"
                  className="rounded-lg border border-gray-200"
                />
              </div>
            )}
            <p className="text-sm text-gray-500 text-center">Then enter the 6-digit code from the app:</p>
            <input type="text" placeholder="Code from app" value={totpCode} maxLength={6}
              onChange={e => setTotpCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleVerifyMFA()}
              className={inputClass + ' text-center text-lg tracking-widest'}
              autoFocus />
            <button onClick={handleVerifyMFA} disabled={loading}
              className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium
                         hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {loading ? 'Finishing setup…' : 'Finish Setup'}
            </button>
          </div>
        )}

        {step === 1 && (
          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:underline font-medium">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
