/**
 * Parses a CMS post body into the same structured blocks the guides are
 * authored in (see ./guides).
 *
 * The admin editor takes "Markdown-style plain text", which has to become
 * markup somewhere. That conversion happens here, into `GuideBlock[]`, rather
 * than into an HTML string — so a post renders through the same `GuideBody`
 * component as a guide, with the same typography, and there is still no
 * `dangerouslySetInnerHTML` anywhere in the editorial path. An author cannot
 * inject markup or script because no branch below ever produces either: every
 * line ends up as text inside an element this app chose.
 *
 * The supported syntax is deliberately small — the subset an author actually
 * uses, each mapping onto a block the renderer already knows how to draw.
 */
import type { GuideBlock } from "./guides";

/** A table row's cells: `| a | b |` with the outer pipes optional. */
function cells(line: string): string[] {
  return line
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

const isTableRow = (line: string) => line.includes("|");
/** The `|---|---|` rule separating a table's header from its body. */
const isTableRule = (line: string) => /^\s*\|?[\s:-]*-[\s|:-]*$/.test(line) && line.includes("-");

export function parsePostBody(content: string): GuideBlock[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: GuideBlock[] = [];

  // Consecutive lines of the same kind accumulate here and are flushed when
  // the kind changes or a blank line ends the run.
  let paragraph: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;
  let quote: string[] = [];
  let table: string[][] | null = null;

  const flush = () => {
    if (paragraph.length) {
      blocks.push({ type: "p", text: paragraph.join(" ") });
      paragraph = [];
    }
    if (list) {
      blocks.push({ type: list.type, items: list.items });
      list = null;
    }
    if (quote.length) {
      blocks.push({ type: "callout", text: quote.join(" ") });
      quote = [];
    }
    if (table) {
      const [headers, ...rows] = table;
      // A "table" of only a header row is really just a line of text.
      if (headers && rows.length) blocks.push({ type: "table", headers, rows });
      else if (headers) blocks.push({ type: "p", text: headers.join(" ") });
      table = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) {
      flush();
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      // Only two heading levels are rendered. `#` is folded into h2 because a
      // post body sits under the page's own h1 — a second h1 would compete
      // with it in the document outline.
      blocks.push({ type: heading[1].length >= 3 ? "h3" : "h2", text: heading[2].trim() });
      continue;
    }

    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line);
    if (bullet) {
      if (list?.type !== "ul") {
        flush();
        list = { type: "ul", items: [] };
      }
      list.items.push(bullet[1].trim());
      continue;
    }

    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (numbered) {
      if (list?.type !== "ol") {
        flush();
        list = { type: "ol", items: [] };
      }
      list.items.push(numbered[1].trim());
      continue;
    }

    const quoted = /^\s*>\s?(.*)$/.exec(line);
    if (quoted) {
      if (!quote.length) flush();
      quote.push(quoted[1].trim());
      continue;
    }

    if (isTableRow(line)) {
      if (!table) {
        flush();
        table = [];
      }
      // The `|---|` rule carries no content; it only marks where the header
      // ends, which this parser already knows from row order.
      if (!isTableRule(line)) table.push(cells(line));
      continue;
    }

    // Anything else is prose. Successive lines join into one paragraph, so a
    // soft-wrapped source line does not become its own stubby paragraph.
    if (list || quote.length || table) flush();
    paragraph.push(line.trim());
  }

  flush();
  return blocks;
}

/** Words per minute used for the reading estimate shown on a post. */
const WPM = 200;

export function readingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WPM));
}

/**
 * First paragraph of the body, for a post saved without an excerpt — better
 * than an empty card on the index or an empty meta description.
 */
export function excerptFrom(content: string, limit = 180): string {
  const first = parsePostBody(content).find((block) => block.type === "p");
  const text = first && "text" in first ? first.text : "";
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).replace(/\s+\S*$/, "")}…`;
}
