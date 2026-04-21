import React, { useState, useEffect } from 'react';
import { employeeAPI, authAPI, getCurrentUser } from './services/api';
import EmployeeList from './components/EmployeeList';
import EmployeeForm from './components/EmployeeForm';
import TimeTracking from './components/TimeTracking';
import RosterManagement from './components/RosterManagement';
import EmployeeRosterView from './components/EmployeeRosterView';
import AIAssistant from './components/AIAssistant';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Login from './components/Login';
import Register from './components/Register';
import { Employee, AuthUser } from './types';
import {
    UsersIcon,
    ClockIcon,
    CalendarDaysIcon,
    ChartBarIcon,
    SparklesIcon,
    ArrowRightOnRectangleIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline';
import './App.css';

type ActiveTab = 'employees' | 'time' | 'roster' | 'analytics' | 'ai';

const NAV_ITEMS: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'employees',  label: 'Employees',     icon: UsersIcon },
    { id: 'time',       label: 'Time Tracking', icon: ClockIcon },
    { id: 'roster',     label: 'Roster',        icon: CalendarDaysIcon },
    { id: 'analytics',  label: 'Analytics',     icon: ChartBarIcon },
    { id: 'ai',         label: 'AI Assistant',  icon: SparklesIcon },
];

const PAGE_TITLES: Record<ActiveTab, { title: string; subtitle: string }> = {
    employees:  { title: 'Employee Management',   subtitle: 'Manage your workforce' },
    time:       { title: 'Time Tracking',          subtitle: 'Clock in / out and view time entries' },
    roster:     { title: 'Roster & Schedules',     subtitle: 'Plan and manage work shifts' },
    analytics:  { title: 'Analytics Dashboard',   subtitle: 'Insights and workforce metrics' },
    ai:         { title: 'AI Assistant',           subtitle: 'Ask questions about your data' },
};

const AVATAR_COLORS = [
    '#4f46e5','#0ea5e9','#10b981','#f59e0b',
    '#ef4444','#8b5cf6','#ec4899','#14b8a6',
];

function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [showLogin, setShowLogin] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<ActiveTab>('employees');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [showForm, setShowForm] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = getCurrentUser();
        if (token && user) {
            authAPI.validateToken(token)
                .then((response) => {
                    const data = response.data as { valid: boolean };
                    if (data.valid) {
                        setIsAuthenticated(true);
                        setCurrentUser(user as AuthUser);
                    } else {
                        handleLogout();
                    }
                })
                .catch(() => handleLogout());
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (isAuthenticated) fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    const fetchEmployees = async (): Promise<void> => {
        setLoading(true);
        try {
            const response = await employeeAPI.getAll();
            setEmployees(Array.isArray(response.data) ? response.data as Employee[] : []);
        } catch (error: unknown) {
            const err = error as { response?: { status?: number } };
            if (err.response?.status === 401) handleLogout();
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = (userData: AuthUser): void => {
        setIsAuthenticated(true);
        setCurrentUser(userData);
    };

    const handleLogout = (): void => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setCurrentUser(null);
        setShowLogin(true);
    };

    const handleCreateEmployee = async (employeeData: object): Promise<void> => {
        try {
            const response = await employeeAPI.create(employeeData);
            setEmployees([...employees, response.data as Employee]);
            setShowForm(false);
        } catch (error: unknown) {
            const err = error as { response?: { data?: string }; message?: string };
            alert('Error creating employee: ' + (err.response?.data ?? err.message));
        }
    };

    const handleUpdateEmployee = async (id: number, employeeData: object): Promise<void> => {
        try {
            const response = await employeeAPI.update(id, employeeData);
            setEmployees(employees.map((emp) => (emp.id === id ? (response.data as Employee) : emp)));
            setSelectedEmployee(null);
            setShowForm(false);
        } catch {
            alert('Error updating employee');
        }
    };

    const handleDeleteEmployee = async (id: number): Promise<void> => {
        if (window.confirm('Are you sure you want to remove this employee?')) {
            try {
                await employeeAPI.delete(id);
                setEmployees(employees.filter((emp) => emp.id !== id));
            } catch {
                alert('Error deleting employee');
            }
        }
    };

    const isManager = currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN';
    const userInitials = currentUser?.username?.slice(0, 2).toUpperCase() ?? '??';
    const avatarColor = getAvatarColor(currentUser?.username ?? '');
    const { title, subtitle } = PAGE_TITLES[activeTab];

    if (!isAuthenticated) {
        return showLogin
            ? <Login onLogin={handleLogin} onSwitchToRegister={() => setShowLogin(false)} />
            : <Register onRegister={() => setShowLogin(true)} onSwitchToLogin={() => setShowLogin(true)} />;
    }

    return (
        <div className="app-layout">
            {/* ── Sidebar ── */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon" style={{ fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        🍕
                    </div>
                    <div className="sidebar-logo-text">
                        <h2>PizzaCo Staff</h2>
                        <span>Workforce Management</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <span className="nav-section-label">Main Menu</span>
                    {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            className={`nav-item ${activeTab === id ? 'active' : ''}`}
                            onClick={() => setActiveTab(id)}
                        >
                            <Icon className="nav-icon" />
                            <span>{label}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-card">
                        <div className="user-avatar" style={{ background: avatarColor }}>
                            {userInitials}
                        </div>
                        <div className="user-info">
                            <div className="user-name">{currentUser?.username}</div>
                            <div className="user-role">{currentUser?.role?.toLowerCase()}</div>
                        </div>
                        <button className="btn-logout" onClick={handleLogout} title="Logout">
                            <ArrowRightOnRectangleIcon style={{ width: 18, height: 18 }} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Main ── */}
            <div className="main-content">
                <header className="topbar">
                    <div className="topbar-title">
                        <h1>{title}</h1>
                        <p>{subtitle}</p>
                    </div>
                    <div className="topbar-actions">
                        {activeTab === 'employees' && isManager && (
                            <button
                                className="btn btn-primary"
                                onClick={() => { setSelectedEmployee(null); setShowForm(true); }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                                </svg>
                                Add Employee
                            </button>
                        )}

                        {/* User pill + logout */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 12, borderLeft: '1px solid var(--border)' }}>
                            <UserCircleIcon style={{ width: 20, height: 20, color: 'var(--text-secondary)', flexShrink: 0 }} />
                            <div style={{ lineHeight: 1.2 }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {currentUser?.username}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                    {currentUser?.role?.toLowerCase()}
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="btn btn-danger"
                                style={{ marginLeft: 4 }}
                            >
                                <ArrowRightOnRectangleIcon style={{ width: 15, height: 15 }} />
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                <main className="page-content">
                    {activeTab === 'employees' && (
                        <>
                            {showForm && (
                                <EmployeeForm
                                    employee={selectedEmployee}
                                    onSubmit={selectedEmployee
                                        ? (data) => handleUpdateEmployee(selectedEmployee.id, data)
                                        : handleCreateEmployee}
                                    onCancel={() => { setShowForm(false); setSelectedEmployee(null); }}
                                />
                            )}
                            {loading ? (
                                <div className="loading-state">
                                    <div className="spinner" />
                                    Loading employees…
                                </div>
                            ) : (
                                <EmployeeList
                                    employees={employees}
                                    onEdit={isManager ? (emp) => { setSelectedEmployee(emp); setShowForm(true); } : null}
                                    onDelete={isManager ? handleDeleteEmployee : null}
                                />
                            )}
                        </>
                    )}
                    {activeTab === 'time' && <TimeTracking employees={employees} />}
                    {activeTab === 'roster' && (
                        isManager
                            ? <RosterManagement currentUser={currentUser!} />
                            : <EmployeeRosterView employee={currentUser} />
                    )}
                    {activeTab === 'analytics' && <AnalyticsDashboard />}
                    {activeTab === 'ai' && <AIAssistant />}
                </main>
            </div>
        </div>
    );
}

export default App;
