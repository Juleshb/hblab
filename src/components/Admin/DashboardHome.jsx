// pages/DashboardHome.jsx
import StatCard from '../Admin/StatCard';
import LineChart from '../Admin/LineChart';
import PieChart from '../Admin/PieChart';
import BarChart from '../Admin/BarChart';
import ServicesSection from '../Admin/ServicesSection';

const DashboardHome = () => {
  const stats = {
    users: 1245,
    trainers: 56,
    certificates: 892,
    pending: 23,
    projects: 15,
    active: 8,
    revenue: 125000,
    expenses: 85000
  };

  // Chart data configurations
  const userGrowthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'New Users',
        data: [65, 59, 80, 81, 56, 72, 95],
        fill: true,
        backgroundColor: 'rgba(13, 148, 136, 0.1)',
        borderColor: 'rgba(13, 148, 136, 1)',
        tension: 0.4,
        borderWidth: 2
      },
      {
        label: 'Active Users',
        data: [45, 49, 60, 71, 46, 52, 75],
        fill: true,
        backgroundColor: 'rgba(56, 182, 255, 0.1)',
        borderColor: 'rgba(56, 182, 255, 1)',
        tension: 0.4,
        borderWidth: 2
      }
    ]
  };

  const certificateStatusData = {
    labels: ['Verified', 'Pending', 'Expired', 'Revoked'],
    datasets: [
      {
        data: [720, 120, 42, 10],
        backgroundColor: [
          'rgba(13, 148, 136, 0.8)',
          'rgba(249, 168, 37, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(156, 163, 175, 0.8)'
        ],
        borderWidth: 1
      }
    ]
  };

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

  return (
    <div>
      <h2 className="text-2xl font-bold text-teal-900 mb-6">Dashboard Overview</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          icon="users"
          title="Total Users"
          value={stats.users}
          trend="+12.5% from last month"
          trendColor="text-green-600"
        />
        <StatCard 
          icon="certificates"
          title="Certificates"
          value={stats.certificates}
          additionalText={`${stats.pending} pending`}
          trendColor="text-red-600"
        />
        <StatCard 
          icon="trainers"
          title="Trainers"
          value={stats.trainers}
          trend="+2 new this week"
          trendColor="text-blue-600"
        />
        <StatCard 
          icon="projects"
          title="Active Projects"
          value={stats.active}
          additionalText={`${stats.projects} total`}
          trendColor="text-indigo-600"
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

      {/* Secondary Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <ChartCard title="Project Progress">
          <BarChart data={projectProgressData} options={{ plugins: { legend: { display: false } } }} />
        </ChartCard>
        <ChartCard 
          title="Financial Overview" 
          headerRight={<span className="text-sm text-teal-600 font-medium">
            Net: ${(stats.revenue - stats.expenses).toLocaleString()}
          </span>}
        >
          <BarChart 
            data={monthlyRevenueData} 
            options={{
              scales: {
                y: {
                  ticks: {
                    callback: function(value) {
                      return '$' + value.toLocaleString();
                    }
                  }
                }
              }
            }} 
          />
        </ChartCard>
        <ChartCard title="Weekly User Activity">
          <BarChart data={userActivityData} />
        </ChartCard>
      </div>

      <ServicesSection />
    </div>
  );
};

const ChartCard = ({ title, children, headerRight }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {headerRight || (
        <select className="text-sm border rounded px-2 py-1">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>Last 90 Days</option>
        </select>
      )}
    </div>
    {children}
  </div>
);

export default DashboardHome;