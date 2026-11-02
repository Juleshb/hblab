// Carrier.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import Navbar from './Navbar';
import Footer from './Footer';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import CareerCard from './CareerCard'; // Import the reusable component

const Carrier = () => {
  const navigate = useNavigate();
  const [jobOpenings, setJobOpenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const benefits = [
    { icon: 'carbon:group', title: 'Great Team', description: 'Work with talented, passionate people' },
    { icon: 'carbon:growth', title: 'Growth Opportunities', description: 'Continuous learning and development' },
    { icon: 'carbon:money', title: 'Competitive Pay', description: 'We value and reward your contributions' },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleApply = (jobId) => {
    navigate(`/apply/${jobId}`);
  };

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('http://localhost:3000/api/careers');
        if (response.data && Array.isArray(response.data.careers)) {
        setJobOpenings(response.data.careers);
        } else {
          setJobOpenings([]);
          setError('No careers found.');
        }
      } catch {
        setError('Failed to load jobs');
        setJobOpenings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      {loading && <LoadingSpinner />}

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-green-900 mb-4">Career Opportunities</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join our team and help build innovative solutions that make a difference.
            </p>
          </div>

          {error && <p className="text-center text-red-500">{error}</p>}

          {!loading && !error && (
            <section className="mb-16">
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {jobOpenings.length === 0 ? (
                  <div className="col-span-full text-center text-gray-400">No careers found.</div>
                ) : (
                  jobOpenings.map((job) => (
                    <CareerCard
                      key={job.id}
                      career={job}
                      BACKEND_URL={'http://localhost:3000'} // You might want to use an env variable here
                      actions={
                        <button
                          onClick={() => handleApply(job.id)}
                          className="w-full bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ease-in-out shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          Apply Now
                        </button>
                      }
                    />
                  ))
                )}
              </div>
            </section>
          )}

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
