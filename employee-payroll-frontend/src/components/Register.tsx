import React, { useState, ChangeEvent, FormEvent } from 'react';
import { authAPI } from '../services/api';
import { EmployeeRole } from '../types';
import {
    ExclamationCircleIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface RegisterProps {
    onRegister: () => void;
    onSwitchToLogin: () => void;
}

interface RegisterFormData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    role: EmployeeRole;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onSwitchToLogin }) => {
    const [userData, setUserData] = useState<RegisterFormData>({
        username: '', email: '', password: '', confirmPassword: '', fullName: '', role: 'EMPLOYEE',
    });
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (userData.password !== userData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await authAPI.register({
                username: userData.username,
                email: userData.email,
                password: userData.password,
                fullName: userData.fullName,
                role: userData.role,
            });
            setSuccess('Account created! Redirecting to login…');
            setTimeout(() => onSwitchToLogin(), 2000);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
            setError(msg ?? 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-left">
                <div className="auth-left-logo" style={{ fontSize: 34 }}>🍕</div>
                <h1>Join PizzaCo Staff</h1>
                <p>Create your account to access the pizza shop workforce management portal.</p>
            </div>

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

                    <h2>Create account</h2>
                    <p className="auth-subtitle">Fill in your details to get started</p>

                    {error && (
                        <div className="auth-alert error">
                            <ExclamationCircleIcon style={{ width: 18, height: 18, flexShrink: 0 }} />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="auth-alert success">
                            <CheckCircleIcon style={{ width: 18, height: 18, flexShrink: 0 }} />
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                        <div className="form-field">
                            <label>Full Name <span className="required">*</span></label>
                            <input type="text" name="fullName" placeholder="Your full name"
                                value={userData.fullName} onChange={handleChange} required />
                        </div>
                        <div className="form-field">
                            <label>Username <span className="required">*</span></label>
                            <input type="text" name="username" placeholder="Choose a username"
                                value={userData.username} onChange={handleChange} required />
                        </div>
                        <div className="form-field">
                            <label>Email <span className="required">*</span></label>
                            <input type="email" name="email" placeholder="your@email.com"
                                value={userData.email} onChange={handleChange} required />
                        </div>
                        <div className="form-field">
                            <label>Role</label>
                            <select name="role" value={userData.role} onChange={handleChange}>
                                <option value="EMPLOYEE">Employee</option>
                                <option value="MANAGER">Manager</option>
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Password <span className="required">*</span></label>
                            <input type="password" name="password" placeholder="Create a password"
                                value={userData.password} onChange={handleChange} required />
                        </div>
                        <div className="form-field">
                            <label>Confirm Password <span className="required">*</span></label>
                            <input type="password" name="confirmPassword" placeholder="Repeat your password"
                                value={userData.confirmPassword} onChange={handleChange} required />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}
                            style={{ width: '100%', padding: '11px', justifyContent: 'center', marginTop: 4 }}>
                            {loading ? 'Creating account…' : 'Create account'}
                        </button>
                    </form>

                    <div className="auth-divider" />

                    <p className="auth-footer">
                        Already have an account?{' '}
                        <button onClick={onSwitchToLogin}>Sign in</button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
