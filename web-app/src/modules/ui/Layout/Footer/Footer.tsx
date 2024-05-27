import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../Logo/Logo';
import { SOCIAL_LINKS } from '../../../../contants';

const CI_COMMIT_SHA: string = import.meta.env.VITE_CI_COMMIT_SHA;

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0A0A0A] text-white">
      <div className="pt-14 pb-8 px-3 max-w-[1280px] mx-auto flex flex-col gap-32">
        <div className="flex flex-col items-center justify-center gap-8 text-center">
          <Logo withText={false} className="h-14 w-14" />
          <p className="flex flex-col justify-center items-center gap-4">
            <span className="text-3xl font-medium">Want to contribute to 0L Network?</span>
            <span className="text-xl font-normal">
              Join the most open, transparent and community driven network today.
            </span>
          </p>
          <Link
            to={SOCIAL_LINKS.discord.href}
            target="_blank"
            className="px-4 py-2.5 bg-white rounded-sm text-lg text-[#525252] border border-[#E5E5E5] hover:bg-gray-300 hover:text-gray-700 transition-colors duration-150"
          >
            Join our discord
          </Link>
        </div>
        <div className="justify-center md:justify-between border-t border-t-1 flex flex-row flex-wrap pt-8 gap-3">
          <span className="opacity-60 ">
            © {new Date().getFullYear()} 0L Network. All rights reserved.
            <span className="opacity-50"> - {CI_COMMIT_SHA}</span>
          </span>
          <div className="flex gap-2">
            {Object.keys(SOCIAL_LINKS).map((socialKey) => {
              const socialLink = SOCIAL_LINKS[socialKey];
              return (
                <Link
                  to={socialLink.href}
                  key={socialKey}
                  target="_blank"
                  aria-label={socialLink.label}
                >
                  {socialLink.logoSvg}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
