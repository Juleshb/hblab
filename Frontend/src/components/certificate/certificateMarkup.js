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
  return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=0&data=${encodeURIComponent(target)}`;
};

export const buildCertificateHtml = (data = {}, qrCodeUrl) => {
  const name = escapeHtml(data.recipientName || 'Recipient');
  const course = escapeHtml(data.courseName || 'HB-Lab Training');
  const duration = escapeHtml(data.duration || '');
  const dateRange = escapeHtml(data.dateRange || '');
  const completion = escapeHtml(formatCertificateDate(data.completionDate));
  const certificateId = escapeHtml(data.certificateId || '—');
  const skills = Array.isArray(data.skills) ? data.skills.filter(Boolean) : [];
  const qr = qrCodeUrl || certificateQrUrl(data.certificateId);

  const detailParts = [
    duration ? `${duration}` : '',
    dateRange ? dateRange : '',
  ].filter(Boolean);

  const skillsHtml = skills.length
    ? `<div style="margin-top:18px;text-align:center;">
        <div style="font-family:system-ui,sans-serif;font-size:11px;letter-spacing:2.4px;text-transform:uppercase;color:#8a6a32;">Skills covered</div>
        <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:10px;max-width:920px;margin-left:auto;margin-right:auto;">
          ${skills
            .map(
              (skill) =>
                `<span style="display:inline-block;padding:5px 12px;border:1px solid #d9c69a;border-radius:999px;background:#fffdf8;font-family:system-ui,sans-serif;font-size:13px;color:#0e4d2c;line-height:1.2;">${escapeHtml(skill)}</span>`
            )
            .join('')}
        </div>
      </div>`
    : '';

  return `<div style="width:1200px;height:848px;box-sizing:border-box;background:#f4f0e6;padding:18px;color:#163126;">
    <div style="height:100%;box-sizing:border-box;border:8px solid #0d4a2b;padding:8px;">
      <div style="height:100%;box-sizing:border-box;border:1px solid #c6a15b;padding:28px 42px 20px;display:flex;flex-direction:column;background:
        radial-gradient(circle at 0 0, rgba(198,161,91,0.18), transparent 26%),
        radial-gradient(circle at 100% 100%, rgba(13,74,43,0.08), transparent 28%),
        #fbf8f2;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:14px;">
            <img src="/images/hb-lab-logo.png" alt="HB-Lab" style="width:62px;height:62px;object-fit:contain;" />
            <div>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;letter-spacing:4px;font-weight:700;color:#0d4a2b;line-height:1;">HB-LAB</div>
              <div style="margin-top:6px;font-family:system-ui,sans-serif;font-size:12px;letter-spacing:1.6px;text-transform:uppercase;color:#8a6a32;">Empowering Digital Dreams</div>
            </div>
          </div>
          <div style="text-align:right;font-family:system-ui,sans-serif;">
            <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8a6a32;">Kigali · Rwanda</div>
            <div style="margin-top:6px;font-size:13px;color:#0d4a2b;">Official training credential</div>
          </div>
        </div>

        <div style="text-align:center;margin-top:26px;">
          <div style="font-family:system-ui,sans-serif;font-size:13px;letter-spacing:6px;text-transform:uppercase;color:#8a6a32;">Certificate of Completion</div>
          <div style="width:160px;height:1px;background:#c6a15b;margin:14px auto 0;"></div>
          <p style="margin:18px 0 0;font-family:system-ui,sans-serif;font-size:16px;color:#4d6258;">This certificate is proudly presented to</p>
          <h1 style="margin:6px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:52px;font-weight:normal;font-style:italic;color:#0d4a2b;line-height:1.15;">${name}</h1>
          <p style="margin:16px auto 0;max-width:860px;font-family:system-ui,sans-serif;font-size:17px;line-height:1.55;color:#24382e;">
            for successfully completing <strong style="color:#0d4a2b;">${course}</strong>${detailParts.length ? ` <span style="color:#8a6a32;">·</span> ${detailParts.join(' <span style="color:#8a6a32;">·</span> ')}` : ''}
          </p>
          ${completion ? `<p style="margin:8px 0 0;font-family:system-ui,sans-serif;font-size:14px;color:#5c6f64;">Completed on ${completion}</p>` : ''}
        </div>

        ${skillsHtml}

        <div style="margin-top:auto;padding-top:22px;display:flex;align-items:flex-end;justify-content:space-between;">
          <div style="width:250px;text-align:center;">
            <img src="/signatures/jules-signature.png" alt="" style="height:58px;object-fit:contain;margin-bottom:4px;" />
            <div style="border-top:1px solid #0d4a2b;padding-top:6px;font-family:system-ui,sans-serif;">
              <div style="font-size:14px;font-weight:700;color:#0d4a2b;">Jules Habarurema</div>
              <div style="font-size:12px;color:#5c6f64;">Chief Executive Officer</div>
            </div>
          </div>
          <div style="text-align:center;">
            <div style="background:#fff;border:1px solid #e6d7b4;padding:6px;display:inline-block;">
              <img src="${qr}" alt="Verification QR code" style="width:84px;height:84px;display:block;" />
            </div>
            <div style="margin-top:6px;font-family:system-ui,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#8a6a32;">Scan to verify</div>
          </div>
          <div style="width:250px;text-align:center;">
            <img src="/signatures/ferdinard-signature.png" alt="" style="height:58px;object-fit:contain;margin-bottom:4px;" />
            <div style="border-top:1px solid #0d4a2b;padding-top:6px;font-family:system-ui,sans-serif;">
              <div style="font-size:14px;font-weight:700;color:#0d4a2b;">Ferdinand Kwizera</div>
              <div style="font-size:12px;color:#5c6f64;">Training Coordinator</div>
            </div>
          </div>
        </div>

        <div style="margin-top:14px;border-top:1px solid #e4d7b8;padding-top:8px;display:flex;justify-content:space-between;font-family:system-ui,sans-serif;font-size:12px;color:#6d7f75;">
          <span>Certificate ID · ${certificateId}</span>
          <span>HB-Lab · Kigali, Rwanda</span>
        </div>
      </div>
    </div>
  </div>`;
};
