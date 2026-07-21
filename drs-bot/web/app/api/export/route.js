import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

const ACCENT = 'FF0E7C66';       // Recykal teal
const ACCENT_SOFT = 'FFE1F0EB';
const FUNNEL_FILL = {
  Branding: 'FFDBEAFE',
  Acquisition: 'FFDCFCE7',
  Engagement: 'FFFDE9DC',
};

function styleHeaderRow(row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ACCENT } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFBFD9D1' } } };
  });
  row.height = 22;
}

export async function POST(req) {
  try {
    const { meta = {}, contentCalendar = [], campaignCalendar = [], moments = [] } = await req.json();
    const wb = new ExcelJS.Workbook();
    wb.creator = 'DRS Bot — Recykal';

    // ---- Tab 1: Task Calendar (grouped by campaign) ----
    const ws = wb.addWorksheet('Task Calendar', { views: [{ state: 'frozen', ySplit: 2 }] });
    const cols = [
      { header: 'Week', width: 18 },
      { header: 'Funnel', width: 13 },
      { header: 'Channel', width: 12 },
      { header: 'Format', width: 14 },
      { header: 'Hook', width: 48 },
      { header: 'Objective', width: 14 },
      { header: 'Owner', width: 18 },
      { header: 'Skill Required', width: 24 },
      { header: 'Assignee', width: 18 },
      { header: 'Executor', width: 20 },
    ];
    const nCols = cols.length;

    const title = ws.addRow([`${meta.project || 'DRS Campaign Plan'}${meta.geography ? ' · ' + meta.geography : ''}${meta.date ? ' · ' + meta.date : ''}`]);
    ws.mergeCells(1, 1, 1, nCols);
    title.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF14201D' } };
    title.height = 26;

    const header = ws.addRow(cols.map((c) => c.header));
    cols.forEach((c, i) => { ws.getColumn(i + 1).width = c.width; });
    styleHeaderRow(header);

    const rowsFor = (campName) => contentCalendar.filter((t) => (t.campaign || '') === campName);
    const named = campaignCalendar.length ? campaignCalendar : [...new Set(contentCalendar.map((t) => t.campaign).filter(Boolean))].map((c) => ({ campaign: c }));
    const seen = new Set();

    const addTaskRow = (t) => {
      const r = ws.addRow(['   ' + (t.week || ''), t.funnel || '', t.channel || '', t.format || '', t.hook || '', t.objective || '', t.owner || '', Array.isArray(t.requiredSkills) ? t.requiredSkills.join(', ') : (t.requiredSkills || ''), t.assignee || '', t.executor || '']);
      r.alignment = { vertical: 'top', wrapText: true };
      const fill = FUNNEL_FILL[t.funnel];
      if (fill) r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
    };

    const addGroupRow = (label) => {
      const g = ws.addRow([label]);
      ws.mergeCells(g.number, 1, g.number, nCols);
      g.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF0E7C66' } };
      g.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ACCENT_SOFT } };
      g.height = 20;
    };

    named.forEach((c) => {
      const label = c.campaign + (c.window ? `  (${c.window})` : '') + (c.objective ? `  — ${c.objective}` : '');
      addGroupRow(label);
      seen.add(c.campaign);
      rowsFor(c.campaign).forEach(addTaskRow);
    });
    // Any tasks whose campaign wasn't listed
    const orphans = contentCalendar.filter((t) => !seen.has(t.campaign || ''));
    if (orphans.length) { addGroupRow('Other tasks'); orphans.forEach(addTaskRow); }

    // ---- Tab 2: Campaigns ----
    if (campaignCalendar.length) {
      const cs = wb.addWorksheet('Campaigns', { views: [{ state: 'frozen', ySplit: 1 }] });
      const ch = cs.addRow(['Campaign', 'Funnel', 'Objective', 'Window', 'Audience', 'Channels', 'Moment', 'KPI']);
      [26, 13, 34, 16, 22, 20, 22, 24].forEach((w, i) => { cs.getColumn(i + 1).width = w; });
      styleHeaderRow(ch);
      campaignCalendar.forEach((c) => {
        const r = cs.addRow([c.campaign || '', c.funnel || '', c.objective || '', c.window || '', c.audience || '', c.channels || '', c.moment || '', c.kpi || '']);
        r.alignment = { vertical: 'top', wrapText: true };
        const fill = FUNNEL_FILL[c.funnel];
        if (fill) r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
      });
    }

    // ---- Tab 3: Moments ----
    if (moments.length) {
      const ms = wb.addWorksheet('Moments', { views: [{ state: 'frozen', ySplit: 1 }] });
      const mh = ms.addRow(['Moment', 'When', 'Why it matters', 'Angle']);
      [26, 20, 50, 50].forEach((w, i) => { ms.getColumn(i + 1).width = w; });
      styleHeaderRow(mh);
      moments.forEach((m) => {
        const r = ms.addRow([m.moment || '', m.dates || '', m.why || '', m.angle || '']);
        r.alignment = { vertical: 'top', wrapText: true };
      });
    }

    const buf = await wb.xlsx.writeBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${(meta.filename || 'DRS-Plan')}.xlsx"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
