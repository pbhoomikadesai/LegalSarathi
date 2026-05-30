import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, MessageCircle, Pin, ShieldCheck } from "lucide-react";
import { ScreenShell } from "@/components/layout/ScreenShell";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { Button } from "@/components/common/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { cn } from "@/lib/utils";

const TABS = ["trending", "recent", "answered", "myQuestions"] as const;
const CHIPS = ["catAll", "catProperty", "catCriminal", "catFamily", "catLabour", "catRti", "catWomen"] as const;
const CHIP_VALUE: Record<string, string | null> = {
  catAll: null, catProperty: "Property", catCriminal: "Criminal", catFamily: "Family",
  catLabour: "Labour", catRti: "RTI", catWomen: "Women",
};

const Community = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { posts } = useCommunity();
  const [tab, setTab] = useState<(typeof TABS)[number]>("trending");
  const [cat, setCat] = useState<(typeof CHIPS)[number]>("catAll");

  const filtered = posts
    .filter((p) => {
      const v = CHIP_VALUE[cat];
      return v ? p.category === v : true;
    })
    .filter((p) => {
      if (tab === "answered") return !!p.verifiedAnswer;
      if (tab === "myQuestions") return !!p.myPost;
      return true;
    })
    .sort((a, b) => {
      if (tab === "recent") return (b.createdAt ?? 0) - (a.createdAt ?? 0);
      return b.upvotes - a.upvotes;
    });

  return (
    <ScreenShell>
      <StickyHeader
        title={t("community")}
        showLanguagePill
        rightAction={
          <Button variant="amber" className="h-9 text-xs px-3" onClick={() => navigate("/community/new")}>
            {t("askAQuestion")}
          </Button>
        }
      />
      <div className="px-6 pt-4 pb-6">
        <div className="flex border-b border-border">
          {TABS.map((x) => (
            <button
              key={x}
              onClick={() => setTab(x)}
              className={cn(
                "flex-1 py-2.5 text-xs font-medium",
                tab === x ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
              )}
            >
              {t(x as never)}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-6 px-6 mt-3 pb-2">
          {CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "ls-chip whitespace-nowrap text-xs tap",
                cat === c && "bg-primary text-primary-foreground border-primary"
              )}
            >
              {t(c as never)}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-12">{t("emptyState")}</p>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/community/${p.id}`)}
                className={cn("w-full text-left ls-card p-4 tap", p.pinned && "border-accent/40 bg-accent/5")}
              >
                <div className="flex items-center gap-2 text-[10px] font-semibold">
                  <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary">{p.category}</span>
                  {p.pinned && <span className="inline-flex items-center gap-1 text-accent"><Pin size={10} /> Pinned</span>}
                  {p.myPost && <span className="px-2 py-0.5 rounded-md bg-success/10 text-success">Mine</span>}
                </div>
                <h3 className="font-display font-semibold text-sm mt-2 leading-tight">{p.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-snug line-clamp-2">{p.excerpt}</p>
                {p.verifiedAnswer && (
                  <p className="text-[11px] text-success inline-flex items-center gap-1 mt-2">
                    <ShieldCheck size={12} /> {t("verifiedAnswer")} · {p.verifiedAnswer.lawyer}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><ArrowUp size={12} /> {p.upvotes + (p.upvoted ? 1 : 0)}</span>
                  <span className="inline-flex items-center gap-1"><MessageCircle size={12} /> {p.comments + (p.replies?.length ?? 0)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </ScreenShell>
  );
};

export default Community;
