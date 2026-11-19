const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const HEADER = '#286850';
const INK = '#0f172a';
const MUTED = '#475569';
const STAMP = path.join(__dirname, '../../assets/official-stamp.png');
const LAB_LOGO = path.join(__dirname, '../../assets/hblab-logo.png');
const STUDIO_LOGO = path.join(__dirname, '../../assets/hbstudio-logo.png');

function siteUrl() {
  const configured = String(process.env.PUBLIC_SITE_URL || process.env.APP_URL || '').replace(/\/$/, '');
  if (configured && !/localhost|127\.0\.0\.1/.test(configured)) return configured;
  return 'https://hblab.rw';
}

function letterNumber(application) {
  return `AL-${application.applicationCode}`;
}

function issuedOn(application) {
  return new Date(application.updatedAt || Date.now()).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Kigali',
  });
}

function letterMark(application) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Letter signing is not configured');
  return crypto
    .createHmac('sha256', secret)
    .update(`hblab-letter:${application.id}:${application.applicationCode}`)
    .digest('hex')
    .slice(0, 20);
}

function verifyUrl(application) {
  return `${siteUrl()}/letter/${encodeURIComponent(application.applicationCode)}?v=${letterMark(application)}`;
}

function matches(application, mark) {
  if (!application?.id || !application.applicationCode) return false;
  if (application.status !== 'approved') return false;
  if (!['Internship', 'Training'].includes(application.careerTitle)) return false;
  let expected = '';
  try {
    expected = letterMark(application);
  } catch {
    return false;
  }
  const given = Buffer.from(String(mark || '').trim().toLowerCase());
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length) return false;
  return crypto.timingSafeEqual(given, wanted);
}

function programLine(application) {
  const place = application.careerDepartment || 'HBLab';
  if (application.careerTitle === 'Training') {
    return `High Technology Builder Lab Ltd accepts you for the ${place} training class.`;
  }
  return `High Technology Builder Lab Ltd accepts you for an internship in ${place}.`;
}

function buildAcceptancePdf(application) {
  const url = verifyUrl(application);
  return QRCode.toBuffer(url, {
    type: 'png',
    margin: 1,
    width: 320,
    errorCorrectionLevel: 'M',
    color: { dark: '#14532d', light: '#ffffffff' },
  }).then((qr) => new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 24, bottom: 24, left: 36, right: 36 },
    });
    const chunks = [];
    let pages = 0;
    doc.on('pageAdded', () => { pages += 1; });
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    pages = 1;

    const left = 36;
    const width = doc.page.width - 72;
    const logoTop = 20;
    const logoH = 34;
    if (fs.existsSync(LAB_LOGO)) doc.image(LAB_LOGO, left, logoTop, { height: logoH });
    if (fs.existsSync(STUDIO_LOGO)) {
      const studioW = logoH * (821 / 280);
      doc.image(STUDIO_LOGO, left + width - studioW, logoTop + 1, { height: logoH - 2 });
    }

    let y = logoTop + logoH + 12;
    const headerLines = [
      ['Helvetica-Bold', 8.5, 'HIGH-TECHNOLOGY BUILDER LAB LTD (HB-LAB LTD)'],
      ['Helvetica-Bold', 8.5, 'RWANDA WESTERN RUBAVU GISENYI'],
      ['Helvetica', 8, 'info@hblab.rw, studio@hblab.rw, 0789028283/079269730, Website: hblab.rw'],
      ['Helvetica', 8, 'TIN: 121966656'],
      ['Helvetica', 7.5, 'Account No: BPR:4493329947, Bank of Kigali: 100230804812, LOLC UNGUKA Finance: 30400994660015'],
    ];
    headerLines.forEach(([font, size, text]) => {
      doc.font(font).fontSize(size).fillColor(HEADER).text(text, left, y, { width, lineBreak: false });
      y += size + 3.2;
    });
    y += 5;
    doc.moveTo(left, y).lineTo(left + width, y).lineWidth(1.1).strokeColor(HEADER).stroke();

    y += 18;
    doc.font('Helvetica-Bold').fontSize(15).fillColor(HEADER)
      .text('ACCEPTANCE LETTER', left, y, { width, align: 'center', lineBreak: false });
    y += 28;
    doc.font('Helvetica').fontSize(10).fillColor(INK)
      .text(`Letter number: ${letterNumber(application)}`, left, y, { width: width / 2, lineBreak: false });
    doc.text(`Date: ${issuedOn(application)}`, left + width / 2, y, { width: width / 2, align: 'right', lineBreak: false });

    y += 26;
    const paragraphs = [
      `Dear ${application.fullName},`,
      programLine(application),
      `Application number: ${application.applicationCode}`,
      'This is your official acceptance. Keep this letter. Anyone who scans the code can open the HBLab page that confirms this document was issued by us.',
    ];
    doc.font('Helvetica').fontSize(11).fillColor(INK);
    paragraphs.forEach((paragraph, index) => {
      doc.text(paragraph, left, y, { width });
      y = doc.y + (index === paragraphs.length - 1 ? 18 : 11);
    });

    const stampW = 168;
    const signTop = y + 6;
    doc.font('Helvetica').fontSize(11).fillColor(INK)
      .text('Yours sincerely,', left + width - stampW, signTop, { width: stampW, lineBreak: false });

    const stampTop = signTop + 16;
    const qrSize = 90;
    doc.image(qr, left, stampTop + 20, { width: qrSize });
    doc.font('Helvetica').fontSize(8).fillColor(MUTED)
      .text('Scan to confirm this letter', left, stampTop + qrSize + 24, { width: qrSize + 8, align: 'center' });

    if (fs.existsSync(STAMP)) doc.image(STAMP, left + width - stampW, stampTop, { width: stampW });
    doc.font('Helvetica-Bold').fontSize(11).fillColor(INK)
      .text('HABARUREMA Jules', left + width - stampW, stampTop + 128, { width: stampW, align: 'center' });
    doc.font('Helvetica').fontSize(9).fillColor(HEADER)
      .text('HB-Lab CEO', left + width - stampW, stampTop + 144, { width: stampW, align: 'center' });

    doc.moveTo(left, 786).lineTo(left + width, 786).lineWidth(0.6).strokeColor('#d7e3dc').stroke();
    doc.font('Helvetica').fontSize(8).fillColor(MUTED)
      .text('This letter is official only when the code matches a letter we issued.', left, 794, { width, align: 'center', lineBreak: false });
    if (pages !== 1) {
      reject(new Error('Acceptance letter ran past one page'));
      return;
    }
    doc.end();
  }));
}

module.exports = {
  letterNumber,
  issuedOn,
  verifyUrl,
  matches,
  buildAcceptancePdf,
};
