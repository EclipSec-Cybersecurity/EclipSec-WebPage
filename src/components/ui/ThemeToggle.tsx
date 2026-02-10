import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-surface border border-transparent hover:border-border transition-all relative overflow-hidden group"
            aria-label="Toggle Theme"
        >
            <div className="relative z-10">
                {theme === 'dark' ? (
                    <Moon className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                ) : (
                    <Sun className="w-5 h-5 text-amber-500 group-hover:text-primary transition-colors" />
                )}
            </div>
            <motion.div
                className="absolute inset-0 bg-primary/10 rounded-full"
                initial={false}
                animate={{
                    scale: [0.8, 1.2, 1],
                    opacity: [0, 1, 0]
                }}
                transition={{ duration: 0.4 }}
                key={theme}
            />
        </button>
    );
};

export default ThemeToggle;
