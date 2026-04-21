import React, { useState } from 'react';
import { Employee } from '../types';
import {
    PencilSquareIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';

interface EmployeeListProps {
    employees: Employee[];
    onEdit: ((employee: Employee) => void) | null;
    onDelete: ((id: number) => void) | null;
}

const AVATAR_COLORS = [
    '#4f46e5','#0ea5e9','#10b981','#f59e0b',
    '#ef4444','#8b5cf6','#ec4899','#14b8a6',
];

function avatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const EmployeeList: React.FC<EmployeeListProps> = ({ employees, onEdit, onDelete }) => {
    const [search, setSearch] = useState('');
    const employeeArray = Array.isArray(employees) ? employees : [];

    const filtered = employeeArray.filter((e) => {
        const q = search.toLowerCase();
        return (
            !q ||
            `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
            e.email?.toLowerCase().includes(q) ||
            e.department?.toLowerCase().includes(q) ||
            e.position?.toLowerCase().includes(q) ||
            e.employeeCode?.toLowerCase().includes(q)
        );
    });

    const activeCount = employeeArray.filter((e) => e.isActive).length;

    return (
        <div>
            {/* Stats row */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: 22 }}>
                <div className="stat-card">
                    <div className="stat-icon indigo">
                        <UsersIcon style={{ width: 22, height: 22 }} />
                    </div>
                    <div className="stat-info">
                        <div className="stat-label">Total</div>
                        <div className="stat-value">{employeeArray.length}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon success">
                        <UsersIcon style={{ width: 22, height: 22 }} />
                    </div>
                    <div className="stat-info">
                        <div className="stat-label">Active</div>
                        <div className="stat-value">{activeCount}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon warning">
                        <UsersIcon style={{ width: 22, height: 22 }} />
                    </div>
                    <div className="stat-info">
                        <div className="stat-label">Inactive</div>
                        <div className="stat-value">{employeeArray.length - activeCount}</div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="toolbar">
                <div className="search-input-wrap">
                    <MagnifyingGlassIcon />
                    <input
                        type="text"
                        placeholder="Search employees…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                    {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Table */}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Department</th>
                            <th>Position</th>
                            <th>Hourly Rate</th>
                            <th>Status</th>
                            {(onEdit || onDelete) && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6}>
                                    <div className="empty-state">
                                        <div className="empty-icon">
                                            <UsersIcon />
                                        </div>
                                        <h3>{search ? 'No results found' : 'No employees yet'}</h3>
                                        <p>
                                            {search
                                                ? `No employees match "${search}"`
                                                : 'Add your first employee using the button above'}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((employee) => {
                                const fullName = `${employee.firstName} ${employee.lastName}`;
                                const initials = `${employee.firstName?.[0] ?? ''}${employee.lastName?.[0] ?? ''}`.toUpperCase();
                                const color = avatarColor(fullName);
                                return (
                                    <tr key={employee.id}>
                                        <td>
                                            <div className="emp-cell">
                                                <div className="emp-avatar" style={{ background: color }}>
                                                    {initials}
                                                </div>
                                                <div>
                                                    <div className="emp-name">{fullName}</div>
                                                    <div className="emp-code">{employee.employeeCode} · {employee.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            {employee.department || '—'}
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>{employee.position || '—'}</td>
                                        <td style={{ fontWeight: 600 }}>
                                            ${employee.hourlyRate?.toFixed(2) ?? '—'}
                                        </td>
                                        <td>
                                            <span className={`badge ${employee.isActive ? 'badge-success' : 'badge-danger'}`}>
                                                {employee.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        {(onEdit || onDelete) && (
                                            <td>
                                                <div className="td-actions">
                                                    {onEdit && (
                                                        <button
                                                            className="btn-icon edit"
                                                            onClick={() => onEdit(employee)}
                                                            title="Edit employee"
                                                        >
                                                            <PencilSquareIcon />
                                                        </button>
                                                    )}
                                                    {onDelete && (
                                                        <button
                                                            className="btn-icon delete"
                                                            onClick={() => onDelete(employee.id)}
                                                            title="Remove employee"
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EmployeeList;
