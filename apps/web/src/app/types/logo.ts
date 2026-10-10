export type Logo = {
  slug: string;
  name: string;
  aliases: string[];
  categories: string[];
  hex: string;
  url: string | null;
  svg: {
    icon: string;
    "icon-mono"?: string;
    wordmark?: string;
  };
};