const escapeHtml = (value) => String(value ?? 'Not recorded').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not recorded' : date.toLocaleString('en-GB', {
    timeZone: 'Asia/Colombo', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

export const buildCompletedWarningHtml = (report) => {
  const metrics = report.metrics || {};
  const field = (label, value) => `<div><span class="label">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
  const row = (label, value) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(report.reportId)}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; color: #172033; background: white; font: 11pt/1.45 Arial, sans-serif; }
    .sheet { width: 190mm; height: 276mm; position: relative; overflow: hidden; }
    .content { transform-origin: top left; }
    header { border-bottom: 3px solid #1e3a8a; padding-bottom: 14px; }
    h1 { font-size: 17pt; margin: 0 0 4px; color: #1e3a8a; }
    .subtitle, .label { font-size: 9pt; color: #526079; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; padding: 18px 0; }
    .label { display: block; margin-bottom: 3px; }
    h2 { font-size: 12pt; color: #1e3a8a; margin: 18px 0 8px; }
    h3 { font-size: 14pt; margin: 6px 0; }
    p { margin: 6px 0 10px; white-space: pre-wrap; overflow-wrap: anywhere; }
    strong, td { overflow-wrap: anywhere; }
    table { width: 100%; border-collapse: collapse; }
    td { border: 1px solid #dbe1ea; padding: 9px 12px; }
    td:last-child { width: 32%; font-weight: bold; }
    section { break-inside: avoid; }
    footer { display: flex; justify-content: space-between; gap: 20px; margin-top: 34px; padding-top: 12px; border-top: 1px solid #cbd5e1; font-size: 10pt; }
  </style></head><body><main class="sheet"><article class="content">
    <header><h1>DISASTER MANAGEMENT CENTRE (DMC) SRI LANKA</h1><div class="subtitle">NATIONAL EMERGENCY OPERATIONS CENTRE | POST-EVENT SITUATION REPORT</div></header>
    <div class="meta">
      ${field('REPORT REFERENCE', report.reportId)}${field('AFFECTED DISTRICT', report.affectedDistrict)}
      ${field('AUTHORIZING OFFICER', report.officer)}${field('DISASTER TYPE', report.disasterType)}
      ${field('ISSUED (SLST)', formatDate(report.issuedAt))}${field('COMPLETED (SLST)', formatDate(report.completedAt))}
    </div>
    <section><h2>1. Disaster Event Summary</h2><h3>${escapeHtml(report.title)}</h3>
      <p>${escapeHtml(report.message || 'Post-event summary of the warning, dissemination metrics, and recorded operational findings.')}</p></section>
    <section><h2>2. Public Warning Dissemination Metrics</h2><table>
      ${row('Total alerts dispatched', metrics.totalAlertsSent)}
      ${row('Estimated population reached', metrics.peopleReached)}
      ${row('Community ground reports verified', metrics.reportsReceived)}
    </table></section>
    <section><h2>3. Impact Assessment & Operational Remarks</h2>
      <p><b>Impact:</b> ${escapeHtml(metrics.impactSummary)}</p>
      <p><b>Remarks:</b> ${escapeHtml(metrics.remarks)}</p></section>
    <footer><div><strong>${escapeHtml(report.officer)}</strong><br>DMC National Operations Officer</div><div>${escapeHtml(report.reportId)}<br>Page 1 of 1</div></footer>
  </article></main></body></html>`;
};

let printing = false;

export const printCompletedWarning = (report) => {
  if (printing) return;
  printing = true;
  const frame = document.createElement('iframe');
  frame.title = 'Completed warning report print document';
  frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0';
  let cleanupTimer;
  const cleanup = () => {
    clearTimeout(cleanupTimer);
    frame.remove();
    printing = false;
  };
  frame.onload = async () => {
    try {
      const printWindow = frame.contentWindow;
      await printWindow.document.fonts.ready;
      const sheet = printWindow.document.querySelector('.sheet');
      const content = printWindow.document.querySelector('.content');
      // Fit the entire report to one A4 page without printing the underlying portal.
      const scale = Math.min(1, sheet.clientHeight / Math.max(1, content.scrollHeight));
      content.style.transform = `scale(${scale})`;
      content.style.height = `${content.scrollHeight * scale}px`;
      printWindow.addEventListener('afterprint', cleanup, { once: true });
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      cleanup();
      window.alert(`Could not open the report for printing: ${error.message}`);
    }
  };
  frame.srcdoc = buildCompletedWarningHtml(report);
  cleanupTimer = setTimeout(cleanup, 300000);
  document.body.appendChild(frame);
};
