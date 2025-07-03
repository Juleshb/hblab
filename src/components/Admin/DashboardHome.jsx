// pages/DashboardHome.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import StatCard from '../Admin/StatCard';
import LineChart from '../Admin/LineChart';
import PieChart from '../Admin/PieChart';
import BarChart from '../Admin/BarChart';
import ServicesSection from '../Admin/ServicesSection';

const DashboardHome = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCertificates: 0,
    totalCarriers: 0,
    adminCount: 0,
    studentCount: 0,
    applicantCount: 0,
    recentUsers: 0,
    recentCertificates: 0,
    recentCarriers: 0,
    userGrowth: '0%',
    certificateGrowth: '0%'
  });
  const [userGrowthData, setUserGrowthData] = useState({
    labels: [],
    datasets: []
  });
  const [certificateStatusData, setCertificateStatusData] = useState({
    labels: [],
    datasets: []
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [topCourses, setTopCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboard data in parallel
      const [
        statsResponse,
        userGrowthResponse,
        certificateStatusResponse,
        activitiesResponse,
        coursesResponse
      ] = await Promise.all([
        axios.get('http://localhost:3000/api/dashboard/stats'),
        axios.get('http://localhost:3000/api/dashboard/user-growth'),
        axios.get('http://localhost:3000/api/dashboard/certificate-status'),
        axios.get('http://localhost:3000/api/dashboard/recent-activities'),
        axios.get('http://localhost:3000/api/dashboard/top-courses')
      ]);

      setStats(statsResponse.data.stats);
      setUserGrowthData(userGrowthResponse.data);
      setCertificateStatusData(certificateStatusResponse.data);
      setRecentActivities(activitiesResponse.data);
      setTopCourses(coursesResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Mock data for charts that don't have database data yet
  const projectProgressData = {
    labels: ['Planning', 'Development', 'Testing', 'Deployment', 'Completed'],
    datasets: [
      {
        label: 'Projects by Phase',
        data: [3, 5, 2, 3, 2],
        backgroundColor: [
          'rgba(99, 102, 241, 0.7)',
          'rgba(13, 148, 136, 0.7)',
          'rgba(234, 179, 8, 0.7)',
          'rgba(239, 68, 68, 0.7)',
          'rgba(16, 185, 129, 0.7)'
        ],
        borderWidth: 1
      }
    ]
  };

  const monthlyRevenueData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'Revenue',
        data: [35000, 42000, 38000, 45000],
        backgroundColor: 'rgba(13, 148, 136, 0.7)',
        borderColor: 'rgba(13, 148, 136, 1)',
        borderWidth: 2
      },
      {
        label: 'Expenses',
        data: [28000, 32000, 30000, 25000],
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2
      }
    ]
  };

  const userActivityData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Logins',
        data: [320, 450, 380, 510, 490, 210, 180],
        backgroundColor: 'rgba(13, 148, 136, 0.7)',
        borderColor: 'rgba(13, 148, 136, 1)',
        borderWidth: 1
      },
      {
        label: 'Actions',
        data: [1200, 1500, 1350, 1700, 1600, 700, 600],
        backgroundColor: 'rgba(56, 182, 255, 0.7)',
        borderColor: 'rgba(56, 182, 255, 1)',
        borderWidth: 1
      }
    ]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchDashboardData}
          className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-teal-900 mb-6">Dashboard Overview</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          icon="users"
          title="Total Users"
          value={stats.totalUsers}
          trend={stats.userGrowth}
          trendColor="text-green-600"
        />
        <StatCard 
          icon="certificates"
          title="Certificates"
          value={stats.totalCertificates}
          additionalText={`${stats.recentCertificates} recent`}
          trend={stats.certificateGrowth}
          trendColor="text-blue-600"
        />
        <StatCard 
          icon="trainers"
          title="Admins"
          value={stats.adminCount}
          additionalText={`${stats.studentCount} students`}
          trendColor="text-indigo-600"
        />
        <StatCard 
          icon="projects"
          title="Carriers"
          value={stats.totalCarriers}
          additionalText={`${stats.recentCarriers} recent`}
          trendColor="text-purple-600"
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard title="User Growth">
          <LineChart data={userGrowthData} />
        </ChartCard>
        <ChartCard title="Certificate Status">
          <PieChart data={certificateStatusData} />
        </ChartCard>
      </div>

      {/* Additional Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard title="Project Progress">
          <BarChart data={projectProgressData} />
        </ChartCard>
        <ChartCard title="Monthly Revenue vs Expenses">
          <LineChart data={monthlyRevenueData} />
        </ChartCard>
      </div>

      {/* User Activity Chart */}
      <div className="mb-8">
        <ChartCard title="Weekly User Activity">
          <BarChart data={userActivityData} />
        </ChartCard>
      </div>

      {/* Recent Activities and Top Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard title="Recent Activities">
          <div className="space-y-3">
            {recentActivities.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
        <ChartCard title="Top Courses">
          <div className="space-y-3">
            {topCourses.slice(0, 5).map((course, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{course.name}</p>
                  <p className="text-xs text-gray-500">{course.category}</p>
                </div>
                <div className="text-sm font-semibold text-teal-600">{course.enrollments}</div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <ServicesSection />
    </div>
  );
};

const ChartCard = ({ title, children, headerRight }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {headerRight && <div>{headerRight}</div>}
    </div>
    {children}
  </div>
);

export default DashboardHome;