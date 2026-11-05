import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { apiOrigin } from '../../apiOrigin';

const LessonsManagement = () => {
  const [lessons, setLessons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [editForm, setEditForm] = useState({ id: null, title: '', description: '' });
  const [deletingLesson, setDeletingLesson] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');
  const [topics, setTopics] = useState([]);
  const [topicForm, setTopicForm] = useState({ title: '', assignment: '', document: null });
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicError, setTopicError] = useState('');
  const [topicSuccess, setTopicSuccess] = useState('');

  // Assignment state
  const [assignmentsByTopic, setAssignmentsByTopic] = useState({});
  const [showAssignmentForm, setShowAssignmentForm] = useState({}); // topicId: boolean
  const [assignmentForm, setAssignmentForm] = useState({ question: '', type: 'MULTIPLE_CHOICE', mark: '', options: [''], correctOption: 0 });
  const [editingAssignment, setEditingAssignment] = useState(null); // assignmentId
  const [assignmentError, setAssignmentError] = useState('');

  const [topicsCount, setTopicsCount] = useState({}); // lessonId: count
  const [stats, setStats] = useState({ totalLessons: 0, totalStudents: 0, studentsLearning: 0, studentsCompleted: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, ACTIVE, INACTIVE

  const [assignmentsCount, setAssignmentsCount] = useState({}); // lessonId: count
  const [marksCount, setMarksCount] = useState({}); // lessonId: total marks

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch lessons
      const lessonsRes = await axios.get(`${apiOrigin}/api/lessons/all`);
      const lessonsData = lessonsRes.data.lessons || [];
      setLessons(lessonsData);
      // Fetch dashboard stats for total students
      const statsRes = await axios.get(`${apiOrigin}/api/dashboard/stats`);
      let studentsLearning = 0;
      let studentsCompleted = 0;
      // Try to fetch lesson progress summary
      try {
        const progressRes = await axios.get(`${apiOrigin}/api/lessons/progress/summary`);
        studentsLearning = progressRes.data.learningCount || 0;
        studentsCompleted = progressRes.data.completedCount || 0;
      } catch {
        studentsLearning = 12; // fallback mock
        studentsCompleted = 8; // fallback mock
      }
      setStats({
        totalLessons: lessonsData.length,
        totalStudents: statsRes.data.stats.studentCount || 0,
        studentsLearning,
        studentsCompleted
      });
      // Fetch topics count for each lesson
      const topicCounts = {};
      await Promise.all(
        lessonsData.map(async (lesson) => {
          try {
            const topicsRes = await axios.get(`${apiOrigin}/api/lessons/${lesson.id}/topics`);
            topicCounts[lesson.id] = topicsRes.data.length;
          } catch {
            topicCounts[lesson.id] = 0;
          }
        })
      );
      setTopicsCount(topicCounts);
      // After fetching topicCounts
      const assignmentsCounts = {};
      const marksCounts = {};
      await Promise.all(
        lessonsData.map(async (lesson) => {
          try {
            const topicsRes = await axios.get(`${apiOrigin}/api/lessons/${lesson.id}/topics`);
            topicCounts[lesson.id] = topicsRes.data.length;
            // For each topic, fetch assignments and sum
            let totalAssignments = 0;
            let totalMarks = 0;
            await Promise.all(
              (topicsRes.data || []).map(async (topic) => {
                try {
                  const assignmentsRes = await axios.get(`${apiOrigin}/api/lessons/topics/${topic.id}/assignments`);
                  totalAssignments += assignmentsRes.data.length;
                  totalMarks += assignmentsRes.data.reduce((sum, a) => sum + (parseInt(a.mark) || 0), 0);
                } catch {}
              })
            );
            assignmentsCounts[lesson.id] = totalAssignments;
            marksCounts[lesson.id] = totalMarks;
          } catch {
            assignmentsCounts[lesson.id] = 0;
            marksCounts[lesson.id] = 0;
          }
        })
      );
      setAssignmentsCount(assignmentsCounts);
      setMarksCount(marksCounts);
    } catch (err) {
      setLessons([]);
      setStats({ totalLessons: 0, totalStudents: 0, studentsLearning: 0, studentsCompleted: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Add Lesson
  const handleOpenModal = () => {
    setForm({ title: '', description: '' });
    setError('');
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (!form.title.trim() || !form.description.trim()) {
        setError('All fields are required.');
        setSubmitting(false);
        return;
      }
      await axios.post(`${apiOrigin}/api/lessons`, {
        title: form.title,
        description: form.description,
      });
      setShowModal(false);
      fetchAllData(); // Re-fetch all data to update stats
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add lesson');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Lesson
  const handleOpenEditModal = (lesson) => {
    setEditForm({ id: lesson.id, title: lesson.title, description: lesson.description });
    setEditError('');
    setShowEditModal(true);
  };
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditError('');
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setEditError('');
    try {
      if (!editForm.title.trim() || !editForm.description.trim()) {
        setEditError('All fields are required.');
        setSubmitting(false);
        return;
      }
      await axios.put(`${apiOrigin}/api/lessons/${editForm.id}`, {
        title: editForm.title,
        description: editForm.description,
      });
      setShowEditModal(false);
      fetchAllData(); // Re-fetch all data to update stats
    } catch (err) {
      setEditError(err.response?.data?.error || 'Failed to update lesson');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Lesson
  const handleOpenDeleteModal = (lesson) => {
    setDeletingLesson(lesson);
    setShowDeleteModal(true);
  };
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingLesson(null);
  };
  const handleDelete = async () => {
    if (!deletingLesson) return;
    setSubmitting(true);
    try {
      await axios.delete(`${apiOrigin}/api/lessons/${deletingLesson.id}`);
      setShowDeleteModal(false);
      setDeletingLesson(null);
      fetchAllData(); // Re-fetch all data to update stats
    } catch (err) {
      alert('Failed to delete lesson');
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch topics for a lesson
  const fetchTopics = async (lessonId) => {
    try {
      const res = await axios.get(`${apiOrigin}/api/lessons/${lessonId}/topics`);
      setTopics(res.data);
    } catch (err) {
      setTopics([]);
    }
  };

  const handleOpenDetails = (lesson) => {
    navigate(`/admin/lessons/${lesson.id}`);
  };

  // Topic CRUD
  const handleTopicFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'document') {
      setTopicForm((prev) => ({ ...prev, document: files[0] }));
    } else {
      setTopicForm((prev) => ({ ...prev, [name]: value }));
    }
  };
  const handleAddTopic = async (e) => {
    e.preventDefault();
    setTopicError('');
    setTopicSuccess('');
    if (!topicForm.title.trim() || !topicForm.document) {
      setTopicError('Topic name and PDF file are required.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('title', topicForm.title);
      formData.append('document', topicForm.document);
      await axios.post(`${apiOrigin}/api/lessons/${detailsLesson.id}/topics`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTopicForm({ title: '', assignment: '', document: null });
      setTopicSuccess('Topic added successfully!');
      fetchTopics(detailsLesson.id);
      setTimeout(() => setTopicSuccess(''), 2000);
    } catch (err) {
      setTopicError('Failed to add topic');
    }
  };
  const handleEditTopic = (topic) => {
    setEditingTopic(topic.id);
    setTopicForm({ title: topic.title, assignment: topic.assignment || '', document: null });
  };
  const handleUpdateTopic = async (e) => {
    e.preventDefault();
    setTopicError('');
    if (!topicForm.title.trim() || !topicForm.assignment.trim()) {
      setTopicError('Title and assignment are required.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('title', topicForm.title);
      formData.append('assignment', topicForm.assignment);
      if (topicForm.document) formData.append('document', topicForm.document);
      await axios.put(`${apiOrigin}/api/lessons/topics/${editingTopic}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setEditingTopic(null);
      setTopicForm({ title: '', assignment: '', document: null });
      fetchTopics(detailsLesson.id);
    } catch (err) {
      setTopicError('Failed to update topic');
    }
  };
  const handleDeleteTopic = async (id) => {
    try {
      await axios.delete(`${apiOrigin}/api/lessons/topics/${id}`);
      fetchTopics(detailsLesson.id);
    } catch (err) {
      setTopicError('Failed to delete topic');
    }
  };

  // Fetch assignments for a topic
  const fetchAssignments = async (topicId) => {
    try {
      const res = await axios.get(`${apiOrigin}/api/lessons/topics/${topicId}/assignments`);
      setAssignmentsByTopic((prev) => ({ ...prev, [topicId]: res.data }));
    } catch (err) {
      setAssignmentsByTopic((prev) => ({ ...prev, [topicId]: [] }));
    }
  };

  const handleShowAssignmentForm = (topicId) => {
    setShowAssignmentForm((prev) => ({ ...prev, [topicId]: !prev[topicId] }));
    setAssignmentForm({ question: '', type: 'MULTIPLE_CHOICE', mark: '', options: [''], correctOption: 0 });
    setEditingAssignment(null);
    setAssignmentError('');
  };

  const handleAssignmentFormChange = (e) => {
    const { name, value } = e.target;
    setAssignmentForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleOptionChange = (idx, value) => {
    setAssignmentForm((prev) => {
      const options = [...prev.options];
      options[idx] = value;
      return { ...prev, options };
    });
  };
  const handleAddOption = () => {
    setAssignmentForm((prev) => ({ ...prev, options: [...prev.options, ''] }));
  };
  const handleRemoveOption = (idx) => {
    setAssignmentForm((prev) => {
      const options = prev.options.filter((_, i) => i !== idx);
      return { ...prev, options };
    });
  };
  const handleAssignmentTypeChange = (e) => {
    const type = e.target.value;
    setAssignmentForm((prev) => ({ ...prev, type, options: type === 'MULTIPLE_CHOICE' ? [''] : [], correctOption: 0 }));
  };
  // Helper: get total mark and question count for a topic
  const getTopicStats = (topicId) => {
    const assignments = assignmentsByTopic[topicId] || [];
    const totalMark = assignments.reduce((sum, a) => sum + (parseInt(a.mark) || 0), 0);
    const questionCount = assignments.length;
    return { totalMark, questionCount };
  };
  // Helper: get allowed mark for a topic (from topic.mark or 0)
  const getAllowedMark = (topic) => parseInt(topic.mark) || 0;
  // Helper: check if adding/editing assignment would exceed allowed mark
  const wouldExceedMark = (topic, mark, editingAssignmentId = null) => {
    const assignments = assignmentsByTopic[topic.id] || [];
    let currentTotal = assignments.reduce((sum, a) => sum + (parseInt(a.mark) || 0), 0);
    if (editingAssignmentId) {
      // Subtract the mark of the assignment being edited
      const editing = assignments.find(a => a.id === editingAssignmentId);
      if (editing) currentTotal -= parseInt(editing.mark) || 0;
    }
    return currentTotal + (parseInt(mark) || 0) > getAllowedMark(topic);
  };
  const handleAssignmentSubmit = async (e, topicId) => {
    e.preventDefault();
    setAssignmentError('');
    if (!assignmentForm.question.trim() || !assignmentForm.mark) {
      setAssignmentError('Question and mark are required.');
      return;
    }
    // Prevent exceeding allowed mark
    const topic = topics.find(t => t.id === topicId);
    if (topic && wouldExceedMark(topic, assignmentForm.mark, editingAssignment)) {
      setAssignmentError(`Total mark for this topic cannot exceed ${getAllowedMark(topic)}.`);
      return;
    }
    try {
      let data = {
        question: assignmentForm.question,
        type: assignmentForm.type,
        mark: assignmentForm.mark,
      };
      if (assignmentForm.type === 'MULTIPLE_CHOICE') {
        data.options = assignmentForm.options.filter((opt) => opt.trim() !== '');
        data.correctOption = assignmentForm.correctOption;
      }
      if (editingAssignment) {
        await axios.put(`${apiOrigin}/api/lessons/assignments/${editingAssignment}`, data);
      } else {
        await axios.post(`${apiOrigin}/api/lessons/topics/${topicId}/assignments`, data);
      }
      fetchAssignments(topicId);
      setShowAssignmentForm((prev) => ({ ...prev, [topicId]: false }));
      setAssignmentForm({ question: '', type: 'MULTIPLE_CHOICE', mark: '', options: [''], correctOption: 0 });
      setEditingAssignment(null);
    } catch (err) {
      setAssignmentError('Failed to save assignment');
    }
  };
  const handleEditAssignment = (assignment, topicId) => {
    setShowAssignmentForm((prev) => ({ ...prev, [topicId]: true }));
    setEditingAssignment(assignment.id);
    setAssignmentForm({
      question: assignment.question,
      type: assignment.type,
      mark: assignment.mark,
      options: assignment.options ? assignment.options.map((o) => o.text) : [''],
      correctOption: assignment.correctOption || 0,
    });
  };
  const handleDeleteAssignment = async (assignmentId, topicId) => {
    try {
      await axios.delete(`${apiOrigin}/api/lessons/assignments/${assignmentId}`);
      fetchAssignments(topicId);
    } catch (err) {
      setAssignmentError('Failed to delete assignment');
    }
  };

  const filteredLessons = useMemo(() => {
    return lessons
      .filter(lesson => {
        if (filterStatus === 'ALL') return true;
        // For now, mock all as 'ACTIVE'
        return filterStatus === 'ACTIVE';
      })
      .filter(lesson =>
        lesson.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [lessons, searchTerm, filterStatus]);

  return (
    <div className="p-4 sm:p-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center">
          <div className="p-3 bg-green-100 rounded-lg mb-2">
            <Icon icon="carbon:book" className="h-8 w-8 text-green-600" />
          </div>
          <div className="text-lg font-bold text-gray-900">{stats.totalLessons}</div>
          <div className="text-xs text-gray-600">Total Lessons</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center">
          <div className="p-3 bg-green-100 rounded-lg mb-2">
            <Icon icon="carbon:user-multiple" className="h-8 w-8 text-green-600" />
          </div>
          <div className="text-lg font-bold text-gray-900">{stats.totalStudents}</div>
          <div className="text-xs text-gray-600">Total Students</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center">
          <div className="p-3 bg-green-100 rounded-lg mb-2">
            <Icon icon="carbon:progress-bar" className="h-8 w-8 text-green-600" />
          </div>
          <div className="text-lg font-bold text-gray-900">{stats.studentsLearning}</div>
          <div className="text-xs text-gray-600">Students Learning</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center">
          <div className="p-3 bg-green-100 rounded-lg mb-2">
            <Icon icon="carbon:checkmark-filled" className="h-8 w-8 text-green-600" />
          </div>
          <div className="text-lg font-bold text-gray-900">{stats.studentsCompleted}</div>
          <div className="text-xs text-gray-600">Completed Lessons</div>
        </div>
      </div>
      {/* Header with search and filter */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-1/3">
            <h1 className="text-xl font-bold text-gray-800">Lessons Management</h1>
            <p className="text-xs text-gray-500">Manage and review all lessons for your organization.</p>
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
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      {/* Loading Spinner */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Icon icon="eos-icons:loading" className="h-12 w-12 animate-spin text-green-600" />
        </div>
      ) : (
        <>
          {filteredLessons.length === 0 ? (
            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl p-6">
              <Icon icon="carbon:book" className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="font-semibold">No lessons found.</p>
              <p className="text-xs">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 ease-in-out transform hover:scale-[1.025] hover:border-green-400 relative group"
                >
                  {/* Top gradient section */}
                  <div className="p-5 pb-3 bg-white">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-800 shadow-sm">Active</span>
                      <span className="text-sm font-medium text-gray-500">{lesson.createdAt ? new Date(lesson.createdAt).toLocaleDateString() : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-4 mb-2">
                      <span className="inline-flex items-center justify-center bg-gradient-to-tr from-green-400 to-green-600 text-white rounded-full shadow-lg h-10 w-10">
                        <Icon icon="carbon:book" className="h-6 w-6" />
                      </span>
                      <h3 className="text-lg md:text-xl font-extrabold text-gray-800 line-clamp-2 ml-2" style={{ textShadow: '0 1px 2px #e6f9f3' }}>{lesson.title}</h3>
                    </div>
                  </div>
                  <div className="px-5 pt-1 pb-2">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-500 text-white text-xs md:text-sm font-semibold shadow">
                        <Icon icon="carbon:document" className="mr-1 text-white h-4 w-4" />{topicsCount[lesson.id] ?? '...'} <span className="ml-1">Topics</span>
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-400 text-white text-xs md:text-sm font-semibold shadow">
                        <Icon icon="carbon:task" className="mr-1 text-white h-4 w-4" />{assignmentsCount[lesson.id] ?? '...'} <span className="ml-1">Assignments</span>
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-300 text-white text-xs md:text-sm font-semibold shadow">
                        <Icon icon="carbon:star" className="mr-1 text-white h-4 w-4" />{marksCount[lesson.id] ?? '...'} <span className="ml-1">Marks</span>
                      </span>
                    </div>
                    {/* Progress Bar */}
                    {typeof topicsCount[lesson.id] === 'number' && typeof assignmentsCount[lesson.id] === 'number' && typeof marksCount[lesson.id] === 'number' && (
                      (() => {
                        const topicProgress = Math.min((topicsCount[lesson.id] / 7) * 100, 100);
                        const assignmentProgress = Math.min((assignmentsCount[lesson.id] / 7) * 100, 100);
                        const markProgress = Math.min((marksCount[lesson.id] / 100) * 100, 100);
                        const progress = Math.round(Math.min(topicProgress, assignmentProgress, markProgress));
                        return (
                          <>
                            <div className="w-full bg-gray-200 rounded-full h-3 mb-2 shadow-inner">
                              <div className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full shadow-lg transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="text-xs text-gray-400 text-right font-semibold tracking-wide">{progress}% complete</p>
                          </>
                        );
                      })()
                    )}
                  </div>
                  <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex gap-2">
                    <Link
                      to={`/admin/lessons/${lesson.id}`}
                      className="flex-1 text-center bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white font-semibold px-2 py-1 text-xs rounded-md transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleOpenEditModal(lesson)}
                      className="flex-1 text-center bg-green-100 text-green-800 font-semibold px-2 py-1 text-xs rounded-md transition-all duration-300 hover:bg-green-200 border border-green-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(lesson)}
                      className="flex-1 text-center bg-red-100 text-red-700 font-semibold px-2 py-1 text-xs rounded-md transition-all duration-300 hover:bg-red-200 border border-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" onClick={e => { if (e.target === e.currentTarget) handleCloseModal(); }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="relative bg-white/90 rounded-3xl shadow-2xl w-full max-w-lg mx-auto border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Icon icon="carbon:add" className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Add Lesson</h2>
                  <p className="text-green-100 text-sm mt-1">Create a new lesson entry</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
              >
                <Icon icon="carbon:close" className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">Lesson Name</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-medium transition-all duration-200 shadow-lg hover:shadow-xl mt-2"
              >
                {submitting ? 'Adding...' : (<><Icon icon="carbon:add" className="h-5 w-5 mr-2" /> Add Lesson</>)}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" onClick={e => { if (e.target === e.currentTarget) handleCloseEditModal(); }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="relative bg-white/90 rounded-3xl shadow-2xl w-full max-w-lg mx-auto border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Icon icon="carbon:edit" className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Edit Lesson</h2>
                  <p className="text-green-100 text-sm mt-1">Update lesson details</p>
                </div>
              </div>
              <button
                onClick={handleCloseEditModal}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
              >
                <Icon icon="carbon:close" className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">Lesson Name</label>
                <input
                  type="text"
                  name="title"
                  value={editForm.title}
                  onChange={handleEditChange}
                  required
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                  required
                  rows={3}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              {editError && <div className="text-red-600 text-sm">{editError}</div>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-medium transition-all duration-200 shadow-lg hover:shadow-xl mt-2"
              >
                {submitting ? 'Saving...' : (<><Icon icon="carbon:edit" className="h-5 w-5 mr-2" /> Save Changes</>)}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" onClick={e => { if (e.target === e.currentTarget) handleCloseDeleteModal(); }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="relative bg-white/90 rounded-3xl shadow-2xl w-full max-w-md mx-auto border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Icon icon="carbon:trash-can" className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Delete Lesson</h2>
                  <p className="text-red-100 text-sm mt-1">Are you sure you want to delete this lesson?</p>
                </div>
              </div>
              <button
                onClick={handleCloseDeleteModal}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
              >
                <Icon icon="carbon:close" className="h-6 w-6" />
              </button>
            </div>
            <div className="p-8 flex flex-col items-center">
              <div className="text-lg font-semibold text-gray-900 mb-4">{deletingLesson?.title}</div>
              <div className="text-gray-600 mb-6 text-center">This action cannot be undone.</div>
              <div className="flex gap-3">
                <button
                  onClick={handleCloseDeleteModal}
                  className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-all duration-200"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-8 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold shadow hover:from-red-700 hover:to-red-800 transition-all duration-200"
                  disabled={submitting}
                >
                  {submitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Details view is now a separate route/component */}
    </div>
  );
};

export default LessonsManagement; 