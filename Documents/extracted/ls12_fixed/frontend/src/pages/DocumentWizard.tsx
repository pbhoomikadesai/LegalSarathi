import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronDown, Download, FileText, Info, Lock, Share2 } from "lucide-react";
import { ScreenShell } from "@/components/layout/ScreenShell";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { Button } from "@/components/common/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import { DOCUMENT_TEMPLATES, DOCUMENT_CATEGORIES, DocumentTemplate, DocumentField } from "@/data/documents";
import { useAuth } from "@/contexts/AuthContext";
import { useGuest } from "@/contexts/GuestContext";
import { usePremium } from "@/contexts/PremiumContext";
import { useCases } from "@/contexts/CasesContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4;
const DOCS_GENERATED_KEY = "ls.docsGenerated";
const safeNum = (k: string) => { try { return parseInt(localStorage.getItem(k) || "0", 10) || 0; } catch { return 0; } };
const safeIncrement = (k: string) => { try { localStorage.setItem(k, String(safeNum(k) + 1)); } catch {} };

// ── Dynamic Field Component ───────────────────────────────────────────────────
function DynamicField({
  field,
  value,
  onChange,
}: {
  field: DocumentField;
  value: string;
  onChange: (v: string) => void;
}) {
  const baseClass =
    "w-full px-4 py-3 rounded-button border border-border bg-card text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium font-display">
        {field.label}
        {field.required && <span className="text-destructive ml-0.5">*</span>}
      </label>

      {field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className={cn(baseClass, "resize-none")}
        />
      ) : field.type === "select" ? (
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(baseClass, "appearance-none pr-10 h-[52px]")}
          >
            <option value="">Select…</option>
            {field.options?.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      ) : (
        <input
          type={field.type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={cn(baseClass, "h-[52px]")}
        />
      )}

      {field.hint && (
        <p className="text-xs text-muted-foreground flex items-start gap-1 pt-0.5">
          <Info size={12} className="shrink-0 mt-0.5" /> {field.hint}
        </p>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
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
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Dynamic form data: field.key → value
  const [formData, setFormData] = useState<Record<string, string>>({});

  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const selected: DocumentTemplate | undefined = useMemo(
    () => DOCUMENT_TEMPLATES.find((d) => d.id === docId),
    [docId]
  );

  const filteredTemplates = categoryFilter === "All"
    ? DOCUMENT_TEMPLATES
    : DOCUMENT_TEMPLATES.filter((d) => d.category === categoryFilter);

  const stepLabels = ["Choose Document", "Fill Details", "Review & Generate", "Download"];
  const back = () => (step === 1 ? navigate(-1) : setStep((s) => (Math.max(1, s - 1) as Step)));

  const setField = (key: string, val: string) =>
    setFormData((prev) => ({ ...prev, [key]: val }));

  // Validate current step
  const canNext = (): boolean => {
    if (step === 1) return !!docId;
    if (step === 2) {
      if (!selected) return false;
      return selected.fields
        .filter((f) => f.required)
        .every((f) => (formData[f.key] || "").trim().length > 0);
    }
    return true;
  };

  // ── Step 3: Generate preview HTML via API ────────────────────────────────
  const generatePreview = async () => {
    if (!selected) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/documents/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_type: selected.apiDocType,
          language: "english",
          data: formData,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(err.detail || `Server error ${res.status}`);
      }
      const json = await res.json();
      setPreviewHtml(json.html || "");
      setDone(true);
      safeIncrement(DOCS_GENERATED_KEY);
      if (selected) {
        addCase({
          type: "document",
          title: selected.name,
          subtitle: Object.values(formData).find((v) => v.length > 20) || selected.description,
          status: "active",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Generation failed", description: msg, variant: "destructive" });
      setStep(2); // bounce back
    } finally {
      setGenerating(false);
    }
  };

  // Trigger generation when step becomes 3
  useEffect(() => {
    if (step !== 3 || done || generating) return;

    const count = safeNum(DOCS_GENERATED_KEY);
    if (!isPremium && count >= 2) {
      showPremium("document_limit");
      setStep(2);
      return;
    }
    if (!tryConsume()) { setStep(2); return; }

    generatePreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ── Download PDF via API ─────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!selected) return;
    setDownloading(true);
    toast({ title: "Generating PDF…", description: "Please wait a moment." });
    try {
      const res = await fetch("/api/documents/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_type: selected.apiDocType,
          language: "english",
          data: formData,
        }),
      });
      if (!res.ok) throw new Error(`PDF error ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selected.id}_LegalSarthi.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "PDF Downloaded", description: "Check your downloads folder." });
    } catch (err: unknown) {
      toast({ title: "Download failed", description: String(err), variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <ScreenShell>
      <StickyHeader
        title="Document Generator"
        showBack
        onBack={back}
        showLanguagePill
      />

      <div className="px-4 pt-4 pb-32">
        {/* Progress bar */}
        <div className="flex gap-1.5 mb-3">
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= step ? "bg-primary" : "bg-border")}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mb-0.5">Step {step} of 4</p>
        <h2 className="font-display font-bold text-lg mb-4">{stepLabels[step - 1]}</h2>

        {/* ── STEP 1: Choose document ── */}
        {step === 1 && (
          <div>
            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 pb-2 mb-3">
              {DOCUMENT_CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={cn(
                    "ls-chip whitespace-nowrap tap text-xs",
                    categoryFilter === c ? "bg-primary text-primary-foreground border-primary" : ""
                  )}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredTemplates.map((tpl) => {
                const active = docId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => setDocId(tpl.id)}
                    className={cn(
                      "w-full text-left ls-card p-4 tap border-2 transition-all",
                      active ? "border-primary bg-primary/5" : "border-transparent"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                      )}>
                        <FileText size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display font-semibold text-sm">{tpl.name}</h3>
                          {tpl.featured && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent/15 text-accent font-semibold">Popular</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tpl.description}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-success/10 text-success font-medium">Free</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">~{tpl.estMinutes} min</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">{tpl.act.split(",")[0]}</span>
                        </div>
                        {tpl.featured && tpl.generatedThisMonth && (
                          <p className="text-[10px] text-accent font-semibold mt-1.5">{tpl.generatedThisMonth.toLocaleString()}+ generated this month</p>
                        )}
                      </div>
                      {active && <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 2: Fill fields ── */}
        {step === 2 && selected && (
          <div className="space-y-4">
            {/* Doc info banner */}
            <div className="ls-card p-3 bg-primary/5 border-primary/20">
              <h3 className="font-display font-semibold text-sm">{selected.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{selected.act}</p>
              <div className="mt-1.5 flex gap-2 flex-wrap">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success font-medium">Fee: {selected.fee}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">{selected.fields.filter((f) => f.required).length} required fields</span>
              </div>
            </div>

            {selected.fields.map((field) => (
              <DynamicField
                key={field.key}
                field={field}
                value={formData[field.key] || ""}
                onChange={(v) => setField(field.key, v)}
              />
            ))}

            <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
              <Lock size={12} /> Your data is processed locally and never stored.
            </p>
          </div>
        )}

        {/* ── STEP 3: Preview ── */}
        {step === 3 && (
          <div>
            {generating && (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
                <p className="mt-4 text-sm text-muted-foreground">Generating your document…</p>
              </div>
            )}

            {done && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 size={20} />
                  <span className="font-display font-semibold text-sm">Document ready</span>
                </div>

                {/* HTML Preview in iframe */}
                {previewHtml && (
                  <div className="rounded-xl overflow-hidden border border-border bg-white">
                    <p className="text-xs font-medium text-muted-foreground px-3 py-2 bg-muted border-b border-border">
                      Preview (scroll to read)
                    </p>
                    <iframe
                      ref={previewRef}
                      srcDoc={previewHtml}
                      className="w-full"
                      style={{ height: "420px", border: "none" }}
                      title="Document Preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    leftIcon={<Download size={14} />}
                    onClick={handleDownload}
                    disabled={downloading}
                  >
                    {downloading ? "Generating…" : "Download PDF"}
                  </Button>
                  <Button
                    variant="secondary"
                    leftIcon={<Share2 size={14} />}
                    onClick={() => {
                      const blob = new Blob([previewHtml], { type: "text/html" });
                      const url = URL.createObjectURL(blob);
                      window.open(url, "_blank");
                    }}
                  >
                    Open in Tab
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => { setStep(1); setDocId(null); setDone(false); setFormData({}); setPreviewHtml(""); }}
                >
                  Start Over
                </Button>

                <div className="ls-card p-3 bg-amber-50 border-amber-200 text-xs text-amber-800">
                  <strong>⚠ Reminder:</strong> This document is a template. Please review it carefully before submission.
                  For critical matters, have it reviewed by a qualified advocate.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      {step < 3 && (
        <div className="fixed bottom-16 left-0 right-0 bg-card border-t border-border z-10">
          <div className="max-w-md mx-auto px-4 py-3 flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={back}>Back</Button>
            <Button
              className="flex-1"
              disabled={!canNext()}
              onClick={() => setStep((s) => (Math.min(3, s + 1) as Step))}
            >
              {step === 2 ? "Generate Preview" : "Continue"}
            </Button>
          </div>
        </div>
      )}
    </ScreenShell>
  );
};

export default DocumentWizard;
