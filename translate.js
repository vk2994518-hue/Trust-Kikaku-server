import axios from 'axios';

const deeplKey = process.env.DEEPL_API_KEY;

export async function translatePair(text, fromLang) {
  const safe = (text || '').slice(0, 2000);
  if (!safe) return { en: '', ja: '' };

  if (deeplKey) {
    try {
      if (fromLang === 'ja') {
        const { data } = await axios.post('https://api-free.deepl.com/v2/translate', null, {
          params: { auth_key: deeplKey, text: safe, target_lang: 'EN' }
        });
        const en = data?.translations?.[0]?.text || '';
        return { en, ja: safe };
      } else {
        const { data } = await axios.post('https://api-free.deepl.com/v2/translate', null, {
          params: { auth_key: deeplKey, text: safe, target_lang: 'JA' }
        });
        const ja = data?.translations?.[0]?.text || '';
        return { en: safe, ja };
      }
    } catch (e) { /* ignore */ }
  }

  return { en: safe, ja: safe };
}
