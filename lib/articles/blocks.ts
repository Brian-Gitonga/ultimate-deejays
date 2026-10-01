/*
 * Article bodies are plain data, rendered by components/article-body.tsx.
 * Text supports two inline marks: **bold** and [link text](/path).
 */
export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "tip"; title: string; text: string }
  | { type: "quote"; text: string; cite?: string };

export type Article = {
  /** One or two sentences: the article's standfirst, card search text and meta description */
  excerpt: string;
  body: Block[];
};

export const p = (text: string): Block => ({ type: "p", text });
export const h2 = (text: string): Block => ({ type: "h2", text });
export const h3 = (text: string): Block => ({ type: "h3", text });
export const ul = (...items: string[]): Block => ({ type: "ul", items });
export const ol = (...items: string[]): Block => ({ type: "ol", items });
export const tip = (title: string, text: string): Block => ({ type: "tip", title, text });
export const quote = (text: string, cite?: string): Block => ({ type: "quote", text, cite });
