import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProductCard from './ProductCard';
import ProductCard1 from './ProductCard1';
import ProductCard2 from './ProductCard2';
import { useDashboard } from './DashboardContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import DownloadReceiptButton from './DownloadReceiptButton';

// Update chart colors
const CHART_COLORS = {
    enrollments: '#00fff5',  // cyan
    revenue: '#ff00ea',      // pink
    recent: '#fffc00',       // yellow
    grid: 'rgba(255, 255, 255, 0.2)',
    text: '#ffffff',
    axis: 'rgba(255, 255, 255, 0.5)'
};

// Replace CyberGradients with simple gradients
const ChartGradients = () => (
    <defs>
        {Object.entries({
            enrollments: ['#3b82f6', '#60a5fa'],
            revenue: ['#10b981', '#34d399'],
            recent: ['#8b5cf6', '#a78bfa']
        }).map(([key, colors]) => (
            <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors[0]} stopOpacity={0.8}/>
                <stop offset="100%" stopColor={colors[1]} stopOpacity={0.8}/>
            </linearGradient>
        ))}
    </defs>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
        <div className="custom-tooltip bg-black/90 backdrop-blur-lg border border-cyan-500/20 p-4 rounded-lg shadow-xl 
            animate-pulse-slow relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 animate-gradient-xy"></div>
            <div className="relative z-10">
                <p className="text-white font-bold mb-2 text-shadow-cyber">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div 
                            className="w-3 h-3 rounded-full animate-pulse"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-white/80">
                            {entry.name}: {entry.name === 'Revenue' ? `₹${entry.value}` : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
// Color definition moved to CYBERPUNK_COLORS above


export default function Dashboard() {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [payments, setPayments] = useState([]);
    const [dashboardStats, setDashboardStats] = useState({
        totalCourses: 0,
        activeEnrollments: 0,
        completionRate: 0,
        coursesChange: 0,
        enrollmentsChange: 0,
        completionChange: 0
    });
    const [purchasedCourses, setPurchasedCourses] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [users, setUsers] = useState([]);
    const [userStatsLoading, setUserStatsLoading] = useState(false);
    const [userStats, setUserStats] = useState({
        total: 0,
        activeToday: 0,
        newThisWeek: 0
    });
    const [coursePopularity, setCoursePopularity] = useState([]);
    const [receipts, setReceipts] = useState([]);
    const { shouldRefresh } = useDashboard();

    useEffect(() => {
        const fetchCoursePopularity = async () => {
            if (activeSection === 'analytics') {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) return;

                    const userId = JSON.parse(atob(token.split('.')[1])).userId;

                    // Fetch both current stats and payment history
                    const [statsResponse, historyResponse] = await Promise.all([
                        fetch(`${import.meta.env.VITE_BACKEND_HOST_URL}/api/payment/course-popularity`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        }),
                        fetch(`${import.meta.env.VITE_BACKEND_HOST_URL}/api/payment/history/${userId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        })
                    ]);

                    await statsResponse.json(); // Ignore stats data as it's not used
                    const historyData = await historyResponse.json();

                    // Process payment history to get course statistics
                    const courseStats = {
                        'Python Course': { enrollments: 0, revenue: 0 },
                        'Java Course': { enrollments: 0, revenue: 0 },
                        'Web Development Course': { enrollments: 0, revenue: 0 }
                    };

                    historyData.forEach(payment => {
                        const courseName = payment.courseDetails.name;
                        if (courseStats[courseName]) {
                            courseStats[courseName].enrollments++;
                            courseStats[courseName].revenue += payment.courseDetails.amount;
                        }
                    });

                    // Format data for the chart
                    const formattedData = Object.entries(courseStats).map(([name, stats]) => ({
                        name: name === 'Web Development Course' ? 'Web Development' : name,
                        enrollments: stats.enrollments,
                        amount: stats.revenue,
                        recentPurchases: historyData
                            .filter(p => p.courseDetails.name === name && 
                                       new Date(p.date) > new Date(Date.now() - 24 * 60 * 60 * 1000))
                            .length // Count purchases in last 24 hours
                    }));

                    setCoursePopularity(formattedData);
                } catch (error) {
                    console.error('Error fetching course popularity:', error);
                    setCoursePopularity([
                        { name: 'Python Course', enrollments: 0, amount: 0, recentPurchases: 0 },
                        { name: 'Java Course', enrollments: 0, amount: 0, recentPurchases: 0 },
                        { name: 'Web Development', enrollments: 0, amount: 0, recentPurchases: 0 }
                    ]);
                }
            }
        };

        fetchCoursePopularity();
        // Set up polling for real-time updates
        const interval = setInterval(fetchCoursePopularity, 5000); // Update every 5 seconds

        return () => clearInterval(interval);
    }, [activeSection]);

    useEffect(() => {
        // Check if user is authenticated
        if (!localStorage.getItem('token')) {
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        const fetchPayments = async () => {
            if (activeSection === 'payments') {
                try {
                    const userId = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).userId;
                    const response = await fetch(`${import.meta.env.VITE_BACKEND_HOST_URL}/api/payment/history/${userId}`);
                    const data = await response.json();
                    setPayments(data);
                } catch (error) {
                    console.error('Error fetching payments:', error);
                    toast.error('Failed to load payment history');
                }
            }
        };
        fetchPayments();
    }, [activeSection]);

    useEffect(() => {
        const fetchDashboardStats = async () => {
            if (activeSection === 'dashboard') {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        navigate('/login');
                        return;
                    }

                    const userId = JSON.parse(atob(token.split('.')[1])).userId;
                    if (!userId) {
                        throw new Error('Invalid user ID');
                    }

                    const response = await fetch(
                        `${import.meta.env.VITE_BACKEND_HOST_URL}/api/payment/stats/${userId}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();
                    if (!data) {
                        throw new Error('No data received');
                    }

                    setDashboardStats(data);
                } catch (error) {
                    console.error('Error fetching dashboard stats:', error);
                    toast.error('Unable to load dashboard statistics');
                    setDashboardStats({
                        totalCourses: 0,
                        activeEnrollments: 0,
                        completionRate: 0,
                        coursesChange: 0,
                        enrollmentsChange: 0,
                        completionChange: 0
                    });
                }
            }
        };

        fetchDashboardStats();
    }, [activeSection, navigate, shouldRefresh]);

    const fetchPurchasedCourses = async () => {
        if (activeSection === 'mycourses') {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No auth token');
                }

                const userId = JSON.parse(atob(token.split('.')[1])).userId;
                
                const response = await fetch(
                    `${import.meta.env.VITE_BACKEND_HOST_URL}/api/payment/purchased-courses/${userId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();
                console.log('Fetched courses:', data); // Debug log

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to fetch courses');
                }

                setPurchasedCourses(data.courses || []);
            } catch (error) {
                console.error('Error fetching purchased courses:', error);
                toast.error('Failed to load purchased courses');
                setPurchasedCourses([]);
            }
        }
    };

    const fetchCertificates = async () => {
        if (activeSection === 'certificates') {
            try {
                const userId = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).userId;
                const response = await fetch(
                    `${import.meta.env.VITE_BACKEND_HOST_URL}/api/certificate/user/${userId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );
                const data = await response.json();
                setCertificates(data.certificates || []);
            } catch (error) {
                console.error('Error fetching certificates:', error);
                toast.error('Failed to load certificates');
            }
        }
    };

    useEffect(() => {
        const fetchUsers = async () => {
            if (activeSection === 'participants') {
                setUserStatsLoading(true);
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        navigate('/login');
                        return;
                    }

                    const response = await fetch(
                        `${import.meta.env.VITE_BACKEND_HOST_URL}/api/auth/users`, 
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();
                    if (data.success) {
                        setUsers(data.users);
                        
                        // Calculate stats
                        const now = new Date();
                        const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
                        
                        setUserStats({
                            total: data.users.length,
                            activeToday: data.users.length, // This would need backend support for actual active users
                            newThisWeek: data.users.filter(user => 
                                new Date(user.joinedDate) > oneWeekAgo
                            ).length
                        });
                    } else {
                        throw new Error(data.error || 'Failed to fetch users');
                    }
                } catch (error) {
                    console.error('Error fetching users:', error);
                    toast.error('Failed to load participants');
                } finally {
                    setUserStatsLoading(false);
                }
            }
        };

        fetchUsers();
    }, [activeSection, navigate]);

    useEffect(() => {
        fetchPurchasedCourses();
        fetchCertificates();
    }, [activeSection, shouldRefresh]); // Add shouldRefresh dependency

    useEffect(() => {
        const fetchReceipts = async () => {
            if (activeSection === 'receipts') {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) return;
                    const userId = JSON.parse(atob(token.split('.')[1])).userId;
                    // Fetch receipts by userId (matches backend route)
                    const response = await fetch(
                        `${import.meta.env.VITE_BACKEND_HOST_URL}/api/payment/receipts/${userId}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        }
                    );
                    const data = await response.json();
                    setReceipts(data.receipts || []);
                } catch (error) {
                    console.error('Error fetching receipts:', error);
                    setReceipts([]);
                }
            }
        };
        fetchReceipts();
    }, [activeSection]);

    // Move section change logic to a separate function
    const handleSectionChange = (sectionId) => {
        setActiveSection(sectionId);
        // If changing to mycourses, force refresh
        if (sectionId === 'mycourses') {
            fetchPurchasedCourses();
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        toast.success('Logged out successfully');
        navigate('/login');
    };

    const sections = [
        { id: 'dashboard', name: 'Dashboard', icon: '📊' },
        { id: 'mycourses', name: 'My Courses', icon: '📚' },
        { id: 'courses', name: 'Buy Courses', icon: '🛒' },
        { id: 'payments', name: 'Payments', icon: '💳' },
        { id: 'certificates', name: 'Certificates', icon: '📜' },
        { id: 'participants', name: 'Participants', icon: '👥' },
        { id: 'analytics', name: 'Analytics', icon: '📈' },
        { id: 'receipts', name: 'Receipts', icon: '🧾' }
    ];

    const renderPurchasedCourses = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {purchasedCourses.length > 0 ? (
                purchasedCourses.map((course) => (
                    <div key={course._id} 
                        className="bg-gov-surface-800 rounded-xl shadow-lg overflow-hidden 
                            hover:shadow-xl transition-all duration-300 border border-gov-border"
                    >
                        <div className="relative h-48">
                            <img
                                src={course.courseDetails.image}
                                alt={course.courseName}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gov-surface-50 mb-4">
                                {course.courseName}
                            </h3>
                            <button
                                onClick={() => navigate(`/course/${course.courseName}`)}
                                className="w-full bg-gov-primary-600 text-gov-surface-50 py-3 px-4 rounded-lg 
                                    font-semibold transition-all duration-300
                                    hover:bg-gov-primary-500 hover:shadow-lg hover:shadow-gov-primary-600/20 
                                    hover:translate-y-[-2px]
                                    active:transform active:scale-98 active:translate-y-0
                                    focus:outline-none focus:ring-2 focus:ring-gov-primary-500 focus:ring-offset-2
                                    focus:ring-offset-gov-surface-800"
                            >
                                Continue Learning
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                    <p>You haven't purchased any courses yet.</p>
                    <button
                        onClick={() => setActiveSection('courses')}
                        className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                    >
                        Browse Available Courses
                    </button>
                </div>
            )}
        </div>
    );

    useEffect(() => {
        // Check URL params for section
        const params = new URLSearchParams(window.location.search);
        const section = params.get('section');
        if (section && sections.some(s => s.id === section)) {
            setActiveSection(section);
        }
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gov-surface-900 to-black flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed md:static w-[280px] bg-black/40 backdrop-blur-xl 
                min-h-screen shadow-xl z-50 transition-all duration-300 transform border-r border-gov-border/10
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="p-6">
                    <h1 className="text-xl font-display font-bold text-gradient mb-8">
                        National Academy of Direct Taxes
                    </h1>
                    <nav className="space-y-2">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => handleSectionChange(section.id)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl 
                                    transition-all duration-300 
                                    ${activeSection === section.id 
                                        ? 'bg-gov-primary-600/10 text-gov-primary-400 shadow-lg backdrop-blur-lg border border-gov-primary-500/20' 
                                        : 'text-white/70 hover:bg-white/5 hover:text-white border border-transparent'
                                    }`}
                            >
                                <span className="text-xl">{section.icon}</span>
                                <span className="font-medium">{section.name}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                {/* Top Navigation */}
                <nav className="bg-black/50 backdrop-blur-xl border-b border-gov-border/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            {/* Hamburger Menu Button */}
                            <div className="flex items-center md:hidden">
                                <button
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                    className="p-2 rounded-lg hover:bg-white/5 text-white/70 hover:text-white transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex items-center">
                                <h2 className="text-xl font-display font-semibold text-white">
                                    {sections.find(s => s.id === activeSection)?.name}
                                </h2>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => navigate('/')}
                                    className="px-4 py-2 rounded-xl bg-white/5 text-white 
                                        font-semibold transition-all duration-300 
                                        hover:bg-white/10 hover:scale-105 border border-white/10"
                                >
                                    Home
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 
                                        font-semibold transition-all duration-300 
                                        hover:bg-red-500/20 hover:scale-105 border border-red-500/20"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Content Area */}
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <div className="space-y-6">
                        {activeSection === 'dashboard' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <DashboardCard
                                    title="Total Courses"
                                    value={dashboardStats.totalCourses.toString()}
                                    icon="📚"
                                    trend={`${dashboardStats.coursesChange > 0 ? '+' : ''}${dashboardStats.coursesChange} this month`}
                                />
                                <DashboardCard
                                    title="Active Enrollments"
                                    value={dashboardStats.activeEnrollments.toString()}
                                    icon="👥"
                                    trend={`${dashboardStats.enrollmentsChange > 0 ? '+' : ''}${dashboardStats.enrollmentsChange}% vs last month`}
                                />
                                <DashboardCard
                                    title="Completion Rate"
                                    value={`${dashboardStats.completionRate}%`}
                                    icon="📈"
                                    trend={`${dashboardStats.completionChange > 0 ? '+' : ''}${dashboardStats.completionChange}% vs last month`}
                                />
                            </div>
                        )}

                        {activeSection === 'courses' && (
                            <div className="space-y-8">
                                <h2 className="text-2xl font-bold text-gradient mb-8">Available Courses</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    <div className="transform hover:scale-105 transition-all duration-300 hover:z-10">
                                        <ProductCard />
                                    </div>
                                    <div className="transform hover:scale-105 transition-all duration-300 hover:z-10">
                                        <ProductCard1 />
                                    </div>
                                    <div className="transform hover:scale-105 transition-all duration-300 hover:z-10">
                                        <ProductCard2 />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'payments' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold text-white mb-4">Payment History</h3>
                                <div className="bg-black/40 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-white/10">
                                    {payments.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-black/60">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-white/10">
                                                            Course
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-white/10">
                                                            Amount
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-white/10">
                                                            Date
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-white/10">
                                                            Status
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/10">
                                                    {payments.map((payment) => (
                                                        <tr key={payment.razorpay_payment_id} 
                                                            className="hover:bg-white/5 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <div className="h-10 w-10 flex-shrink-0">
                                                                        <img 
                                                                            className="h-10 w-10 rounded-lg object-cover border border-white/10" 
                                                                            src={payment.courseDetails.image} 
                                                                            alt="" 
                                                                        />
                                                                    </div>
                                                                    <div className="ml-4">
                                                                        <div className="text-sm font-medium text-white">
                                                                            {payment.courseDetails.name}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-300">
                                                                    ₹{payment.courseDetails.amount}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-300">
                                                                    {new Date(payment.date).toLocaleDateString('en-IN', {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                        year: 'numeric'
                                                                    })}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                                    bg-green-500/10 text-green-400 border border-green-500/20">
                                                                    Completed
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            No payment history found
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeSection === 'certificates' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold text-white mb-4">Your Certificates</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {certificates.length > 0 ? (
                                        certificates.map((cert) => (
                                            <div key={cert.certificateNumber} 
                                                className="glass-card p-6 hover-lift border border-gov-primary-500/10 
                                                    hover:border-gov-primary-500/20 transition-all duration-300">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-2xl">📜</span>
                                                    <span className="text-sm text-gov-primary-400">
                                                        {new Date(cert.completionDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <h4 className="text-lg font-semibold text-white mb-2">{cert.courseName}</h4>
                                                <p className="text-white/70 text-sm mb-4">Certificate No: {cert.certificateNumber}</p>
                                                <button
                                                    onClick={() => window.open(
                                                        `${import.meta.env.VITE_BACKEND_HOST_URL}/api/certificate/download/${cert.certificateNumber}`,
                                                        '_blank'
                                                    )}
                                                    className="w-full bg-gov-accent-500 text-white py-2 px-4 rounded-lg 
                                                        font-semibold transition-all duration-300
                                                        hover:bg-gov-accent-400 hover:shadow-lg hover:shadow-gov-accent-500/20 
                                                        hover:translate-y-[-2px] active:translate-y-0"
                                                >
                                                    Download Certificate
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full text-center py-12 text-gov-surface-200">
                                            <p>No certificates found. Complete a course to earn your first certificate!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeSection === 'participants' && (
                            <div className="space-y-6">
                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <DashboardCard
                                        title="Total Participants"
                                        value={userStats.total}
                                        icon="👥"
                                        trend="Overall registered users"
                                    />
                                    <DashboardCard
                                        title="Active Today"
                                        value={userStats.activeToday}
                                        icon="🎯"
                                        trend="Currently active users"
                                    />
                                    <DashboardCard
                                        title="New This Week"
                                        value={userStats.newThisWeek}
                                        icon="📈"
                                        trend="Users joined in last 7 days"
                                    />
                                </div>

                                {/* Users Table */}
                                <div className="glass-card overflow-hidden">
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-white mb-4">
                                            Registered Participants
                                        </h3>
                                        
                                        {userStatsLoading ? (
                                            <div className="flex justify-center py-8">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gov-primary-500"></div>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="border-b border-white/10">
                                                            <th className="text-left py-3 px-4 text-gov-surface-200 font-medium">Participant ID</th>
                                                            <th className="text-left py-3 px-4 text-gov-surface-200 font-medium">Joined Date</th>
                                                            <th className="text-left py-3 px-4 text-gov-surface-200 font-medium">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/10">
                                                        {users.map((user, index) => (
                                                            <tr key={user._id || index} 
                                                                className="hover:bg-white/5 transition-colors">
                                                                <td className="py-3 px-4">
                                                                    <div className="flex items-center">
                                                                        <div className="h-8 w-8 rounded-full bg-gov-primary-500/20 
                                                                            flex items-center justify-center text-gov-primary-400 font-medium">
                                                                            {index + 1}
                                                                        </div>
                                                                        <span className="ml-3 font-medium text-white">
                                                                            Participant #{index + 1}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 px-4 text-gov-surface-200">
                                                                    {new Date(user.joinedDate).toLocaleDateString('en-IN', {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                        year: 'numeric'
                                                                    })}
                                                                </td>
                                                                <td className="py-3 px-4">
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                                        bg-green-500/10 text-green-400 border border-green-500/20">
                                                                        Active
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                
                                                {users.length === 0 && (
                                                    <div className="text-center py-8 text-gov-surface-200">
                                                        No participants found
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'analytics' && (
                            <div className="space-y-8">
                                <h3 className="text-2xl font-semibold text-gradient">Analytics Overview</h3>
                                
                                {/* Course Metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="glass-card p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-white/60 text-sm">Course Enrollments</p>
                                                <h4 className="text-2xl font-bold text-white mt-1">
                                                    {dashboardStats.activeEnrollments || 0}
                                                </h4>
                                            </div>
                                            <span className="text-green-400 bg-green-400/10 px-2 py-1 rounded-lg text-xs">
                                                {dashboardStats.enrollmentsChange > 0 ? '+' : ''}{dashboardStats.enrollmentsChange}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-gov-primary-500 to-gov-accent-400 rounded-full"
                                                style={{ width: `${Math.min(100, Math.max(0, dashboardStats.enrollmentsChange))}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="glass-card p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-white/60 text-sm">Active Users</p>
                                                <h4 className="text-2xl font-bold text-white mt-1">
                                                    {userStats.activeToday}
                                                </h4>
                                            </div>
                                            <span className="text-green-400 bg-green-400/10 px-2 py-1 rounded-lg text-xs">
                                                Today
                                            </span>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-gov-primary-500 to-gov-accent-400 rounded-full animate-pulse"
                                                style={{ width: `${(userStats.activeToday / userStats.total * 100) || 0}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="glass-card p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-white/60 text-sm">Completion Rate</p>
                                                <h4 className="text-2xl font-bold text-white mt-1">
                                                    {dashboardStats.completionRate}%
                                                </h4>
                                            </div>
                                            <span className="text-green-400 bg-green-400/10 px-2 py-1 rounded-lg text-xs">
                                                {dashboardStats.completionChange > 0 ? '+' : ''}{dashboardStats.completionChange}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-gov-primary-500 to-gov-accent-400 rounded-full"
                                                style={{ width: `${dashboardStats.completionRate}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Course Popularity Graph */}
                                <div className="bg-black/95 p-8 rounded-xl shadow-lg border border-white/10">
                                    <div className="flex items-center justify-between mb-8">
                                        <h4 className="text-xl font-semibold text-white">
                                            Course Analytics
                                        </h4>
                                        <div className="text-white/60">
                                            Updated in realtime
                                        </div>
                                    </div>

                                    <div className="h-[450px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={coursePopularity}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                            >
                                                <CartesianGrid 
                                                    strokeDasharray="3 3" 
                                                    stroke={CHART_COLORS.grid}
                                                    vertical={true}
                                                    horizontal={true}
                                                />
                                                <XAxis 
                                                    dataKey="name"
                                                    tick={{ fill: CHART_COLORS.text }}
                                                    stroke={CHART_COLORS.axis}
                                                    axisLine={{ stroke: CHART_COLORS.axis, strokeWidth: 2 }}
                                                />
                                                <YAxis 
                                                    yAxisId="left"
                                                    tick={{ fill: CHART_COLORS.text }}
                                                    stroke={CHART_COLORS.axis}
                                                    axisLine={{ stroke: CHART_COLORS.axis, strokeWidth: 2 }}
                                                    tickLine={{ stroke: CHART_COLORS.axis }}
                                                    label={{ 
                                                        value: 'Count', 
                                                        angle: -90, 
                                                        position: 'insideLeft',
                                                        style: { fill: CHART_COLORS.text, fontSize: '14px' }
                                                    }}
                                                />
                                                <YAxis 
                                                    yAxisId="right"
                                                    orientation="right"
                                                    tick={{ fill: CHART_COLORS.text }}
                                                    stroke={CHART_COLORS.axis}
                                                    axisLine={{ stroke: CHART_COLORS.axis, strokeWidth: 2 }}
                                                    tickLine={{ stroke: CHART_COLORS.axis }}
                                                    label={{ 
                                                        value: 'Revenue (₹)', 
                                                        angle: 90, 
                                                        position: 'insideRight',
                                                        style: { fill: CHART_COLORS.text, fontSize: '14px' }
                                                    }}
                                                />
                                                <Tooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                                        borderRadius: '8px',
                                                        color: '#fff'
                                                    }}
                                                />
                                                <Legend 
                                                    wrapperStyle={{ color: CHART_COLORS.text }}
                                                />
                                                <Bar 
                                                    name="Enrollments"
                                                    dataKey="enrollments"
                                                    yAxisId="left"
                                                    fill={CHART_COLORS.enrollments}
                                                    barSize={40}
                                                />
                                                <Bar 
                                                    name="Revenue"
                                                    dataKey="amount"
                                                    yAxisId="right"
                                                    fill={CHART_COLORS.revenue}
                                                    barSize={40}
                                                />
                                                <Bar 
                                                    name="Recent Purchases"
                                                    dataKey="recentPurchases"
                                                    yAxisId="left"
                                                    fill={CHART_COLORS.recent}
                                                    barSize={40}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    
                                    <div className="mt-4 text-sm text-white/60 text-center">
                                        Last updated: {new Date().toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'receipts' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold text-white mb-4">Your Receipts</h3>
                                <div className="bg-black/40 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-white/10">
                                    {receipts.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-black/60">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-white/10">
                                                            Course
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-white/10">
                                                            Amount
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-white/10">
                                                            Date
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-white/10">
                                                            Order ID
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-white/10">
                                                            Download
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/10">
                                                    {receipts.map((receipt) => (
                                                        <tr key={receipt.orderId} className="hover:bg-white/5 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-white">
                                                                    {receipt.courseId}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-300">
                                                                    ₹{receipt.amount}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-300">
                                                                    {new Date(receipt.date).toLocaleDateString('en-IN', {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                        year: 'numeric'
                                                                    })}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-xs text-gray-400 break-all">{receipt.orderId}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <DownloadReceiptButton orderId={receipt.orderId} disabled={false} />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            No receipts found
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeSection === 'mycourses' && renderPurchasedCourses()}
                    </div>
                </div>
            </div>
        </div>
    );
}



function DashboardCard({ title, value, icon, trend }) {
    return (
        <div className="glass-card p-6 hover-lift border border-gov-primary-500/10 
            hover:border-gov-primary-500/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">{icon}</span>
                <span className="text-sm text-gov-primary-400 bg-gov-primary-500/10 
                    px-2 py-1 rounded-full border border-gov-primary-500/20">
                    {trend}
                </span>
            </div>
            <h3 className="text-white/70 text-sm font-medium">{title}</h3>
            <p className="text-3xl font-semibold text-white mt-2">{value}</p>
        </div>
    );
}








