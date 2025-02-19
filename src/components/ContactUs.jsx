import React from "react";
import { motion } from "framer-motion";

const ContactUs = () => {
  return (
    <div className="flex items-center justify-center mx-auto w-full text-green-900">
      <div className="flex flex-col items-center gap-5 max-w-screen-xl mx-auto px-5">
        <div>
        <h1 className="lg:text-3xl text-2xl md:font-bold font-black mb-8 lg:w-full text-center">Contact Us</h1>
        </div>

       

<section className="">
  <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-5">
      <div className="lg:col-span-2 lg:py-12">
        <p className="max-w-xl text-lg">
        Let’s get this conversation started. Tell us a bit about yourself and we’ll get in touch as soon as we can.
        </p>

        <div className="mt-8">
          <a href="#" className=" font-bold "> +250 789 028 283 / +250 792 445 913</a><br></br>
          <a href="#" className=" font-bold mt-2 "> hblabltd@gmail.com</a>

          <address className="mt-2 not-italic">or viste our office at Rubavu/Rugero front of Erica Motel</address>
        </div>
      </div>

      <div className="rounded-lg bg-white p-8 shadow-lg lg:col-span-3 lg:p-12">
        <form action="#" className="space-y-4">
          <div>
            <label className="sr-only" htmlFor="name">Name</label>
            <input
              className="w-full rounded-lg border border-green-200 p-3 text-sm"
              placeholder="Name"
              type="text"
              id="name"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="sr-only" htmlFor="email">Email</label>
              <input
                className="w-full rounded-lg border border-green-200 p-3 text-sm"
                placeholder="Email address"
                type="email"
                id="email"
              />
            </div>

            <div>
              <label className="sr-only" htmlFor="phone">Phone</label>
              <input
                className="w-full rounded-lg border border-green-200 p-3 text-sm"
                placeholder="Phone Number"
                type="tel"
                id="phone"
              />
            </div>
          </div>


          <div>
            <label className="sr-only" htmlFor="message">Message</label>

            <textarea
              className="w-full rounded-lg border border-green-200 p-3 text-sm"
              placeholder="Message"
              rows="8"
              id="message"
            ></textarea>
          </div>

          <div className="mt-4">
           
            <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-4 py-3 px-5 bg-transparent border-2 rounded border-green-900 text-green-900 text-sm hover:bg-green-900 hover:text-white hover:font-semibold"
        >
          Submit &rarr;
        </motion.button>
          </div>
        </form>
      </div>
    </div>
  </div>
</section>
      </div>
    </div>
  );
};

export default ContactUs;
