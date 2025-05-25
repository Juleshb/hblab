import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import Navbar from './Navbar';
import Footer from './Footer';

const ApplyCarrier = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - in a real app, you'd fetch this from an API
  const jobDetails = {
    1: {
      title: "Frontend Developer",
      type: "Full-time",
      location: "Kigali, Rwanda",
      description: "We're looking for an experienced React developer to join our team.",
      requirements: [
        "3+ years experience with React",
        "Proficient in JavaScript/TypeScript",
        "Experience with state management (Redux, Context API)",
        "Familiarity with RESTful APIs"
      ],
      startDate: "June 15, 2023",
      endDate: "July 15, 2023",
     image: "../assets/cr.jpg"
    },
    2: {
      title: "UX Designer",
      type: "Contract",
      location: "Remote",
      description: "Help us create beautiful user experiences for our products.",
      requirements: [
        "Portfolio demonstrating UI/UX skills",
        "Experience with Figma or Adobe XD",
        "Understanding of user-centered design",
        "2+ years professional experience"
      ],
      startDate: "June 20, 2023",
      endDate: "July 30, 2023",
      ApplicationLink: "https://recruitment.mifotra.gov.rw/"
    },
    3: {
      title: "Backend Engineer",
      type: "Full-time",
      location: "Kigali, Rwanda",
      description: "Node.js developer needed to build our API infrastructure.",
      requirements: [
        "Strong Node.js and Express experience",
        "Database design (SQL/NoSQL)",
        "API development and security",
        "Experience with cloud services"
      ],
      startDate: "July 1, 2023",
      endDate: "August 15, 2023",
      ApplicationLink: "https://recruitment.mifotra.gov.rw/"
    }
  };

  const job = jobDetails[id];

  if (!job) {
    return <div className="text-center py-20">Job not found</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto">
     
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Job Details */}
            <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-2xl font-bold text-green-900 mb-4">{job.title}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">Job Type</h3>
                  <p className="text-gray-600">{job.type}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Location</h3>
                  <p className="text-gray-600">{job.location}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Application Period</h3>
                  <p className="text-gray-600">
                    {job.startDate} - {job.endDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Image instead of Form */}
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm ">
                  <div>
                  <h3 className="font-medium text-gray-900">Requirements</h3>
                  <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    {job.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
               <div className="py-2">
  <h3 className="font-medium text-gray-900">Application Link</h3>
  <a 
    href={job.ApplicationLink} 
    target="_blank" 
    rel="noopener noreferrer"
    className="text-green-600 py-2 hover:text-green-800 hover:underline"
  >
    Click here to apply 
  </a>
</div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ApplyCarrier;
