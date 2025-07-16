import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';

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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsLesson, setDetailsLesson] = useState(null);
  const [topics, setTopics] = useState([]);
  const [topicForm, setTopicForm] = useState({ title: '', assignment: '', document: null });
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicError, setTopicError] = useState('');

  // Assignment state
  const [assignmentsByTopic, setAssignmentsByTopic] = useState({});
  const [showAssignmentForm, setShowAssignmentForm] = useState({}); // topicId: boolean
  const [assignmentForm, setAssignmentForm] = useState({ question: '', type: 'MULTIPLE_CHOICE', mark: '', options: [''], correctOption: 0 });
  const [editingAssignment, setEditingAssignment] = useState(null); // assignmentId
  const [assignmentError, setAssignmentError] = useState('');

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/lessons/all');
      setLessons(res.data.lessons || []);
    } catch (err) {
      setLessons([]);
      console.error('Error fetching lessons:', err);
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
      await axios.post('http://localhost:3000/api/lessons', {
        title: form.title,
        description: form.description,
      });
      setShowModal(false);
      fetchLessons();
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
      await axios.put(`http://localhost:3000/api/lessons/${editForm.id}`, {
        title: editForm.title,
        description: editForm.description,
      });
      setShowEditModal(false);
      fetchLessons();
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
      await axios.delete(`http://localhost:3000/api/lessons/${deletingLesson.id}`);
      setShowDeleteModal(false);
      setDeletingLesson(null);
      fetchLessons();
    } catch (err) {
      alert('Failed to delete lesson');
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch topics for a lesson
  const fetchTopics = async (lessonId) => {
    try {
      const res = await axios.get(`http://localhost:3000/api/lessons/${lessonId}/topics`);
      setTopics(res.data);
    } catch (err) {
      setTopics([]);
    }
  };

  const handleOpenDetailsModal = async (lesson) => {
    setDetailsLesson(lesson);
    setShowDetailsModal(true);
    await fetchTopics(lesson.id);
  };
  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setDetailsLesson(null);
    setTopics([]);
    setEditingTopic(null);
    setTopicForm({ title: '', assignment: '', document: null });
    setTopicError('');
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
    if (!topicForm.title.trim() || !topicForm.assignment.trim()) {
      setTopicError('Title and assignment are required.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('title', topicForm.title);
      formData.append('assignment', topicForm.assignment);
      if (topicForm.document) formData.append('document', topicForm.document);
      await axios.post(`http://localhost:3000/api/lessons/${detailsLesson.id}/topics`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTopicForm({ title: '', assignment: '', document: null });
      fetchTopics(detailsLesson.id);
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
      await axios.put(`http://localhost:3000/api/lessons/topics/${editingTopic}`, formData, {
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
      await axios.delete(`http://localhost:3000/api/lessons/topics/${id}`);
      fetchTopics(detailsLesson.id);
    } catch (err) {
      setTopicError('Failed to delete topic');
    }
  };

  // Fetch assignments for a topic
  const fetchAssignments = async (topicId) => {
    try {
      const res = await axios.get(`http://localhost:3000/api/lessons/topics/${topicId}/assignments`);
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
  const handleAssignmentSubmit = async (e, topicId) => {
    e.preventDefault();
    setAssignmentError('');
    if (!assignmentForm.question.trim() || !assignmentForm.mark) {
      setAssignmentError('Question and mark are required.');
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
        await axios.put(`http://localhost:3000/api/lessons/assignments/${editingAssignment}`, data);
      } else {
        await axios.post(`http://localhost:3000/api/lessons/topics/${topicId}/assignments`, data);
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
      await axios.delete(`http://localhost:3000/api/lessons/assignments/${assignmentId}`);
      fetchAssignments(topicId);
    } catch (err) {
      setAssignmentError('Failed to delete assignment');
    }
  };

  return (
    <div className="p-2 sm:p-4 lg:p-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Lessons Management</h1>
          <p className="text-gray-600 mt-1 text-xs sm:text-sm">Manage and add new lessons for your organization.</p>
        </div>
            <button
              onClick={handleOpenModal}
          className="inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-medium transition-all duration-200 shadow-lg hover:shadow-xl text-xs sm:text-sm"
            >
          <Icon icon="carbon:add" className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
          Add Lesson
            </button>
          </div>
      <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
        {lessons.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No lessons found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {lessons.map((lesson) => (
              <div key={lesson.id} className="bg-white/70 backdrop-blur rounded-2xl border border-green-100 shadow p-4 flex flex-col relative group transition-all duration-200 hover:shadow-2xl">
                <div className="font-bold text-base sm:text-lg text-green-900 mb-2">{lesson.title}</div>
                <div className="text-xs sm:text-sm text-gray-600 mb-3 flex-1">{lesson.description}</div>
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleOpenDetailsModal(lesson)}
                    className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-all duration-200"
                  >
                    <Icon icon="carbon:view" className="h-4 w-4 mr-1" /> View Details
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(lesson)}
                    className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-all duration-200"
                  >
                    <Icon icon="carbon:edit" className="h-4 w-4 mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => handleOpenDeleteModal(lesson)}
                    className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-all duration-200"
                  >
                    <Icon icon="carbon:trash-can" className="h-4 w-4 mr-1" /> Delete
                  </button>
                </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
      {showDetailsModal && detailsLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" onClick={e => { if (e.target === e.currentTarget) handleCloseDetailsModal(); }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="relative bg-white/90 rounded-3xl shadow-2xl w-full max-w-2xl mx-auto border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Icon icon="carbon:view" className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Lesson Details</h2>
                  <p className="text-green-100 text-sm mt-1">{detailsLesson.title}</p>
                </div>
              </div>
              <button
                onClick={handleCloseDetailsModal}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
              >
                <Icon icon="carbon:close" className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <div className="font-bold text-green-900 text-lg mb-1">Description</div>
                <div className="text-gray-700 mb-4">{detailsLesson.description}</div>
              </div>
              <div>
                <div className="font-bold text-green-900 text-lg mb-2">Topics</div>
                {topics.length === 0 ? (
                  <div className="text-gray-500">No topics found.</div>
                ) : (
                  <div className="space-y-3">
                    {topics.map((topic) => (
                      <div key={topic.id} className="bg-green-50 border border-green-100 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                        {editingTopic === topic.id ? (
                          <form onSubmit={handleUpdateTopic} className="flex flex-col sm:flex-row gap-2 w-full" encType="multipart/form-data">
                            <input type="text" name="title" value={topicForm.title} onChange={handleTopicFormChange} placeholder="Topic Title" className="border rounded px-2 py-1 w-full sm:w-32 focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                            <input type="text" name="assignment" value={topicForm.assignment} onChange={handleTopicFormChange} placeholder="Assignment (include mark)" className="border rounded px-2 py-1 w-full sm:w-40 focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                            <input type="file" name="document" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" onChange={handleTopicFormChange} className="border rounded px-2 py-1 w-full sm:w-40 focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                            <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition">Save</button>
                            <button type="button" onClick={() => setEditingTopic(null)} className="bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition">Cancel</button>
                          </form>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                            <div className="font-semibold text-green-900 w-full sm:w-32">{topic.title}</div>
                            <div className="text-green-700 w-full sm:w-20">Mark: {topic.mark}</div>
                            {topic.documentUrl && <a href={topic.documentUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 underline w-full sm:w-40">Document</a>}
                            {topic.assignment && <div className="text-green-700 w-full sm:w-40">Assignment: {topic.assignment}</div>}
                            <button onClick={() => handleEditTopic(topic)} className="bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition">Edit</button>
                            <button onClick={() => handleDeleteTopic(topic.id)} className="bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition">Delete</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <form onSubmit={editingTopic ? handleUpdateTopic : handleAddTopic} className="flex flex-col sm:flex-row gap-2 mt-4" encType="multipart/form-data">
                  <input type="text" name="title" value={topicForm.title} onChange={handleTopicFormChange} placeholder="Topic Title" className="border rounded px-2 py-1 w-full sm:w-32 focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                  <input type="text" name="assignment" value={topicForm.assignment} onChange={handleTopicFormChange} placeholder="Assignment (include mark)" className="border rounded px-2 py-1 w-full sm:w-40 focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                  <input type="file" name="document" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" onChange={handleTopicFormChange} className="border rounded px-2 py-1 w-full sm:w-40 focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                  <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition">{editingTopic ? 'Save' : 'Add Topic'}</button>
                  {editingTopic && <button type="button" onClick={() => setEditingTopic(null)} className="bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition">Cancel</button>}
                </form>
                {topicError && <div className="text-red-600 text-sm mt-2">{topicError}</div>}
              </div>
              <div>
                <div className="font-bold text-green-900 text-lg mb-2">Assignments</div>
                {topics.length === 0 ? (
                  <div className="text-gray-500">No topics found to add assignments.</div>
                ) : (
                  <div className="space-y-3">
                    {topics.map((topic) => (
                      <div key={topic.id} className="bg-green-50 border border-green-100 rounded-lg p-3 flex flex-col gap-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="font-semibold text-green-900 w-full sm:w-32">{topic.title}</div>
                          <div className="text-green-700 w-full sm:w-20">Mark: {topic.mark}</div>
                          <button
                            onClick={() => {
                              fetchAssignments(topic.id);
                              handleShowAssignmentForm(topic.id);
                            }}
                            className="mt-2 text-green-700 underline text-xs self-start"
                          >
                            {showAssignmentForm[topic.id] ? 'Hide Assignments' : 'Show/Add Assignments'}
                          </button>
                        </div>
                        {showAssignmentForm[topic.id] && (
                          <div className="mt-2 bg-white border border-green-100 rounded p-2">
                            <div className="font-bold text-green-900 text-sm mb-2">Assignments</div>
                            {/* Assignment List */}
                            {assignmentsByTopic[topic.id] && assignmentsByTopic[topic.id].length > 0 ? (
                              <div className="space-y-2 mb-2">
                                {assignmentsByTopic[topic.id].map((assignment) => (
                                  <div key={assignment.id} className="border border-green-200 rounded p-2 flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-green-800">{assignment.type.replace('_', ' ')}</span>
                                      <span className="text-green-700">Mark: {assignment.mark}</span>
                                      <button onClick={() => handleEditAssignment(assignment, topic.id)} className="text-xs text-green-600 underline">Edit</button>
                                      <button onClick={() => handleDeleteAssignment(assignment.id, topic.id)} className="text-xs text-red-600 underline">Delete</button>
                                    </div>
                                    <div className="text-green-900">Q: {assignment.question}</div>
                                    {assignment.type === 'MULTIPLE_CHOICE' && assignment.options && (
                                      <div className="ml-4">
                                        <div className="text-xs text-green-700">Options:</div>
                                        <ul className="list-disc ml-6">
                                          {assignment.options.map((opt, idx) => (
                                            <li key={opt.id} className={assignment.correctOption === idx ? 'font-bold text-green-800' : ''}>{opt.text}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 mb-2">No assignments yet.</div>
                            )}
                            {/* Assignment Form */}
                            <form onSubmit={(e) => handleAssignmentSubmit(e, topic.id)} className="space-y-2">
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input type="text" name="question" value={assignmentForm.question} onChange={handleAssignmentFormChange} placeholder="Question" className="border rounded px-2 py-1 w-full sm:w-1/2 focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                                <select name="type" value={assignmentForm.type} onChange={handleAssignmentTypeChange} className="border rounded px-2 py-1 w-full sm:w-1/4 focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                  <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                                  <option value="SHORT_ANSWER">Short Answer</option>
                                  <option value="ESSAY">Essay</option>
                                </select>
                                <input type="number" name="mark" value={assignmentForm.mark} onChange={handleAssignmentFormChange} placeholder="Mark" className="border rounded px-2 py-1 w-full sm:w-1/4 focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                              </div>
                              {assignmentForm.type === 'MULTIPLE_CHOICE' && (
                                <div className="space-y-1">
                                  <div className="flex flex-col gap-1">
                                    {assignmentForm.options.map((opt, idx) => (
                                      <div key={idx} className="flex items-center gap-2">
                                        <input type="text" value={opt} onChange={(e) => handleOptionChange(idx, e.target.value)} placeholder={`Option ${idx + 1}`} className="border rounded px-2 py-1 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                                        <input type="radio" name="correctOption" checked={assignmentForm.correctOption === idx} onChange={() => setAssignmentForm((prev) => ({ ...prev, correctOption: idx }))} />
                                        <span className="text-xs">Correct</span>
                                        {assignmentForm.options.length > 1 && (
                                          <button type="button" onClick={() => handleRemoveOption(idx)} className="text-xs text-red-600 underline">Remove</button>
                                        )}
                                      </div>
                                    ))}
                                    <button type="button" onClick={handleAddOption} className="text-xs text-green-600 underline mt-1">Add Option</button>
                                  </div>
                                </div>
                              )}
                              {assignmentError && <div className="text-red-600 text-xs">{assignmentError}</div>}
                              <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition">{editingAssignment ? 'Save Assignment' : 'Add Assignment'}</button>
                              {editingAssignment && <button type="button" onClick={() => { setEditingAssignment(null); setAssignmentForm({ question: '', type: 'MULTIPLE_CHOICE', mark: '', options: [''], correctOption: 0 }); }} className="bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition ml-2">Cancel</button>}
                            </form>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
              </div>
            </div>
          )}
    </div>
  );
};

export default LessonsManagement; 