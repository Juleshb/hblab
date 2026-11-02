import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';

const LessonDetailsView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [topics, setTopics] = useState([]);
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicForm, setTopicForm] = useState({ title: '', document: null });
  const [topicError, setTopicError] = useState('');
  const [topicSuccess, setTopicSuccess] = useState('');
  const [assignmentsByTopic, setAssignmentsByTopic] = useState({});
  const [showAssignmentForm, setShowAssignmentForm] = useState({});
  const [assignmentForm, setAssignmentForm] = useState({ question: '', type: 'MULTIPLE_CHOICE', mark: '', options: [''], correctOption: 0 });
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [assignmentError, setAssignmentError] = useState('');

  useEffect(() => {
    fetchLesson();
    fetchTopics();
    // eslint-disable-next-line
  }, [id]);

  const fetchLesson = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/api/lessons/${id}/details`);
      setLesson(res.data);
    } catch (err) {
      setLesson(null);
    }
  };
  const fetchTopics = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/api/lessons/${id}/topics`);
      setTopics(res.data);
      // Fetch assignments for all topics
      res.data.forEach(topic => fetchAssignments(topic.id));
    } catch (err) {
      setTopics([]);
    }
  };
  const fetchAssignments = async (topicId) => {
    try {
      const res = await axios.get(`http://localhost:3000/api/lessons/topics/${topicId}/assignments`);
      setAssignmentsByTopic((prev) => ({ ...prev, [topicId]: res.data }));
    } catch (err) {
      setAssignmentsByTopic((prev) => ({ ...prev, [topicId]: [] }));
    }
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
      await axios.post(`http://localhost:3000/api/lessons/${id}/topics`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTopicForm({ title: '', document: null });
      setTopicSuccess('Topic added successfully!');
      fetchTopics();
      setTimeout(() => setTopicSuccess(''), 2000);
    } catch (err) {
      setTopicError('Failed to add topic');
    }
  };
  const handleDeleteTopic = async (topicId) => {
    try {
      await axios.delete(`http://localhost:3000/api/lessons/topics/${topicId}`);
      fetchTopics();
    } catch (err) {
      setTopicError('Failed to delete topic');
    }
  };

  // Assignment CRUD
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
  const getTopicStats = (topicId) => {
    const assignments = assignmentsByTopic[topicId] || [];
    const totalMark = assignments.reduce((sum, a) => sum + (parseInt(a.mark) || 0), 0);
    const questionCount = assignments.length;
    return { totalMark, questionCount };
  };
  const getAllowedMark = (topic) => parseInt(topic.mark) || 0;
  const wouldExceedMark = (topic, mark, editingAssignmentId = null) => {
    const assignments = assignmentsByTopic[topic.id] || [];
    let currentTotal = assignments.reduce((sum, a) => sum + (parseInt(a.mark) || 0), 0);
    if (editingAssignmentId) {
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
    <div className="w-full max-w-4xl mx-auto mt-8 mb-8 bg-white/90 rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
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
        </div>
        {/* Add Topic Form */}
        <form onSubmit={handleAddTopic} className="bg-green-50 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-end gap-4 border border-green-100 shadow">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Topic Name</label>
            <input
              type="text"
              name="title"
              value={topicForm.title}
              onChange={handleTopicFormChange}
              required
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">PDF File</label>
            <input
              type="file"
              name="document"
              accept="application/pdf"
              onChange={handleTopicFormChange}
              required
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Icon icon="carbon:add" className="h-5 w-5 mr-2" /> Add Topic
          </button>
        </form>
        {topicError && <div className="text-red-600 text-sm mb-2">{topicError}</div>}
        {topicSuccess && <div className="text-green-700 text-sm mb-2">{topicSuccess}</div>}
        {/* Topics List */}
        <div className="space-y-6">
          {topics.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No topics found.</div>
          ) : (
            topics.map((topic) => {
              const stats = getTopicStats(topic.id);
              return (
                <div key={topic.id} className="bg-white rounded-xl border border-green-100 shadow p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <Icon icon="carbon:document-pdf" className="h-6 w-6 text-green-700" />
                      <div className="font-bold text-green-900 text-lg">{topic.title}</div>
                      {topic.document && (
                        <a
                          href={`http://localhost:3000/uploads/${topic.document}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs font-semibold"
                        >
                          <Icon icon="carbon:view" className="h-4 w-4 mr-1" /> View PDF
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>Questions: <span className="font-bold text-green-800">{stats.questionCount}</span></span>
                      <span>Total Mark: <span className="font-bold text-green-800">{stats.totalMark}</span></span>
                      <button
                        onClick={() => handleDeleteTopic(topic.id)}
                        className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-semibold ml-2"
                      >
                        <Icon icon="carbon:trash-can" className="h-4 w-4 mr-1" /> Delete
                      </button>
                    </div>
                  </div>
                  {/* Assignments List */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-green-800">Assignments</div>
                      <button
                        onClick={() => handleShowAssignmentForm(topic.id)}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400"
                      >
                        <Icon icon="carbon:add" className="h-4 w-4 mr-1" /> {showAssignmentForm[topic.id] ? 'Cancel' : 'Add Assignment'}
                      </button>
                    </div>
                    {assignmentError && <div className="text-red-600 text-sm mb-2">{assignmentError}</div>}
                    {showAssignmentForm[topic.id] && (
                      <form onSubmit={(e) => handleAssignmentSubmit(e, topic.id)} className="bg-green-50 rounded-xl p-4 mb-4 border border-green-100">
                        <div className="mb-2">
                          <label className="block text-sm font-medium mb-1">Question</label>
                          <input
                            type="text"
                            name="question"
                            value={assignmentForm.question}
                            onChange={handleAssignmentFormChange}
                            required
                            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                        <div className="mb-2">
                          <label className="block text-sm font-medium mb-1">Type</label>
                          <select
                            name="type"
                            value={assignmentForm.type}
                            onChange={handleAssignmentTypeChange}
                            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          >
                            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                            <option value="SHORT_ANSWER">Short Answer</option>
                          </select>
                        </div>
                        <div className="mb-2">
                          <label className="block text-sm font-medium mb-1">Mark</label>
                          <input
                            type="number"
                            name="mark"
                            value={assignmentForm.mark}
                            onChange={handleAssignmentFormChange}
                            required
                            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                        {assignmentForm.type === 'MULTIPLE_CHOICE' && (
                          <div className="mb-2">
                            <label className="block text-sm font-medium mb-1">Options</label>
                            {assignmentForm.options.map((opt, idx) => (
                              <div key={idx} className="flex items-center gap-2 mb-1">
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                                  className="flex-1 border rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                                <input
                                  type="radio"
                                  name="correctOption"
                                  checked={assignmentForm.correctOption === idx}
                                  onChange={() => setAssignmentForm((prev) => ({ ...prev, correctOption: idx }))}
                                />
                                <span className="text-xs">Correct</span>
                                {assignmentForm.options.length > 1 && (
                                  <button type="button" onClick={() => handleRemoveOption(idx)} className="text-red-500 hover:text-red-700"><Icon icon="carbon:close" className="h-4 w-4" /></button>
                                )}
                              </div>
                            ))}
                            <button type="button" onClick={handleAddOption} className="text-green-700 hover:underline text-xs mt-1"><Icon icon="carbon:add" className="h-4 w-4 inline" /> Add Option</button>
                          </div>
                        )}
                        <button
                          type="submit"
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 font-medium transition-all duration-200 shadow-lg hover:shadow-xl mt-2"
                        >
                          <Icon icon="carbon:save" className="h-5 w-5 mr-2" /> {editingAssignment ? 'Save Changes' : 'Add Assignment'}
                        </button>
                      </form>
                    )}
                    {/* Assignment List */}
                    <div className="space-y-2">
                      {(assignmentsByTopic[topic.id] || []).length === 0 ? (
                        <div className="text-gray-400 text-sm">No assignments yet.</div>
                      ) : (
                        assignmentsByTopic[topic.id].map((assignment) => (
                          <div key={assignment.id} className="bg-green-50 rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-green-100">
                            <div>
                              <div className="font-semibold text-green-900">{assignment.question}</div>
                              <div className="text-xs text-gray-600">Type: {assignment.type.replace('_', ' ')}, Mark: {assignment.mark}</div>
                              {assignment.type === 'MULTIPLE_CHOICE' && assignment.options && (
                                <div className="mt-1 text-xs text-gray-700">
                                  Options: {assignment.options.map((opt, idx) => (
                                    <span key={idx} className={assignment.correctOption === idx ? 'font-bold text-green-700' : ''}>
                                      {opt.text}{idx < assignment.options.length - 1 ? ', ' : ''}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 mt-2 md:mt-0">
                              <button
                                onClick={() => handleEditAssignment(assignment, topic.id)}
                                className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs font-semibold"
                              >
                                <Icon icon="carbon:edit" className="h-4 w-4 mr-1" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteAssignment(assignment.id, topic.id)}
                                className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-semibold"
                              >
                                <Icon icon="carbon:trash-can" className="h-4 w-4 mr-1" /> Delete
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonDetailsView; 