import i18n from '@/core/i18n/index.ts'
import { escapeHtml } from '@/shared/reports/reportTheme.ts'
import type { ReportDocument } from '@/shared/reports/types.ts'

export function buildPdfHtml(document: ReportDocument, options: { forFile?: boolean } = {}): string {
  const isRtl = document.language === 'ar'
  const dir = isRtl ? 'rtl' : 'ltr'
  const align = isRtl ? 'right' : 'left'
  const accentAngle = isRtl ? '270deg' : '90deg'
  const font = options.forFile
    ? "Tahoma, 'Segoe UI', Arial, sans-serif"
    : isRtl
      ? "'IBM Plex Sans Arabic', 'IBM Plex Sans', sans-serif"
      : "'IBM Plex Sans', 'IBM Plex Sans Arabic', sans-serif"
  const recordTotal = document.sections.reduce((sum, section) => sum + (section.table?.rows.length ?? 0), 0)

  const filtersHtml =
    document.filters.length > 0
      ? `<section class="panel">
          <div class="panel__head">
            <span class="mark"></span>
            <h2>${escapeHtml(i18n.t('reports.filters'))}</h2>
          </div>
          <div class="chips">${document.filters
            .map(
              (filter) => `<span class="chip"><em>${escapeHtml(filter.label)}</em>${escapeHtml(filter.value)}</span>`,
            )
            .join('')}</div>
        </section>`
      : ''

  const sectionsHtml = document.sections
    .map((section) => {
      const metricsHtml =
        section.metrics && section.metrics.length > 0
          ? `<div class="metrics">${section.metrics
              .map(
                (metric) => `<article class="metric">
                  <span>${escapeHtml(metric.label)}</span>
                  <strong>${escapeHtml(metric.value)}</strong>
                  ${metric.hint ? `<small>${escapeHtml(metric.hint)}</small>` : ''}
                </article>`,
              )
              .join('')}</div>`
          : ''

      const table = section.table
      const tableHtml = table
        ? table.rows.length === 0
          ? `<p class="empty">${escapeHtml(i18n.t('reports.noData'))}</p>`
          : `<div class="table-meta">
               <span>${escapeHtml(i18n.t('reports.recordCount', { count: table.rows.length }))}</span>
             </div>
             <div class="table-wrap">
               <table>
                 <thead>
                   <tr>
                     <th class="num">${escapeHtml(i18n.t('reports.rowNumber'))}</th>
                     ${table.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}
                   </tr>
                 </thead>
                 <tbody>
                   ${table.rows
                     .map(
                       (row, index) => `<tr>
                         <td class="num">${index + 1}</td>
                         ${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}
                       </tr>`,
                     )
                     .join('')}
                 </tbody>
               </table>
             </div>`
        : ''

      return `<section class="panel">
        <div class="panel__head">
          <span class="mark"></span>
          <h2>${escapeHtml(section.title)}</h2>
        </div>
        ${metricsHtml}
        ${tableHtml}
      </section>`
    })
    .join('')

  return `<!doctype html>
<html lang="${document.language}" dir="${dir}">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(document.title)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      html, body { margin: 0; background: ${options.forFile ? '#fff' : '#efeaf6'}; direction: ${dir}; }
      body {
        color: #1c1633;
        font-family: ${font};
        font-size: 13px;
        line-height: 1.55;
        letter-spacing: 0;
        word-spacing: normal;
        font-kerning: none;
        font-variant-ligatures: none;
        text-align: ${align};
      }
      .is-file, .is-file * {
        letter-spacing: 0 !important;
        word-spacing: normal !important;
        font-kerning: none !important;
        font-variant-ligatures: none !important;
        text-rendering: geometricPrecision;
      }
      .toolbar {
        position: sticky;
        top: 0;
        z-index: 2;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 10px 20px;
        background: #fff;
        border-bottom: 1px solid #e0daea;
      }
      .toolbar p { margin: 0; color: #6b647c; font-size: 12px; }
      .toolbar button {
        min-height: 36px;
        padding: 0 16px;
        border: 0;
        border-radius: 9px;
        background: #1c1633;
        color: #fff;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }
      .sheet {
        width: ${options.forFile ? '718px' : 'min(1100px, calc(100% - 32px))'};
        margin: ${options.forFile ? '0' : '20px auto 36px'};
        background: #fff;
        border: 1px solid #e0daea;
        box-shadow: ${options.forFile ? 'none' : '0 18px 40px rgb(28 22 51 / 8%)'};
      }
      .masthead {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 16px;
        padding: ${options.forFile ? '16px 14px 14px' : '22px 28px 20px'};
        background: #27155e;
        color: #f3eeff;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .logo {
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        border-radius: 11px;
        background: linear-gradient(135deg, #ffd36a, #ffb020);
        color: #1c1633;
        font-weight: 700;
      }
      .brand small {
        display: block;
        color: #d0c4ea;
        font-size: 11px;
        text-transform: uppercase;
      }
      .brand strong { font-size: 16px; }
      .accent { height: 4px; background: linear-gradient(${accentAngle}, #ffd36a, #ffb020); }
      .intro { padding: ${options.forFile ? '16px 14px 6px' : '24px 28px 8px'}; }
      h1 {
        margin: 0 0 6px;
        font-size: ${options.forFile ? '22px' : '28px'};
        line-height: 1.25;
      }
      .subtitle { margin: 0 0 16px; color: #6b647c; max-width: 70ch; }
      .meta {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }
      .meta div {
        padding: 10px 12px;
        border: 1px solid #e0daea;
        border-radius: 10px;
        background: #f8f5fc;
      }
      .meta span, .meta small { display: block; color: #6b647c; font-size: 11px; }
      .meta strong { display: block; margin-top: 3px; font-size: 14px; }
      .panel { padding: ${options.forFile ? '6px 14px 14px' : '8px 28px 22px'}; }
      .panel__head {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 10px 0 12px;
      }
      .mark {
        width: 8px;
        height: 8px;
        border-radius: 2px;
        background: #ffb020;
      }
      h2 { margin: 0; font-size: 15px; }
      .chips { display: flex; flex-wrap: wrap; gap: 8px; }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border: 1px solid #e0daea;
        border-radius: 999px;
        background: #fff;
        font-size: 12px;
      }
      .chip em { color: #6b647c; font-style: normal; font-weight: 600; }
      .metrics {
        display: grid;
        grid-template-columns: repeat(${options.forFile ? 2 : 4}, minmax(0, 1fr));
        gap: 10px;
      }
      .metric {
        padding: 12px 14px;
        border: 1px solid #e0daea;
        border-inline-start: 3px solid #ffb020;
        border-radius: 10px;
        background: #fff;
      }
      .metric span, .metric small { display: block; color: #6b647c; font-size: 11px; }
      .metric strong { display: block; margin: 5px 0 2px; font-size: 20px; }
      .table-meta { margin: 4px 0 8px; color: #6b647c; font-size: 12px; }
      .table-wrap {
        overflow: visible;
        border: 1px solid #e0daea;
        border-radius: 10px;
      }
      table {
        width: 100%;
        table-layout: fixed;
        border-collapse: collapse;
        direction: ${dir};
      }
      th, td {
        padding: ${options.forFile ? '8px 6px' : '9px 10px'};
        border-bottom: 1px solid #eee8f5;
        text-align: ${align};
        vertical-align: top;
        overflow-wrap: break-word;
        word-break: normal;
        white-space: normal;
      }
      th {
        background: #27155e;
        color: #f3eeff;
        font-size: ${options.forFile ? '10px' : '11px'};
        font-weight: 600;
        line-height: 1.35;
      }
      td { font-size: ${options.forFile ? '10px' : '13px'}; line-height: 1.4; }
      tbody tr:nth-child(even) { background: #f7f4fc; }
      tbody tr:last-child td { border-bottom: 0; }
      .num { width: ${options.forFile ? '28px' : '44px'}; color: #6b647c; font-variant-numeric: tabular-nums; text-align: center; }
      th.num { color: #d0c4ea; }
      .empty {
        margin: 0;
        padding: 16px;
        border: 1px dashed #e0daea;
        border-radius: 10px;
        color: #6b647c;
        text-align: center;
      }
      .colophon {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: ${options.forFile ? '12px 14px 14px' : '14px 28px 18px'};
        border-top: 1px solid #efeaf6;
        color: #6b647c;
        font-size: 11px;
      }
      @media (max-width: 800px) {
        .meta, .metrics { grid-template-columns: 1fr 1fr; }
      }
      @page { size: A4 portrait; margin: 10mm; }
      @media print {
        html, body { background: #fff; }
        .toolbar { display: none; }
        .sheet {
          width: auto;
          margin: 0;
          border: 0;
          box-shadow: none;
        }
        .panel, .intro, .masthead, .colophon { padding-inline: 0; }
        .table-wrap { overflow: visible; }
        thead { display: table-header-group; }
        tr { break-inside: avoid; }
      }
    </style>
  </head>
  <body dir="${dir}" class="${options.forFile ? 'is-file' : ''}">
    ${
      options.forFile
        ? ''
        : `<div class="toolbar">
      <p>${escapeHtml(i18n.t('reports.printHint'))}</p>
      <button type="button" onclick="window.print()">${escapeHtml(i18n.t('reports.downloadPdf'))}</button>
    </div>`
    }
    <article class="sheet${options.forFile ? ' is-file' : ''}" dir="${dir}">
      <header class="masthead">
        <div class="brand">
          <div class="logo">MZ</div>
          <div>
            <small>${escapeHtml(document.portal)}</small>
            <strong>${escapeHtml(document.appName)}</strong>
          </div>
        </div>
      </header>
      <div class="accent"></div>
      <section class="intro">
        <h1>${escapeHtml(document.title)}</h1>
        ${document.subtitle ? `<p class="subtitle">${escapeHtml(document.subtitle)}</p>` : ''}
        <div class="meta">
          <div>
            <span>${escapeHtml(i18n.t('reports.generatedAt'))}</span>
            <strong>${escapeHtml(document.generatedAt)}</strong>
          </div>
          <div>
            <span>${escapeHtml(i18n.t('common.language'))}</span>
            <strong>${escapeHtml(document.languageLabel)}</strong>
          </div>
          <div>
            <span>${escapeHtml(i18n.t('common.results'))}</span>
            <strong>${escapeHtml(i18n.t('reports.recordCount', { count: recordTotal }))}</strong>
          </div>
        </div>
      </section>
      ${filtersHtml}
      ${sectionsHtml}
      <footer class="colophon">
        <span>${escapeHtml(i18n.t('reports.footer'))}</span>
        <span>${escapeHtml(document.appName)} · ${escapeHtml(document.generatedAt)}</span>
      </footer>
    </article>
  </body>
</html>`
}

export function buildPdfCaptureHtml(document: ReportDocument): string {
  const full = buildPdfHtml(document, { forFile: true })
  const styleStart = full.indexOf('<style>')
  const styleEnd = full.indexOf('</style>')
  const articleStart = full.indexOf('<article')
  const articleEnd = full.lastIndexOf('</article>')
  const rawCss = styleStart >= 0 && styleEnd > styleStart ? full.slice(styleStart + '<style>'.length, styleEnd) : ''
  const scopedCss = `@scope ([data-mz-pdf-host]) {
    ${rawCss.replaceAll('html, body', ':scope').replaceAll('body {', ':scope {').replace(/@page[\s\S]*$/, '')}
  }`
  const article =
    articleStart >= 0 && articleEnd > articleStart ? full.slice(articleStart, articleEnd + '</article>'.length) : full
  return `<style>
    [data-mz-pdf-host],
    [data-mz-pdf-host] * {
      letter-spacing: 0 !important;
      word-spacing: normal !important;
      font-kerning: none !important;
      font-variant-ligatures: none !important;
    }
    ${scopedCss}
  </style>${article}`
}
