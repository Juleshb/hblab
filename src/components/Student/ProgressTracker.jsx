import React from 'react';

const ProgressTracker = ({ userId, progress = 0 }) => {
  return (
    <div className="bg-green-100 rounded-lg shadow-md p-4 flex flex-col items-center">
      <h3 className="text-lg font-semibold text-green-900 mb-2">Learning Progress</h3>
      <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
        <div className="bg-green-600 h-4 rounded-full" style={{ width: `${progress}%` }}></div>
      </div>
      <span className="text-green-700 font-semibold">{progress}% Complete</span>
    </div>
  );
};
export default ProgressTracker; 