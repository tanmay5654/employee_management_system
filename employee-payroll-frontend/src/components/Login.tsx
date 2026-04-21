import React, { useState, ChangeEvent, FormEvent } from 'react';
import { authAPI } from '../services/api';
import { AuthUser, LoginCredentials } from '../types';
import {
    UsersIcon,
    ShieldCheckIcon,
    ClockIcon,
    ChartBarIcon,
    ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

interface LoginProps {
    onLogin: (user: AuthUser) => void;
    onSwitchToRegister: () => void;
}

const FEATURES = [
    { icon: UsersIcon,       text: 'Manage kitchen, delivery & front-of-house staff' },
    { icon: ClockIcon,       text: 'Real-time shift & attendance tracking' },
    { icon: ChartBarIcon,    text: 'Payroll insights & labor cost analytics' },
    { icon: ShieldCheckIcon, text: 'Role-based access for managers & staff' },
];

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister }) => {
    const [credentials, setCredentials] = useState<LoginCredentials>({ username: '', password: '' });
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await authAPI.login(credentials);
            const { token, username, role, userId } = response.data as AuthUser & { token: string };
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify({ username, role, userId }));
            onLogin({ username, role, userId });
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
            setError(msg ?? 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* Left branding panel */}
            <div className="auth-left">
                <div className="auth-left-logo" style={{ fontSize: 34 }}>
                    🍕
                </div>
                <h1>PizzaCo Staff Portal</h1>
                <p>All-in-one workforce management for your pizza restaurant — from kitchen to delivery.</p>
                <div className="auth-features">
                    {FEATURES.map(({ icon: Icon, text }) => (
                        <div className="auth-feature" key={text}>
                            <Icon />
                            <span>{text}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right form panel */}
            <div className="auth-right">
                <div className="auth-form-box">
                    <div className="auth-logo">
                        <div className="auth-logo-mark" style={{ fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            🍕
                        </div>
                        <div className="auth-logo-text">
                            PizzaCo Staff
                            <small>Workforce Management</small>
                        </div>
                    </div>

                    <h2>Welcome back</h2>
                    <p className="auth-subtitle">Sign in to manage your pizza shop team</p>

                    {error && (
                        <div className="auth-alert error">
                            <ExclamationCircleIcon style={{ width: 18, height: 18, flexShrink: 0 }} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div className="form-field">
                            <label>Username</label>
                            <input
                                type="text"
                                name="username"
                                placeholder="Enter your username"
                                value={credentials.username}
                                onChange={handleChange}
                                required
                                autoComplete="username"
                                autoFocus
                            />
                        </div>
                        <div className="form-field">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                value={credentials.password}
                                onChange={handleChange}
                                required
                                autoComplete="current-password"
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ width: '100%', padding: '11px', justifyContent: 'center', marginTop: 4 }}
                        >
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>

                    <div className="auth-divider" />

                    <p className="auth-footer">
                        Don't have an account?{' '}
                        <button onClick={onSwitchToRegister}>Create account</button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
