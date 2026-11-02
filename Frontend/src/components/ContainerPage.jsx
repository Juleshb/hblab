import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import HeroSection from "./HeroSection";
import OurServices from "./OurServices";
import AboutUs from "./AboutUs";
import Courses from "./Courses";
import ContactUs from "./ContactUs";
import CompaniesTrustUs from "./CompaniesTrustUs";
import LeadershipTeam from "./LeadershipTeam";

const ContainerPage = () => {
  return (
    <div className="bg-gray-200">
      
      <section>
        <Navbar/>
      </section>
      <section id="home" className="overflow-hidden ">
        <HeroSection />
      </section>
     
      <section id="about-us" className="grid min-h-screen place-items-center w-full px-5 my-5">
        <AboutUs />
      </section>
     
      <section id="courses" className="grid min-h-screen mx-auto place-items-center w-full">
        <Courses />
      </section>

      
      
      <section
        id="our-services"
        className="grid place-items-center w-full px-5 my-5"
      >
        <OurServices />
      </section>
      <section
        id="companies-trust-us"
        className="grid place-items-center w-full px-5 my-5"
      >
        <CompaniesTrustUs />
      </section>

      <section id="our-leadership" className="mx-auto place-items-center w-full px-5 my-5">
        <LeadershipTeam />
      </section>
      <section id="contact-us" className="mx-auto place-items-center w-full px-5 my-5">
        <ContactUs />
      </section>
      
      <section className="grid mx-auto place-items-center w-full">
        <Footer />
      </section>
    </div>
  );
};

export default ContainerPage;
