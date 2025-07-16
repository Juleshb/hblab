import React, { useEffect, useState } from 'react';
import { useAuth } from '../../assets/context/AuthContext';
import { Icon } from '@iconify/react';

const StudentLessons = () => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:3000/api/lessons?userId=${user.id}`);
        if (!res.ok) throw new Error('Failed to fetch lessons');
        const data = await res.json();
        setLessons(data.lessons || []);
      } catch (err) {
        setError('Failed to load lessons.');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchLessons();
  }, [user]);

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-green-900 mb-4">My Lessons</h1>
      <div className="bg-white rounded-lg shadow border border-green-100 p-4">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Icon icon="eos-icons:loading" className="h-8 w-8 animate-spin text-green-700" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : lessons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Icon icon="carbon:book" className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-base text-gray-500 mb-1 font-semibold">No lessons assigned yet.</p>
            <p className="text-xs text-gray-400">Check back later for new lessons.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-green-100 text-xs rounded-xl overflow-hidden">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-2 py-2 text-left font-semibold text-green-700 uppercase tracking-wider">Title</th>
                  <th className="px-2 py-2 text-left font-semibold text-green-700 uppercase tracking-wider">Description</th>
                  <th className="px-2 py-2 text-left font-semibold text-green-700 uppercase tracking-wider">Progress</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-green-50">
                {lessons.map(lesson => (
                  <tr key={lesson.id} className="hover:bg-green-50/60 transition">
                    <td className="px-2 py-2 whitespace-nowrap font-medium text-gray-900">{lesson.title}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-gray-700 max-w-xs truncate">{lesson.description}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-green-800 font-semibold">{lesson.progress ? `${lesson.progress}%` : '0%'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentLessons; 