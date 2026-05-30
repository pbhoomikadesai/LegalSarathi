import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowUp, Heart, MessageCircle, Send, ShieldCheck } from "lucide-react";
import { ScreenShell } from "@desktop/components/layout/ScreenShell";
import { StickyHeader } from "@desktop/components/layout/StickyHeader";
import { Button } from "@desktop/components/common/Button";
import { useLanguage } from "@desktop/contexts/LanguageContext";
import { useCommunity, type Reply } from "@desktop/contexts/CommunityContext";
import { useGuest } from "@desktop/contexts/GuestContext";
import { cn } from "@desktop/lib/utils";

const CommunityPostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { byId, toggleUpvote, addReply, toggleReplyLike, isReplyLiked } = useCommunity();
  const { tryConsume } = useGuest();
  const [body, setBody] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string } | null>(null);
  const [replyBody, setReplyBody] = useState("");

  const post = id ? byId(id) : undefined;

  const tree = useMemo(() => {
    if (!post?.replies) return [] as Array<Reply & { children: Reply[] }>;
    const roots = post.replies.filter((r) => !r.parentId);
    return roots.map((r) => ({
      ...r,
      children: post.replies!.filter((c) => c.parentId === r.id),
    }));
  }, [post]);

  if (!post) {
    return (
      <ScreenShell>
        <StickyHeader title={t("community")} showBack />
        <div className="p-6 text-sm text-muted-foreground">Not found.</div>
      </ScreenShell>
    );
  }

  const handleTopReply = () => {
    if (!body.trim()) return;
    if (!tryConsume()) return;
    addReply(post.id, body, null);
    setBody("");
  };

  const handleNestedReply = () => {
    if (!replyingTo || !replyBody.trim()) return;
    if (!tryConsume()) return;
    addReply(post.id, replyBody, replyingTo.id);
    setReplyBody("");
    setReplyingTo(null);
  };

  const ReplyCard = ({ r, nested = false }: { r: Reply; nested?: boolean }) => {
    const liked = isReplyLiked(r.id);
    return (
      <div className={cn("ls-card p-3", nested && "ml-6 border-l-2 border-l-primary/30")}>
        <p className="text-xs font-semibold">{r.author}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.body}</p>
        <div className="mt-2 flex items-center gap-3 text-[11px]">
          <button
            onClick={() => toggleReplyLike(post.id, r.id)}
            className={cn(
              "inline-flex items-center gap-1 tap",
              liked ? "text-destructive" : "text-muted-foreground"
            )}
          >
            <Heart size={12} className={cn(liked && "fill-current")} /> {r.likes}
          </button>
          {!nested && (
            <button
              onClick={() => { setReplyingTo({ id: r.id, author: r.author }); setReplyBody(""); }}
              className="text-muted-foreground hover:text-primary tap"
            >
              {t("reply")}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <ScreenShell>
      <StickyHeader title={post.category} showBack showLanguagePill />
      <div className="px-8 pt-6 pb-6 max-w-3xl">
        <article className="ls-card p-4">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary">{post.category}</span>
          <h1 className="font-display font-bold text-lg mt-2 leading-tight">{post.title}</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{post.excerpt}</p>

          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border text-xs">
            <button
              onClick={() => toggleUpvote(post.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border tap",
                post.upvoted ? "bg-primary text-primary-foreground border-primary" : "border-border"
              )}
            >
              <ArrowUp size={13} /> {post.upvotes + (post.upvoted ? 1 : 0)}
            </button>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <MessageCircle size={13} /> {(post.replies?.length ?? 0) + post.comments}
            </span>
          </div>
        </article>

        {post.verifiedAnswer && (
          <div className="ls-card p-4 mt-4 border-l-4 border-l-success">
            <p className="text-[11px] text-success inline-flex items-center gap-1 font-semibold">
              <ShieldCheck size={12} /> {t("verifiedAnswer")} · {post.verifiedAnswer.lawyer}
            </p>
            <p className="text-sm mt-2 leading-relaxed">
              Based on the Indian Contract Act, you have a strong case. File a written notice first, then approach Small Causes Court if there is no response within 15 days.
            </p>
          </div>
        )}

        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-5 mb-2">{t("comments")}</h2>
        <div className="space-y-3">
          {tree.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No comments yet. Be the first to reply.</p>
          )}
          {tree.map((r) => (
            <div key={r.id} className="space-y-2">
              <ReplyCard r={r} />
              {r.children.map((c) => <ReplyCard key={c.id} r={c} nested />)}
              {replyingTo?.id === r.id && (
                <div className="ml-6 ls-card p-2 flex items-center gap-2">
                  <input
                    autoFocus
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder={t("writeReply")}
                    className="flex-1 h-9 px-2 text-xs bg-transparent outline-none"
                  />
                  <button onClick={() => setReplyingTo(null)} className="text-[11px] text-muted-foreground px-2 tap">
                    {t("cancelReply")}
                  </button>
                  <button
                    onClick={handleNestedReply}
                    disabled={!replyBody.trim()}
                    className="h-8 px-3 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold tap disabled:opacity-40"
                  >
                    {t("reply")}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 bg-card border-t border-border">
        <div className="px-8 py-3 flex items-center gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("writeAnAnswer")}
            className="flex-1 h-11 px-3 rounded-button border border-border bg-card text-sm outline-none focus:border-primary"
          />
          <Button leftIcon={<Send size={14} />} onClick={handleTopReply} disabled={!body.trim()} className="h-11 px-4 text-xs">
            {t("send")}
          </Button>
        </div>
      </div>
    </ScreenShell>
  );
};

export default CommunityPostDetail;
