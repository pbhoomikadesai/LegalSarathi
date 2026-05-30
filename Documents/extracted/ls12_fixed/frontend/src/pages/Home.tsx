import { useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Search, Scale, FileText, MessageSquare, Landmark, ChevronRight } from "lucide-react";
import { ScreenShell } from "@/components/layout/ScreenShell";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { KnowYourRightsAccordion } from "@/components/home/KnowYourRightsAccordion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useGuest } from "@/contexts/GuestContext";
import { getLanguage } from "@/i18n/languages";

const Home = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { profile, guestName, isGuest } = useAuth();
  const { tryConsume } = useGuest();
  const [query, setQuery] = useState("");

  const today = new Intl.DateTimeFormat(getLanguage(lang).locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const displayName =
    (profile.name && profile.name.trim()) || (isGuest && guestName) || "Priya";

  const sendQuery = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    if (!tryConsume()) return;
    navigate("/chat", { state: { initialQuery: trimmed } });
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendQuery(query);
  };

  const startVoice = () => {
    if (!tryConsume()) return;
    navigate("/chat", { state: { startVoice: true } });
  };

  const chipQueries = [
    { label: t("fileRti"), q: t("fileRtiQuery") },
    { label: t("tenantRights"), q: t("tenantRightsQuery") },
    { label: t("consumerComplaint"), q: t("consumerComplaintQuery") },
  ];

  return (
    <ScreenShell>
      <StickyHeader showMenu showLanguagePill showBell showAvatar centerLogo />
      <div className="px-6 pt-5 pb-6 animate-fade-in-up">
        <h1 className="text-[22px] font-display font-bold">
          {t("namaste")}, {displayName}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">{today}</p>

        <div className="mt-5 flex items-center gap-2 ls-card px-4 h-14 focus-within:border-primary">
          <Search size={18} className="text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder={t("askQuestion")}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label={t("askQuestion")}
          />
          {query.trim() ? (
            <button
              onClick={() => sendQuery(query)}
              aria-label="Send"
              className="h-9 px-3 rounded-full bg-primary text-primary-foreground text-xs font-semibold tap"
            >
              {t("next")}
            </button>
          ) : (
            <button
              onClick={startVoice}
              aria-label="Voice input"
              className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center tap"
            >
              <Mic size={16} className="text-primary" />
            </button>
          )}
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none -mx-6 px-6">
          {chipQueries.map((c) => (
            <button
              key={c.label}
              onClick={() => sendQuery(c.q)}
              className="ls-chip whitespace-nowrap text-primary border-primary/20 bg-primary/5 tap"
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <ActionTile bg="bg-primary" text="text-primary-foreground" icon={<MessageSquare size={22} />} label={t("aiChatbot")} onClick={() => navigate("/chat")} />
          <ActionTile bg="bg-accent" text="text-accent-foreground" icon={<FileText size={22} />} label={t("documentGenerator")} onClick={() => navigate("/documents")} />
          <ActionTile bg="bg-tile-blueGray" text="text-white" icon={<Scale size={22} />} label={t("findLawyer")} onClick={() => navigate("/lawyers")} />
          <ActionTile bg="bg-tile-warmGreen" text="text-white" icon={<Landmark size={22} />} label="Government Portals" onClick={() => navigate("/portal-tracker")} />
        </div>

        <KnowYourRightsAccordion />

        <section className="mt-7">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-display font-semibold">{t("recentQueries")}</h2>
            <button onClick={() => navigate("/chat")} className="text-xs text-primary font-medium tap inline-flex items-center gap-0.5">
              {t("viewAll")} <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {["Eviction notice from landlord", "RTI for ration card status"].map((q) => (
              <button
                key={q}
                onClick={() => sendQuery(q)}
                className="w-full text-left ls-card p-4 text-sm tap"
              >
                <p className="font-medium">{q}</p>
                <p className="text-xs text-muted-foreground mt-1">2 days ago</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </ScreenShell>
  );
};

const ActionTile = ({ bg, text, icon, label, onClick }: { bg: string; text: string; icon: React.ReactNode; label: string; onClick?: () => void }) => (
  <button onClick={onClick} className={`tap text-left rounded-2xl ${bg} ${text} p-4 h-28 flex flex-col justify-between shadow-card`}>
    <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">{icon}</span>
    <span className="text-sm font-display font-semibold leading-tight">{label}</span>
  </button>
);

export default Home;
