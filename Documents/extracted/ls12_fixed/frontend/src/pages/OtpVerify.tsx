import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Menu } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/common/Button';
import { OTPInput } from '@/components/common/OTPInput';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const OtpVerify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? '';
  const { verifyOtp, onboardingComplete, supabaseProfile } = useAuth();
  const { t } = useLanguage();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    if (!email) navigate('/login', { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = window.setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [seconds]);

  const masked = email;

  const verify = async () => {
    if (otp.length !== 6) return;
    setVerifying(true);
    setError(false);
    try {
      if (email.toLowerCase() === 'chrisfds2407@gmail.com' && otp === '123456') {
        // Under the hood, log them in using the fixed test password
        const { supabase } = await import('@/lib/supabase');
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: 'testpassword123'
        });
        if (error) throw new Error(error.message);
      } else {
        await verifyOtp(email, otp);
      }
      // If profile has no name → send to onboarding, else home
      const needsOnboarding = !supabaseProfile?.name || !onboardingComplete;
      navigate(needsOnboarding ? '/onboarding-form' : '/home', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid OTP';
      // Supabase returns "Token has expired or is invalid" — show friendlier error
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('expired')) {
        setError(true);
      } else {
        toast.error(msg);
      }
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (seconds > 0) return;
    setOtp('');
    setError(false);
    setSeconds(30);
    // Resend OTP — import supabase directly to avoid circular dep
    const { supabase } = await import('@/lib/supabase');
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) toast.error('Failed to resend OTP: ' + error.message);
    else toast.success('OTP resent!');
  };

  return (
    <div className="min-h-[100dvh] bg-mandala animate-slide-from-right">
      <div className="max-w-md mx-auto bg-background min-h-[100dvh] flex flex-col">
        <header className="flex items-center px-4 h-14 border-b border-border">
          <button
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="w-10 h-10 -ml-2 rounded-full hover:bg-muted flex items-center justify-center"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1 text-center font-display font-bold text-[17px] text-primary -ml-10">
            LegalSarathi
          </div>
          <button
            aria-label="Menu"
            className="w-10 h-10 -mr-2 rounded-full hover:bg-muted flex items-center justify-center opacity-0 pointer-events-none"
          >
            <Menu size={22} />
          </button>
        </header>

        <div className="flex-1 px-6 pt-8 pb-6 flex flex-col">
          <h1 className="text-2xl font-display font-bold">Verify Email</h1>
          <p className="text-base font-semibold mt-3">{masked}</p>
          <p className="text-sm text-muted-foreground mt-1">Code sent to your email</p>

          <div className="mt-8">
            <OTPInput
              value={otp}
              onChange={(v) => { setOtp(v); if (error) setError(false); }}
              error={error}
            />
            {error && (
              <p className="text-center text-xs text-destructive mt-3">{t('wrongOtp')}</p>
            )}
          </div>

          <div className="mt-8">
            <Button
              fullWidth
              disabled={otp.length !== 6}
              loading={verifying}
              onClick={verify}
            >
              {verifying ? t('verifying') : t('verifyOtp')}
            </Button>
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">{t('didntReceive')} </span>
            {seconds > 0 ? (
              <span className="text-muted-foreground">
                {t('resendIn')} {seconds}s
              </span>
            ) : (
              <button onClick={handleResend} className="text-primary font-semibold tap">
                {t('resendOtp')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpVerify;
