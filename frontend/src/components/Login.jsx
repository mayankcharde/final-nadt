import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function Login() {
    const [credentials, setCredentials] = useState({ 
        email: "", 
        password: "" 
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const validateForm = () => {
        const newErrors = {};
        if (!credentials.email) newErrors.email = 'Email is required';
        if (!credentials.password) newErrors.password = 'Password is required';
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (credentials.email && !emailRegex.test(credentials.email)) {
            newErrors.email = 'Invalid email format';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_HOST_URL}/api/auth/login`,
                {
                    email: credentials.email.trim().toLowerCase(),
                    password: credentials.password
                }
            );

            if (response.data.success && response.data.token) {
                localStorage.setItem('token', response.data.token);
                toast.success('Logged in successfully');
                navigate('/dashboard');
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = error.response?.data?.error || 'Login failed';
            toast.error(errorMessage);
            setErrors({ form: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gov-primary-900 via-gov-surface-900 to-gov-primary-800 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-gov-surface-800/50 backdrop-blur-md p-8 rounded-2xl border border-gov-border shadow-2xl">
                <div className="text-center">
                    <h1 className="text-3xl font-display font-bold text-gov-surface-50 mb-2">
                        Welcome back
                    </h1>
                    <p className="text-gov-surface-200">
                        Sign in to your account to continue
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gov-surface-100 mb-2">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                className="input w-full text-white bg-white/10"
                                placeholder="Enter your email"
                                value={credentials.email}
                                onChange={(e) => {
                                    setCredentials({...credentials, email: e.target.value});
                                    if (errors.email) setErrors({...errors, email: ''});
                                }}
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gov-surface-100 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                className="input w-full text-white bg-white/10"
                                placeholder="Enter your password"
                                value={credentials.password}
                                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                            />
                        </div>
                    </div>

                    {errors.form && (
                        <div className="text-sm text-red-500 text-center bg-red-500/10 rounded-lg p-2">
                            {errors.form}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 text-base font-semibold hover:translate-y-[-2px] active:translate-y-0"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-b-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
                                    Signing in...
                                </div>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </div>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => navigate('/register')}
                            className="text-gov-accent-400 hover:text-gov-accent-300 font-medium transition-all duration-300 hover:translate-y-[-1px]"
                        >
                            Don't have an account? Register
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

