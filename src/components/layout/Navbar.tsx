import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Shield, Globe } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';

const Navbar = () => {
    const { t, i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Toggle Language
    const toggleLanguage = () => {
        const newLang = i18n.language === 'es' ? 'en' : 'es';
        i18n.changeLanguage(newLang);
    };

    // Handle Scroll Effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: t('common.services'), path: '/servicios' },
        { name: t('common.about'), path: '/nosotros' },
        { name: t('common.contact'), path: '/contacto' },
    ];

    return (
        <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-background/95 backdrop-blur-md border-b border-border shadow-lg' : 'bg-transparent'}`}>
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <NavLink to="/" className="flex items-center gap-2 group">
                        <Shield className="w-8 h-8 text-primary group-hover:text-accent transition-colors" />
                        <span className="text-xl font-bold text-heading tracking-wide">EclipSec</span>
                    </NavLink>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        <div className="flex gap-6">
                            {navLinks.map((link) => (
                                <NavLink
                                    key={link.path}
                                    to={link.path}
                                    className={({ isActive }) => `text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-text'}`}
                                >
                                    {link.name}
                                </NavLink>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 border-l border-border pl-4">
                            {/* Theme Toggle */}
                            <ThemeToggle />

                            {/* Language Toggle */}
                            <button
                                onClick={toggleLanguage}
                                className="flex items-center gap-1 text-sm text-text hover:text-heading transition-colors"
                                aria-label="Toggle Language"
                            >
                                <Globe className="w-4 h-4" />
                                <span className="uppercase">{i18n.language}</span>
                            </button>
                        </div>

                        {/* CTA Button */}
                        <NavLink
                            to="/contacto"
                            className="px-4 py-2 text-sm font-bold text-background bg-primary hover:bg-primaryHover rounded transition-colors shadow-[0_0_10px_rgba(211,47,47,0.5)] hover:shadow-[0_0_15px_rgba(211,47,47,0.8)]"
                        >
                            {t('common.contact_secure')}
                        </NavLink>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-4">
                        <ThemeToggle />
                        <button onClick={toggleLanguage} className="text-text">
                            <span className="uppercase font-bold text-xs">{i18n.language}</span>
                        </button>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-text hover:text-primary transition-colors"
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Dropdown */}
            {isOpen && (
                <div className="md:hidden bg-surface border-b border-border">
                    <div className="flex flex-col p-4 gap-4">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsOpen(false)}
                                className={({ isActive }) => `text-base font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-text'}`}
                            >
                                {link.name}
                            </NavLink>
                        ))}
                        <NavLink
                            to="/contacto"
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 text-center text-sm font-bold text-background bg-primary hover:bg-primaryHover rounded transition-colors"
                        >
                            {t('common.contact_secure')}
                        </NavLink>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
