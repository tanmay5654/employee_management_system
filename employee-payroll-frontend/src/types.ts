// ─── Domain types ─────────────────────────────────────────────────────────────

export type EmployeeRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
export type RosterStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Employee {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  hourlyRate: number;
  department?: string;
  position?: string;
  isActive: boolean;
  role: EmployeeRole;
  managedDepartment?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimeEntry {
  id: number;
  employee: Employee;
  clockIn: string;
  clockOut?: string;
  breakMinutes: number;
  totalHours?: number;
  date: string;
  notes?: string;
}

export interface Roster {
  id: number;
  employee: Employee;
  manager?: Employee;
  shiftDate: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  totalShiftHours?: number;
  shiftType: string;
  department?: string;
  status: RosterStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Auth types ────────────────────────────────────────────────────────────────

export interface AuthUser {
  username: string;
  role: EmployeeRole;
  userId: number;
  id?: number; // alias used in some components
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: EmployeeRole;
}

// ─── Analytics types ───────────────────────────────────────────────────────────

export interface WeeklyHoursRow {
  name: string;
  department?: string;
  hours: number;
}

export interface OvertimeTrendRow {
  week: string;
  overtimeHours: number;
  employeesWithOvertime: number;
}

export interface DepartmentSummaryRow {
  department: string;
  employeeCount: number;
  avgHourlyRate: number;
}

export interface PayrollForecastRow {
  department: string;
  estimatedCost: number;
}

// ─── AI types ──────────────────────────────────────────────────────────────────

export interface AiQueryResult {
  query: string;
  generatedSql: string;
  data: Record<string, string | null>[];
  rowCount: number;
  error?: string;
}

// ─── Timesheet status ─────────────────────────────────────────────────────────

export interface ClockStatus {
  isClockedIn: boolean;
  clockInTime?: string;
  timeEntryId?: number;
}

export interface HoursSummary {
  scheduledHours?: number;
  actualHours?: number;
  difference?: number;
}
