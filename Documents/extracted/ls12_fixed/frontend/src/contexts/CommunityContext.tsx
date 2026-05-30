import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { COMMUNITY_POSTS, type CommunityPost } from "@/data/community";

export interface Reply {
  id: string;
  author: string;
  body: string;
  createdAt: number;
  parentId?: string | null;
  likes: number;
}

export interface PostWithMeta extends CommunityPost {
  upvoted?: boolean;
  myPost?: boolean;
  replies?: Reply[];
  createdAt?: number;
}

interface Ctx {
  posts: PostWithMeta[];
  byId: (id: string) => PostWithMeta | undefined;
  addPost: (p: { title: string; excerpt: string; category: string }) => PostWithMeta;
  toggleUpvote: (id: string) => void;
  addReply: (postId: string, body: string, parentId?: string | null) => void;
  toggleReplyLike: (postId: string, replyId: string) => void;
  isReplyLiked: (replyId: string) => boolean;
}

const KEY = "ls.community.v2";

interface Stored {
  custom: PostWithMeta[];
  upvotes: string[];
  replies: Record<string, Reply[]>;
  likedReplies: string[];
}

const empty = (): Stored => ({ custom: [], upvotes: [], replies: {}, likedReplies: [] });

const safeGet = (): Stored => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) };
  } catch { return empty(); }
};
const safeSet = (v: Stored) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* no-op */ } };

const CommunityContext = createContext<Ctx | undefined>(undefined);

export const CommunityProvider = ({ children }: { children: ReactNode }) => {
  const [stored, setStored] = useState<Stored>(() => safeGet());

  useEffect(() => { safeSet(stored); }, [stored]);

  const posts = useMemo<PostWithMeta[]>(() => {
    const all: PostWithMeta[] = [...stored.custom, ...COMMUNITY_POSTS];
    return all.map((p) => ({
      ...p,
      upvoted: stored.upvotes.includes(p.id),
      replies: stored.replies[p.id] ?? [],
    }));
  }, [stored]);

  const byId = useCallback((id: string) => posts.find((p) => p.id === id), [posts]);

  const addPost: Ctx["addPost"] = useCallback((p) => {
    const item: PostWithMeta = {
      id: `q_${Date.now().toString(36)}`,
      category: p.category,
      title: p.title,
      excerpt: p.excerpt,
      tags: [p.category],
      upvotes: 0,
      comments: 0,
      myPost: true,
      createdAt: Date.now(),
    };
    setStored((s) => ({ ...s, custom: [item, ...s.custom] }));
    return item;
  }, []);

  const toggleUpvote = useCallback((id: string) => {
    setStored((s) => {
      const has = s.upvotes.includes(id);
      return { ...s, upvotes: has ? s.upvotes.filter((x) => x !== id) : [...s.upvotes, id] };
    });
  }, []);

  const addReply = useCallback((postId: string, body: string, parentId: string | null = null) => {
    if (!body.trim()) return;
    const r: Reply = {
      id: `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      author: "You",
      body: body.trim(),
      createdAt: Date.now(),
      parentId,
      likes: 0,
    };
    setStored((s) => ({ ...s, replies: { ...s.replies, [postId]: [...(s.replies[postId] ?? []), r] } }));
  }, []);

  const toggleReplyLike = useCallback((postId: string, replyId: string) => {
    setStored((s) => {
      const liked = s.likedReplies.includes(replyId);
      const replies = (s.replies[postId] ?? []).map((r) =>
        r.id === replyId ? { ...r, likes: Math.max(0, r.likes + (liked ? -1 : 1)) } : r
      );
      return {
        ...s,
        replies: { ...s.replies, [postId]: replies },
        likedReplies: liked ? s.likedReplies.filter((x) => x !== replyId) : [...s.likedReplies, replyId],
      };
    });
  }, []);

  const isReplyLiked = useCallback((replyId: string) => stored.likedReplies.includes(replyId), [stored.likedReplies]);

  const value = useMemo<Ctx>(
    () => ({ posts, byId, addPost, toggleUpvote, addReply, toggleReplyLike, isReplyLiked }),
    [posts, byId, addPost, toggleUpvote, addReply, toggleReplyLike, isReplyLiked]
  );
  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>;
};

export const useCommunity = () => {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error("useCommunity must be used within CommunityProvider");
  return ctx;
};
