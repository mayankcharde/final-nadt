import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import nadtLogo from '../assets/nadt-logo.png';

export default function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const stats = [
        { number: '1,248+', label: 'Active Participants' },
        { number: '892+', label: 'Certificates Issued' },
        { number: '15+', label: 'Training Programs' },
        { number: '98.5%', label: 'Success Rate' },
    ];

    const features = [
        {
            title: 'Secure Authentication',
            description: 'Advanced security with Aadhaar eKYC integration',
            icon: '🔐'
        },
        {
            title: 'Payment Processing',
            description: 'Multiple payment options with instant verification',
            icon: '💳'
        },
        {
            title: 'Certificate Management',
            description: 'Automated certificate generation and verification',
            icon: '📜'
        },
        {
            title: 'Analytics Dashboard',
            description: 'Real-time insights and performance tracking',
            icon: '📊'
        }
    ];

    const handleLearnMore = () => {
        window.open('https://www.nadt.gov.in/BannerPage.aspx', '_blank');
    };

    const handleAccessPlatform = () => {
        window.open('https://www.nadt.gov.in/BannerPage.aspx', '_blank');
    };

    const handleCoursesClick = () => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/dashboard?section=courses');
        } else {
            navigate('/login', { state: { redirect: '/dashboard?section=courses' } });
        }
    };

    return (
        <div className="min-h-screen dark-gradient">
            {/* Navigation */}
            <nav className={`fixed w-full z-50 transition-all duration-500 ${
                scrolled ? 'bg-black/80 backdrop-blur-lg shadow-lg border-b border-gov-border/20' : 'bg-transparent'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-32"> {/* Increased container height */}
                        <div className="flex items-center space-x-6">
                            <img 
                                src={nadtLogo} 
                                alt="NADT Logo" 
                                className="h-28 w-28 md:h-32 md:w-32 object-contain filter brightness-125 hover:brightness-150 
                                        transition-all duration-300 drop-shadow-2xl" /* Increased size more */
                            />
                            <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-display font-bold bg-gradient-to-r 
                                from-white via-white to-gray-300 bg-clip-text text-transparent">
                                National Academy of Direct Taxes
                            </span>
                        </div>
                        
                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-8">
                            <NavLink href="#features" className="text-gov-primary-600"></NavLink>
                            <button 
                                onClick={handleCoursesClick}
                                className="text-gov-primary-600 hover:text-gov-accent-400 font-medium transition-colors duration-200"
                            >
                                Courses
                            </button>
                            <button 
                                onClick={() => navigate('/about')}
                                className="text-gov-primary-600 hover:text-gov-accent-400 font-medium transition-colors duration-200"
                            >
                                About
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="btn-primary"
                            >
                                Sign In
                            </button>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                aria-label="Toggle menu"
                            >
                                <svg
                                    className="h-6 w-6 text-white"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    {isMenuOpen ? (
                                        <path d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Mobile menu */}
                    <div
                        className={`md:hidden transition-all duration-300 ease-in-out ${
                            isMenuOpen
                                ? 'opacity-100 h-64'
                                : 'opacity-0 h-0'
                        } overflow-hidden`}
                    >
                        <div className="px-2 pt-2 pb-3 space-y-1 bg-black/95 backdrop-blur-lg rounded-lg mt-2 shadow-lg border border-gray-800">
                            <MobileNavLink href="#features"></MobileNavLink>
                            <button
                                onClick={handleCoursesClick}
                                className="w-full text-left px-4 py-2 text-white hover:text-gov-primary-400 
                                    font-medium rounded-lg hover:bg-white/10 transition-colors duration-200"
                            >
                                Courses
                            </button>
                            <MobileNavLink href="#about">About</MobileNavLink>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full text-left px-4 py-2 text-white hover:text-gov-primary-400 
                                    font-medium rounded-lg hover:bg-white/10 transition-colors duration-200"
                            >
                                Sign In
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center space-y-8 animate-fade-in">
                        <h1 className="text-4xl md:text-6xl font-display font-bold text-gradient">
                            National Academy of Direct Taxes
                        </h1>
                        <p className="text-xl md:text-2xl text-gov-surface-200 max-w-3xl mx-auto leading-relaxed">
                            Advanced training platform for tax professionals with integrated 
                            payment processing, certificate management, and compliance tracking.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-8 py-4 rounded-xl bg-gov-primary-600 text-gov-surface-50 
                                    font-semibold transition-all duration-300
                                    hover:bg-gov-primary-700 hover:shadow-xl hover:shadow-gov-primary-600/20 
                                    hover:translate-y-[-2px]
                                    active:transform active:scale-98 active:translate-y-0
                                    focus:outline-none focus:ring-2 focus:ring-gov-primary-500 focus:ring-offset-2"
                            >
                                Access Dashboard
                            </button>
                            <button
                                onClick={handleLearnMore}
                                className="px-8 py-4 rounded-xl border-2 border-gov-primary-600 
                                    text-gov-primary-700 font-semibold transition-all duration-300
                                    hover:bg-gov-primary-50 hover:shadow-xl hover:shadow-gov-primary-600/10 
                                    hover:translate-y-[-2px] hover:border-gov-primary-700
                                    active:transform active:scale-98 active:translate-y-0
                                    focus:outline-none focus:ring-2 focus:ring-gov-primary-500 focus:ring-offset-2
                                    flex items-center"
                            >
                                Learn More
                                <svg 
                                    className="w-5 h-5 ml-2" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <div className="py-16 bg-black/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} 
                                className="glass-card p-6 hover-lift border border-white/10 
                                    hover:border-white/20 transition-all duration-300"
                            >
                                <div className="text-3xl font-bold text-gradient">
                                    {stat.number}
                                </div>
                                <div className="text-white/80 font-medium">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-16 bg-black/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center text-gradient mb-12">
                        Comprehensive Training Management
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} 
                                className="glass-card p-6 hover-lift border border-white/10 
                                    hover:border-white/20 group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 
                                    group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="text-4xl mb-4 transform transition-all duration-300 
                                    group-hover:scale-110 relative z-10">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-white/90 transition-all duration-300 
                                    group-hover:text-white relative z-10">
                                    {feature.title}
                                </h3>
                                <p className="text-white/70 group-hover:text-white/90 transition-all duration-300 
                                    relative z-10">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-gov-primary-900 to-black text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
                    <p className="text-xl mb-8">Join thousands of tax professionals who trust NADT for their training and certification needs.</p>
                    <button 
                        onClick={handleAccessPlatform}
                        className="bg-white text-gov-primary-700 px-8 py-4 rounded-xl
                            font-semibold transition-all duration-300 
                            hover:bg-gov-surface-50 hover:shadow-xl hover:shadow-black/10
                            hover:translate-y-[-2px] 
                            active:transform active:scale-98 active:translate-y-0
                            focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2
                            focus:ring-offset-gov-primary-700
                            flex items-center mx-auto"
                    >
                        <span className="flex items-center">
                            Access Platform 
                            <svg 
                                className="w-5 h-5 ml-2" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                                />
                            </svg>
                        </span>
                    </button>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-black text-gov-surface-200 py-12 border-t border-gov-border/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-white font-semibold mb-4 cursor-pointer hover:text-gov-primary-400 transition-colors">
                                NADT Platform
                            </h3>
                            <p className="text-sm cursor-pointer hover:text-gov-primary-400 transition-colors">
                                Advanced training platform for tax professionals with integrated management systems.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-4 cursor-pointer hover:text-gov-primary-400 transition-colors">
                                Features
                            </h3>
                            <ul className="space-y-2 text-sm">
                                {["Payment Processing", "Certificate Management", "Participant Tracking", "Analytics Dashboard"].map((item) => (
                                    <li key={item} className="cursor-pointer hover:text-gov-primary-400 transition-colors">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-4 cursor-pointer hover:text-gov-primary-400 transition-colors">
                                Support
                            </h3>
                            <ul className="space-y-2 text-sm">
                                {["Documentation", "Help Center", "Contact Support", "Training Resources"].map((item) => (
                                    <li key={item} className="cursor-pointer hover:text-gov-primary-400 transition-colors">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-4 cursor-pointer hover:text-gov-primary-400 transition-colors">
                                Legal
                            </h3>
                            <ul className="space-y-2 text-sm">
                                {["Privacy Policy", "Terms of Service", "Compliance", "Security"].map((item) => (
                                    <li key={item} className="cursor-pointer hover:text-gov-primary-400 transition-colors">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Copyright and Developer Credits */}
                    <div className="mt-12 pt-8">
                        <div className="text-center space-y-8">
                            <div className="text-sm text-gov-surface-300 mb-6">
                                © 2025 National Academy of Direct Taxes. All rights reserved.Nagpur
                            </div>
                            
                            {/* Developers Section */}
                            <div className="relative">
                                {/* Decorative Elements */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gov-primary-500/10 to-transparent" />
                                
                                <div className="relative py-8">
                                    <div className="text-lg font-display font-semibold text-gradient mb-8">
                                        Design & Development Team
                                    </div>
                                    
                                    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                                        {/* Developer Card 1 */}
                                        <div className="glass-card p-6 hover:scale-105 transition-all duration-300 w-full max-w-xs
                                            border border-gov-primary-500/20 hover:border-gov-primary-500/40">
                                            <div className="text-xl font-semibold text-gov-primary-400 mb-4">
                                                Mayank Shirish Charde
                                            </div>
                                            <div className="space-y-3">
                                                <a href="mailto:mayankcharde2@gmail.com" 
                                                   className="flex items-center gap-3 text-gov-surface-200 hover:text-gov-primary-400 
                                                   transition-all duration-300 group">
                                                    <svg className="w-5 h-5 text-gov-primary-500 group-hover:scale-110 transition-transform" 
                                                         fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                                    </svg>
                                                    mayankcharde2@gmail.com
                                                </a>
                                                <a href="tel:+919699561658" 
                                                   className="flex items-center gap-3 text-gov-surface-200 hover:text-gov-primary-400 
                                                   transition-all duration-300 group">
                                                    <svg className="w-5 h-5 text-gov-primary-500 group-hover:scale-110 transition-transform" 
                                                         fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                                    </svg>
                                                    +91 9699561658
                                                </a>
                                            </div>
                                        </div>

                                        {/* Developer Card 2 */}
                                        <div className="glass-card p-6 hover:scale-105 transition-all duration-300 w-full max-w-xs
                                            border border-gov-primary-500/20 hover:border-gov-primary-500/40">
                                            <div className="text-xl font-semibold text-gov-primary-400 mb-4">
                                                Yash Rajesh Garad
                                            </div>
                                            <div className="space-y-3">
                                                <a href="mailto: yash.garad27@gmail.com" 
                                                   className="flex items-center gap-3 text-gov-surface-200 hover:text-gov-primary-400 
                                                   transition-all duration-300 group">
                                                    <svg className="w-5 h-5 text-gov-primary-500 group-hover:scale-110 transition-transform" 
                                                         fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                                    </svg>
                                                    yash.garad27@gmail.com
                                                </a>
                                                <a href="tel:+919370471759" 
                                                   className="flex items-center gap-3 text-gov-surface-200 hover:text-gov-primary-400 
                                                   transition-all duration-300 group">
                                                    <svg className="w-5 h-5 text-gov-primary-500 group-hover:scale-110 transition-transform" 
                                                         fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                                    </svg>
                                                    +91 9370471759
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function NavLink({ href, children }) {
    return (
        <a href={href} className="text-gray-600 hover:text-primary-600 
            font-medium transition-colors duration-200">
            {children}
        </a>
    );
}

function MobileNavLink({ href, children }) {
    return (
        <a
            href={href}
            className="block px-4 py-2 text-white hover:text-gov-primary-400 
                font-medium rounded-lg hover:bg-white/10 transition-colors duration-200"
        >
            {children}
        </a>
    );
}

