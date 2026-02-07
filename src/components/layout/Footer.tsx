import { Github, Linkedin, Instagram } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-surface border-t border-border py-8 mt-auto">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">

                    {/* Brand & Tagline */}
                    <div className="text-center md:text-left">
                        <h3 className="text-xl font-bold text-heading">EclipSec</h3>
                        <p className="text-sm text-textMuted mt-1">
                            "{t('hero.title')}"
                        </p>
                    </div>

                    {/* Social Links */}
                    <div className="flex gap-4">
                        <a href="https://github.com/ElRetrillo" target="_blank" rel="noopener noreferrer" className="text-text hover:text-primary transition-colors">
                            <Github className="w-5 h-5" />
                        </a>
                        <a href="https://www.linkedin.com/in/eclipsec/" target="_blank" rel="noopener noreferrer" className="text-text hover:text-primary transition-colors">
                            <Linkedin className="w-5 h-5" />
                        </a>
                        <a href="https://instagram.com/eclipsec_cl" target="_blank" rel="noopener noreferrer" className="text-text hover:text-primary transition-colors">
                            <Instagram className="w-5 h-5" />
                        </a>
                    </div>

                    {/* Copyright */}
                    <div className="text-sm text-textMuted">
                        &copy; {currentYear} EclipSec E.I.R.L.
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
