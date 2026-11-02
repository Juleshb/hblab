import React, { useEffect, useState } from 'react';
import axios from 'axios';

const LessonList = ({ userId }) => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:3000/api/lessons?userId=${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLessons(response.data.lessons || []);
        setLoading(false);
      } catch (err) {
        setError('Failed to load lessons');
        setLoading(false);
      }
    };
    if (userId) fetchLessons();
  }, [userId]);

  if (loading) return <div className="text-green-700">Loading lessons...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      {(lessons || []).map((lesson) => (
        <div key={lesson.id} className="bg-green-100 p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-green-900">{lesson.title}</h3>
            <p className="text-gray-600">Progress: {lesson.progress || 0}%</p>
          </div>
          <button className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition">Continue</button>
        </div>
      ))}
    </div>
  );
};
export default LessonList; 