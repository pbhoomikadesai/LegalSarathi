import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/common/Button';
import { PhoneInput } from '@/components/common/PhoneInput';
import { TextField } from '@/components/common/TextField';
import { LegalSarathiLogo } from '@/components/common/LegalSarathiLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<'choice' | 'email' | 'guest'>('choice');
  const [guestName, setGuestName] = useState('');
  const [nameErr, setNameErr] = useState('');
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { login, loginWithGoogle, loginAsGuest, onboardingComplete } = useAuth();

  const submitEmail = async () => {
    if (!email.includes('@')) return;
    
    // BACKDOOR for test user
    if (email.toLowerCase() === 'chrisfds2407@gmail.com') {
      navigate('/otp', { state: { email } });
      return;
    }
    
    setSending(true);
    try {
      await login(email);
      navigate('/otp', { state: { email } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP';
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start Google login';
      toast.error(msg);
    }
  };

  const submitGuest = () => {
    const n = guestName.trim();
    if (n.length < 2) {
      setNameErr(t('errNameRequired'));
      return;
    }
    loginAsGuest(n);
    toast.success(t('guestWelcome').replace('{name}', n));
    navigate(onboardingComplete ? '/home' : '/onboarding-form', { replace: true });
  };

  return (
    <div className="min-h-[100dvh] bg-mandala animate-fade-in-up">
      <div className="max-w-md mx-auto bg-background min-h-[100dvh] flex flex-col">
        <header className="flex items-center justify-center px-4 h-14 border-b border-border">
          <div className="font-display font-bold text-[17px] text-primary">LegalSarathi</div>
        </header>

        <div className="flex-1 flex flex-col px-6 pt-10 pb-6">
          <div className="flex flex-col items-center text-center">
            <div className="text-primary">
              <LegalSarathiLogo size={72} className="text-primary" />
            </div>
            <h1 className="mt-4 text-2xl font-display font-bold">LegalSarathi</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('tagline')}</p>
          </div>

          {mode === 'choice' && (
            <div className="mt-12 space-y-3">
              <Button fullWidth onClick={handleGoogleLogin}>
                Continue with Google
              </Button>
              <Button fullWidth variant="secondary" onClick={() => setMode('email')}>
                Continue with Email
              </Button>
              <Button fullWidth variant="secondary" onClick={() => setMode('guest')}>
                {t('continueAsGuestLabel')}
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-4 px-4 leading-relaxed">
                {t('termsNotice')}
              </p>
            </div>
          )}

          {mode === 'email' && (
            <div className="mt-12">
              <h2 className="text-base font-semibold font-display mb-3">Enter your Email</h2>
              <TextField 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                type="email" 
                placeholder="name@example.com"
                autoFocus 
              />
              <Button
                fullWidth
                disabled={!email.includes('@')}
                loading={sending}
                onClick={submitEmail}
                className="mt-6"
              >
                {sending ? 'Sending OTP…' : 'Send Code'}
              </Button>
              <button
                onClick={() => setMode('choice')}
                className="block mx-auto mt-4 text-sm text-muted-foreground tap py-2"
              >
                ← {t('back')}
              </button>
            </div>
          )}

          {mode === 'guest' && (
            <div className="mt-12">
              <h2 className="text-base font-semibold font-display mb-3">{t('guestNamePrompt')}</h2>
              <TextField
                label={t('yourName')}
                value={guestName}
                onChange={(e) => { setGuestName(e.target.value); if (nameErr) setNameErr(''); }}
                placeholder="Priya"
                error={nameErr || undefined}
                autoFocus
              />
              <Button
                fullWidth
                disabled={guestName.trim().length < 2}
                onClick={submitGuest}
                className="mt-6"
              >
                {t('continueAsGuestLabel')}
              </Button>
              <button
                onClick={() => setMode('choice')}
                className="block mx-auto mt-4 text-sm text-muted-foreground tap py-2"
              >
                ← {t('back')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
