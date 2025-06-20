import { useNavigate } from 'react-router-dom';

export default function About() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gov-surface-900 to-black">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-black/80 backdrop-blur-lg shadow-lg border-b border-gov-border/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <span className="text-2xl font-display font-bold bg-gradient-to-r from-white via-white to-gray-300 
                            bg-clip-text text-transparent">
                            National Academy of Direct Taxes
                        </span>
                        <button
                            onClick={() => navigate('/')}
                            className="px-4 py-2 rounded-xl bg-white/5 text-white 
                                font-semibold transition-all duration-300 
                                hover:bg-white/10 hover:scale-105 border border-white/10"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
                <div className="space-y-12">
                    {/* Hero Section */}
                    <div className="text-center">
                        <h1 className="text-4xl font-display font-bold text-gradient mb-6">
                            About NADT Platform
                        </h1>
                        <div className="w-24 h-1 bg-gradient-to-r from-gov-primary-500 to-gov-accent-400 mx-auto rounded-full mb-8"></div>
                    </div>

                    {/* Main Content */}
                    <div className="space-y-8">
                        {/* Introduction */}
                        <div className="glass-card p-8 animate-fade-in">
                            <p className="text-white/90 leading-relaxed">
                                The National Academy of Direct Taxes (NADT) has developed an advanced Integrated Fee & Certification Payment Portal to modernize and streamline the management of training programs, seminars, and certification courses for IRS officers, income tax officials, and other stakeholders.
                            </p>
                        </div>

                        {/* Background */}
                        <div className="glass-card p-8">
                            <p className="text-white/80 leading-relaxed">
                                Previously, the fee payment and certification processes were partially manual and scattered across multiple platforms—leading to delays, miscommunication, and administrative overhead. Our new platform solves these challenges by offering a centralized, automated, and user-friendly system built with modern web technologies.
                            </p>
                        </div>

                        {/* Features */}
                        <div className="glass-card p-8">
                            <h2 className="text-2xl font-display font-bold text-gradient mb-6">
                                Platform Features
                            </h2>
                            <p className="text-white/80 mb-4">
                                Powered by Razorpay, the portal enables:
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "Instant online payments with multiple payment options",
                                    "Auto-generation of GST-compliant receipts and invoices",
                                    "Automated certificate delivery upon course completion and payment confirmation",
                                    "Real-time admin dashboards for revenue tracking, analytics, and reporting",
                                    "Streamlined refund processing with clear approval workflows"
                                ].map((feature, index) => (
                                    <li key={index} className="flex items-center space-x-3 text-white/70">
                                        <span className="text-gov-primary-400">•</span>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Conclusion */}
                        <div className="glass-card p-8">
                            <p className="text-white/80 leading-relaxed">
                                This digital transformation enhances transparency, accuracy, and efficiency—benefiting both participants and NADT administrators. With this initiative, NADT takes a significant step forward in delivering tech-driven, secure, and seamless services to its users.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
