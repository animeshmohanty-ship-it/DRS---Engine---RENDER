import { NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

export const dynamic = 'force-dynamic';

// Resolve the same Google Cloud service account used by Vertex.
function resolveAuthOptions() {
  const jsonContents = process.env.GCP_CREDENTIALS_JSON;
  if (jsonContents && jsonContents.trim().startsWith('{')) {
    return { credentials: JSON.parse(jsonContents) };
  }
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyFile) return { keyFile };
  throw new Error('GCP credentials missing (set GCP_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS)');
}

export async function POST(req) {
  try {
    const { text, voice, languageCode } = await req.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ ok: false, error: 'text is required' }, { status: 400 });
    }

    const auth = new GoogleAuth({ ...resolveAuthOptions(), scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const client = await auth.getClient();
    const token = (await client.getAccessToken()).token;

    const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: String(text).slice(0, 4500) }, // TTS hard limit ~5000 chars
        voice: { languageCode: languageCode || 'en-IN', name: voice || 'en-IN-Neural2-B' },
        audioConfig: { audioEncoding: 'MP3' },
      }),
    });
    const j = await res.json();
    if (!res.ok || !j.audioContent) {
      return NextResponse.json({ ok: false, error: j.error?.message || 'TTS synthesis failed' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, audioContent: j.audioContent });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
