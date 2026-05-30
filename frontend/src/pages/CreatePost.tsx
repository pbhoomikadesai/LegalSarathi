import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScreenShell } from "@/components/layout/ScreenShell";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { Button } from "@/components/common/Button";
import { TextField } from "@/components/common/TextField";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { useGuest } from "@/contexts/GuestContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Property", "Criminal", "Family", "Labour", "RTI", "Consumer"];

const CreatePost = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { addPost } = useCommunity();
  const { tryConsume } = useGuest();
  const { toast } = useToast();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const canSubmit = title.trim().length >= 8 && body.trim().length >= 12;

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (!tryConsume()) return;
    const p = addPost({ title: title.trim(), excerpt: body.trim(), category });
    toast({ title: t("postedAnonymously") });
    navigate(`/community/${p.id}`, { replace: true });
  };

  return (
    <ScreenShell>
      <StickyHeader title={t("askAQuestion")} showBack showLanguagePill />
      <div className="px-6 pt-4 pb-32 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 font-display">{t("pickCategory")}</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "ls-chip tap text-xs",
                  category === c && "bg-primary text-primary-foreground border-primary"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <TextField
          label={t("questionTitleLabel")}
          placeholder="Landlord refusing to refund deposit..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium mb-2 font-display">{t("questionDetailsLabel")}</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("caseDescPlaceholder")}
            rows={6}
            className="w-full px-4 py-3 rounded-button border border-border bg-card text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none"
          />
        </div>

        <p className="text-[11px] text-muted-foreground">{t("postedAnonymously")}</p>
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-card border-t border-border">
        <div className="max-w-md mx-auto px-4 py-3">
          <Button fullWidth disabled={!canSubmit} onClick={handleSubmit}>
            {t("postQuestion")}
          </Button>
        </div>
      </div>
    </ScreenShell>
  );
};

export default CreatePost;
