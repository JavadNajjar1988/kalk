const { chromium } = require("playwright");

(async () => {
  const [htmlPath, pdfPath, runningTitle] = process.argv.slice(2);
  if (!htmlPath || !pdfPath || !runningTitle) {
    throw new Error("Usage: node render_field_pdf.cjs <html> <pdf> <running-title>");
  }
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.goto("file:///" + htmlPath.replace(/\\/g, "/"), { waitUntil: "networkidle" });
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="width:100%;direction:rtl;font-family:'B Nazanin',serif;font-size:9px;color:#697386;text-align:right;padding:0 20mm;">${runningTitle}</div>`,
      footerTemplate: `<div style="width:100%;direction:rtl;font-family:'B Nazanin',serif;font-size:9px;color:#697386;text-align:center;padding:0 20mm;">صفحه <span class="pageNumber"></span> از <span class="totalPages"></span></div>`,
      margin: { top: "18mm", right: "20mm", bottom: "19mm", left: "20mm" },
      preferCSSPageSize: true,
    });
    console.log(pdfPath);
  } finally {
    await browser.close();
  }
})();
