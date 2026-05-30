import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@desktop/components/common/Button";
import { PhoneInput } from "@desktop/components/common/PhoneInput";
import { TextField } from "@desktop/components/common/TextField";
import { LegalSarathiLogo } from "@desktop/components/common/LegalSarathiLogo";
import { useLanguage } from "@desktop/contexts/LanguageContext";
import { useAuth } from "@desktop/contexts/AuthContext";

const Login = () => {
  const [phone, setPhone] = useState("");
  const [mode, setMode] = useState<"choice" | "phone" | "guest">("choice");
  const [guestName, setGuestName] = useState("");
  const [nameErr, setNameErr] = useState("");
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { loginAsGuest, onboardingComplete } = useAuth();

  const submitPhone = () => {
    if (phone.length !== 10) return;
    navigate("/otp", { state: { phone } });
  };

  const submitGuest = () => {
    const n = guestName.trim();
    if (n.length < 2) { setNameErr(t("errNameRequired")); return; }
    loginAsGuest(n);
    toast.success(t("guestWelcome").replace("{name}", n));
    navigate(onboardingComplete ? "/home" : "/onboarding-form", { replace: true });
  };

  return (
    <div className="min-h-screen bg-mandala flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-background rounded-3xl shadow-card p-10 animate-fade-in-up">
        <div className="flex flex-col items-center text-center mb-8">
          <LegalSarathiLogo size={72} className="text-primary" />
          <h1 className="mt-4 text-2xl font-display font-bold">LegalSarathi</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("tagline")}</p>
        </div>

        {mode === "choice" && (
          <div className="space-y-3">
            <Button fullWidth onClick={() => setMode("phone")}>{t("continueWithPhone")}</Button>
            <Button fullWidth variant="secondary" onClick={() => setMode("guest")}>{t("continueAsGuestLabel")}</Button>
            <p className="text-center text-xs text-muted-foreground mt-4 leading-relaxed">
              {t("byProceeding")} <button className="underline tap">{t("terms")}</button> &amp; <button className="underline tap">{t("privacy")}</button>
            </p>
          </div>
        )}

        {mode === "phone" && (
          <div className="space-y-4">
            <PhoneInput value={phone} onChange={setPhone} />
            <Button fullWidth onClick={submitPhone} disabled={phone.length !== 10}>{t("sendOtp")}</Button>
            <Button fullWidth variant="ghost" onClick={() => setMode("choice")}>{t("back")}</Button>
          </div>
        )}

        {mode === "guest" && (
          <div className="space-y-4">
            <TextField label={t("yourName")} value={guestName} onChange={(e) => { setGuestName(e.target.value); setNameErr(""); }} error={nameErr} placeholder="e.g. Priya" />
            <Button fullWidth onClick={submitGuest}>{t("continueAsGuestLabel")}</Button>
            <Button fullWidth variant="ghost" onClick={() => setMode("choice")}>{t("back")}</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
