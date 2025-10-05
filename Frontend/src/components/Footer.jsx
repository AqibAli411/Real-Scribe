import {
  Github,
  Facebook,
  Instagram,
  Linkedin,
  Heart,
  Code,
  Mail,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12 pb-4">
        {/* Main Content */}
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* About Section */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-blue-500">Aqib Ali</h3>
            <p className="leading-relaxed text-gray-600">
              Full Stack Web Developer passionate about creating exceptional
              digital experiences. I love turning ideas into reality through
              clean, efficient code and innovative solutions.
            </p>
            <div className="flex items-center space-x-2 text-blue-500">
              <Code size={18} />
              <span className="text-sm font-medium">
                Always learning, always building
              </span>
            </div>
          </div>

          {/* Links & Credentials */}
          <div className="flex flex-col items-start justify-center space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">
              Connect With Me
            </h4>
            <div className="space-y-3">
              <a
                href="https://github.com/AqibAli411"
                className="group flex items-center space-x-3 text-gray-600 transition-colors duration-200 hover:text-blue-500"
              >
                <Github
                  size={20}
                  className="transition-transform duration-200 group-hover:scale-110"
                />
                <span>GitHub</span>
              </a>
              <a
                href="https://www.linkedin.com/in/aqib-halepoto-1b1876329/"
                className="group flex items-center space-x-3 text-gray-600 transition-colors duration-200 hover:text-blue-500"
              >
                <Linkedin
                  size={20}
                  className="transition-transform duration-200 group-hover:scale-110"
                />
                <span>LinkedIn</span>
              </a>
              <a
                href="#"
                className="group flex items-center space-x-3 text-gray-600 transition-colors duration-200 hover:text-blue-500"
              >
                <Facebook
                  size={20}
                  className="transition-transform duration-200 group-hover:scale-110"
                />
                <span>Facebook</span>
              </a>
              <a
                href="#"
                className="group flex items-center space-x-3 text-gray-600 transition-colors duration-200 hover:text-blue-500"
              >
                <Instagram
                  size={20}
                  className="transition-transform duration-200 group-hover:scale-110"
                />
                <span>Instagram</span>
              </a>
            </div>
          </div>

          {/* Contact & Additional Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">
              Get In Touch
            </h4>
            <div className="space-y-3">
              <a
                href="mailto:"
                className="group flex items-center space-x-3 text-gray-600 transition-colors duration-200 hover:text-blue-500"
              >
                <Mail
                  size={20}
                  className="transition-transform duration-200 group-hover:scale-110"
                />
                <span>Email me</span>
              </a>
              <div className="pt-2">
                <p className="text-sm text-gray-500">
                  Available for freelance projects and collaborations
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            {/* Open Source & Love */}
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span>MIT Open Source</span>
              </div>
              <div className="group flex items-center space-x-2">
                <span>Made with</span>
                <Heart
                  size={16}
                  className="text-red-500 transition-transform duration-200 group-hover:scale-110 group-hover:animate-pulse"
                />
                <span>and lots of Tea</span>
              </div>
            </div>

            {/* Copyright */}
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} Aqib Ali. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
