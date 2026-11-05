import React, { useEffect, useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { StudentLayout } from './index';
import { useAuth } from '../../assets/context/AuthContext';
import { apiOrigin } from '../../apiOrigin';

const ProgressBar = ({ progress }) => (
  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
    <div
      className="bg-green-600 h-1.5 rounded-full transition-all duration-700"
      style={{ width: `${progress}%` }}
    ></div>
  </div>
);

const LessonCard = ({ lesson }) => (
  <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out overflow-hidden border border-gray-100 flex flex-col">
    <div className="p-5 flex-grow">
      <div className="flex justify-between items-start">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${lesson.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {lesson.completed ? 'Completed' : 'In Progress'}
        </span>
        <span className="text-sm font-medium text-gray-500">{lesson.category || 'General'}</span>
      </div>
      <h3 className="text-lg font-bold text-gray-800 mt-4 mb-2 line-clamp-2">{lesson.title}</h3>
      <div className="flex items-center text-gray-500 text-sm mb-4">
        <Icon icon="carbon:time" className="mr-2" />
        <span>{lesson.duration || 'N/A'}</span>
      </div>
      <ProgressBar progress={lesson.progress} />
      <p className="text-xs text-gray-400 text-right">{lesson.progress || 0}% complete</p>
    </div>
    <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
      <button className="w-full text-center bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white font-semibold py-2 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
        {lesson.completed ? 'Review Course' : lesson.progress === 0 ? 'Start Lesson' : 'Continue Lesson'}
      </button>
    </div>
  </div>
);

const StudentProgress = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, COMPLETED, IN_PROGRESS

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${apiOrigin}/api/users/student/progress?userId=${user.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch progress');
        return res.json();
      })
      .then(data => {
        setProgress(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [user]);

  // Calculate overall progress (average)
  const overallProgress = progress.length > 0
    ? Math.round(progress.reduce((sum, l) => sum + (l.progress || 0), 0) / progress.length)
    : 0;

  const filteredLessons = useMemo(() => {
    return progress
      .filter(lesson => lesson.progress > 0) // Only show started lessons
      .filter(lesson => {
        if (filterStatus === 'ALL') return true;
        return filterStatus === 'COMPLETED' ? lesson.completed : !lesson.completed;
      })
      .filter(lesson =>
        lesson.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [progress, searchTerm, filterStatus]);

  return (
    <StudentLayout title="Learning Progress">
      <div className="p-4 sm:p-6">
        {/* Summary Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-1/3">
              <h1 className="text-xl font-bold text-gray-800">Your Learning Progress</h1>
              <p className="text-xs text-gray-500">Track your lesson completion and keep learning!</p>
            </div>
            <div className="w-full md:w-2/3 flex flex-col md:flex-row items-center gap-3">
              <div className="w-full relative">
                <Icon icon="carbon:search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search lessons..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all text-sm"
                />
              </div>
              <div className="w-full md:w-auto flex items-center gap-2">
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full md:w-auto px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all text-sm appearance-none bg-white"
                >
                  <option value="ALL">All</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="IN_PROGRESS">In Progress</option>
                </select>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-700" style={{ width: `${overallProgress}%` }}></div>
            </div>
            <div className="text-right text-green-700 font-semibold">{overallProgress}% Complete</div>
          </div>
        </div>
        {/* Lessons Grid */}
        {loading ? (
          <div className="text-center py-10">
            <Icon icon="eos-icons:loading" className="h-10 w-10 text-green-700 animate-spin inline-block" />
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500 bg-red-50 rounded-xl p-6">{error}</div>
        ) : filteredLessons.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl p-6">
            <Icon icon="carbon:book" className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="font-semibold">No lessons found.</p>
            <p className="text-xs">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map(lesson => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentProgress; 