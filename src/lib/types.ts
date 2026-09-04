export type Bookmark = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  favicon_url: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type BookmarkInput = {
  url: string;
  title?: string;
  description?: string | null;
  favicon_url?: string | null;
  tags?: string[];
};