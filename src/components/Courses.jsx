import React from "react";
import { motion } from "framer-motion";
import computer from "../assets/cr.jpg";

const Courses = () => {
  return (
    <div>
      <div className="flex items-center justify-center mx-auto w-full text-green-900">
        <div className="flex flex-col items-center gap-5 max-w-screen-xl mx-auto px-5">
          {/* Title Animation */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="my-3"
          >
            <h1 className="lg:text-3xl text-2xl md:font-bold font-black mb-8 lg:w-full text-center">Career</h1>
          </motion.div>

          <div className="grid lg:grid-cols-2 grid-cols-1 flex justify-center items-center gap-15 p-4">
            {/* Left Section: Course Details */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
              className="flex flex-col lg:py-10 py-3 rounded-lg h-full w-full"
            >
              <div className="space-y-4">
                {[
                  {
                    title: "Software Development",
                    description: [
                      "At HB Lab, we provide hands-on, industry-focused training in Software Development, covering all essential aspects needed to become a skilled developer. Our program includes:",
                      "1. Frontend Development",
                      "Learn to create visually appealing and responsive web applications using modern technologies:",
                      "HTML, CSS, JavaScript, React.js, Vue.js and more – Build structured, styled, and interactive user interfaces and Work with component-based frameworks for scalable applications.",
                      "2. Backend Development",
                      "Understand server-side development and databases to create dynamic web applications:",
                      "Node.js, Express.js, Django, Flask and more – Develop server-side logic and connect your application to databases.",
                      "3. Full Stack Development",
                      "Combine frontend and backend technologies to create full-fledged web applications:",
                      "MERN Stack, MEAN Stack, Django + React and more – Develop end-to-end applications and deploy them to the cloud.",
                      "4. Mobile Development",
                      "Learn to build cross-platform mobile applications using React Native, Flutter and more ...",
                      "5. Software Engineering Best Practices",
                      "Understand software development methodologies, version control, testing, debugging, and more.",
                      "6. Databases",
                      "Learn to work with SQL and NoSQL databases to store and manage application data.",
                      "7. DevOps",
                      "Understand CI/CD, Docker, Kubernetes, and cloud computing to deploy and manage applications.",
                      "8 UX/UI Design",
                      "Learn to design user-friendly interfaces and create engaging user experiences.",
                    ],
                  },
                  {
                    title: "Multimedia",
                    description: [
                      "Graphic design and video editing",
                      "Animation and motion graphics",
                      "Digital content creation"
                    ],
                  },
                  {
                    title: "Networking",
                    description: [
                      "Network setup and security: Learn how to design, implement, and secure networks to protect data and optimize performance.",
                      "Server management: Gain expertise in configuring and maintaining servers, including Linux and Windows environments.",
                      "Cloud computing fundamentals: Understand cloud infrastructure, virtualization, and services such as AWS, Google Cloud, and Azure."
                    ],
                  },
                  {
                    title: "Computer Systems",
                    description: [
                      "Hardware and software troubleshooting",
                      "System administration",
                      "Cybersecurity basics"
                    ],
                  },
                ].map((course, index) => (
                  <motion.details
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: index * 0.2 }}
                    className="group border-s-4 border-green-500 bg-gray-50 p-6 [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer items-center justify-between gap-1.5">
                      <h2 className="text-lg font-medium text-gray-900">{course.title}</h2>
                      <span className="shrink-0 rounded-full bg-white p-1.5 text-gray-900 sm:p-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="size-5 shrink-0 transition duration-300 group-open:-rotate-45"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    </summary>
                    <p className="mt-4 leading-relaxed text-gray-700">
                      {course.description.map((desc, i) => (
                        <span key={i} className="block">{desc}</span>
                      ))}
                    </p>
                  </motion.details>
                ))}
              </div>
            </motion.div>

            {/* Right Section: Image with Animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 }}
              className="flex flex-col rounded-lg h-full w-full items-center justify-center border-Teal"
            >
              <img
                src={computer}
                alt="Computer"
                className="w-full h-auto border-[3px] border-solid bg-Teal rounded-lg"
              />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.7 }}
                className="text-green-900 mt-4 w-full"
              >
                We are committed to growth and upskilling of our technical talent, including developing the next generation of technologists. So we have made long-term investments in upskilling and reskilling partnerships and programs.
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Courses;
