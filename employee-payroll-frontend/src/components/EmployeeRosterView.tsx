import React, { useState, useEffect } from 'react';
import { rosterAPI } from '../services/api';
import { AuthUser, Roster, HoursSummary, RosterStatus } from '../types';

interface WeekRange {
  startDate: string;
  endDate: string;
}

interface EmployeeRosterViewProps {
  employee: AuthUser | null;
}

const STATUS_CLASS: Record<RosterStatus, string> = {
    SCHEDULED: 'status-scheduled',
    IN_PROGRESS: 'status-progress',
    COMPLETED: 'status-completed',
    CANCELLED: 'status-cancelled',
};

const EmployeeRosterView: React.FC<EmployeeRosterViewProps> = ({ employee }) => {
    const [rosters, setRosters] = useState<Roster[]>([]);
    const [upcomingShifts, setUpcomingShifts] = useState<Roster[]>([]);
    const [hoursSummary, setHoursSummary] = useState<HoursSummary | null>(null);
    const [selectedWeek, setSelectedWeek] = useState<WeekRange>({
        startDate: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1)).toISOString().split('T')[0],
        endDate: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 7)).toISOString().split('T')[0],
    });

    const employeeId = employee?.userId ?? employee?.id;

    useEffect(() => {
        if (employeeId) {
            fetchRosters();
            fetchUpcomingShifts();
            fetchHoursSummary();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employee, selectedWeek]);

    const fetchRosters = async (): Promise<void> => {
        try {
            const response = await rosterAPI.getEmployeeRosters(employeeId!);
            const data = response.data as { rosters?: Roster[] };
            setRosters(data.rosters ?? []);
        } catch (err) { console.error('Error fetching rosters:', err); }
    };

    const fetchUpcomingShifts = async (): Promise<void> => {
        try {
            const response = await rosterAPI.getUpcomingShifts(employeeId!);
            setUpcomingShifts(response.data as Roster[]);
        } catch (err) { console.error('Error fetching upcoming shifts:', err); }
    };

    const fetchHoursSummary = async (): Promise<void> => {
        try {
            const response = await rosterAPI.getHoursSummary(employeeId!, selectedWeek.startDate, selectedWeek.endDate);
            setHoursSummary(response.data as HoursSummary);
        } catch (err) { console.error('Error fetching hours summary:', err); }
    };

    return (
        <div className="employee-roster-view">
            <h2>My Schedule & Hours</h2>

            {upcomingShifts.length > 0 && (
                <div className="upcoming-shifts-card">
                    <h3>📅 Upcoming Shifts</h3>
                    <div className="upcoming-shifts-list">
                        {upcomingShifts.slice(0, 3).map((shift) => (
                            <div key={shift.id} className="upcoming-shift-item">
                                <span className="shift-date">
                                    {new Date(shift.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                                <span className="shift-time">
                                    {new Date(shift.startTime).toLocaleTimeString()} - {new Date(shift.endTime).toLocaleTimeString()}
                                </span>
                                <span className="shift-type">{shift.shiftType}</span>
                                <span className={`shift-status ${STATUS_CLASS[shift.status]}`}>{shift.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="hours-summary-card">
                <h3>📊 Hours Summary</h3>
                <div className="week-selector">
                    <input type="date" value={selectedWeek.startDate}
                        onChange={(e) => setSelectedWeek({ ...selectedWeek, startDate: e.target.value })} />
                    <span>to</span>
                    <input type="date" value={selectedWeek.endDate}
                        onChange={(e) => setSelectedWeek({ ...selectedWeek, endDate: e.target.value })} />
                </div>
                {hoursSummary && (
                    <div className="summary-stats">
                        <div className="stat-box"><label>Scheduled Hours</label>
                            <span className="stat-value">{hoursSummary.scheduledHours?.toFixed(1)}</span></div>
                        <div className="stat-box"><label>Actual Hours Worked</label>
                            <span className="stat-value">{hoursSummary.actualHours?.toFixed(1)}</span></div>
                        <div className="stat-box"><label>Difference</label>
                            <span className={`stat-value ${(hoursSummary.difference ?? 0) >= 0 ? 'positive' : 'negative'}`}>
                                {(hoursSummary.difference ?? 0) > 0 ? '+' : ''}{hoursSummary.difference?.toFixed(1)}
                            </span></div>
                    </div>
                )}
            </div>

            <div className="all-schedules">
                <h3>📋 All Scheduled Shifts</h3>
                <table className="schedules-table">
                    <thead>
                        <tr><th>Date</th><th>Shift</th><th>Start Time</th><th>End Time</th><th>Break</th><th>Total Hours</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        {rosters.length === 0 ? (
                            <tr><td colSpan={7} className="no-data">No schedules found</td></tr>
                        ) : (
                            rosters.map((roster) => (
                                <tr key={roster.id}>
                                    <td>{new Date(roster.shiftDate).toLocaleDateString()}</td>
                                    <td>{roster.shiftType}</td>
                                    <td>{new Date(roster.startTime).toLocaleTimeString()}</td>
                                    <td>{new Date(roster.endTime).toLocaleTimeString()}</td>
                                    <td>{roster.breakDuration} min</td>
                                    <td>{roster.totalShiftHours?.toFixed(1)}</td>
                                    <td><span className={`status-badge ${STATUS_CLASS[roster.status]}`}>{roster.status}</span></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EmployeeRosterView;
