import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { apiOrigin } from '../../apiOrigin';

const CareerApplications = ({ userId }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${apiOrigin}/api/applications/by-user/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setApplications(response.data.applications || []);
        setLoading(false);
      } catch (err) {
        setError('Failed to load career applications');
        setLoading(false);
      }
    };
    if (userId) fetchApplications();
  }, [userId]);

  if (loading) return <div className="text-green-700">Loading career applications...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-green-900 mb-2">Career Applications</h3>
      {applications.length === 0 ? (
        <div className="text-gray-500 text-center py-4">You have not applied to any careers yet.</div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {applications.map((app) => (
            <li key={app.id} className="py-2 flex justify-between items-center">
              <span>{app.careerTitle}</span>
              <span className="text-green-700 font-semibold">{app.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
export default CareerApplications; 