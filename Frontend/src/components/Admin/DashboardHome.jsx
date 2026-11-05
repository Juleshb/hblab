import { apiOrigin } from '../../apiOrigin';
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
        axios.get(`${apiOrigin}/api/dashboard/stats`),
        axios.get(`${apiOrigin}/api/dashboard/user-growth`),
        axios.get(`${apiOrigin}/api/dashboard/certificate-status`),
        axios.get(`${apiOrigin}/api/dashboard/recent-activities`),
        axios.get(`${apiOrigin}/api/dashboard/top-courses`)
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
          'rgba(34,197,94,0.7)', // green-500
          'rgba(22,163,74,0.7)', // green-600
          'rgba(132,204,22,0.7)', // green-400
          'rgba(187,247,208,0.7)', // green-100
          'rgba(21,128,61,0.7)' // green-700
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
        backgroundColor: 'rgba(34,197,94,0.7)',
        borderColor: 'rgba(22,163,74,1)',
        borderWidth: 2
      },
      {
        label: 'Expenses',
        data: [28000, 32000, 30000, 25000],
        backgroundColor: 'rgba(187,247,208,0.7)',
        borderColor: 'rgba(21,128,61,1)',
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
        backgroundColor: 'rgba(34,197,94,0.7)',
        borderColor: 'rgba(22,163,74,1)',
        borderWidth: 1
      },
      {
        label: 'Actions',
        data: [1200, 1500, 1350, 1700, 1600, 700, 600],
        backgroundColor: 'rgba(132,204,22,0.7)',
        borderColor: 'rgba(21,128,61,1)',
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
      <h2 className="text-xl font-bold text-green-900 mb-4 tracking-tight">Dashboard Overview</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard 
          icon="users"
          title="Total Users"
          value={stats.totalUsers}
          trend={stats.userGrowth}
          trendColor="text-green-600"
          className="glass-card"
        />
        <StatCard 
          icon="certificates"
          title="Certificates"
          value={stats.totalCertificates}
          additionalText={`${stats.recentCertificates} recent`}
          trend={stats.certificateGrowth}
          trendColor="text-green-600"
          className="glass-card"
        />
        <StatCard 
          icon="trainers"
          title="Admins"
          value={stats.adminCount}
          additionalText={`${stats.studentCount} students`}
          trendColor="text-green-600"
          className="glass-card"
        />
        <StatCard 
          icon="projects"
          title="Carriers"
          value={stats.totalCarriers}
          additionalText={`${stats.recentCarriers} recent`}
          trendColor="text-green-600"
          className="glass-card"
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        <ChartCard title="User Growth" className="glass-card">
          <LineChart data={userGrowthData} />
        </ChartCard>
        <ChartCard title="Certificate Status" className="glass-card">
          <PieChart data={certificateStatusData} />
        </ChartCard>
      </div>

      {/* Additional Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        <ChartCard title="Project Progress" className="glass-card">
          <BarChart data={projectProgressData} />
        </ChartCard>
        <ChartCard title="Monthly Revenue vs Expenses" className="glass-card">
          <LineChart data={monthlyRevenueData} />
        </ChartCard>
      </div>

      {/* User Activity Chart */}
      <div className="mb-4">
        <ChartCard title="Weekly User Activity" className="glass-card">
          <BarChart data={userActivityData} />
        </ChartCard>
      </div>

      {/* Recent Activities and Top Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        <ChartCard title="Recent Activities" className="glass-card">
          <div className="space-y-2">
            {recentActivities.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-white/30 rounded-lg backdrop-blur-md">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-900">{activity.action}</p>
                  <p className="text-[10px] text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
        <ChartCard title="Top Courses" className="glass-card">
          <div className="space-y-2">
            {topCourses.slice(0, 5).map((course, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white/30 rounded-lg backdrop-blur-md">
                <div>
                  <p className="text-xs font-medium text-gray-900">{course.name}</p>
                  <p className="text-[10px] text-gray-500">{course.category}</p>
                </div>
                <div className="text-xs font-semibold text-teal-600">{course.enrollments}</div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
      <div className="mt-2">
      <ServicesSection />
      </div>
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