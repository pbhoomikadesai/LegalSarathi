import { useEffect, useState } from "react";
import { ChevronDown, HelpCircle, Mail, MessageSquare, Phone, Send } from "lucide-react";
import { ScreenShell } from "@/components/layout/ScreenShell";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { Button } from "@/components/common/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const FAQS = [
  { q: "Is LegalSarathi free to use?", a: "Yes, basic features like AI chat, RTI generation and viewing lawyers are free for guests with limited usage. Premium unlocks unlimited use." },
  { q: "Are documents court-accepted?", a: "All templates are reviewed by practicing advocates and follow standard formats accepted across Indian courts." },
  { q: "Are video calls confidential?", a: "Yes. Calls run over end-to-end encrypted channels and are never recorded." },
  { q: "Can I use it without signing up?", a: "Yes — choose 'Continue as Guest' on the login screen for 5 free actions." },
];

interface Ticket {
  id: string;
  name: string;
  email: string;
  issue: string;
  status: "open";
  createdAt: number;
}

const KEY = "ls.tickets.v1";

const HelpCenter = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState<number | null>(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [issue, setIssue] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setTickets(JSON.parse(raw));
    } catch { /* no-op */ }
  }, []);

  const submit = () => {
    if (!name.trim() || !email.trim() || !issue.trim()) return;
    const ticket: Ticket = {
      id: `t_${Date.now().toString(36)}`,
      name: name.trim(),
      email: email.trim(),
      issue: issue.trim(),
      status: "open",
      createdAt: Date.now(),
    };
    const next = [ticket, ...tickets];
    setTickets(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* no-op */ }
    setName(""); setEmail(""); setIssue("");
    toast({ title: t("ticketSubmitted") });
  };

  return (
    <ScreenShell>
      <StickyHeader title={t("helpSupport")} showBack showLanguagePill />
      <div className="px-6 pt-4 pb-8 space-y-5">
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("faqs")}</h2>
          <div className="ls-card divide-y divide-border">
            {FAQS.map((f, i) => (
              <button
                key={i}
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-4 py-3 tap"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle size={16} className="text-primary shrink-0" />
                  <p className="flex-1 text-sm font-medium">{f.q}</p>
                  <ChevronDown size={16} className={cn("transition-transform text-muted-foreground", open === i && "rotate-180")} />
                </div>
                {open === i && <p className="text-xs text-muted-foreground mt-2 leading-relaxed pl-6">{f.a}</p>}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("contactSupport")}</h2>
          <div className="ls-card divide-y divide-border">
            <a href="mailto:support@legalsarathi.in" className="flex items-center gap-3 px-4 py-3 tap">
              <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground/70"><Mail size={16} /></span>
              <span className="flex-1 text-sm font-medium">support@legalsarathi.in</span>
            </a>
            <a href="tel:+918000000000" className="flex items-center gap-3 px-4 py-3 tap">
              <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground/70"><Phone size={16} /></span>
              <span className="flex-1 text-sm font-medium">+91 80000 00000</span>
            </a>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("raiseTicket")}</h2>
          <div className="ls-card p-4 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("yourName")}
              className="w-full h-11 px-3 rounded-button border border-border bg-card text-sm outline-none focus:border-primary"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("yourEmail")}
              className="w-full h-11 px-3 rounded-button border border-border bg-card text-sm outline-none focus:border-primary"
            />
            <textarea
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder={t("describeIssue")}
              rows={4}
              className="w-full px-3 py-2 rounded-button border border-border bg-card text-sm outline-none focus:border-primary resize-none"
            />
            <Button
              leftIcon={<Send size={14} />}
              onClick={submit}
              disabled={!name.trim() || !email.trim() || !issue.trim()}
              className="w-full h-11 text-sm"
            >
              {t("submitTicket")}
            </Button>
          </div>
        </section>

        {tickets.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("yourTickets")}</h2>
            <div className="space-y-2">
              {tickets.map((tk) => (
                <div key={tk.id} className="ls-card p-3">
                  <div className="flex items-start gap-2">
                    <MessageSquare size={14} className="text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{tk.issue}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{tk.email} · #{tk.id.slice(2, 8)}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/15 text-warning font-semibold">
                      {t("statusOpen")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </ScreenShell>
  );
};

export default HelpCenter;
