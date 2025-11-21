import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import StudentSidebar from './StudentSidebar';
import StudentHeader from './StudentHeader';
import { useAuth } from '../../assets/context/AuthContext';
import toast from 'react-hot-toast';

const PASS_MARK = 70;

const StudentLessonDetail = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [lesson, setLesson] = useState(null);
  const [topics, setTopics] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [assignmentAnswers, setAssignmentAnswers] = useState({});
  const [assignmentScores, setAssignmentScores] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topicProgress, setTopicProgress] = useState({});
  const [showTest, setShowTest] = useState({});
  const [showDocumentViewer, setShowDocumentViewer] = useState({});
  const [lessonProgress, setLessonProgress] = useState(0);
  const [showSolution, setShowSolution] = useState({});
  const [solutionData, setSolutionData] = useState({});
  const [savingProgress, setSavingProgress] = useState(false);
  const [lessonCompleted, setLessonCompleted] = useState(false);

  useEffect(() => {
    fetchLessonData();
  }, [lessonId]);

  useEffect(() => {
    updateLessonProgress();
  }, [topics, topicProgress, assignmentScores]);

  const fetchLessonData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch lesson details with topics
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
          } catch (err) {
            console.error(`Failed to fetch assignment for topic ${topic.id}:`, err);
            assignmentsObj[topic.id] = null;
          }
        })
      );
      setAssignments(assignmentsObj);

      // Fetch user's progress for this lesson
      try {
        const progressRes = await axios.get(`http://localhost:3000/api/lessons/${lessonId}/progress`, {
          params: { userId: user.id }
        });
        if (progressRes.data) {
          setLessonProgress(progressRes.data.progress || 0);
          setLessonCompleted(progressRes.data.completed || false);
        }
      } catch (err) {
        console.log('No existing progress found for this lesson');
      }

    } catch (err) {
      console.error('Failed to fetch lesson data:', err);
      setError('Failed to load lesson data. Please try again.');
      toast.error('Failed to load lesson data');
    } finally {
      setLoading(false);
    }
  };

  const saveProgressToServer = async (progress, completed = false) => {
    if (savingProgress) return;
    
    setSavingProgress(true);
    try {
      await axios.post(`http://localhost:3000/api/lessons/${lessonId}/progress`, {
        userId: user.id,
        progress,
        completed
      });
    } catch (err) {
      console.error('Failed to save progress:', err);
      toast.error('Failed to save progress');
    } finally {
      setSavingProgress(false);
    }
  };

  const handleAnswerChange = (topicId, value) => {
    setAssignmentAnswers(prev => ({ ...prev, [topicId]: value }));
  };

  const handleDocumentComplete = async (topicId) => {
    setTopicProgress(prev => ({ ...prev, [topicId]: true }));
    
    const currentTopic = topics.find(topic => topic.id === topicId);
    const hasTest = assignments[topicId];
    
    if (hasTest) {
      setShowTest(prev => ({ ...prev, [topicId]: true }));
      toast.success('Document completed! You can now take the test.');
    } else {
      toast.success('Document completed! Moving to next topic.');
      if (currentTopicIndex < topics.length - 1) {
        setCurrentTopicIndex(prev => prev + 1);
      }
    }
    
    // Update and save progress
    const newProgress = calculateProgress();
    setLessonProgress(newProgress);
    await saveProgressToServer(newProgress);
  };

  const calculateProgress = () => {
    if (!topics.length) return 0;
    
    let completedTopics = 0;
    topics.forEach(topic => {
      const hasTest = assignments[topic.id];
      const documentCompleted = topicProgress[topic.id];
      const testCompleted = assignmentScores[topic.id] >= PASS_MARK;
      
      if (hasTest) {
        if (documentCompleted && testCompleted) {
          completedTopics++;
        }
      } else {
        if (documentCompleted) {
          completedTopics++;
        }
      }
    });
    
    return Math.round((completedTopics / topics.length) * 100);
  };

  const updateLessonProgress = () => {
    const newProgress = calculateProgress();
    setLessonProgress(newProgress);
    
    // Check if lesson is completed
    const isCompleted = newProgress === 100;
    if (isCompleted && !lessonCompleted) {
      setLessonCompleted(true);
      saveProgressToServer(newProgress, true);
      toast.success('🎉 Congratulations! You have completed this lesson!');
    } else if (!isCompleted && lessonCompleted) {
      setLessonCompleted(false);
      saveProgressToServer(newProgress, false);
    } else {
      saveProgressToServer(newProgress, lessonCompleted);
    }
  };

  const handleSubmitAssignment = async (topicId) => {
    if (!assignmentAnswers[topicId]?.trim()) {
      toast.error('Please provide an answer before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const assignment = assignments[topicId];
      let score = 0;
      let correctAnswer = '';
      let explanation = '';

      if (assignment.type === 'MULTIPLE_CHOICE') {
        const selectedOptionIndex = parseInt(assignmentAnswers[topicId]);
        const selectedOption = assignment.options[selectedOptionIndex];
        const correctOption = assignment.options.find(opt => opt.isCorrect);
        
        score = selectedOption.isCorrect ? 100 : 0;
        correctAnswer = correctOption?.text || 'No correct answer found';
        explanation = selectedOption.isCorrect 
          ? 'Correct! Your answer is right.' 
          : `Incorrect. The correct answer is: "${correctAnswer}"`;
      } else {
        // For text assignments - improved scoring
        const answer = assignmentAnswers[topicId].trim();
        const wordCount = answer.split(/\s+/).length;
        const minWords = 10;
        
        if (wordCount < minWords) {
          score = Math.max(30, Math.round((wordCount / minWords) * 60));
          explanation = `Your answer is too short. Please provide at least ${minWords} words for a better score.`;
        } else {
          score = Math.min(95, 70 + Math.round((wordCount - minWords) * 2));
          explanation = score >= PASS_MARK 
            ? 'Excellent answer! You provided sufficient detail and understanding.' 
            : 'Good effort! Try to provide more comprehensive answers for better scores.';
        }
        correctAnswer = 'Text answer - evaluated based on length and content quality';
      }
      
      // Store solution data
      setSolutionData(prev => ({
        ...prev,
        [topicId]: {
          score,
          correctAnswer,
          explanation,
          userAnswer: assignmentAnswers[topicId],
          submittedAt: new Date().toISOString()
        }
      }));
      
      setAssignmentScores(prev => ({ ...prev, [topicId]: score }));
      setShowSolution(prev => ({ ...prev, [topicId]: true }));
      
      if (score >= PASS_MARK) {
        toast.success(`🎉 Great job! You scored ${score}%`);
        updateLessonProgress();
      } else {
        toast.error(`Try again! You scored ${score}%. You need ${PASS_MARK}% to pass.`);
      }
    } catch (err) {
      console.error('Failed to submit assignment:', err);
      toast.error('Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getProgressPercentage = () => {
    if (!topics.length) return 0;
    const completedTopics = Object.values(assignmentScores).filter(s => s >= PASS_MARK).length;
    return Math.round((completedTopics / topics.length) * 100);
  };

  const getTopicStatus = (index) => {
    const score = assignmentScores[topics[index]?.id];
    if (score >= PASS_MARK) return 'completed';
    if (index <= currentTopicIndex) return 'active';
    return 'locked';
  };

  const isDocumentCompleted = (topicId) => {
    return topicProgress[topicId] || false;
  };

  const shouldShowTest = (topicId) => {
    return showTest[topicId] || false;
  };

  const handleNextTopic = () => {
    if (currentTopicIndex < topics.length - 1) {
      setCurrentTopicIndex(prev => prev + 1);
      setShowSolution(prev => ({ ...prev, [topics[currentTopicIndex].id]: false }));
    }
  };

  const handlePreviousTopic = () => {
    if (currentTopicIndex > 0) {
      setCurrentTopicIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <StudentSidebar
          sidebarOpen={sidebarOpen}
          mobileSidebarOpen={mobileSidebarOpen}
          toggleSidebar={() => setSidebarOpen(open => !open)}
          toggleMobileSidebar={() => setMobileSidebarOpen(open => !open)}
        />
        <div className="flex-1 flex flex-col lg:ml-60">
          <StudentHeader
            user={user}
            onLogout={logout}
            title="Loading Lesson..."
            toggleSidebar={() => setMobileSidebarOpen(open => !open)}
          />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-green-200 border-t-green-600 mx-auto mb-6"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-400 animate-ping"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading Lesson Content</h3>
              <p className="text-gray-500 text-sm">Please wait while we prepare your learning materials...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <StudentSidebar
          sidebarOpen={sidebarOpen}
          mobileSidebarOpen={mobileSidebarOpen}
          toggleSidebar={() => setSidebarOpen(open => !open)}
          toggleMobileSidebar={() => setMobileSidebarOpen(open => !open)}
        />
        <div className="flex-1 flex flex-col lg:ml-60">
          <StudentHeader
            user={user}
            onLogout={logout}
            title="Error"
            toggleSidebar={() => setMobileSidebarOpen(open => !open)}
          />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Icon icon="carbon:warning" className="h-10 w-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Something went wrong</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-y-3">
                <button
                  onClick={fetchLessonData}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  <Icon icon="carbon:refresh" className="h-5 w-5 inline mr-2" />
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/student/lessons')}
                  className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition-all duration-200 font-semibold"
                >
                  <Icon icon="carbon:arrow-left" className="h-5 w-5 inline mr-2" />
                  Back to Lessons
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <StudentSidebar
        sidebarOpen={sidebarOpen}
        mobileSidebarOpen={mobileSidebarOpen}
        toggleSidebar={() => setSidebarOpen(open => !open)}
        toggleMobileSidebar={() => setMobileSidebarOpen(open => !open)}
      />
      <div className="flex-1 flex flex-col lg:ml-60">
        <StudentHeader
          user={user}
          onLogout={logout}
          title={lesson?.title || 'Lesson Details'}
          toggleSidebar={() => setMobileSidebarOpen(open => !open)}
        />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Lesson Header */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 mb-8 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 via-green-700 to-green-800 p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4 mb-4 sm:mb-0">
                      <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                        <Icon icon="carbon:education" className="h-10 w-10 text-white" />
                      </div>
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                          {lesson?.title}
                        </h1>
                        <p className="text-sm sm:text-base text-green-100 max-w-2xl">
                          {lesson?.description}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/student/lessons')}
                      className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/30"
                    >
                      <Icon icon="carbon:arrow-left" className="h-5 w-5" />
                      <span className="hidden sm:inline font-medium">Back to Lessons</span>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Progress Section */}
              <div className="p-6 sm:p-8 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
                  <div className="text-center p-4 bg-blue-50 rounded-2xl">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{topics.length}</div>
                    <div className="text-sm text-gray-600 font-medium">Total Topics</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-2xl">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {Object.values(assignmentScores).filter(s => s >= PASS_MARK).length}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Completed</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-2xl">
                    <div className="text-2xl font-bold text-purple-600 mb-1">{lessonProgress}%</div>
                    <div className="text-sm text-gray-600 font-medium">Progress</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-2xl">
                    <div className="text-2xl font-bold text-orange-600 mb-1">
                      {topics.length - Object.values(assignmentScores).filter(s => s >= PASS_MARK).length}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Remaining</div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-gray-700">Lesson Progress</span>
                    <span className="text-sm font-bold text-green-600">{lessonProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-1000 ease-out shadow-sm relative"
                      style={{ width: `${lessonProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePreviousTopic}
                    disabled={currentTopicIndex === 0}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      currentTopicIndex === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}
                  >
                    <Icon icon="carbon:arrow-left" className="h-4 w-4" />
                    <span className="text-sm font-medium">Previous</span>
                  </button>
                  
                  <div className="text-sm text-gray-600 font-medium">
                    Topic {currentTopicIndex + 1} of {topics.length}
                  </div>
                  
                  <button
                    onClick={handleNextTopic}
                    disabled={currentTopicIndex === topics.length - 1}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      currentTopicIndex === topics.length - 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    <span className="text-sm font-medium">Next</span>
                    <Icon icon="carbon:arrow-right" className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Current Topic Display */}
            {topics.length > 0 && (
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 mb-8 overflow-hidden">
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      getTopicStatus(currentTopicIndex) === 'completed' 
                        ? 'bg-green-500 text-white' 
                        : getTopicStatus(currentTopicIndex) === 'active'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {getTopicStatus(currentTopicIndex) === 'completed' ? (
                        <Icon icon="carbon:checkmark" className="h-6 w-6" />
                      ) : (
                        <span className="font-bold text-lg">{currentTopicIndex + 1}</span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 mb-1">
                        {topics[currentTopicIndex]?.title}
                      </h2>
                      <p className="text-sm text-gray-500">
                        Topic {currentTopicIndex + 1} of {topics.length}
                      </p>
                    </div>
                  </div>

                  {/* Topic Content */}
                  <div className="space-y-6">
                    {/* Document Section */}
                    {!isDocumentCompleted(topics[currentTopicIndex]?.id) && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Icon icon="carbon:document" className="h-6 w-6 text-blue-600" />
                          <h3 className="text-lg font-semibold text-blue-800">Learning Material</h3>
                        </div>
                        <p className="text-blue-700 mb-4">
                          Please read through the learning material for this topic. Once you've completed reading, click the button below to proceed.
                        </p>
                        
                        {topics[currentTopicIndex]?.documentUrl && (
                          <div className="mb-4">
                            <button 
                              onClick={() => setShowDocumentViewer(prev => ({ 
                                ...prev, 
                                [topics[currentTopicIndex].id]: !prev[topics[currentTopicIndex].id] 
                              }))}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-all duration-200 font-medium"
                            >
                              <Icon icon={showDocumentViewer[topics[currentTopicIndex].id] ? "carbon:view-off" : "carbon:view"} className="h-4 w-4" />
                              {showDocumentViewer[topics[currentTopicIndex].id] ? 'Hide Document' : 'View Document'}
                            </button>
                            
                            {showDocumentViewer[topics[currentTopicIndex].id] && (
                              <div className="mt-4 border border-blue-200 rounded-xl overflow-hidden shadow-lg">
                                <div className="bg-blue-100 px-4 py-3 border-b border-blue-200">
                                  <span className="text-sm font-medium text-blue-800">Document Viewer</span>
                                </div>
                                <div className="h-96 bg-white">
                                  <iframe
                                    src={`http://localhost:3000${topics[currentTopicIndex].documentUrl}`}
                                    className="w-full h-full border-0"
                                    title="Document Viewer"
                                    onLoad={() => console.log('Document loaded')}
                                    onError={() => toast.error('Failed to load document')}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <button
                          onClick={() => handleDocumentComplete(topics[currentTopicIndex].id)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          <Icon icon="carbon:checkmark" className="h-5 w-5 inline mr-2" />
                          I've Completed Reading
                        </button>
                      </div>
                    )}

                    {/* Test Section */}
                    {isDocumentCompleted(topics[currentTopicIndex]?.id) && 
                     assignments[topics[currentTopicIndex]?.id] && 
                     shouldShowTest(topics[currentTopicIndex]?.id) && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Icon icon="carbon:quiz" className="h-6 w-6 text-green-600" />
                          <h3 className="text-lg font-semibold text-green-800">Test Your Knowledge</h3>
                        </div>
                        <p className="text-green-700 mb-6">
                          Now that you've read the material, test your understanding with this quiz.
                        </p>

                        {assignments[topics[currentTopicIndex].id].type === 'MULTIPLE_CHOICE' ? (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-800 mb-3 text-base">
                              {assignments[topics[currentTopicIndex].id].question}
                            </h4>
                            {assignments[topics[currentTopicIndex].id].options?.map((option, optIndex) => (
                              <label key={option.id} className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-all duration-200">
                                <input
                                  type="radio"
                                  name={`assignment-${topics[currentTopicIndex].id}`}
                                  value={optIndex}
                                  checked={assignmentAnswers[topics[currentTopicIndex].id] === optIndex.toString()}
                                  onChange={(e) => handleAnswerChange(topics[currentTopicIndex].id, e.target.value)}
                                  disabled={assignmentScores[topics[currentTopicIndex].id] >= PASS_MARK}
                                  className="text-green-600 focus:ring-green-500 h-4 w-4"
                                />
                                <span className="text-gray-700 text-sm">{option.text}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-800 mb-3 text-base">
                              {assignments[topics[currentTopicIndex].id].question}
                            </h4>
                            <textarea
                              placeholder="Type your answer here..."
                              value={assignmentAnswers[topics[currentTopicIndex].id] || ''}
                              onChange={(e) => handleAnswerChange(topics[currentTopicIndex].id, e.target.value)}
                              disabled={assignmentScores[topics[currentTopicIndex].id] >= PASS_MARK}
                              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none text-sm min-h-[120px]"
                            />
                          </div>
                        )}

                        {/* Score Display */}
                        {assignmentScores[topics[currentTopicIndex].id] !== undefined && (
                          <div className={`mt-4 p-4 rounded-xl ${
                            assignmentScores[topics[currentTopicIndex].id] >= PASS_MARK 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">Your Score:</span>
                              <span className="font-bold text-lg">{assignmentScores[topics[currentTopicIndex].id]}%</span>
                            </div>
                            <div className="text-sm mt-1">
                              {assignmentScores[topics[currentTopicIndex].id] >= PASS_MARK 
                                ? '🎉 Great job! You passed!' 
                                : `You need ${PASS_MARK}% to pass.`}
                            </div>
                          </div>
                        )}

                        {/* Submit Button */}
                        {assignmentScores[topics[currentTopicIndex].id] < PASS_MARK && !showSolution[topics[currentTopicIndex].id] && (
                          <button
                            onClick={() => handleSubmitAssignment(topics[currentTopicIndex].id)}
                            disabled={submitting || !assignmentAnswers[topics[currentTopicIndex].id]?.trim()}
                            className={`w-full mt-4 py-3 px-6 rounded-xl font-semibold transition-all duration-200 text-sm shadow-lg ${
                              submitting || !assignmentAnswers[topics[currentTopicIndex].id]?.trim()
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-xl transform hover:-translate-y-0.5'
                            }`}
                          >
                            {submitting ? (
                              <div className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Submitting...</span>
                              </div>
                            ) : (
                              <span>Submit Test</span>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Solution Section */}
                    {showSolution[topics[currentTopicIndex]?.id] && solutionData[topics[currentTopicIndex]?.id] && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Icon icon="carbon:chart-line" className="h-6 w-6 text-blue-600" />
                          <h3 className="text-lg font-semibold text-blue-800">Test Results</h3>
                        </div>
                        
                        {/* Score Display */}
                        <div className={`mb-6 p-4 rounded-xl ${
                          solutionData[topics[currentTopicIndex].id].score >= PASS_MARK 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">Your Score:</span>
                            <span className="font-bold text-xl">{solutionData[topics[currentTopicIndex].id].score}%</span>
                          </div>
                          <div className="text-sm">
                            {solutionData[topics[currentTopicIndex].id].score >= PASS_MARK 
                              ? '✅ Great job! You passed!' 
                              : `❌ You need ${PASS_MARK}% to pass.`}
                          </div>
                        </div>

                        {/* Answer Analysis */}
                        <div className="space-y-4">
                          <div>
                            <span className="text-sm font-semibold text-gray-700">Your Answer:</span>
                            <div className="mt-2 bg-gray-50 p-3 rounded-lg border">
                              <p className="text-sm text-gray-700">
                                {solutionData[topics[currentTopicIndex].id].userAnswer}
                              </p>
                            </div>
                          </div>
                          
                          {assignments[topics[currentTopicIndex].id]?.type === 'MULTIPLE_CHOICE' && (
                            <div>
                              <span className="text-sm font-semibold text-gray-700">Correct Answer:</span>
                              <div className="mt-2 bg-green-50 p-3 rounded-lg border border-green-200">
                                <p className="text-sm text-green-700 font-medium">
                                  {solutionData[topics[currentTopicIndex].id].correctAnswer}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <span className="text-sm font-semibold text-gray-700">Explanation:</span>
                            <div className="mt-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <p className="text-sm text-blue-700">
                                {solutionData[topics[currentTopicIndex].id].explanation}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Completion Section - For topics without tests */}
                    {isDocumentCompleted(topics[currentTopicIndex]?.id) && 
                     !assignments[topics[currentTopicIndex]?.id] && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Icon icon="carbon:checkmark" className="h-6 w-6 text-green-600" />
                          <h3 className="text-lg font-semibold text-green-800">Topic Completed</h3>
                        </div>
                        <p className="text-green-700 mb-4">
                          You've successfully completed this topic. No test is required for this topic.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Topics Overview */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 mb-8">
              <div className="p-6 sm:p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Topics Overview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topics.map((topic, index) => {
                    const status = getTopicStatus(index);
                    const assignment = assignments[topic.id];
                    const score = assignmentScores[topic.id];
                    const isCompleted = score >= PASS_MARK;
                    const isActive = index <= currentTopicIndex;
                    const documentCompleted = isDocumentCompleted(topic.id);
                    
                    return (
                      <div 
                        key={topic.id}
                        className={`p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                          status === 'completed' 
                            ? 'border-green-200 bg-green-50' 
                            : status === 'active'
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-gray-200 bg-gray-50'
                        } ${!isActive ? 'opacity-60' : 'hover:shadow-lg hover:scale-105'} ${
                          index === currentTopicIndex ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                        }`}
                        onClick={() => setCurrentTopicIndex(index)}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            status === 'completed' 
                              ? 'bg-green-500 text-white' 
                              : status === 'active'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {status === 'completed' ? (
                              <Icon icon="carbon:checkmark" className="h-4 w-4" />
                            ) : (
                              <span className="font-bold text-sm">{index + 1}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 text-sm">{topic.title}</h4>
                            <p className="text-xs text-gray-500">Topic {index + 1}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs">
                            <Icon icon="carbon:document" className="h-3 w-3 text-blue-500" />
                            <span className={documentCompleted ? 'text-green-600 font-medium' : 'text-gray-500'}>
                              {documentCompleted ? 'Read' : 'Not Read'}
                            </span>
                          </div>
                          
                          {assignment && (
                            <div className="flex items-center gap-2 text-xs">
                              <Icon icon="carbon:quiz" className="h-3 w-3 text-purple-500" />
                              <span className={isCompleted ? 'text-green-600 font-medium' : 'text-gray-500'}>
                                {isCompleted ? 'Passed' : score !== undefined ? `${score}%` : 'Not Taken'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Completion Certificate */}
            {lessonCompleted && (
              <div className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 rounded-3xl p-8 text-white text-center shadow-2xl">
                <div className="bg-white/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <Icon icon="carbon:certificate" className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">🎉 Congratulations!</h3>
                <p className="text-green-100 mb-6 text-lg">You have successfully completed this lesson.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate('/student/certificates')}
                    className="bg-white text-green-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Icon icon="carbon:certificate" className="h-5 w-5 inline mr-2" />
                    View Certificate
                  </button>
                  <button
                    onClick={() => navigate('/student/lessons')}
                    className="bg-white/20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-all duration-200 border border-white/30"
                  >
                    <Icon icon="carbon:arrow-left" className="h-5 w-5 inline mr-2" />
                    Back to Lessons
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentLessonDetail; 