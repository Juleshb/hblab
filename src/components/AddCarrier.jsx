import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import axios from "axios";

const AddCarrier = () => {
  const [newCarrier, setNewCarrier] = useState({
    title: "",
    type: "FULL_TIME",
    location: "",
    description: "",
    requirements: [],
    startDate: "",
    endDate: "",
    applicationLink: "",
    imageUrl: "",
    currentRequirement: "",
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCarrier({
      ...newCarrier,
      [name]: value,
    });
  };

  const handleAddRequirement = () => {
    if (newCarrier.currentRequirement.trim()) {
      setNewCarrier({
        ...newCarrier,
        requirements: [
          ...newCarrier.requirements,
          newCarrier.currentRequirement,
        ],
        currentRequirement: "",
      });
    }
  };

  const handleRemoveRequirement = (index) => {
    const updatedRequirements = [...newCarrier.requirements];
    updatedRequirements.splice(index, 1);
    setNewCarrier({
      ...newCarrier,
      requirements: updatedRequirements,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !newCarrier.title ||
      !newCarrier.location ||
      !newCarrier.description ||
      !newCarrier.startDate ||
      !newCarrier.endDate
    ) {
      setSuccessMessage("");
      setErrorMessage("Please fill out all required fields.");
      return;
    }

    try {
      console.log("Submitting carrier:", newCarrier);
      const response = await axios.post("http://localhost:3000/carriers/", {
        title: newCarrier.title ,
        type: newCarrier.type,
        location: newCarrier.location,
        description: newCarrier.description,
        requirements: newCarrier.requirements,
        startDate: newCarrier.startDate,
        endDate: newCarrier.endDate,
        applicationLink: newCarrier.applicationLink,
        imageUrl: newCarrier.imageUrl,
      });
      console.log(response.data);
      setNewCarrier({
        title: "",
        type: "FULL_TIME",
        location: "",
        description: "",
        requirements: [],
        startDate: "",
        endDate: "",
        applicationLink: "",
        imageUrl: "",
        currentRequirement: "",
      });

      setErrorMessage("");
      setSuccessMessage("Job opportunity added successfully!");

      // Auto-clear success message after 4 seconds
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      setSuccessMessage("");
      setErrorMessage("Something went wrong while submitting the form.");
      console.log(error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="m-20 max-w-4xl mx-auto">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => navigate("/careers")}
              className="px-4 py-2 bg-green-800 text-white rounded hover:bg-green-600"
            >
              View All Careers
            </button>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-green-900 mb-6">
              Add New Job Opportunity
            </h1>

            {/* Success/Error Messages */}
            {successMessage && (
              <div className="mb-4 p-4 text-green-800 bg-green-100 border border-green-300 rounded">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="mb-4 p-4 text-red-800 bg-red-100 border border-red-300 rounded">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Job Title */}
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="title">
                    Job Title*
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={newCarrier.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Job Type */}
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="type">
                    Job Type*
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={newCarrier.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="FULL_TIME">Full-time</option>
                    <option value="PART_TIME">Part-time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label
                    className="block text-gray-700 mb-2"
                    htmlFor="location"
                  >
                    Location*
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={newCarrier.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Application Link */}
                <div>
                  <label
                    className="block text-gray-700 mb-2"
                    htmlFor="applicationLink"
                  >
                    Application Link
                  </label>
                  <input
                    type="url"
                    id="applicationLink"
                    name="applicationLink"
                    value={newCarrier.applicationLink}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label
                    className="block text-gray-700 mb-2"
                    htmlFor="startDate"
                  >
                    Start Date*
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={newCarrier.startDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="endDate">
                    End Date*
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={newCarrier.endDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label
                    className="block text-gray-700 mb-2"
                    htmlFor="description"
                  >
                    Description*
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={newCarrier.description}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  ></textarea>
                </div>

                {/* Image Upload */}
                <div className="md:col-span-2">
                  <label
                    className="block text-gray-700 mb-2"
                    htmlFor="imageFile"
                  >
                    Upload Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    id="imageFile"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewCarrier({
                            ...newCarrier,
                            imageUrl: reader.result,
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  {newCarrier.imageUrl && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Image Preview:
                      </p>
                      <img
                        src={newCarrier.imageUrl}
                        alt="Preview"
                        className="w-full max-w-sm rounded shadow"
                      />
                    </div>
                  )}
                </div>

                {/* Requirements */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-2">
                    Requirements*
                  </label>
                  <div className="flex mb-2">
                    <input
                      type="text"
                      value={newCarrier.currentRequirement}
                      onChange={(e) =>
                        setNewCarrier({
                          ...newCarrier,
                          currentRequirement: e.target.value,
                        })
                      }
                      className="flex-grow px-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Add a requirement"
                    />
                    <button
                      type="button"
                      onClick={handleAddRequirement}
                      className="bg-green-900 text-white px-4 py-2 rounded-r-md hover:bg-green-700"
                    >
                      Add
                    </button>
                  </div>

                  <div className="space-y-2">
                    {newCarrier.requirements.map((req, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-100 p-2 rounded"
                      >
                        <span>{req}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRequirement(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Icon icon="carbon:trash-can" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit/Reset Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setNewCarrier({
                      title: "",
                      type: "FULL_TIME",
                      location: "",
                      description: "",
                      requirements: [],
                      startDate: "",
                      endDate: "",
                      applicationLink: "",
                      imageUrl: "",
                      currentRequirement: "",
                    });
                    setSuccessMessage("");
                    setErrorMessage("");
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-900 text-white rounded-md hover:bg-green-700"
                >
                  Submit Job
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AddCarrier;
