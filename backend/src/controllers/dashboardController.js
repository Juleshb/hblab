const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get total counts
    const totalUsers = await prisma.user.count();
    const totalCertificates = await prisma.certificate.count();
    const totalCarriers = await prisma.carrier.count();
    
    // Get users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });

    const adminCount = usersByRole.find(u => u.role === 'ADMIN')?._count.role || 0;
    const studentCount = usersByRole.find(u => u.role === 'STUDENT')?._count.role || 0;
    const applicantCount = usersByRole.find(u => u.role === 'APPLICANT')?._count.role || 0;

    // Get recent certificates (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentCertificates = await prisma.certificate.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Get recent users (last 30 days)
    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Get recent carriers (last 30 days)
    const recentCarriers = await prisma.carrier.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Calculate growth percentages (mock data for now)
    const userGrowth = recentUsers > 0 ? ((recentUsers / totalUsers) * 100).toFixed(1) : 0;
    const certificateGrowth = recentCertificates > 0 ? ((recentCertificates / totalCertificates) * 100).toFixed(1) : 0;

    res.json({
      stats: {
        totalUsers,
        totalCertificates,
        totalCarriers,
        adminCount,
        studentCount,
        applicantCount,
        recentUsers,
        recentCertificates,
        recentCarriers,
        userGrowth: `${userGrowth}%`,
        certificateGrowth: `${certificateGrowth}%`
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

// Get user growth data for charts
const getUserGrowthData = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      _count: {
        id: true
      }
    });

    // Process data for chart format
    const labels = [];
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString('default', { month: 'short' });
      labels.push(monthName);
      
      const monthCount = monthlyData.filter(item => {
        const itemDate = new Date(item.createdAt);
        return itemDate.getMonth() === date.getMonth() && 
               itemDate.getFullYear() === date.getFullYear();
      }).reduce((sum, item) => sum + item._count.id, 0);
      
      data.push(monthCount);
    }

    res.json({
      labels,
      datasets: [
        {
          label: 'New Users',
          data,
          fill: true,
          backgroundColor: 'rgba(13, 148, 136, 0.1)',
          borderColor: 'rgba(13, 148, 136, 1)',
          tension: 0.4,
          borderWidth: 2
        }
      ]
    });
  } catch (error) {
    console.error('User growth data error:', error);
    res.status(500).json({ error: 'Failed to fetch user growth data' });
  }
};

// Get certificate status data
const getCertificateStatusData = async (req, res) => {
  try {
    const totalCertificates = await prisma.certificate.count();
    
    // For now, we'll use mock data since we don't have status field
    // In a real scenario, you'd add a status field to the Certificate model
    const verified = Math.floor(totalCertificates * 0.8);
    const pending = Math.floor(totalCertificates * 0.15);
    const expired = Math.floor(totalCertificates * 0.04);
    const revoked = Math.floor(totalCertificates * 0.01);

    res.json({
      labels: ['Verified', 'Pending', 'Expired', 'Revoked'],
      datasets: [
        {
          data: [verified, pending, expired, revoked],
          backgroundColor: [
            'rgba(13, 148, 136, 0.8)',
            'rgba(249, 168, 37, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(156, 163, 175, 0.8)'
          ],
          borderWidth: 1
        }
      ]
    });
  } catch (error) {
    console.error('Certificate status data error:', error);
    res.status(500).json({ error: 'Failed to fetch certificate status data' });
  }
};

// Get recent activities
const getRecentActivities = async (req, res) => {
  try {
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    const recentCertificates = await prisma.certificate.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        recipientName: true,
        courseName: true,
        createdAt: true
      }
    });

    const recentCarriers = await prisma.carrier.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        type: true,
        createdAt: true
      }
    });

    // Combine and sort activities
    const activities = [
      ...recentUsers.map(user => ({
        id: user.id,
        type: 'user',
        action: 'User registered',
        title: user.name || user.email,
        subtitle: user.role,
        time: user.createdAt
      })),
      ...recentCertificates.map(cert => ({
        id: cert.id,
        type: 'certificate',
        action: 'Certificate generated',
        title: cert.recipientName,
        subtitle: cert.courseName,
        time: cert.createdAt
      })),
      ...recentCarriers.map(carrier => ({
        id: carrier.id,
        type: 'carrier',
        action: 'Carrier posted',
        title: carrier.title,
        subtitle: carrier.type,
        time: carrier.createdAt
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

    res.json(activities);
  } catch (error) {
    console.error('Recent activities error:', error);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
};

// Get top courses (based on certificates)
const getTopCourses = async (req, res) => {
  try {
    const courseStats = await prisma.certificate.groupBy({
      by: ['courseName'],
      _count: {
        courseName: true
      },
      orderBy: {
        _count: {
          courseName: 'desc'
        }
      },
      take: 5
    });

    res.json(courseStats.map(course => ({
      name: course.courseName,
      count: course._count.courseName
    })));
  } catch (error) {
    console.error('Top courses error:', error);
    res.status(500).json({ error: 'Failed to fetch top courses' });
  }
};

module.exports = {
  getDashboardStats,
  getUserGrowthData,
  getCertificateStatusData,
  getRecentActivities,
  getTopCourses
}; 