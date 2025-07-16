import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import StatCard from './StatCard';
import ProjectsTable from './ProjectsTable';
import ProjectModal from './ProjectModal';

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
    <div>
      {/* Add Project Button, Stats Cards, Projects Table, etc. */}
    </div>
  );
};

export default ProjectsManagement; 