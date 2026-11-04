import CertificateArtwork from "./certificate/CertificateArtwork";

const HBLCertificate = ({ certificateData }) => {
  return (
    <div className="overflow-x-auto">
      <CertificateArtwork certificate={certificateData} />
    </div>
  );
};

export default HBLCertificate;
