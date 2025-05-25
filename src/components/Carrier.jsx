import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import Navbar from "./Navbar";
import Footer from "./Footer";

const Carrier = () => {
  const navigate = useNavigate();

  const jobOpenings = [
    {
      id: 1,
      title: "Frontend Developer",
      type: "Full-time",
      location: "Kigali, Rwanda",
      description: "We're looking for an experienced React developer to join our team.",
      startDate: "2023-06-15",
      endDate: "2023-07-15",
      requirements: [
        "3+ years experience with React",
        "Proficient in JavaScript/TypeScript",
        "Experience with state management",
        "Familiarity with RESTful APIs"
      ]
    },
    {
      id: 2,
      title: "UX Designer",
      type: "Contract",
      location: "Remote",
      description: "Help us create beautiful user experiences for our products.",
      startDate: "2023-06-20",
      endDate: "2023-07-30",
      requirements: [
        "Portfolio demonstrating UI/UX skills",
        "Experience with Figma or Adobe XD",
        "Understanding of user-centered design"
      ]
    },
    {
      id: 3,
      title: "Backend Engineer",
      type: "Full-time",
      location: "Kigali, Rwanda",
      description: "Node.js developer needed to build our API infrastructure.",
      startDate: "2023-07-01",
      endDate: "2023-08-15",
      requirements: [
        "Strong Node.js and Express experience",
        "Database design (SQL/NoSQL)",
        "API development and security"
      ]
    }
  ];

  const benefits = [
    { icon: "carbon:group", title: "Great Team", description: "Work with talented, passionate people" },
    { icon: "carbon:growth", title: "Growth Opportunities", description: "Continuous learning and development" },
    { icon: "carbon:money", title: "Competitive Pay", description: "We value and reward your contributions" }
  ];

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleApply = (jobId) => {
    navigate(`/apply/${jobId}`); // Navigate to ApplyCarrier with job ID
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-green-900 mb-4">Career Opportunities</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join our team and help build innovative solutions that make a difference.
            </p>
          </div>

          <section className="mb-16">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {jobOpenings.map((job) => (
                <div key={job.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">{job.title}</h2>
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      {job.type}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 flex items-center">
                    <Icon icon="carbon:location" className="mr-2" />
                    {job.location}
                  </p>
                  <p className="text-gray-700 mb-6">{job.description}</p>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Start Date:</span> {formatDate(job.startDate)}
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">End Date:</span> {formatDate(job.endDate)}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleApply(job.id)}
                    className="w-full bg-green-900 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors"
                  >
                    Apply Now
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Join Us?</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <div className="bg-green-100 p-3 rounded-full mr-4">
                    <Icon icon={benefit.icon} className="text-green-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Carrier;