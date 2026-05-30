import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, Menu } from "lucide-react";
import { Button } from "@desktop/components/common/Button";
import { OTPInput } from "@desktop/components/common/OTPInput";
import { useAuth } from "@desktop/contexts/AuthContext";
import { useLanguage } from "@desktop/contexts/LanguageContext";

const MOCK_OTP = "123456";

const OtpVerify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = (location.state as { phone?: string } | null)?.phone ?? "";
  const { login, onboardingComplete } = useAuth();
  const { t } = useLanguage();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    if (!phone) {
      navigate("/login", { replace: true });
    }
  }, [phone, navigate]);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = window.setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [seconds]);

  const masked = phone ? `+91 ******${phone.slice(-4)}` : "";

  const verify = () => {
    setVerifying(true);
    setError(false);
    window.setTimeout(() => {
      if (otp === MOCK_OTP) {
        login(phone);
        navigate(onboardingComplete ? "/home" : "/onboarding-form", { replace: true });
      } else {
        setError(true);
        setVerifying(false);
      }
    }, 700);
  };

  const handleResend = () => {
    if (seconds > 0) return;
    setOtp("");
    setError(false);
    setSeconds(30);
  };

  return (
    <div className="min-h-screen bg-mandala flex items-center justify-center animate-slide-from-right">
      <div className="max-w-md mx-auto bg-background min-h-screen flex flex-col">
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
          <button aria-label="Menu" className="w-10 h-10 -mr-2 rounded-full hover:bg-muted flex items-center justify-center opacity-0 pointer-events-none">
            <Menu size={22} />
          </button>
        </header>

        <div className="flex-1 px-6 pt-8 pb-6 flex flex-col">
          <h1 className="text-2xl font-display font-bold">{t("verifyNumber")}</h1>
          <p className="text-base font-semibold mt-3">{masked}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("otpSentTo")}</p>

          <div className="mt-8">
            <OTPInput value={otp} onChange={(v) => { setOtp(v); if (error) setError(false); }} error={error} />
            {error && (
              <p className="text-center text-xs text-destructive mt-3">{t("wrongOtp")}</p>
            )}
          </div>

          <div className="mt-8">
            <Button
              fullWidth
              disabled={otp.length !== 6}
              loading={verifying}
              onClick={verify}
            >
              {verifying ? t("verifying") : t("verifyOtp")}
            </Button>
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">{t("didntReceive")} </span>
            {seconds > 0 ? (
              <span className="text-muted-foreground">
                {t("resendIn")} {seconds}s
              </span>
            ) : (
              <button onClick={handleResend} className="text-primary font-semibold tap">
                {t("resendOtp")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpVerify;
