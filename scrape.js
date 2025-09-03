import axios from 'axios';
import * as cheerio from 'cheerio';
import he from 'he';
import pLimit from 'p-limit';
import { guessLanguage, extractPartNumbers, cleanName } from '../utils/text.js';

const limit = pLimit(4);

export async function extractFromPages(searchResults, { query, mode }) {
  const top = searchResults.slice(0, 8);
  const tasks = top.map((r) => limit(async () => parsePage(r, { query, mode })));
  const all = (await Promise.allSettled(tasks))
    .flatMap(p => p.status === 'fulfilled' ? p.value : []);

  return all.filter(Boolean);
}

async function parsePage(item, { query, mode }) {
  try {
    const { data: html } = await axios.get(item.link, { timeout: 12000, headers: { 'User-Agent': 'Mozilla/5.0 TrustKikakuBot' } });
    const $ = cheerio.load(html);

    const title = $('title').text() || item.title || '';
    const text = $('body').text().replace(/\s+/g, ' ').slice(0, 20000);

    const numbers = extractPartNumbers(text, query);

    const h = $('h1, h2').map((_, el) => $(el).text()).get().join(' · ');
    const rawName = cleanName(he.decode((title + ' · ' + h).trim()));

    let enName = null, jaName = null;
    const lang = guessLanguage(rawName);
    if (lang === 'ja') {
      jaName = rawName;
    } else if (lang === 'en') {
      enName = rawName;
    }

    if (mode === 'number') {
      return [{
        source: item.link,
        domain: item.displayLink,
        partNumber: query,
        enName,
        jaName
      }];
    } else {
      return numbers.slice(0, 5).map(n => ({
        source: item.link,
        domain: item.displayLink,
        partNumber: n,
        enName,
        jaName
      }));
    }
  } catch {
    return [];
  }
}
