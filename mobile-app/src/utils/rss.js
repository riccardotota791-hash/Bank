// Parser RSS minimale via regex: evita di aggiungere una libreria XML pesante
// per un formato (RSS 2.0 <item>) che è sempre praticamente lo stesso.

function extractTag(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? cleanText(match[1]) : '';
}

function cleanText(raw) {
  let text = raw.trim();
  const cdataMatch = text.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  if (cdataMatch) text = cdataMatch[1];
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

export function parseRss(xmlText, sourceName) {
  const items = xmlText.match(/<item[\s\S]*?<\/item>/gi) || [];
  return items
    .map((itemXml) => {
      const title = extractTag(itemXml, 'title');
      const linkTagMatch = itemXml.match(/<link[^>]*href="([^"]+)"/i);
      const link = extractTag(itemXml, 'link') || (linkTagMatch ? linkTagMatch[1] : '');
      const pubDateRaw = extractTag(itemXml, 'pubDate') || extractTag(itemXml, 'dc:date') || extractTag(itemXml, 'published');
      const description = extractTag(itemXml, 'description') || extractTag(itemXml, 'summary');
      const parsedDate = pubDateRaw ? new Date(pubDateRaw) : new Date();
      return {
        title,
        link,
        description: description.slice(0, 220),
        source: sourceName,
        publishedAt: Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
      };
    })
    .filter((a) => a.title && a.link);
}
