import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import StatCard from './StatCard';
import ProjectsTable from './ProjectsTable';
import ProjectModal from './ProjectModal';
import Sidebar from './Sidebar';
import Header from './Header';

const ProjectsManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((open) => !open);
  const toggleMobileSidebar = () => setMobileSidebarOpen((open) => !open);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view', 'add', 'edit'
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    onHold: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 8;
  const totalPages = Math.ceil(projects.length / projectsPerPage);
  const paginatedProjects = projects.slice((currentPage - 1) * projectsPerPage, currentPage * projectsPerPage);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
        
        // Calculate stats
        const total = data.length;
        const active = data.filter(project => project.status === 'active').length;
        const completed = data.filter(project => project.status === 'completed').length;
        const onHold = data.filter(project => project.status === 'on_hold').length;
        
        setStats({ total, active, completed, onHold });
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = () => {
    setSelectedProject(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          fetchProjects(); // Refresh data
        }
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const handleStatusUpdate = async (projectId, newStatus) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchProjects(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        mobileSidebarOpen={mobileSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        toggleMobileSidebar={toggleMobileSidebar} 
      />
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <Header toggleMobileSidebar={toggleMobileSidebar} activeTab="projects" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Add Project Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleAddProject}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Icon icon="carbon:add" className="h-4 w-4 mr-2" />
              Add Project
            </button>
          </div>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Projects"
              value={stats.total}
              icon="carbon:project"
              color="blue"
              loading={loading}
            />
            <StatCard
              title="Active Projects"
              value={stats.active}
              icon="carbon:play"
              color="green"
              loading={loading}
            />
            <StatCard
              title="Completed"
              value={stats.completed}
              icon="carbon:checkmark"
              color="purple"
              loading={loading}
            />
            <StatCard
              title="On Hold"
              value={stats.onHold}
              icon="carbon:pause"
              color="yellow"
              loading={loading}
            />
          </div>

          {/* Projects Table */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">All Projects</h3>
              <p className="mt-1 text-sm text-gray-500">
                View and manage all company projects
              </p>
            </div>
            <ProjectsTable
              projects={paginatedProjects}
              loading={loading}
              onView={handleViewProject}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              onStatusUpdate={handleStatusUpdate}
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
          </div>
        </div>

        {/* Project Modal */}
        {isModalOpen && (
          <ProjectModal
            project={selectedProject}
            mode={modalMode}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={fetchProjects}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectsManagement; 