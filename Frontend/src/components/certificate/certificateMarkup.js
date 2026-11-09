const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const formatCertificateDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const certificateQrUrl = (certificateId) => {
  const target = `https://www.hblab.rw/verfiy/${certificateId || ''}`;
  const params = new URLSearchParams({
    size: '560x560',
    margin: '40',
    ecc: 'H',
    format: 'png',
    color: '111111',
    bgcolor: 'ffffff',
    data: target,
  });
  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
};

export const buildCertificateHtml = (data = {}, qrCodeUrl) => {
  const rawName = String(data.recipientName || 'Recipient');
  const name = escapeHtml(rawName);
  const course = escapeHtml(data.courseName || 'HB-Lab Training');
  const duration = escapeHtml(data.duration || '');
  const dateRange = escapeHtml(data.dateRange || '');
  const completion = escapeHtml(formatCertificateDate(data.completionDate));
  const certificateId = escapeHtml(data.certificateId || '—');
  const skills = Array.isArray(data.skills) ? data.skills.filter(Boolean) : [];
  const qr = qrCodeUrl || certificateQrUrl(data.certificateId);
  const namePx = rawName.length > 34 ? 36 : rawName.length > 24 ? 44 : 52;

  const facts = [
    duration ? { label: 'Duration', value: duration } : null,
    dateRange ? { label: 'Period', value: dateRange } : null,
    completion ? { label: 'Completed', value: completion } : null,
  ].filter(Boolean);

  const factsHtml = facts.length
    ? `<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;">
        ${facts
          .map(
            (fact) => `<div style="padding:8px 14px;border-radius:12px;background:#ffffff;border:1px solid #d5e4de;">
              <div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#2e6b57;font-weight:600;">${fact.label}</div>
              <div style="margin-top:3px;font-size:13px;font-weight:600;color:#1a3d31;">${fact.value}</div>
            </div>`
          )
          .join('')}
      </div>`
    : '';

  const skillsHtml = skills.length
    ? `<div style="margin-top:18px;">
        <div style="font-size:10px;letter-spacing:1.8px;text-transform:uppercase;color:#2e6b57;font-weight:600;">Skills covered</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;max-width:680px;">
          ${skills
            .map(
              (skill) =>
                `<span style="display:inline-block;padding:6px 12px;border-radius:999px;background:#ffffff;border:1px solid #d5e4de;font-size:13px;font-weight:500;color:#1a3d31;line-height:1.2;">${escapeHtml(skill)}</span>`
            )
            .join('')}
        </div>
      </div>`
    : '';

  const signature = (src, person, role) => `<div style="width:230px;">
    <img src="${src}" alt="" style="height:52px;object-fit:contain;object-position:left center;display:block;margin-bottom:2px;" />
    <div style="border-top:1.5px solid #1a3d31;padding-top:6px;">
      <div style="font-size:14px;font-weight:600;color:#132d24;">${person}</div>
      <div style="margin-top:1px;font-size:12px;color:#5d6f68;">${role}</div>
    </div>
  </div>`;

  const corner = (style) =>
    `<div style="position:absolute;width:54px;height:54px;z-index:1;${style}"></div>`;

  return `<div style="width:1200px;height:848px;box-sizing:border-box;padding:14px;font-family:'Poppins',system-ui,sans-serif;color:#1a3d31;background:#2e6b57;">
    <div style="position:relative;height:100%;box-sizing:border-box;overflow:hidden;background-color:#ffffff;background-image:
      radial-gradient(circle at 18% 48%, rgba(46,107,87,0.06), transparent 34%),
      repeating-linear-gradient(118deg, rgba(46,107,87,0.045) 0 1px, transparent 1px 16px);">
      <div style="position:absolute;left:-90px;top:160px;width:440px;height:440px;border-radius:50%;border:1px solid rgba(46,107,87,0.16);z-index:0;"></div>
      <div style="position:absolute;left:-48px;top:202px;width:356px;height:356px;border-radius:50%;border:1px solid rgba(46,107,87,0.1);z-index:0;"></div>
      <div style="position:absolute;right:-80px;bottom:-90px;width:260px;height:260px;border-radius:50%;border:1px solid rgba(46,107,87,0.12);z-index:0;"></div>
      <div style="position:absolute;left:86px;top:188px;font-family:'Cormorant Garamond',Georgia,serif;font-size:250px;line-height:0.8;font-weight:600;color:rgba(46,107,87,0.06);letter-spacing:-10px;z-index:0;">HB</div>
      <div style="position:absolute;top:12px;right:12px;bottom:12px;left:12px;border:1.5px solid #2e6b57;z-index:1;"></div>
      <div style="position:absolute;top:18px;right:18px;bottom:18px;left:18px;border:1px solid rgba(46,107,87,0.22);z-index:1;"></div>
      ${corner('top:22px;left:22px;width:34px;height:34px;border-top:3px solid #2e6b57;border-left:3px solid #2e6b57;')}
      ${corner('top:22px;right:22px;width:34px;height:34px;border-top:3px solid #2e6b57;border-right:3px solid #2e6b57;')}
      ${corner('bottom:22px;left:22px;width:34px;height:34px;border-bottom:3px solid #2e6b57;border-left:3px solid #2e6b57;')}
      ${corner('bottom:22px;right:22px;width:34px;height:34px;border-bottom:3px solid #2e6b57;border-right:3px solid #2e6b57;')}
      <div style="position:relative;z-index:2;height:100%;box-sizing:border-box;padding:40px 48px 26px 56px;display:flex;flex-direction:column;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:14px;">
            <img src="/images/hb-lab-logo.png" alt="HB-Lab" style="width:58px;height:58px;object-fit:contain;" />
            <div>
              <div style="font-size:26px;letter-spacing:3.5px;font-weight:700;color:#132d24;line-height:1;">HB-LAB</div>
              <div style="margin-top:5px;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#2e6b57;">Empowering Digital Dreams</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px;letter-spacing:2.2px;text-transform:uppercase;color:#2e6b57;font-weight:600;">Granted credential</div>
            <div style="margin-top:4px;font-size:13px;font-weight:300;color:#7a8d85;">Official training record</div>
          </div>
        </div>

        <div style="margin-top:26px;display:flex;gap:28px;flex:1;min-height:0;align-items:flex-start;">
          <div style="flex:1;min-width:0;display:flex;flex-direction:column;align-self:stretch;">
            <div style="font-size:12px;letter-spacing:3.6px;text-transform:uppercase;color:#2e6b57;font-weight:600;">Certificate of completion</div>
            <div style="margin-top:18px;font-size:14px;font-weight:300;color:#8b9c94;">This certificate is presented to</div>
            <h1 style="margin:2px 0 0;font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;font-size:${namePx + 10}px;line-height:1;font-weight:500;font-style:italic;color:#132d24;">${name}</h1>
            <div style="width:76px;height:3px;margin-top:12px;border-radius:99px;background:#2e6b57;"></div>
            <p style="margin:14px 0 0;max-width:640px;font-size:16px;font-weight:300;line-height:1.55;color:#6d8078;">
              for successfully completing <strong style="color:#1a3d31;font-weight:500;">${course}</strong>
            </p>
            <p style="margin:10px 0 0;max-width:640px;font-size:13px;font-weight:300;line-height:1.6;color:#8b9c94;">
              HB-Lab grants this credential for completed training. Copy and share it with employers, on a portfolio, or with a school. The code lets them confirm it is genuine.
            </p>
            ${factsHtml}
            ${skillsHtml}
            <div style="margin-top:auto;padding-top:22px;display:flex;justify-content:space-between;gap:16px;">
              ${signature('/signatures/jules-signature.png', 'Jules Habarurema', 'Chief Executive Officer')}
              ${signature('/signatures/ferdinard-signature.png', 'Ferdinand Kwizera', 'Training Coordinator')}
            </div>
          </div>

          <div style="width:276px;box-sizing:border-box;background:#ffffff;border:1.5px solid #2e6b57;border-radius:18px;padding:18px 16px 16px;display:flex;flex-direction:column;align-items:center;color:#1a3d31;flex-shrink:0;">
            <div style="font-size:11px;letter-spacing:2.4px;text-transform:uppercase;color:#2e6b57;font-weight:600;">Verification</div>
            <div style="margin-top:14px;background:#ffffff;border:1px solid #d5e4de;border-radius:14px;padding:10px;line-height:0;">
              <img src="${qr}" alt="Verification QR code" crossorigin="anonymous" width="210" height="210" style="width:210px;height:210px;display:block;image-rendering:auto;" />
            </div>
            <div style="margin-top:14px;font-size:15px;font-weight:600;letter-spacing:0.2px;color:#1a3d31;">Scan to verify</div>
            <div style="margin-top:4px;font-size:12px;line-height:1.45;text-align:center;color:#6d827a;">Point a camera at this code to confirm the record.</div>
            <div style="margin-top:auto;padding-top:16px;width:100%;border-top:1px solid #d5e4de;text-align:center;">
              <div style="font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:#2e6b57;font-weight:600;">Certificate ID</div>
              <div style="margin-top:5px;font-size:13px;font-weight:600;line-height:1.35;word-break:break-word;color:#1a3d31;">${certificateId}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
};
