import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import StudentSidebar from './StudentSidebar';
import StudentHeader from './StudentHeader';
import { useAuth } from '../../assets/context/AuthContext';

const PASS_MARK = 70;

const StudentLessonDetail = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [lesson, setLesson] = useState(null);
  const [topics, setTopics] = useState([]);
  const [assignments, setAssignments] = useState({}); // topicId: assignment
  const [lessonSize, setLessonSize] = useState({ topics: 0, assignments: 0, marks: 0 });
  const [unlockedIndex, setUnlockedIndex] = useState(0);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [assignmentAnswers, setAssignmentAnswers] = useState({}); // topicId: answer
  const [assignmentScores, setAssignmentScores] = useState({}); // topicId: score
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLessonAndTopics();
  }, [lessonId]);

  const fetchLessonAndTopics = async () => {
    setLoading(true);
    try {
      const lessonRes = await axios.get(`http://localhost:3000/api/lessons/${lessonId}/details`);
      setLesson(lessonRes.data);
      setTopics(lessonRes.data.topics || []);
      // Fetch assignments for each topic
      const assignmentsObj = {};
      await Promise.all(
        (lessonRes.data.topics || []).map(async (topic) => {
          try {
            const assignmentRes = await axios.get(`http://localhost:3000/api/lessons/topics/${topic.id}/assignments`);
            assignmentsObj[topic.id] = assignmentRes.data[0] || null;
          } catch {
            assignmentsObj[topic.id] = null;
          }
        })
      );
      setAssignments(assignmentsObj);
      setUnlockedIndex(0);
      setCurrentTopicIndex(0);
      setAssignmentAnswers({});
      setAssignmentScores({});
      setProgress(0);
      // Calculate lesson size
      let totalAssignments = 0;
      let totalMarks = 0;
      (lessonRes.data.topics || []).forEach(topic => {
        const a = assignmentsObj[topic.id];
        if (a) {
          totalAssignments += 1;
          totalMarks += parseInt(a.mark) || 0;
        }
      });
      setLessonSize({ topics: (lessonRes.data.topics || []).length, assignments: totalAssignments, marks: totalMarks });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (topicId, value) => {
    setAssignmentAnswers((prev) => ({ ...prev, [topicId]: value }));
  };

  // Placeholder scoring logic: always pass if answer is not empty
  const handleSubmitAssignment = async (topicId) => {
    setSubmitting(true);
    setTimeout(() => {
      // Simulate scoring: if answer is not empty, pass with 80, else fail with 50
      const score = assignmentAnswers[topicId]?.trim() ? 80 : 50;
      setAssignmentScores((prev) => ({ ...prev, [topicId]: score }));
      if (score >= PASS_MARK && unlockedIndex < topics.length - 1) {
        setUnlockedIndex(unlockedIndex + 1);
        setCurrentTopicIndex(unlockedIndex + 1);
      }
      // Update progress
      const completed = Object.values({ ...assignmentScores, [topicId]: score }).filter(s => s >= PASS_MARK).length;
      setProgress(Math.round((completed / topics.length) * 100));
      setSubmitting(false);
    }, 800);
  };

  if (loading) {
    return <div className="flex justify-center items-center py-16"><Icon icon="eos-icons:loading" className="h-12 w-12 animate-spin text-green-600" /></div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar
        sidebarOpen={sidebarOpen}
        mobileSidebarOpen={mobileSidebarOpen}
        toggleSidebar={() => setSidebarOpen((open) => !open)}
        toggleMobileSidebar={() => setMobileSidebarOpen((open) => !open)}
      />
      <div className="flex-1 flex flex-col">
        <StudentHeader
          user={user}
          onLogout={logout}
          title={lesson?.title || 'Lesson Details'}
          toggleSidebar={() => setMobileSidebarOpen((open) => !open)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-3xl mx-auto">
          <div className="w-full max-w-4xl mx-auto mt-8 mb-8 bg-white/90 rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in">
            <div className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Icon icon="carbon:view" className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Lesson Details</h2>
                  <p className="text-green-100 text-sm mt-1">{lesson?.title}</p>
                </div>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
              >
                <Icon icon="carbon:close" className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <div className="font-bold text-green-900 text-lg mb-1">Description</div>
                <div className="text-gray-700 mb-4">{lesson?.description}</div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-green-500 text-white text-xs md:text-sm font-semibold shadow">
                    <Icon icon="carbon:document" className="mr-1 text-white h-4 w-4" />{lessonSize.topics} <span className="ml-1">Topics</span>
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-green-400 text-white text-xs md:text-sm font-semibold shadow">
                    <Icon icon="carbon:task" className="mr-1 text-white h-4 w-4" />{lessonSize.assignments} <span className="ml-1">Assignments</span>
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-green-300 text-white text-xs md:text-sm font-semibold shadow">
                    <Icon icon="carbon:star" className="mr-1 text-white h-4 w-4" />{lessonSize.marks} <span className="ml-1">Marks</span>
                  </span>
                </div>
              </div>
              <div className="mb-6">
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div className="bg-green-600 h-3 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 text-right">{progress}% complete</p>
              </div>
              <div className="space-y-6">
                {topics.map((topic, idx) => {
                  const unlocked = idx <= unlockedIndex;
                  const completed = assignmentScores[topic.id] >= PASS_MARK;
                  return (
                    <div key={topic.id} className={`rounded-xl border p-6 shadow-sm transition-all ${unlocked ? 'bg-white' : 'bg-gray-100 opacity-70'} hover:shadow-lg`}> {/* Increased padding, lighter locked bg, hover effect */}
                      <div className="flex items-center gap-2 mb-2">
                        <Icon icon="carbon:document" className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-900 text-lg">{topic.title}</span> {/* Larger, bolder title */}
                        {/* Removed Completed and Locked badges for a cleaner look */}
                      </div>
                      {unlocked && (
                        <>
                          <div className="mb-2 text-sm text-gray-700 font-medium">Assignment:</div>
                          {assignments[topic.id] ? (
                            <div className="mb-2">
                              <input
                                type="text"
                                placeholder="Type your answer..."
                                value={assignmentAnswers[topic.id] || ''}
                                onChange={e => handleAnswerChange(topic.id, e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-base"
                                disabled={completed}
                              />
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 italic">No assignment for this topic.</div>
                          )}
                          {assignmentScores[topic.id] !== undefined && (
                            <div className={`text-xs font-semibold mt-1 ${assignmentScores[topic.id] >= PASS_MARK ? 'text-green-700' : 'text-red-600'}`}>Score: {assignmentScores[topic.id]}%</div>
                          )}
                          {!completed && assignments[topic.id] && (
                            <button
                              className="mt-3 px-5 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold shadow hover:from-green-700 hover:to-green-800 transition-all text-base"
                              onClick={() => handleSubmitAssignment(topic.id)}
                              disabled={submitting}
                            >
                              {submitting ? 'Submitting...' : 'Submit Assignment'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* Fade-in animation */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
};

export default StudentLessonDetail; 