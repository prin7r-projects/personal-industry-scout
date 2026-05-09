export interface ParsedSource {
  url: string;
  title?: string;
  description?: string;
  content?: string;
  author?: string;
  publishedAt?: string;
  modifiedAt?: string;
  categories?: string[];
  guid?: string;
  sourceType: string;
  sourceUrl: string;
}
