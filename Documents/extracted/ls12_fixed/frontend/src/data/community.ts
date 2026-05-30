export interface CommunityPost {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  tags: string[];
  upvotes: number;
  comments: number;
  verifiedAnswer?: { lawyer: string };
  pinned?: boolean;
}

export const COMMUNITY_POSTS: CommunityPost[] = [];
