import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/common/Button";
import { TextField } from "@/components/common/TextField";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { INDIAN_STATES, INTEREST_KEYS } from "@/data/onboarding";
import type { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

const AGREE_KEYS: TranslationKey[] = ["agree1", "agree2", "agree3", "agree4"];

const OnboardingForm = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { profile, setProfile, setOnboardingComplete, isAuthenticated, isGuest, guestName } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState(profile.name && profile.name !== "Priya" ? profile.name : guestName ?? "");
  const [stateVal, setStateVal] = useState(profile.state ?? "");
  const [interests, setInterests] = useState<string[]>(profile.interests ?? []);
  const [agrees, setAgrees] = useState<Record<string, boolean>>({
    agree1: false, agree2: false, agree3: false, agree4: false,
  });
  const [errors, setErrors] = useState<{ name?: string; state?: string; agree?: string }>({});

  // Auth guard: run after mount so all hooks above are called unconditionally
  useEffect(() => {
    if (!isAuthenticated && !isGuest) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isGuest, navigate]);

  const filteredStates = useMemo(() => INDIAN_STATES, []);
  const allAgreed = AGREE_KEYS.every((k) => agrees[k]);

  const next1 = () => {
    const e: typeof errors = {};
    if (name.trim().length < 2) e.name = t("errNameRequired");
    if (!stateVal) e.state = t("errStateRequired");
    setErrors(e);
    if (Object.keys(e).length) return;
    setStep(2);
  };

  const next2 = () => {
    if (!allAgreed) {
      setErrors((p) => ({ ...p, agree: t("errAgreeRequired") }));
      return;
    }
    setErrors((p) => ({ ...p, agree: undefined }));
    setStep(3);
  };

  const finish = () => {
    setProfile({ ...profile, name: name.trim(), state: stateVal, interests });
    setOnboardingComplete(true);
    toast.success(t("welcomeUser").replace("{name}", name.trim()));
    navigate("/home", { replace: true });
  };

  const toggleInterest = (k: string) => {
    setInterests((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  const toggleAgree = (k: string) => {
    setAgrees((p) => ({ ...p, [k]: !p[k] }));
    if (errors.agree) setErrors((p) => ({ ...p, agree: undefined }));
  };

  const back = () => {
    if (step === 1) navigate(-1);
    else setStep((s) => (s - 1) as Step);
  };

  const progressPct = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="min-h-[100dvh] bg-mandala">
      <div className="max-w-md mx-auto bg-background min-h-[100dvh] flex flex-col">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border flex items-center px-4 h-14">
          <button
            onClick={back}
            aria-label="Back"
            className="w-10 h-10 -ml-2 rounded-full hover:bg-muted flex items-center justify-center tap"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1 text-center">
            <span className="text-xs font-semibold text-muted-foreground">
              {t("step")} {step} {t("of")} 3
            </span>
          </div>
          <div className="w-10" />
        </header>

        <div className="h-1 bg-border">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex-1 px-6 pt-6 pb-6 flex flex-col">
          {step === 1 && (
            <div className="animate-fade-in-up flex-1 flex flex-col">
              <h1 className="text-2xl font-display font-bold leading-tight">{t("obfStep1Title")}</h1>
              <p className="text-sm text-muted-foreground mt-2">{t("obfStep1Sub")}</p>

              <div className="mt-8 space-y-5">
                <TextField
                  label={t("yourNameLabel")}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
                  }}
                  placeholder="Priya Sharma"
                  error={errors.name}
                  autoFocus
                />
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t("stateLabel")}</label>
                  <select
                    value={stateVal}
                    onChange={(e) => {
                      setStateVal(e.target.value);
                      if (errors.state) setErrors((p) => ({ ...p, state: undefined }));
                    }}
                    className={cn(
                      "w-full h-12 rounded-xl border bg-card px-3 text-base appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40",
                      errors.state ? "border-destructive" : "border-border"
                    )}
                  >
                    <option value="">{t("selectState")}</option>
                    {filteredStates.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.state && <p className="text-xs text-destructive mt-1">{errors.state}</p>}
                </div>
              </div>

              <div className="flex-1" />
              <Button fullWidth onClick={next1} className="mt-10">{t("next")}</Button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in-up flex-1 flex flex-col">
              <h1 className="text-2xl font-display font-bold leading-tight">{t("obfStep2AgreeTitle")}</h1>
              <p className="text-sm text-muted-foreground mt-2">{t("obfStep2AgreeSub")}</p>

              <div className="mt-6 space-y-3">
                {AGREE_KEYS.map((k) => {
                  const checked = !!agrees[k];
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => toggleAgree(k)}
                      aria-pressed={checked}
                      className={cn(
                        "w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all tap",
                        checked ? "border-primary bg-primary/5" : "border-border bg-card"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                          checked ? "bg-primary border-primary text-primary-foreground" : "border-border bg-background"
                        )}
                      >
                        {checked && <Check size={14} strokeWidth={3} />}
                      </span>
                      <span className="text-sm leading-snug">{t(k)}</span>
                    </button>
                  );
                })}
              </div>

              {errors.agree && (
                <p className="text-xs text-destructive mt-3 text-center">{errors.agree}</p>
              )}

              <div className="flex-1" />
              <Button fullWidth onClick={next2} disabled={!allAgreed} className="mt-8">
                {t("next")}
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in-up flex-1 flex flex-col">
              <h1 className="text-2xl font-display font-bold leading-tight">{t("obfStep3Title")}</h1>
              <p className="text-sm text-muted-foreground mt-2">{t("obfStep3Sub")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("selectAllApply")}</p>

              <div className="mt-6 grid grid-cols-2 gap-2">
                {INTEREST_KEYS.map((k) => {
                  const selected = interests.includes(k);
                  return (
                    <button
                      key={k}
                      onClick={() => toggleInterest(k)}
                      className={cn(
                        "min-h-[48px] rounded-2xl border-2 px-3 py-2.5 text-sm font-medium text-left flex items-center justify-between gap-2 transition-all tap",
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground"
                      )}
                      aria-pressed={selected}
                    >
                      <span className="truncate">{t(k as TranslationKey)}</span>
                      {selected && (
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex-1" />
              <Button fullWidth onClick={finish} className="mt-8">{t("finish")}</Button>
              <button
                onClick={finish}
                className="block mx-auto mt-2 text-sm text-muted-foreground tap py-2"
              >
                {t("skip")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingForm;
