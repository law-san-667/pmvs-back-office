export type ContentBlock =
  | { kind: "p"; text: string }
  | { kind: "li"; items: string[] };

export type ContentSection = {
  id: string;
  title: string;
  blocks: ContentBlock[];
};

export const CONTENT_LOCALES = ["fr", "en", "pt", "ar"] as const;
export type ContentLocale = (typeof CONTENT_LOCALES)[number];

export type PageTranslation = {
  locale: ContentLocale;
  title: string;
  summary: string | null;
  sections: ContentSection[];
  updatedAt: string;
};

export type AdminContentPage = {
  id: string;
  slug: string;
  kind: string;
  isPublished: boolean;
  sortOrder: number;
  updatedAt: string;
  translations: PageTranslation[];
};

export type SiteLink = { label: string; href: string };

export type SiteSettings = {
  contact: {
    legalName: string;
    tradeName: string;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
  };
  tagline?: string | null;
  socialLinks: SiteLink[];
  footerColumns: { title: string; links: SiteLink[] }[];
};

/**
 * Page text as admins type or paste it:
 *   ## Section title
 *   A paragraph (a blank line ends it).
 *   - a list item
 */
const slugify = (title: string) =>
  title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "section";

export const parseContent = (text: string): ContentSection[] => {
  const sections: ContentSection[] = [];
  const usedIds = new Set<string>();
  let paragraph: string[] = [];
  let list: string[] = [];

  const current = () => {
    if (!sections.length) {
      sections.push({ id: "introduction", title: "Introduction", blocks: [] });
      usedIds.add("introduction");
    }
    return sections[sections.length - 1];
  };
  const flush = () => {
    if (paragraph.length) {
      current().blocks.push({ kind: "p", text: paragraph.join("\n") });
      paragraph = [];
    }
    if (list.length) {
      current().blocks.push({ kind: "li", items: list });
      list = [];
    }
  };

  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (line.startsWith("## ")) {
      flush();
      const title = line.slice(3).trim();
      let id = slugify(title);
      for (let n = 2; usedIds.has(id); n++) id = `${slugify(title)}-${n}`;
      usedIds.add(id);
      sections.push({ id, title, blocks: [] });
    } else if (/^[-•*] /.test(line)) {
      if (paragraph.length) flush();
      list.push(line.slice(2).trim());
    } else if (!line) {
      flush();
    } else {
      if (list.length) flush();
      paragraph.push(line);
    }
  }
  flush();

  return sections.filter((section) => section.title || section.blocks.length);
};

export const serializeContent = (sections: ContentSection[]) =>
  sections
    .map((section) =>
      [
        `## ${section.title}`,
        ...section.blocks.map((block) =>
          block.kind === "p"
            ? block.text
            : block.items.map((item) => `- ${item}`).join("\n"),
        ),
      ].join("\n\n"),
    )
    .join("\n\n");
