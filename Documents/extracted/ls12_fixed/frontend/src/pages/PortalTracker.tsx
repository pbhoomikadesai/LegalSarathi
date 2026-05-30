import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  Upload,
  ExternalLink,
  Sparkles,
  FileText,
  ScanText,
  CreditCard,
  Activity,
  Trash2,
  Download,
  Pencil,
} from "lucide-react";
import { ScreenShell } from "@/components/layout/ScreenShell";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useCases } from "@/contexts/CasesContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/* ---------- Portal catalog ---------- */

type PortalKey = "consumer" | "cyber" | "labour" | "rti" | "police";

interface Portal {
  key: PortalKey;
  name: string;
  authority: string;
  url: string;
  fee: string;
  description: string;
  matchKeywords: string[]; // for AI smart recommendation
}

const PORTALS: Portal[] = [
  {
    key: "consumer",
    name: "Consumer Forum (e-Daakhil)",
    authority: "National Consumer Disputes Redressal Commission",
    url: "https://edaakhil.nic.in/",
    fee: "₹100 – ₹5,000 (slab-based)",
    description: "File complaints against goods/services defects, unfair trade practices, refunds.",
    matchKeywords: ["consumer", "refund", "product", "service", "amazon", "flipkart", "warranty", "defective"],
  },
  {
    key: "cyber",
    name: "Cyber Crime Portal",
    authority: "Ministry of Home Affairs (I4C)",
    url: "https://cybercrime.gov.in/",
    fee: "Free",
    description: "Report online fraud, financial cybercrime, social-media harassment, phishing.",
    matchKeywords: ["fraud", "cyber", "online", "upi", "phishing", "hack", "scam", "social media"],
  },
  {
    key: "labour",
    name: "Labour Court / SAMADHAN",
    authority: "Ministry of Labour & Employment",
    url: "https://samadhan.labour.gov.in/",
    fee: "Free",
    description: "Wage disputes, illegal termination, gratuity, PF, workplace grievances.",
    matchKeywords: ["salary", "wage", "termination", "fired", "boss", "employer", "pf", "gratuity"],
  },
  {
    key: "rti",
    name: "RTI Online Portal",
    authority: "DoPT, Government of India",
    url: "https://rtionline.gov.in/",
    fee: "₹10",
    description: "Right to Information requests to any Central Government department.",
    matchKeywords: ["rti", "information", "government", "department", "records"],
  },
  {
    key: "police",
    name: "FIR / Police e-Services",
    authority: "State Police Department",
    url: "https://digitalpolice.gov.in/",
    fee: "Free",
    description: "Lodge FIRs, view case status, lost-article reports.",
    matchKeywords: ["fir", "police", "stolen", "theft", "assault", "missing"],
  },
];

/* ---------- Step model ---------- */

type StepId = "gather" | "file" | "pay" | "track";

interface PortalState {
  steps: Record<StepId, boolean>;
  files: { name: string; size: number; ocrText?: string }[];
  draft: string;
}

const STORAGE_KEY = "ls.portalTracker.v1";

const safeRead = (): Record<PortalKey, PortalState> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* no-op */
  }
  const empty = {} as Record<PortalKey, PortalState>;
  PORTALS.forEach((p) => {
    empty[p.key] = { steps: { gather: false, file: false, pay: false, track: false }, files: [], draft: "" };
  });
  return empty;
};

const safeWrite = (s: Record<PortalKey, PortalState>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* no-op */
  }
};

/* ---------- AI smart recommendation ---------- */

const recommendPortal = (query: string): PortalKey | null => {
  const q = query.toLowerCase();
  let best: { key: PortalKey; score: number } | null = null;
  for (const p of PORTALS) {
    const score = p.matchKeywords.reduce((acc, kw) => (q.includes(kw) ? acc + 1 : acc), 0);
    if (score > 0 && (!best || score > best.score)) best = { key: p.key, score };
  }
  return best?.key ?? null;
};

/* ---------- Mock OCR ---------- */

const mockOcr = (filename: string): string => {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) {
    return `[PDF detected: ${filename}]\nName: ___\nDate: ${new Date().toLocaleDateString()}\nReference No: ___\nExtracted: Document body parsed successfully.`;
  }
  if (lower.match(/\.(jpe?g|png)$/)) {
    return `[Image OCR: ${filename}]\nDetected text: "Receipt / Notice / ID"\nKey fields: amount, date, signature.`;
  }
  return `[${filename}] Parsed content unavailable for this file type.`;
};

/* ---------- Component ---------- */

const PortalTracker = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { profile } = useAuth();
  const { addCase } = useCases();
  const { toast } = useToast();

  const queryFromUrl = params.get("q") ?? "";
  const initialPortal: PortalKey = (params.get("portal") as PortalKey) || recommendPortal(queryFromUrl) || "consumer";

  const [activePortal, setActivePortal] = useState<PortalKey>(initialPortal);
  const [openStep, setOpenStep] = useState<StepId | null>("gather");
  const [search, setSearch] = useState(queryFromUrl);
  const [state, setState] = useState<Record<PortalKey, PortalState>>(() => safeRead());
  const [editingDraft, setEditingDraft] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    safeWrite(state);
  }, [state]);

  const portal = useMemo(() => PORTALS.find((p) => p.key === activePortal)!, [activePortal]);
  const portalState = state[activePortal];

  const filteredPortals = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PORTALS;
    return PORTALS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.matchKeywords.some((k) => q.includes(k))
    );
  }, [search]);

  const recommendation = useMemo(() => (search.trim() ? recommendPortal(search) : null), [search]);

  const completedCount = Object.values(portalState.steps).filter(Boolean).length;
  const progressPct = Math.round((completedCount / 4) * 100);

  /* --- mutators --- */

  const toggleStep = (id: StepId, value?: boolean) => {
    setState((prev) => ({
      ...prev,
      [activePortal]: {
        ...prev[activePortal],
        steps: { ...prev[activePortal].steps, [id]: value ?? !prev[activePortal].steps[id] },
      },
    }));
  };

  const handleUpload = (files: FileList | null) => {
    if (!files || !files.length) return;
    const accepted = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    const docExt = /\.(pdf|docx?|jpe?g|png)$/i;
    const additions: PortalState["files"] = [];
    Array.from(files).forEach((f) => {
      if (!accepted.includes(f.type) && !docExt.test(f.name)) {
        toast({ title: "Unsupported file", description: `${f.name} is not allowed (PDF/DOCX/JPG/PNG only).`, variant: "destructive" });
        return;
      }
      additions.push({ name: f.name, size: f.size, ocrText: mockOcr(f.name) });
    });
    if (!additions.length) return;
    setState((prev) => ({
      ...prev,
      [activePortal]: {
        ...prev[activePortal],
        files: [...prev[activePortal].files, ...additions],
        steps: { ...prev[activePortal].steps, gather: true }, // auto-complete Gather step
      },
    }));
    toast({ title: "Files uploaded", description: `${additions.length} file(s) parsed via OCR.` });
  };

  const removeFile = (idx: number) => {
    setState((prev) => {
      const newFiles = prev[activePortal].files.filter((_, i) => i !== idx);
      return {
        ...prev,
        [activePortal]: {
          ...prev[activePortal],
          files: newFiles,
          steps: { ...prev[activePortal].steps, gather: newFiles.length > 0 },
        },
      };
    });
  };

  const generateDraft = () => {
    const userName = (profile.name && profile.name.trim()) || "[Your Name]";
    const ocrSnippets = portalState.files
      .map((f) => `• ${f.name}\n  ${f.ocrText?.split("\n").slice(0, 2).join(" / ") ?? ""}`)
      .join("\n");
    const draft = `To,
The ${portal.authority}

Subject: Complaint regarding ${search.trim() || "[describe matter]"}

Respected Sir/Madam,

I, ${userName}, hereby submit this complaint through the ${portal.name} for the following grievance:

${search.trim() || "[Briefly describe what happened, when, and the harm caused.]"}

Supporting Documents Attached:
${ocrSnippets || "• [List documents you will attach]"}

I request a fair and time-bound resolution under the applicable provisions of law.

Yours sincerely,
${userName}
Date: ${new Date().toLocaleDateString()}

---
This is AI-generated legal guidance for advisory purposes only. Please consult a qualified lawyer for your specific case.`;
    setState((prev) => ({
      ...prev,
      [activePortal]: { ...prev[activePortal], draft, steps: { ...prev[activePortal].steps, file: true } },
    }));
    toast({ title: "Draft generated", description: "AI-assisted complaint ready to review." });
  };

  const saveDraftToCases = () => {
    addCase({
      type: portal.key === "rti" ? "rti" : "document",
      title: `${portal.name} – Complaint`,
      subtitle: search.slice(0, 120) || portal.description,
      status: "active",
      meta: { portal: portal.key, draft: portalState.draft },
    });
    toast({ title: "Saved to Cases", description: "You can resume editing from the Cases tab." });
  };

  const downloadDraft = () => {
    if (!portalState.draft.trim()) {
      toast({ title: "Nothing to download", description: "Generate a draft first." });
      return;
    }
    const blob = new Blob([portalState.draft], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${portal.key}-complaint-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  /* ---------- render ---------- */

  return (
    <ScreenShell>
      <StickyHeader title="Portal Tracker" showBack onBack={() => navigate(-1)} showLanguagePill />
      <div className="px-5 pt-4 pb-8 space-y-5 animate-fade-in-up">
        {/* Search + AI recommendation */}
        <div>
          <div className="ls-card flex items-center gap-2 px-4 h-12 focus-within:border-primary">
            <ScanText size={16} className="text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Describe your issue or search a portal…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-label="Search portals"
            />
          </div>
          {recommendation && recommendation !== activePortal && (
            <button
              onClick={() => setActivePortal(recommendation)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary font-medium tap"
            >
              <Sparkles size={12} /> AI suggests: {PORTALS.find((p) => p.key === recommendation)?.name}
            </button>
          )}
        </div>

        {/* Portal tabs */}
        <div className="-mx-5 px-5 overflow-x-auto scrollbar-none">
          <div className="flex gap-2">
            {filteredPortals.map((p) => {
              const active = p.key === activePortal;
              return (
                <button
                  key={p.key}
                  onClick={() => setActivePortal(p.key)}
                  className={cn(
                    "ls-chip whitespace-nowrap tap",
                    active ? "bg-primary text-primary-foreground border-primary" : ""
                  )}
                >
                  {p.name.split(" (")[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Portal info card */}
        <div className="ls-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display font-semibold text-base">{portal.name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{portal.authority}</p>
              <p className="text-xs mt-2 leading-snug">{portal.description}</p>
            </div>
            <a
              href={portal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center tap"
              aria-label="Open portal"
            >
              <ExternalLink size={16} />
            </a>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">
                {completedCount}/4 steps · {progressPct}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        {/* Step cards */}
        <div className="space-y-3">
          <StepCard
            id="gather"
            icon={<Upload size={18} />}
            title="Gather Documents"
            description="Upload supporting docs (PDF, DOCX, JPG, PNG). OCR auto-extracts text."
            done={portalState.steps.gather}
            open={openStep === "gather"}
            onToggle={() => setOpenStep(openStep === "gather" ? null : "gather")}
          >
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,image/*"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
            <Button leftIcon={<Upload size={14} />} onClick={() => fileRef.current?.click()} className="h-10 text-xs px-4">
              Choose files
            </Button>
            {portalState.files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {portalState.files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="rounded-lg border border-border bg-muted/40 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={14} className="text-primary shrink-0" />
                        <span className="text-xs font-medium truncate">{f.name}</span>
                      </div>
                      <button
                        onClick={() => removeFile(i)}
                        aria-label="Remove file"
                        className="w-7 h-7 rounded-full hover:bg-background flex items-center justify-center tap text-muted-foreground"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {f.ocrText && (
                      <pre className="mt-2 text-[10px] text-muted-foreground whitespace-pre-wrap font-mono leading-snug">
                        {f.ocrText}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </StepCard>

          <StepCard
            id="file"
            icon={<Pencil size={18} />}
            title="File Complaint"
            description="AI auto-drafts a complaint using your description and uploaded docs."
            done={portalState.steps.file}
            open={openStep === "file"}
            onToggle={() => setOpenStep(openStep === "file" ? null : "file")}
          >
            <div className="flex flex-wrap gap-2">
              <Button leftIcon={<Sparkles size={14} />} onClick={generateDraft} className="h-10 text-xs px-4">
                {portalState.draft ? "Regenerate draft" : "Generate AI draft"}
              </Button>
              {portalState.draft && (
                <>
                  <Button variant="secondary" onClick={() => setEditingDraft((v) => !v)} className="h-10 text-xs px-4">
                    {editingDraft ? "Done editing" : "Edit"}
                  </Button>
                  <Button variant="secondary" leftIcon={<Download size={14} />} onClick={downloadDraft} className="h-10 text-xs px-4">
                    Download
                  </Button>
                  <Button variant="ghost" onClick={saveDraftToCases} className="h-10 text-xs px-4">
                    Save to Cases
                  </Button>
                </>
              )}
            </div>
            {portalState.draft && (
              editingDraft ? (
                <textarea
                  value={portalState.draft}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      [activePortal]: { ...prev[activePortal], draft: e.target.value },
                    }))
                  }
                  rows={10}
                  className="mt-3 w-full px-3 py-2 rounded-button border border-border bg-card text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-y"
                />
              ) : (
                <pre className="mt-3 ls-card p-3 text-[11px] leading-relaxed whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                  {portalState.draft}
                </pre>
              )
            )}
          </StepCard>

          <StepCard
            id="pay"
            icon={<CreditCard size={18} />}
            title="Pay Filing Fee"
            description={`Applicable fee for this portal: ${portal.fee}`}
            done={portalState.steps.pay}
            open={openStep === "pay"}
            onToggle={() => setOpenStep(openStep === "pay" ? null : "pay")}
          >
            <div className="ls-card p-3 text-xs">
              <p>
                <strong>Fee:</strong> {portal.fee}
              </p>
              <p className="text-muted-foreground mt-1">
                Pay directly on the official portal. We do not collect any fees on your behalf.
              </p>
            </div>
            <div className="mt-3 flex gap-2">
              <a
                href={portal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="tap inline-flex items-center justify-center gap-2 rounded-button px-4 h-10 text-xs font-semibold font-display bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => toggleStep("pay", true)}
              >
                <ExternalLink size={13} /> Pay on portal
              </a>
              <Button variant="secondary" className="h-10 text-xs px-4" onClick={() => toggleStep("pay")}>
                {portalState.steps.pay ? "Mark unpaid" : "I've paid"}
              </Button>
            </div>
          </StepCard>

          <StepCard
            id="track"
            icon={<Activity size={18} />}
            title="Track Status"
            description="Real-time status updates for your submission."
            done={portalState.steps.track}
            open={openStep === "track"}
            onToggle={() => setOpenStep(openStep === "track" ? null : "track")}
          >
            <div className="ls-card p-3 text-xs space-y-1.5">
              <StatusLine label="Filed on portal" ok={portalState.steps.file} />
              <StatusLine label="Fee paid" ok={portalState.steps.pay} />
              <StatusLine label="Acknowledgement received" ok={portalState.steps.pay && portalState.steps.file} />
              <StatusLine label="Hearing / Resolution" ok={portalState.steps.track} />
            </div>
            <div className="mt-3 flex gap-2">
              <a
                href={portal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="tap inline-flex items-center justify-center gap-2 rounded-button px-4 h-10 text-xs font-semibold font-display border border-primary text-primary hover:bg-primary/5"
              >
                Open status page
              </a>
              <Button variant="ghost" className="h-10 text-xs px-4" onClick={() => toggleStep("track")}>
                {portalState.steps.track ? "Reopen" : "Mark resolved"}
              </Button>
            </div>
          </StepCard>
        </div>

        {/* Disclaimer */}
        <p className="text-[11px] text-muted-foreground leading-relaxed pt-2">
          This is AI-generated legal guidance for advisory purposes only. Please consult a qualified lawyer for your
          specific case.
        </p>
      </div>
    </ScreenShell>
  );
};

/* ---------- Sub-components ---------- */

interface StepCardProps {
  id: StepId;
  icon: React.ReactNode;
  title: string;
  description: string;
  done: boolean;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const StepCard = ({ icon, title, description, done, open, onToggle, children }: StepCardProps) => (
  <div className={cn("ls-card overflow-hidden transition-colors", done && "border-success/40 bg-success/5")}>
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 p-4 text-left tap"
      aria-expanded={open}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          done ? "bg-success text-white" : "bg-primary/10 text-primary"
        )}
      >
        {done ? <CheckCircle2 size={18} /> : icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-display font-semibold text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
      </div>
      <ChevronDown size={18} className={cn("text-muted-foreground transition-transform shrink-0", open && "rotate-180")} />
    </button>
    {open && <div className="px-4 pb-4 pt-1">{children}</div>}
  </div>
);

const StatusLine = ({ label, ok }: { label: string; ok: boolean }) => (
  <div className="flex items-center gap-2">
    {ok ? (
      <CheckCircle2 size={13} className="text-success" />
    ) : (
      <Circle size={13} className="text-muted-foreground" />
    )}
    <span className={cn("text-xs", ok ? "text-foreground" : "text-muted-foreground")}>{label}</span>
  </div>
);

export default PortalTracker;
