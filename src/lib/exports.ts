export function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map(row => headers.map(h => escape(row[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportReportDocument(title: string, html: string, type: "pdf" | "word") {
  if (type === "word") {
    const doc = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
        <head><meta charset="utf-8"><title>${title}</title></head>
        <body>${html}</body>
      </html>
    `;
    const blob = new Blob([doc], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "-").toLowerCase()}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #223E5B; padding: 32px; }
          h1 { margin: 0 0 8px; }
          table { border-collapse: collapse; width: 100%; margin-top: 16px; }
          th, td { border: 1px solid #EBCBB0; padding: 8px; text-align: left; }
          th { background: #F2E7D3; }
          .note { color: #6B7280; font-size: 12px; }
        </style>
      </head>
      <body>${html}</body>
    </html>
  `);
  win.document.close();
  if (type === "pdf") {
    win.focus();
    win.print();
  }
}
