import React from "react";

const HBLCertificate = ({ certificateData }) => {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white border-2 border-gray-300">
      {/* Certificate Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">CERTIFICATE</h1>
        <div className="w-24 h-1 bg-black mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold">— PARTICIPATION —</h2>
      </div>

      {/* Presentation Text */}
      <div className="text-center mb-10">
        <p className="text-lg mb-6">THIS CERTIFICATE IS PROUDLY PRESENTED TO</p>
        <h3 className="text-3xl font-bold text-green-800 mb-10">
          {certificateData.recipientName || "HABARUGIRA Justin"}
        </h3>
      </div>

      {/* Completion Text */}
      <div className="text-center mb-10">
        <p className="text-lg leading-relaxed">
          has successfully completed {certificateData.duration || "3 months"} HB-LAB training in{" "}
          <span className="font-semibold">
            {certificateData.courseName || "Computer Skills and Software Development"}
          </span>{" "}
          from {certificateData.dateRange || "Jan-March 2025"}.
        </p>
      </div>

      {/* Skills Section */}
      <div className="mb-12">
        <p className="text-lg mb-2">Content of the Training were:</p>
        <ul className="list-disc list-inside pl-4">
          {certificateData.skills?.map((skill, index) => (
            <li key={index} className="mb-1">
              {skill}
            </li>
          )) || (
            <>
              <li>Computer Skills (Ms Word, Excel, Computer Maintenance)</li>
              <li>UX/UI</li>
              <li>HTML</li>
              <li>CSS</li>
              <li>Javascript</li>
              <li>React Js</li>
              <li>Database Management</li>
            </>
          )}
        </ul>
      </div>

      {/* Date Section */}
      <div className="mb-12">
        <p className="text-lg">
          Date: {certificateData.completionDate?.split('-').reverse().join(' / ') || "10 / 04 / 2025"}
        </p>
      </div>

      {/* Signatures Section */}
      <div className="flex justify-between mt-16">
        <div className="text-center">
          <div className="mb-2 border-t-2 border-black w-32 mx-auto"></div>
          <p>Mr. KWIZERA Ferdnard</p>
          <p className="text-sm">(Training Coordinator HB-LAB)</p>
        </div>
        <div className="text-center">
          <div className="mb-2 border-t-2 border-black w-32 mx-auto"></div>
          <p>Mr. HABARUREMA Jules</p>
          <p className="text-sm">(CEO HB-LAB)</p>
        </div>
      </div>
    </div>
  );
};

export default HBLCertificate;