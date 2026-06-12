import { google } from 'googleapis';
import { loadServiceAccountCredentials } from './_lib/calendar.js';

/*
    Collects questions the FAQ bot couldn't answer in a Google Sheet, so they
    can be reviewed and turned into new knowledge-base entries
    (src/data/faqKnowledge.js). Fire-and-forget from the client.

    Setup (see docs/context/integrations.md):
    - Google Sheets API enabled in the same Cloud project as the calendar bot
    - the sheet shared with the service-account email as editor
    - FAQ_LOG_SHEET_ID env var on Vercel = the sheet's ID (from its URL)

    No visitor identity is stored — just timestamp and question text.
*/

const MAX_QUESTION_LENGTH = 300;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sheetId = process.env.FAQ_LOG_SHEET_ID;
  if (!sheetId) {
    return res.status(503).json({ error: 'faq_log_not_configured' });
  }

  const q = typeof req.body?.q === 'string' ? req.body.q.trim() : '';
  if (q.length < 2) {
    return res.status(400).json({ error: 'Missing question.' });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: loadServiceAccountCredentials(),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    const timestamp = new Intl.DateTimeFormat('de-AT', {
      timeZone: 'Europe/Vienna', dateStyle: 'medium', timeStyle: 'short',
    }).format(new Date());

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'A:B',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [[timestamp, q.slice(0, MAX_QUESTION_LENGTH)]] },
    });

    return res.status(204).end();
  } catch (error) {
    console.error('FAQ log error:', error);
    return res.status(500).json({ error: 'faq_log_failed' });
  }
}
