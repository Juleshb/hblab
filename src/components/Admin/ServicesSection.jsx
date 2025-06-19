// components/ServicesSection.jsx
import { motion } from 'framer-motion';
import { FaCode, FaLaptop, FaCog } from 'react-icons/fa';

const ServicesSection = () => {
  const services = [
    {
      icon: <FaCode size={50} className="text-teal-700" />,
      title: "Web & Mobile",
      description: "45 active projects",
      progress: 75,
      bgColor: "bg-teal-100",
      progressColor: "bg-teal-600"
    },
    {
      icon: <FaLaptop size={50} className="text-blue-700" />,
      title: "IT Services",
      description: "32 active contracts",
      progress: 60,
      bgColor: "bg-blue-100",
      progressColor: "bg-blue-600"
    },
    {
      icon: <FaCog size={50} className="text-blue-600" />,
      title: "Courses",
      description: "28 running batches",
      progress: 85,
      bgColor: "bg-blue-50",
      progressColor: "bg-blue-400"
    }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex flex-col items-center gap-5">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="lg:text-3xl text-2xl font-bold mb-8 text-center text-teal-900">
            Our Services Summary
          </h1>
        </motion.div>

        <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 lg:gap-10 gap-3 w-full">
          {services.map((service, index) => (
            <ServiceCard 
              key={index}
              service={service}
              delay={0.2 * (index + 1)}
            />
          ))}
        </div>

        <ViewAllButton />
      </div>
    </div>
  );
};

const ServiceCard = ({ service, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, delay }}
    whileHover={{ scale: 1.05 }}
    className={`flex flex-col ${service.bgColor} px-5 py-5 mx-auto lg:py-10 rounded-lg h-full w-full text-center shadow-lg`}
  >
    <div className="flex justify-center">{service.icon}</div>
    <h3 className="font-bold text-xl p-2">{service.title}</h3>
    <p className="text-gray-700 mb-4">{service.description}</p>
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div 
        className={`${service.progressColor} h-2.5 rounded-full`} 
        style={{width: `${service.progress}%`}}
      ></div>
    </div>
  </motion.div>
);

const ViewAllButton = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay: 0.6 }}
  >
    <motion.button
      whileHover={{ scale: 1.1 }}
      className="mt-4 py-3 px-5 bg-teal-700 text-white rounded-lg text-sm hover:bg-teal-800 font-semibold"
    >
      View All Services &rarr;
    </motion.button>
  </motion.div>
);

export default ServicesSection;