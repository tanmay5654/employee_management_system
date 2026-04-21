import React, { useState, useEffect, ChangeEvent } from 'react';
import { timesheetAPI } from '../services/api';
import { Employee, TimeEntry, ClockStatus } from '../types';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface TimeTrackingProps {
  employees: Employee[];
}

const TimeTracking: React.FC<TimeTrackingProps> = ({ employees }) => {
    const [selectedEmployee, setSelectedEmployee] = useState<string>('');
    const [clockStatus, setClockStatus] = useState<ClockStatus | null>(null);
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [breakMinutes, setBreakMinutes] = useState<number>(0);
    const [notes, setNotes] = useState<string>('');
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        if (selectedEmployee) {
            checkStatus();
            loadTimeEntries();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEmployee]);

    const checkStatus = async (): Promise<void> => {
        try {
            const response = await timesheetAPI.getStatus(selectedEmployee);
            setClockStatus(response.data as ClockStatus);
        } catch (err) {
            console.error('Error checking status:', err);
        }
    };

    const loadTimeEntries = async (): Promise<void> => {
        try {
            const response = await timesheetAPI.getByEmployee(selectedEmployee);
            setTimeEntries(response.data as TimeEntry[]);
        } catch (err) {
            console.error('Error loading time entries:', err);
        }
    };

    const handleClockIn = async (): Promise<void> => {
        try {
            setLoading(true);
            await timesheetAPI.clockIn(selectedEmployee);
            alert('Clocked in successfully!');
            checkStatus();
            loadTimeEntries();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: string }; message?: string })?.response?.data;
            alert('Error clocking in: ' + (msg ?? (err as Error).message));
        } finally {
            setLoading(false);
        }
    };

    const handleClockOut = async (): Promise<void> => {
        try {
            setLoading(true);
            await timesheetAPI.clockOut(selectedEmployee, breakMinutes, notes);
            alert('Clocked out successfully!');
            checkStatus();
            loadTimeEntries();
            setBreakMinutes(0);
            setNotes('');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: string }; message?: string })?.response?.data;
            alert('Error clocking out: ' + (msg ?? (err as Error).message));
        } finally {
            setLoading(false);
        }
    };

    const loadDateRange = async (): Promise<void> => {
        try {
            const response = await timesheetAPI.getByDateRange(selectedEmployee, dateRange.startDate, dateRange.endDate);
            const data = response.data as { entries?: TimeEntry[] };
            setTimeEntries(data.entries ?? []);
        } catch (err) {
            console.error('Error loading date range:', err);
        }
    };

    return (
        <div className="time-tracking">
            <h2>Time Tracking</h2>
            <div className="employee-selector">
                <label>Select Employee:</label>
                <select value={selectedEmployee} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedEmployee(e.target.value)}>
                    <option value="">Choose an employee</option>
                    {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName} - {emp.employeeCode}
                        </option>
                    ))}
                </select>
            </div>

            {selectedEmployee && (
                <>
                    <div className="clock-actions">
                        <div className="status-card">
                            <h3>Current Status</h3>
                            <p className={clockStatus?.isClockedIn ? 'status-active' : 'status-inactive'}>
                                {clockStatus?.isClockedIn ? '⏰ Clocked In' : '⚪ Clocked Out'}
                            </p>
                            {clockStatus?.isClockedIn && clockStatus.clockInTime && (
                                <p>Since: {new Date(clockStatus.clockInTime).toLocaleString()}</p>
                            )}
                        </div>
                        <div className="action-buttons">
                            {!clockStatus?.isClockedIn ? (
                                <button className="btn-clock-in" onClick={handleClockIn} disabled={loading}>
                                    {loading ? 'Processing...' : '⏰ Clock In'}
                                </button>
                            ) : (
                                <div className="clock-out-form">
                                    <input type="number" placeholder="Break minutes" value={breakMinutes}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setBreakMinutes(Number(e.target.value))} />
                                    <input type="text" placeholder="Notes" value={notes}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)} />
                                    <button className="btn-clock-out" onClick={handleClockOut} disabled={loading}>
                                        {loading ? 'Processing...' : '🔴 Clock Out'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="time-entries">
                        <div className="entries-header">
                            <h3>Time Entries</h3>
                            <div className="date-filter">
                                <input type="date" value={dateRange.startDate}
                                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} />
                                <span>to</span>
                                <input type="date" value={dateRange.endDate}
                                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} />
                                <button onClick={loadDateRange}>Filter</button>
                            </div>
                        </div>
                        <table className="entries-table">
                            <thead>
                                <tr><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Break (min)</th><th>Total Hours</th><th>Notes</th></tr>
                            </thead>
                            <tbody>
                                {timeEntries.length === 0 ? (
                                    <tr><td colSpan={6} className="no-data">No time entries found</td></tr>
                                ) : (
                                    timeEntries.map((entry) => (
                                        <tr key={entry.id}>
                                            <td>{entry.date}</td>
                                            <td>{new Date(entry.clockIn).toLocaleTimeString()}</td>
                                            <td>{entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString() : 'Active'}</td>
                                            <td>{entry.breakMinutes}</td>
                                            <td>{entry.totalHours?.toFixed(2)}</td>
                                            <td>{entry.notes}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default TimeTracking;
