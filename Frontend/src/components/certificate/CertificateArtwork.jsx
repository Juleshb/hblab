import { buildCertificateHtml, certificateQrUrl } from './certificateMarkup';

const CertificateArtwork = ({ certificate, qrCodeUrl }) => {
  const html = buildCertificateHtml(
    certificate || {},
    qrCodeUrl || certificateQrUrl(certificate?.certificateId)
  );

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

export default CertificateArtwork;
