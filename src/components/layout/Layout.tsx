import { Outlet } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = () => {
    return (
        <div className="flex flex-col min-h-screen bg-background text-text transition-colors duration-300">
            <Navbar />
            <main className="flex-grow">
                <Outlet />
            </main>
            <Footer />
            <Analytics />
        </div>
    );
};

export default Layout;
