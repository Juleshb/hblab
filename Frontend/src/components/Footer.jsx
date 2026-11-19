import { Link } from "react-router-dom";
import Logo from "../assets/logo-white.png";
import { Icon } from "@iconify/react";

function Footer() {
  return (
    <footer className="bg-green-950 text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <img src={Logo} alt="HBLab" className="h-12 w-auto" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-green-100">
            High-Technology Builder Lab Ltd. Technology, multimedia, and professional training in Rubavu, Gisenyi.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green-200">Visit</p>
          <p className="mt-4 text-sm">Rubavu, Gisenyi, Rwanda</p>
          <a className="mt-2 block text-sm text-green-50 hover:underline" href="mailto:info@hblab.rw">info@hblab.rw</a>
          <a className="block text-sm text-green-50 hover:underline" href="mailto:studio@hblab.rw">studio@hblab.rw</a>
          <a className="mt-2 block text-sm text-green-50 hover:underline" href="tel:+250789028283">+250 789 028 283</a>
          <a className="block text-sm text-green-50 hover:underline" href="tel:+250792697730">+250 792 697 730</a>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green-200">Company</p>
          <div className="mt-4 space-y-2 text-sm">
            <Link className="block text-green-50 hover:underline" to="/training">Professional training</Link>
            <Link className="block text-green-50 hover:underline" to="/internship">Internship</Link>
            <Link className="block text-green-50 hover:underline" to="/certificate">Certificate check</Link>
            <Link className="block text-green-50 hover:underline" to="/studio">HB Studio</Link>
            <Link className="block text-green-50 hover:underline" to="/leadership">Leadership</Link>
            <Link className="block text-green-50 hover:underline" to="/careers">Careers</Link>
            <a className="block text-green-50 hover:underline" href="/#contact-us">Contact</a>
            <Link className="block text-green-50 hover:underline" to="/privacy-policy">Privacy Policy</Link>
            <Link className="block text-green-50 hover:underline" to="/terms-of-use">Terms of Use</Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green-200">Follow</p>
          <div className="mt-4 flex gap-3">
            <a href="https://www.instagram.com/hblabrw" aria-label="Instagram" className="rounded-full border border-white/20 p-2 hover:bg-white/10"><Icon icon="proicons:instagram" width="20" height="20" /></a>
            <a href="https://x.com/HabaruremaJules" aria-label="X" className="rounded-full border border-white/20 p-2 hover:bg-white/10"><Icon icon="line-md:twitter-x-alt" width="20" height="20" /></a>
            <a href="https://www.linkedin.com/company/hb-lab/" aria-label="LinkedIn" className="rounded-full border border-white/20 p-2 hover:bg-white/10"><Icon icon="ri:linkedin-fill" width="20" height="20" /></a>
            <a href="https://www.tiktok.com/@hblabrw" aria-label="TikTok" className="rounded-full border border-white/20 p-2 hover:bg-white/10"><Icon icon="ic:sharp-tiktok" width="20" height="20" /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-green-200">
        High-Technology Builder Lab Ltd
      </div>
    </footer>
  );
}

export default Footer;
