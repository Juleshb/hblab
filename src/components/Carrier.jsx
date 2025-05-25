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
      description: "We're looking for an experienced React developer to join our team."
    },
    {
      id: 2,
      title: "UX Designer",
      type: "Contract",
      location: "Remote",
      description: "Help us create beautiful user experiences for our products."
    },
    {
      id: 3,
      title: "Backend Engineer",
      type: "Full-time",
      location: "Kigali, Rwanda",
      description: "Node.js developer needed to build our API infrastructure."
    }
  ];

  const benefits = [
    { icon: "carbon:group", title: "Great Team", description: "Work with talented, passionate people" },
    { icon: "carbon:growth", title: "Growth Opportunities", description: "Continuous learning and development" },
    { icon: "carbon:money", title: "Competitive Pay", description: "We value and reward your contributions" }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-green-900 mb-4">Career Opportunities</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join our team and help build innovative solutions that make a difference.
            </p>
          </div>

          {/* Jobs Grid */}
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
                  <button
                    onClick={() => navigate(`/apply/${job.id}`)}
                    className="w-full bg-green-900 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors"
                  >
                    Apply Now
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Benefits Section */}
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