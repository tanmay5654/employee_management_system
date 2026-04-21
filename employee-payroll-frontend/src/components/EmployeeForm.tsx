import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Employee, EmployeeRole } from '../types';
import { XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline';

const DEPARTMENTS = [
    'Kitchen',
    'Delivery',
    'Front of House',
    'Management',
    'Cleaning',
];

const POSITIONS: Record<string, string[]> = {
    Kitchen:          ['Head Chef', 'Pizza Maker', 'Prep Cook', 'Dough Specialist', 'Line Cook'],
    Delivery:         ['Delivery Driver', 'Senior Driver'],
    'Front of House': ['Cashier', 'Order Taker', 'Customer Service Rep'],
    Management:       ['Store Manager', 'Shift Manager', 'Assistant Manager'],
    Cleaning:         ['Cleaner', 'Dishwasher'],
};

interface EmployeeFormData {
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    hourlyRate: string | number;
    department: string;
    position: string;
    role: EmployeeRole;
    isActive: boolean;
}

interface EmployeeFormProps {
    employee?: Employee | null;
    onSubmit: (data: EmployeeFormData) => void;
    onCancel: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState<EmployeeFormData>({
        employeeCode: employee?.employeeCode ?? '',
        firstName:    employee?.firstName ?? '',
        lastName:     employee?.lastName ?? '',
        email:        employee?.email ?? '',
        phone:        employee?.phone ?? '',
        hourlyRate:   employee?.hourlyRate ?? '',
        department:   employee?.department ?? '',
        position:     employee?.position ?? '',
        role:         employee?.role ?? 'EMPLOYEE',
        isActive:     employee?.isActive !== undefined ? employee.isActive : true,
    });

    const availablePositions = POSITIONS[formData.department] ?? [];

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
        const target = e.target as HTMLInputElement;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        setFormData({ ...formData, [target.name]: value });
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        if (!formData.employeeCode || !formData.firstName || !formData.lastName || !formData.hourlyRate) {
            alert('Please fill in all required fields');
            return;
        }
        onSubmit(formData);
    };

    const isEditing = Boolean(employee);

    return (
        <div className="form-overlay">
            <div className="form-modal">
                {/* Header */}
                <div className="form-modal-header">
                    <div>
                        <h3>{isEditing ? 'Edit Employee' : 'Add New Employee'}</h3>
                        <p>{isEditing ? 'Update the employee details below' : 'Fill in the details to onboard a new employee'}</p>
                    </div>
                    <button className="btn-icon" onClick={onCancel} title="Close">
                        <XMarkIcon />
                    </button>
                </div>

                {/* Body */}
                <div className="form-modal-body">
                    <form id="employee-form" onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-field">
                                <label>Employee Code <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="employeeCode"
                                    placeholder="e.g. EMP001"
                                    value={formData.employeeCode}
                                    onChange={handleChange}
                                    required
                                    disabled={isEditing}
                                />
                            </div>
                            <div className="form-field">
                                <label>Role</label>
                                <select name="role" value={formData.role} onChange={handleChange}>
                                    <option value="EMPLOYEE">Employee</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            <div className="form-field">
                                <label>First Name <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="firstName"
                                    placeholder="First name"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <label>Last Name <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Last name"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="email@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-field">
                                <label>Phone</label>
                                <input
                                    type="text"
                                    name="phone"
                                    placeholder="+1 555 000 0000"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-field">
                                <label>Department</label>
                                <select
                                    name="department"
                                    value={formData.department}
                                    onChange={(e) => {
                                        setFormData({ ...formData, department: e.target.value, position: '' });
                                    }}
                                >
                                    <option value="">Select department…</option>
                                    {DEPARTMENTS.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Position</label>
                                <select
                                    name="position"
                                    value={formData.position}
                                    onChange={handleChange}
                                    disabled={!formData.department}
                                >
                                    <option value="">{formData.department ? 'Select position…' : 'Select department first'}</option>
                                    {availablePositions.map((p) => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Hourly Rate ($) <span className="required">*</span></label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="hourlyRate"
                                    placeholder="0.00"
                                    value={formData.hourlyRate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-field" style={{ justifyContent: 'center', paddingTop: 24 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleChange}
                                        style={{ width: 16, height: 16, accentColor: 'var(--indigo)' }}
                                    />
                                    <span style={{ fontWeight: 500 }}>Active Employee</span>
                                </label>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="form-modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" form="employee-form" className="btn btn-primary">
                        <UserPlusIcon style={{ width: 16, height: 16 }} />
                        {isEditing ? 'Save Changes' : 'Create Employee'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmployeeForm;
