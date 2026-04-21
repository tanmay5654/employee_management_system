import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { rosterAPI, employeeAPI } from '../services/api';
import { Employee, Roster, AuthUser } from '../types';
import {
    PlusIcon,
    XMarkIcon,
    CalendarDaysIcon,
    PencilSquareIcon,
    FunnelIcon,
} from '@heroicons/react/24/outline';

interface DateRange {
    startDate: string;
    endDate: string;
}

interface RosterFormData {
    employeeId: string | number;
    shiftDate: string;
    startTime: string;
    endTime: string;
    breakDuration: number;
    department: string;
    shiftType: string;
    notes: string;
}

interface RosterManagementProps {
    currentUser: AuthUser;
}

const SHIFT_TYPES = [
    { value: 'Opening',      label: 'Opening',      time: '7 AM – 12 PM',  dot: '#f59e0b' },
    { value: 'Lunch Rush',   label: 'Lunch Rush',   time: '11 AM – 3 PM',  dot: '#ef4444' },
    { value: 'Afternoon',    label: 'Afternoon',    time: '2 PM – 7 PM',   dot: '#8b5cf6' },
    { value: 'Dinner Rush',  label: 'Dinner Rush',  time: '5 PM – 10 PM',  dot: '#dc2626' },
    { value: 'Closing',      label: 'Closing',      time: '9 PM – 1 AM',   dot: '#64748b' },
    { value: 'Custom',       label: 'Custom',       time: 'Manual times',  dot: '#4f46e5' },
];

const STATUS_CLASS: Record<string, string> = {
    SCHEDULED:   'badge-indigo',
    IN_PROGRESS: 'badge-warning',
    COMPLETED:   'badge-success',
    CANCELLED:   'badge-danger',
};

const RosterManagement: React.FC<RosterManagementProps> = ({ currentUser }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [rosters, setRosters] = useState<Roster[]>([]);
    const [showForm, setShowForm] = useState<boolean>(false);
    const [selectedRoster, setSelectedRoster] = useState<Roster | null>(null);
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
    });
    const [department, setDepartment] = useState<string>('');
    const [formData, setFormData] = useState<RosterFormData>({
        employeeId: '', shiftDate: new Date().toISOString().split('T')[0],
        startTime: '', endTime: '', breakDuration: 30,
        department: '', shiftType: 'Morning', notes: '',
    });

    useEffect(() => {
        fetchEmployees();
        fetchRosters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange, department]);

    const fetchEmployees = async (): Promise<void> => {
        try {
            const response = await employeeAPI.getAll();
            setEmployees((response.data as Employee[]).filter((emp) => emp.isActive));
        } catch (err) { console.error(err); }
    };

    const fetchRosters = async (): Promise<void> => {
        try {
            const response = await rosterAPI.getAllRosters(
                currentUser?.userId ?? currentUser?.id,
                dateRange.startDate, dateRange.endDate,
                department || null
            );
            const data = response.data as { rosters?: Roster[] };
            setRosters(data.rosters ?? []);
        } catch (err) { console.error(err); }
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openCreate = (): void => {
        setSelectedRoster(null);
        setFormData({
            employeeId: '', shiftDate: new Date().toISOString().split('T')[0],
            startTime: '', endTime: '', breakDuration: 30,
            department: '', shiftType: 'Morning', notes: '',
        });
        setShowForm(true);
    };

    const openEdit = (roster: Roster): void => {
        setSelectedRoster(roster);
        setFormData({
            employeeId: roster.employee?.id ?? '',
            shiftDate: roster.shiftDate,
            startTime: new Date(roster.startTime).toTimeString().slice(0, 5),
            endTime: new Date(roster.endTime).toTimeString().slice(0, 5),
            breakDuration: roster.breakDuration,
            department: roster.department ?? '',
            shiftType: roster.shiftType,
            notes: roster.notes ?? '',
        });
        setShowForm(true);
    };

    const closeForm = (): void => { setShowForm(false); setSelectedRoster(null); };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        const managerId = currentUser.userId ?? currentUser.id;
        const rosterData = {
            ...formData,
            managerId,
            startTime: `${formData.shiftDate}T${formData.startTime}:00`,
            endTime: `${formData.shiftDate}T${formData.endTime}:00`,
        };
        try {
            if (selectedRoster) {
                await rosterAPI.updateRoster(selectedRoster.id, managerId, rosterData);
            } else {
                await rosterAPI.createRoster(rosterData);
            }
            closeForm();
            fetchRosters();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: string }; message?: string })?.response?.data;
            alert('Error: ' + (msg ?? (err as Error).message));
        }
    };

    return (
        <div>
            {/* ── Toolbar ── */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-body" style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <FunnelIcon style={{ width: 16, height: 16, color: 'var(--text-muted)', flexShrink: 0 }} />
                        <div className="form-field" style={{ margin: 0, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', margin: 0 }}>From</label>
                            <input type="date" value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                style={{ padding: '7px 10px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.83rem', outline: 'none' }} />
                        </div>
                        <div className="form-field" style={{ margin: 0, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', margin: 0 }}>To</label>
                            <input type="date" value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                style={{ padding: '7px 10px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.83rem', outline: 'none' }} />
                        </div>
                        <input type="text" placeholder="Filter by dept (Kitchen, Delivery…)" value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            style={{ padding: '7px 10px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.83rem', outline: 'none', minWidth: 160 }} />
                        <button className="btn btn-primary" onClick={openCreate} style={{ marginLeft: 'auto' }}>
                            <PlusIcon style={{ width: 16, height: 16 }} />
                            New Shift
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3>Scheduled Shifts</h3>
                        <p>{rosters.length} shift{rosters.length !== 1 ? 's' : ''} in selected period</p>
                    </div>
                </div>
                <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Employee</th>
                                <th>Department</th>
                                <th>Shift</th>
                                <th>Start</th>
                                <th>End</th>
                                <th>Hours</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rosters.length === 0 ? (
                                <tr>
                                    <td colSpan={9}>
                                        <div className="empty-state">
                                            <div className="empty-icon">
                                                <CalendarDaysIcon />
                                            </div>
                                            <h3>No shifts scheduled</h3>
                                            <p>Create a new shift to get started</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                rosters.map((roster) => {
                                    const statusKey = roster.status?.toUpperCase() ?? '';
                                    const shiftMeta = SHIFT_TYPES.find(s => s.value === roster.shiftType);
                                    return (
                                        <tr key={roster.id}>
                                            <td style={{ fontWeight: 600 }}>{roster.shiftDate}</td>
                                            <td>
                                                <div className="emp-name">{roster.employee?.firstName} {roster.employee?.lastName}</div>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{roster.department || '—'}</td>
                                            <td>
                                                <span className="shift-chip" style={{
                                                    background: shiftMeta ? shiftMeta.dot + '20' : '#f1f5f9',
                                                    color: shiftMeta?.dot ?? 'var(--text-secondary)',
                                                    border: `1px solid ${shiftMeta?.dot ?? 'var(--border)'}40`,
                                                }}>
                                                    {roster.shiftType}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.85rem' }}>{new Date(roster.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td style={{ fontSize: '0.85rem' }}>{new Date(roster.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td style={{ fontWeight: 600 }}>{roster.totalShiftHours?.toFixed(1)}h</td>
                                            <td>
                                                <span className={`badge ${STATUS_CLASS[statusKey] ?? 'badge-gray'}`}>
                                                    {roster.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn-icon edit" onClick={() => openEdit(roster)} title="Edit shift">
                                                    <PencilSquareIcon />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Modal ── */}
            {showForm && (
                <div className="form-overlay">
                    <div className="form-modal">
                        <div className="form-modal-header">
                            <div>
                                <h3>{selectedRoster ? 'Edit Shift' : 'Create New Shift'}</h3>
                                <p>{selectedRoster ? 'Update the shift details below' : 'Schedule a new work shift for an employee'}</p>
                            </div>
                            <button className="btn-icon" onClick={closeForm} title="Close">
                                <XMarkIcon />
                            </button>
                        </div>

                        <div className="form-modal-body">
                            <form id="roster-form" onSubmit={handleSubmit}>
                                <div className="form-grid">
                                    <div className="form-field span-2">
                                        <label>Employee <span className="required">*</span></label>
                                        <select name="employeeId" value={formData.employeeId} onChange={handleInputChange} required>
                                            <option value="">Select employee…</option>
                                            {employees.map((emp) => (
                                                <option key={emp.id} value={emp.id}>
                                                    {emp.firstName} {emp.lastName}{emp.department ? ` — ${emp.department}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-field">
                                        <label>Shift Date <span className="required">*</span></label>
                                        <input type="date" name="shiftDate" value={formData.shiftDate} onChange={handleInputChange} required />
                                    </div>

                                    <div className="form-field">
                                        <label>Shift Type</label>
                                        <select name="shiftType" value={formData.shiftType} onChange={handleInputChange}>
                                            {SHIFT_TYPES.map(({ value, label, time }) => (
                                                <option key={value} value={value}>{label} ({time})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-field">
                                        <label>Start Time <span className="required">*</span></label>
                                        <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} required />
                                    </div>

                                    <div className="form-field">
                                        <label>End Time <span className="required">*</span></label>
                                        <input type="time" name="endTime" value={formData.endTime} onChange={handleInputChange} required />
                                    </div>

                                    <div className="form-field">
                                        <label>Break Duration (min)</label>
                                        <input type="number" name="breakDuration" value={formData.breakDuration}
                                            onChange={handleInputChange} min="0" step="15" placeholder="30" />
                                    </div>

                                    <div className="form-field">
                                        <label>Department</label>
                                        <input type="text" name="department" value={formData.department}
                                            onChange={handleInputChange} placeholder="e.g. Kitchen, Delivery" />
                                    </div>

                                    <div className="form-field span-2">
                                        <label>Notes</label>
                                        <textarea name="notes" value={formData.notes} onChange={handleInputChange}
                                            rows={2} placeholder="Optional notes about this shift…"
                                            style={{ resize: 'vertical' }} />
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="form-modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={closeForm}>
                                Cancel
                            </button>
                            <button type="submit" form="roster-form" className="btn btn-primary">
                                <CalendarDaysIcon style={{ width: 16, height: 16 }} />
                                {selectedRoster ? 'Save Changes' : 'Create Shift'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RosterManagement;
