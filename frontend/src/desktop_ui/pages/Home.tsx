import { useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Search, Scale, FileText, MessageSquare, Landmark, ChevronRight } from "lucide-react";
import { ScreenShell } from "@desktop/components/layout/ScreenShell";
import { StickyHeader } from "@desktop/components/layout/StickyHeader";
import { KnowYourRightsAccordion } from "@desktop/components/home/KnowYourRightsAccordion";
import { useLanguage } from "@desktop/contexts/LanguageContext";
import { useAuth } from "@desktop/contexts/AuthContext";
import { useGuest } from "@desktop/contexts/GuestContext";
import { useChatHistory } from "@/hooks/useChatHistory";
import { getLanguage } from "@desktop/i18n/languages";

const Home = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { profile, guestName, isGuest } = useAuth();
  const { tryConsume } = useGuest();
  const { sessions, loading: historyLoading } = useChatHistory();
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
    { label: t("fileRti"), q: "How do I file an RTI application?" },
    { label: t("tenantRights"), q: "What are my rights as a tenant?" },
    { label: t("consumerComplaint"), q: "How do I file a consumer complaint?" },
  ];

  return (
    <ScreenShell>
      <StickyHeader showLanguagePill showBell showAvatar centerLogo />
      <div className="px-8 pt-8 pb-10 animate-fade-in-up max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">
            {t("namaste")}, {displayName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{today}</p>
        </div>

        {/* Search bar - wide desktop version */}
        <div className="flex items-center gap-3 ls-card px-5 h-14 focus-within:border-primary max-w-2xl mb-3">
          <Search size={20} className="text-muted-foreground shrink-0" />
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
              className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold tap"
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

        <div className="flex gap-2 flex-wrap mb-8">
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

        {/* Desktop 2-column layout: action tiles + sidebar */}
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-8">
            {/* Action tiles - 4 in a row on desktop */}
            <div className="grid grid-cols-2 gap-4">
              <ActionTile bg="bg-primary" text="text-primary-foreground" icon={<MessageSquare size={26} />} label={t("aiChatbot")} onClick={() => navigate("/chat")} />
              <ActionTile bg="bg-accent" text="text-accent-foreground" icon={<FileText size={26} />} label={t("documentGenerator")} onClick={() => navigate("/documents")} />
              <ActionTile bg="bg-tile-blueGray" text="text-white" icon={<Scale size={26} />} label={t("findLawyer")} onClick={() => navigate("/lawyers")} />
              <ActionTile bg="bg-tile-warmGreen" text="text-white" icon={<Landmark size={26} />} label="Government Portals" onClick={() => navigate("/portal-tracker")} />
            </div>

            {/* Recent queries */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold">{t("recentQueries")}</h2>
                <button onClick={() => navigate("/chat")} className="text-sm text-primary font-medium tap inline-flex items-center gap-0.5">
                  {t("viewAll")} <ChevronRight size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {historyLoading ? (
                  <div className="col-span-2 text-center text-xs text-muted-foreground py-4">Loading history...</div>
                ) : sessions.length === 0 ? (
                  <div className="col-span-2 text-center text-xs text-muted-foreground py-4">No recent queries yet.</div>
                ) : (
                  sessions.slice(0, 4).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => navigate("/chat", { state: { sessionId: s.id } })}
                      className="w-full text-left ls-card p-5 text-sm tap flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold line-clamp-1 pr-4">{s.title}</p>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {new Date(s.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Sidebar: Know Your Rights */}
          <div>
            <KnowYourRightsAccordion />
          </div>
        </div>
      </div>
    </ScreenShell>
  );
};

const ActionTile = ({ bg, text, icon, label, onClick }: { bg: string; text: string; icon: React.ReactNode; label: string; onClick?: () => void }) => (
  <button onClick={onClick} className={`tap text-left rounded-2xl ${bg} ${text} p-6 h-36 flex flex-col justify-between shadow-card hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg`}>
    <span className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">{icon}</span>
    <span className="text-base font-display font-semibold leading-tight">{label}</span>
  </button>
);

export default Home;
