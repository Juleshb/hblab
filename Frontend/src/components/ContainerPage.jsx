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
    <div className="bg-white text-green-950">
      <Navbar />
      <main>
        <section id="home">
          <HeroSection />
        </section>
        <section id="companies-trust-us" className="border-y border-green-100 bg-green-50/40">
          <CompaniesTrustUs />
        </section>
        <section id="our-services">
          <OurServices />
        </section>
        <section id="courses" className="bg-green-50/50">
          <Courses />
        </section>
        <section id="about-us">
          <AboutUs />
        </section>
        <section id="our-leadership" className="bg-green-50/40">
          <LeadershipTeam />
        </section>
        <section id="contact-us">
          <ContactUs />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ContainerPage;
