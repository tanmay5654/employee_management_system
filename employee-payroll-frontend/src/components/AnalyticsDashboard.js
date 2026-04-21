import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { analyticsAPI } from '../services/api';

const COLORS = ['#3b5bdb', '#f59f00', '#20c997', '#f03e3e', '#7950f2', '#1c7ed6', '#2f9e44', '#e67700'];

function StatCard({ title, value, sub, color }) {
    return (
        <div style={{ ...styles.card, borderTop: `4px solid ${color}` }}>
            <p style={styles.cardTitle}>{title}</p>
            <p style={{ ...styles.cardValue, color }}>{value}</p>
            {sub && <p style={styles.cardSub}>{sub}</p>}
        </div>
    );
}

function AnalyticsDashboard() {
    const [weeklyHours, setWeeklyHours] = useState([]);
    const [overtimeTrends, setOvertimeTrends] = useState([]);
    const [deptSummary, setDeptSummary] = useState([]);
    const [payrollForecast, setPayrollForecast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [wh, ot, ds, pf] = await Promise.all([
                    analyticsAPI.getWeeklyHours(),
                    analyticsAPI.getOvertimeTrends(),
                    analyticsAPI.getDepartmentSummary(),
                    analyticsAPI.getPayrollForecast(),
                ]);
                setWeeklyHours(wh.data);
                setOvertimeTrends(ot.data);
                setDeptSummary(ds.data);
                setPayrollForecast(pf.data);
            } catch (err) {
                setError('Failed to load analytics. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    if (loading) return <div style={styles.loading}>Loading analytics...</div>;
    if (error) return <div style={styles.error}>{error}</div>;

    const totalEmployees = deptSummary.reduce((s, d) => s + d.employeeCount, 0);
    const totalHoursThisWeek = weeklyHours.reduce((s, e) => s + e.hours, 0).toFixed(1);
    const totalOvertimeThisWeek = overtimeTrends[overtimeTrends.length - 1]?.overtimeHours ?? 0;
    const totalPayrollCost = payrollForecast.reduce((s, d) => s + d.estimatedCost, 0).toFixed(2);

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Analytics Dashboard</h2>
            <p style={styles.subtitle}>Real-time workforce metrics — current week</p>

            {/* KPI Cards */}
            <div style={styles.kpiRow}>
                <StatCard title="Total Employees" value={totalEmployees} sub="Active" color="#3b5bdb" />
                <StatCard title="Hours This Week" value={totalHoursThisWeek} sub="Across all employees" color="#20c997" />
                <StatCard title="Overtime Hours" value={totalOvertimeThisWeek} sub="This week" color="#f59f00" />
                <StatCard title="Est. Payroll Cost" value={`€${totalPayrollCost}`} sub="This week" color="#f03e3e" />
            </div>

            {/* Row 1: Weekly Hours Bar + Overtime Line */}
            <div style={styles.row}>
                <div style={styles.chartBox}>
                    <h3 style={styles.chartTitle}>Hours Worked This Week (per employee)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={weeklyHours} margin={{ top: 8, right: 20, bottom: 60, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v) => [`${v}h`, 'Hours']} />
                            <Bar dataKey="hours" fill="#3b5bdb" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div style={styles.chartBox}>
                    <h3 style={styles.chartTitle}>Overtime Trend (past 8 weeks)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={overtimeTrends} margin={{ top: 8, right: 20, bottom: 10, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="overtimeHours" stroke="#f59f00" strokeWidth={2} dot={{ r: 4 }} name="Overtime hrs" />
                            <Line type="monotone" dataKey="employeesWithOvertime" stroke="#f03e3e" strokeWidth={2} dot={{ r: 4 }} name="Employees" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Row 2: Dept Pie + Payroll Bar */}
            <div style={styles.row}>
                <div style={styles.chartBox}>
                    <h3 style={styles.chartTitle}>Employees by Department</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={deptSummary}
                                dataKey="employeeCount"
                                nameKey="department"
                                cx="50%" cy="50%"
                                outerRadius={100}
                                label={({ department, employeeCount }) => `${department}: ${employeeCount}`}
                                labelLine={false}
                            >
                                {deptSummary.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(v) => [v, 'Employees']} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div style={styles.chartBox}>
                    <h3 style={styles.chartTitle}>Payroll Cost Forecast by Department (€)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={payrollForecast} margin={{ top: 8, right: 20, bottom: 60, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="department" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v) => [`€${v}`, 'Est. Cost']} />
                            <Bar dataKey="estimatedCost" radius={[4, 4, 0, 0]}>
                                {payrollForecast.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: { padding: '24px', maxWidth: '1200px', margin: '0 auto' },
    title: { margin: '0 0 4px', fontSize: '1.6rem', color: '#1a1a2e' },
    subtitle: { margin: '0 0 24px', color: '#666', fontSize: '0.95rem' },
    kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' },
    card: {
        background: '#fff', borderRadius: '10px', padding: '18px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    },
    cardTitle: { margin: '0 0 8px', fontSize: '0.82rem', color: '#888', fontWeight: 600, textTransform: 'uppercase' },
    cardValue: { margin: '0 0 4px', fontSize: '2rem', fontWeight: 700 },
    cardSub: { margin: 0, fontSize: '0.8rem', color: '#aaa' },
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' },
    chartBox: {
        background: '#fff', borderRadius: '10px', padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    },
    chartTitle: { margin: '0 0 16px', fontSize: '0.95rem', color: '#333', fontWeight: 600 },
    loading: { padding: '40px', textAlign: 'center', color: '#888' },
    error: { padding: '20px', background: '#fff5f5', color: '#c0392b', borderRadius: '8px', margin: '24px' },
};

export default AnalyticsDashboard;
