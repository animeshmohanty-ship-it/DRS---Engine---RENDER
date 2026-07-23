import { NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import * as vertex from '../../../lib/llm/vertex.js';

export const dynamic = 'force-dynamic';

// Above this many characters we summarize the doc into a dense brief so it
// never blows the token budget when injected into every stage prompt.
const SUMMARY_THRESHOLD = 12000;
const HARD_CAP = 60000; // never store more raw text than this

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ ok: false, error: 'No file uploaded' }, { status: 400 });
    }

    const filename = file.name || 'document.pdf';
    if (!/\.pdf$/i.test(filename)) {
      return NextResponse.json({ ok: false, error: 'Only PDF files are supported for now' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // ---- Extract text ----
    let rawText = '';
    try {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      rawText = (result?.text || '').replace(/\s+\n/g, '\n').trim();
    } catch (e) {
      return NextResponse.json({ ok: false, error: `Could not read PDF: ${e.message}` }, { status: 422 });
    }

    if (!rawText) {
      return NextResponse.json({ ok: false, error: 'This PDF has no extractable text (it may be a scanned image).' }, { status: 422 });
    }

    const fullChars = rawText.length;
    let brainText = rawText;
    let summarized = false;

    // ---- Auto-summarize big docs ----
    if (fullChars > SUMMARY_THRESHOLD) {
      try {
        const prompt = `You are condensing a source document so an AI marketing/strategy engine can use it as reference context for a Deposit Return System (DRS) campaign.
Produce a DENSE, factual brief of the document below. Preserve every concrete fact useful for planning: names, dates, deposit values, materials, targets, obligations, stakeholders, geographies, numbers, deadlines, and any rules or requirements. Drop boilerplate, legalese filler, and repetition. No preamble — just the brief, in tight bullet points grouped by theme.

DOCUMENT ("${filename}"):
${rawText.slice(0, HARD_CAP)}`;
        const { text } = await vertex.generateGrounded(prompt, { temperature: 0.1 });
        if (text && text.trim()) {
          brainText = text.trim();
          summarized = true;
        } else {
          brainText = rawText.slice(0, SUMMARY_THRESHOLD);
        }
      } catch (e) {
        // Summarization failed — fall back to a truncated slice so upload still succeeds.
        brainText = rawText.slice(0, SUMMARY_THRESHOLD);
        summarized = true;
      }
    }

    return NextResponse.json({
      ok: true,
      doc: {
        filename,
        text: brainText,
        fullChars,
        brainChars: brainText.length,
        summarized,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
