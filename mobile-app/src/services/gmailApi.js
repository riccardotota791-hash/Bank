const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

export async function listMessageIds(accessToken, query, maxResults = 20) {
  const url = `${GMAIL_BASE}/messages?maxResults=${maxResults}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Gmail list error: ${res.status}`);
  const data = await res.json();
  return data.messages || [];
}

export async function getMessage(accessToken, id) {
  const url = `${GMAIL_BASE}/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Gmail get error: ${res.status}`);
  const data = await res.json();
  const headers = Object.fromEntries((data.payload?.headers || []).map((h) => [h.name, h.value]));
  return {
    id: data.id,
    snippet: data.snippet || '',
    subject: headers.Subject || '',
    sender: headers.From || '',
    dateHeader: headers.Date || '',
  };
}

export function parseEmailDate(dateHeader) {
  const parsed = dateHeader ? new Date(dateHeader) : new Date();
  const valid = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  return valid.toISOString().slice(0, 10);
}
