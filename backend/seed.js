const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await prisma.certificate.deleteMany();
    await prisma.carrier.deleteMany();
    await prisma.user.deleteMany();

    console.log('🗑️  Cleared existing data');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@hblab.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN'
      }
    });

    // Create sample users
    const users = [];
    for (let i = 1; i <= 50; i++) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await prisma.user.create({
        data: {
          email: `student${i}@example.com`,
          password: hashedPassword,
          name: `Student ${i}`,
          role: i % 3 === 0 ? 'APPLICANT' : 'STUDENT'
        }
      });
      users.push(user);
    }

    console.log('👥 Created users');

    // Create sample carriers
    const carrierTitles = [
      'Software Developer Intern',
      'Data Analyst Position',
      'UX/UI Designer',
      'Marketing Specialist',
      'Project Manager',
      'Quality Assurance Engineer',
      'DevOps Engineer',
      'Product Manager',
      'Business Analyst',
      'Frontend Developer'
    ];

    const carrierTypes = ['Full-time', 'Part-time', 'Internship', 'Contract'];
    const locations = ['Kigali, Rwanda', 'Remote', 'Nairobi, Kenya', 'Kampala, Uganda'];

    for (let i = 0; i < 25; i++) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30));
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 90) + 30);

      await prisma.carrier.create({
        data: {
          title: carrierTitles[Math.floor(Math.random() * carrierTitles.length)],
          type: carrierTypes[Math.floor(Math.random() * carrierTypes.length)],
          location: locations[Math.floor(Math.random() * locations.length)],
          description: `This is a sample carrier description for position ${i + 1}. We are looking for talented individuals to join our team.`,
          requirements: [
            'Bachelor\'s degree in Computer Science or related field',
            'Strong problem-solving skills',
            'Excellent communication skills',
            'Team player with leadership qualities'
          ],
          startDate,
          endDate,
          applicationLink: `https://example.com/apply/${i + 1}`,
          imageUrl: 'https://via.placeholder.com/300x200'
        }
      });
    }

    console.log('💼 Created carriers');

    // Create sample certificates
    const courseNames = [
      'Web Development Fundamentals',
      'Data Science Essentials',
      'UX/UI Design Principles',
      'Digital Marketing Strategy',
      'Project Management Professional',
      'Cybersecurity Basics',
      'Mobile App Development',
      'Cloud Computing Fundamentals',
      'Business Analytics',
      'Artificial Intelligence Introduction'
    ];

    const skills = [
      ['HTML', 'CSS', 'JavaScript'],
      ['Python', 'R', 'SQL'],
      ['Figma', 'Adobe XD', 'Sketch'],
      ['SEO', 'Social Media Marketing', 'Content Creation'],
      ['Agile', 'Scrum', 'Risk Management'],
      ['Network Security', 'Ethical Hacking', 'Cryptography'],
      ['React Native', 'Flutter', 'Swift'],
      ['AWS', 'Azure', 'Google Cloud'],
      ['Tableau', 'Power BI', 'Excel'],
      ['Machine Learning', 'Deep Learning', 'Neural Networks']
    ];

    for (let i = 0; i < 100; i++) {
      const courseIndex = Math.floor(Math.random() * courseNames.length);
      const completionDate = new Date();
      completionDate.setDate(completionDate.getDate() - Math.floor(Math.random() * 365));
      
      const startDate = new Date(completionDate);
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 90) - 30);

      await prisma.certificate.create({
        data: {
          recipientName: users[Math.floor(Math.random() * users.length)].name,
          email: users[Math.floor(Math.random() * users.length)].email,
          courseName: courseNames[courseIndex],
          duration: `${Math.floor(Math.random() * 6) + 2} months`,
          dateRange: `${startDate.toLocaleDateString()} - ${completionDate.toLocaleDateString()}`,
          completionDate,
          skills: skills[courseIndex],
          certificateId: `CERT-${String(i + 1).padStart(6, '0')}`
        }
      });
    }

    console.log('🎓 Created certificates');

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Created:
    - 1 Admin user (admin@hblab.com / admin123)
    - ${users.length} Students/Applicants
    - 25 Carriers
    - 100 Certificates`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed(); 