import axios from 'axios';

const googleKey = process.env.GOOGLE_API_KEY;
const cseId = process.env.GOOGLE_CSE_ID;

const preferredDomains = (process.env.PREFERRED_DOMAINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

export async function searchWeb(q, mode) {
  if (!googleKey || !cseId) throw new Error('Google Custom Search env missing');

  const qParts = [];
  if (mode === 'number') {
    qParts.push(`"${q}"`);
    qParts.push('parts');
  } else {
    qParts.push(q);
    qParts.push('part number');
  }
  const query = qParts.join(' ');

  const url = 'https://www.googleapis.com/customsearch/v1';
  const { data } = await axios.get(url, {
    params: {
      key: googleKey,
      cx: cseId,
      q: query,
      num: 10,
      lr: 'lang_en,lang_ja'
    }
  });

  const items = (data.items || []).map(it => ({
    title: it.title,
    snippet: it.snippet,
    link: it.link,
    displayLink: it.displayLink
  }));

  items.sort((a, b) => {
    const aScore = preferredDomains.some(d => a.displayLink?.includes(d)) ? 1 : 0;
    const bScore = preferredDomains.some(d => b.displayLink?.includes(d)) ? 1 : 0;
    return bScore - aScore;
  });

  return items;
}
