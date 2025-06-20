import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Register() {
    const [credentials, setCredentials] = useState({
        name: "",
        email: "",
        password: ""
    });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_HOST_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });
            const json = await response.json();
            
            if (json.authtoken) {
                localStorage.setItem('token', json.authtoken);
                toast.success('Registered successfully');
                navigate('/dashboard');
            } else {
                toast.error(json.error);
            }
        } catch (error) {
            toast.error('Something went wrong');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gov-primary-900 via-gov-surface-900 to-gov-primary-800 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-gov-surface-800/50 backdrop-blur-md p-8 rounded-2xl border border-gov-border shadow-2xl">
                <div className="text-center">
                    <h1 className="text-3xl font-display font-bold text-gov-surface-50 mb-2">
                        Create account
                    </h1>
                    <p className="text-gov-surface-200">
                        Join NADT Platform to get started
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-5">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gov-surface-100 mb-2">
                                Full name
                            </label>
                            <input
                                id="name"
                                type="text"
                                required
                                className="input w-full text-white bg-white/10"
                                placeholder="Enter your full name"
                                value={credentials.name}
                                onChange={(e) => setCredentials({...credentials, name: e.target.value})}
                            />
                        </div>
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
                                onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                            />
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
                                placeholder="Create a password"
                                value={credentials.password}
                                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="btn-primary w-full py-3 text-base font-semibold hover:translate-y-[-2px] active:translate-y-0"
                        >
                            Create account
                        </button>
                    </div>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="text-gov-accent-400 hover:text-gov-accent-300 font-medium transition-all duration-300 hover:translate-y-[-1px]"
                        >
                            Already have an account? Sign in
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

