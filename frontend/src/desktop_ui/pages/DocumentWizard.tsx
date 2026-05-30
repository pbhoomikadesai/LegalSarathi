import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Download, FileText, Info, Lock, Share2 } from "lucide-react";
import { ScreenShell } from "@desktop/components/layout/ScreenShell";
import { StickyHeader } from "@desktop/components/layout/StickyHeader";
import { Button } from "@desktop/components/common/Button";
import { TextField } from "@desktop/components/common/TextField";
import { useLanguage } from "@desktop/contexts/LanguageContext";
import { LANGUAGES } from "@desktop/i18n/languages";
import { DOCUMENT_TEMPLATES, DOCUMENT_CATEGORIES } from "@desktop/data/documents";
import { useAuth } from "@desktop/contexts/AuthContext";
import { useGuest } from "@desktop/contexts/GuestContext";
import { usePremium } from "@desktop/contexts/PremiumContext";
import { useCases } from "@desktop/contexts/CasesContext";
import { useToast } from "@desktop/hooks/use-toast";
import { cn } from "@desktop/lib/utils";

type Step = 1 | 2 | 3 | 4;

const DOCS_GENERATED_KEY = "ls.docsGenerated";

const safeNum = (k: string) => {
  try { return parseInt(localStorage.getItem(k) || "0", 10) || 0; } catch { return 0; }
};
const safeIncrement = (k: string) => {
  try { localStorage.setItem(k, String(safeNum(k) + 1)); } catch { /* no-op */ }
};

const DocumentWizard = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { isPremium } = useAuth();
  const { tryConsume } = useGuest();
  const { show: showPremium } = usePremium();
  const { addCase } = useCases();
  const { toast } = useToast();

  const initialId = (location.state as { id?: string } | null)?.id;
  const [step, setStep] = useState<Step>(initialId ? 2 : 1);
  const [docId, setDocId] = useState<string | null>(initialId ?? null);
  const [docLang, setDocLang] = useState(lang);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [phone, setPhone] = useState("");
  const [caseDesc, setCaseDesc] = useState("");
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const docs = DOCUMENT_TEMPLATES;
  const selected = useMemo(() => docs.find((d) => d.id === docId), [docs, docId]);

  const stepLabels = [t("wizStep1"), t("wizStep2"), t("wizStep3"), t("wizStep4")];

  const next = () => setStep((s) => (Math.min(4, s + 1) as Step));
  const back = () => (step === 1 ? navigate(-1) : setStep((s) => (Math.max(1, s - 1) as Step)));

  const canNext = () => {
    if (step === 1) return !!docId;
    if (step === 2) return name.trim().length > 1 && address.trim().length > 3 && /^\d{10}$/.test(phone);
    if (step === 3) return caseDesc.trim().length >= 10;
    return true;
  };

  // Generate flow on entering step 4
  useEffect(() => {
    if (step !== 4 || done || generating) return;
    // Premium gate: 1 free document for non-premium users
    const generatedCount = safeNum(DOCS_GENERATED_KEY);
    if (!isPremium && generatedCount >= 1) {
      showPremium("document_limit");
      // bounce back to step 3 so user can retry after upgrade
      setStep(3);
      return;
    }
    if (!tryConsume()) {
      setStep(3);
      return;
    }
    setGenerating(true);
    const tm = window.setTimeout(() => {
      setGenerating(false);
      setDone(true);
      safeIncrement(DOCS_GENERATED_KEY);
      if (selected) {
        addCase({
          type: selected.id === "rti" ? "rti" : "document",
          title: selected.name,
          subtitle: caseDesc.slice(0, 120),
          status: "active",
        });
      }
    }, 1400);
    return () => window.clearTimeout(tm);
  }, [step, done, generating, isPremium, tryConsume, showPremium, addCase, selected, caseDesc]);

  const handleDownload = () => {
    toast({ title: t("downloadPdf"), description: t("docSavedToCases") });
  };

  return (
    <ScreenShell>
      <StickyHeader title={t("documentGenerator" as never) || t("legalDocuments")} showBack onBack={back} showLanguagePill />
      <div className="px-8 pt-6 pb-10 max-w-5xl">
        <div className="flex gap-1.5 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-border")} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mb-1">{t("step")} {step} {t("of")} 4</p>
        <h2 className="font-display font-bold text-lg mb-4">{stepLabels[step - 1]}</h2>

        {step === 1 && (
          <div className="space-y-3">
            {DOCUMENT_CATEGORIES.filter((c) => c !== "All").slice(0, 8).map((cat) => {
              const tpl = docs.find((d) => d.category === cat);
              if (!tpl) return null;
              const active = docId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => setDocId(tpl.id)}
                  className={cn(
                    "w-full text-left ls-card p-4 tap border-2",
                    active ? "border-primary bg-primary/5" : "border-transparent"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}>
                      <FileText size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-sm">{tpl.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tpl.description}</p>
                    </div>
                    {active && <CheckCircle2 size={18} className="text-primary shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <TextField label={t("fullName")} placeholder="Priya Desai" value={name} onChange={(e) => setName(e.target.value)} />
            <TextField label={t("address")} placeholder="House 12, Jayanagar, Bengaluru" value={address} onChange={(e) => setAddress(e.target.value)} />
            <TextField
              label={t("aadhaarOptional")}
              placeholder="XXXX XXXX XXXX"
              value={aadhaar}
              onChange={(e) => setAadhaar(e.target.value)}
              rightAddon={<span className="pr-3 text-accent" title="Optional and encrypted"><Info size={16} /></span>}
            />
            <TextField label={t("phoneLabel")} placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} />
            <div>
              <label className="block text-sm font-medium mb-2 font-display">{t("documentLanguage")}</label>
              <select
                value={docLang}
                onChange={(e) => setDocLang(e.target.value as typeof docLang)}
                className="w-full h-[52px] px-4 rounded-button border border-border bg-card font-native text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.native}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5 pt-2">
              <Lock size={12} /> {t("dataSecure")}
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 font-display">{t("caseDescLabel")}</label>
              <textarea
                value={caseDesc}
                onChange={(e) => setCaseDesc(e.target.value)}
                placeholder={t("caseDescPlaceholder")}
                rows={6}
                className="w-full px-4 py-3 rounded-button border border-border bg-card text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none"
              />
            </div>
            <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <Lock size={12} /> {t("dataSecure")}
            </p>
          </div>
        )}

        {step === 4 && (
          <div>
            {generating && (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
                <p className="mt-4 text-sm text-muted-foreground">{t("generatingDoc")}</p>
              </div>
            )}
            {done && selected && (
              <div className="space-y-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-success/15 text-success flex items-center justify-center animate-scale-in">
                    <CheckCircle2 size={28} />
                  </div>
                  <h3 className="mt-3 font-display font-bold text-base">{t("docReady")}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{t("docSavedToCases")}</p>
                </div>
                <div className="ls-card p-4 text-xs text-foreground/80 leading-relaxed font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
{`${selected.name.toUpperCase()}

To,
The ${selected.category === "RTI" ? "Public Information Officer" : "Concerned Authority"}

I, ${name || "________"}, residing at ${address || "________"}, hereby submit the following:

${caseDesc || "________"}

I request appropriate action under the relevant provisions of law.

Yours sincerely,
${name || "________"}
${phone ? `+91 ${phone}` : ""}
Date: ${new Date().toLocaleDateString()}`}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button leftIcon={<Download size={14} />} onClick={handleDownload}>{t("downloadPdf")}</Button>
                  <Button variant="secondary" leftIcon={<Share2 size={14} />}>{t("shareDoc")}</Button>
                </div>
                <Button variant="ghost" fullWidth onClick={() => { setStep(1); setDocId(null); setDone(false); setCaseDesc(""); }}>
                  {t("startOver")}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {step < 4 && (
        <div className="sticky bottom-0 bg-card border-t border-border">
          <div className="px-8 py-3 flex gap-3 max-w-5xl">
            <Button variant="ghost" className="flex-1" onClick={back}>{t("back")}</Button>
            <Button className="flex-1" disabled={!canNext()} onClick={next}>{t("continue")}</Button>
          </div>
        </div>
      )}
    </ScreenShell>
  );
};

export default DocumentWizard;
