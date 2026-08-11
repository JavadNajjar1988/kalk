const { chromium } = require("playwright");

(async () => {
  const htmlPath = "C:\\Users\\AI\\Documents\\GitHub\\kalk\\tmp\\our-system-comparison-report.html";
  const pdfPath = "C:\\Users\\AI\\Documents\\GitHub\\kalk\\output\\pdf\\گزارش مقایسه قابلیت‌های سامانه ما با سامانه C2.pdf";
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });
  const page = await browser.newPage();
  await page.goto("file:///" + htmlPath.replace(/\\/g, "/"), { waitUntil: "networkidle" });
  await page.pdf({
    path: pdfPath,
    format: "Letter",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `<div style="width:100%;font-family:'B Nazanin',serif;font-size:10px;color:#667085;text-align:right;padding:0 18mm;">گزارش ارزیابی و برنامه تکمیل قابلیت‌های سامانه ما</div>`,
    footerTemplate: `<div style="width:100%;font-family:'B Nazanin',serif;font-size:10px;color:#667085;text-align:right;padding:0 18mm;">سامانه ما | گزارش مقایسه فنی و برنامه ارتقا | صفحه <span class="pageNumber"></span> از <span class="totalPages"></span></div>`,
    margin: { top: "18mm", right: "18mm", bottom: "19mm", left: "18mm" },
    preferCSSPageSize: true,
  });
  console.log(pdfPath);
  await browser.close();
})();
