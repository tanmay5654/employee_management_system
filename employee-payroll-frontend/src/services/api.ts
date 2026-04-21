import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL
    ? `${process.env.REACT_APP_API_URL}/api`
    : 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error: { response?: { status?: number } }) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ==================== AUTH APIS ====================
export const authAPI = {
    login: (credentials: { username: string; password: string }): Promise<AxiosResponse> =>
        api.post('/auth/login', credentials),
    register: (userData: object): Promise<AxiosResponse> =>
        api.post('/auth/register', userData),
    validateToken: (token: string): Promise<AxiosResponse> =>
        api.get(`/auth/validate?token=${token}`),
    logout: (): void => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
};

// ==================== EMPLOYEE APIS ====================
export const employeeAPI = {
    getAll: async (): Promise<AxiosResponse> => {
        try {
            const response = await api.get('/employees');
            return { ...response, data: Array.isArray(response.data) ? response.data : [] };
        } catch (error) {
            console.error('Error fetching employees:', error);
            return { data: [] } as AxiosResponse;
        }
    },
    getById: (id: number): Promise<AxiosResponse> => api.get(`/employees/${id}`),
    create: (data: object): Promise<AxiosResponse> => api.post('/employees', data),
    update: (id: number, data: object): Promise<AxiosResponse> => api.put(`/employees/${id}`, data),
    delete: (id: number): Promise<AxiosResponse> => api.delete(`/employees/${id}`),
    getByDepartment: (dept: string): Promise<AxiosResponse> => api.get(`/employees/department/${dept}`),
};

// ==================== TIMESHEET APIS ====================
export const timesheetAPI = {
    clockIn: (employeeId: string | number): Promise<AxiosResponse> =>
        api.post(`/timesheets/clockin/${employeeId}`),
    clockOut: (employeeId: string | number, breakMinutes: number, notes: string): Promise<AxiosResponse> =>
        api.put(`/timesheets/clockout/${employeeId}?breakMinutes=${breakMinutes || 0}&notes=${notes || ''}`),
    getStatus: (employeeId: string | number): Promise<AxiosResponse> =>
        api.get(`/timesheets/status/${employeeId}`),
    getByEmployee: (employeeId: string | number): Promise<AxiosResponse> =>
        api.get(`/timesheets/employee/${employeeId}`),
    getByDate: (employeeId: string | number, date: string): Promise<AxiosResponse> =>
        api.get(`/timesheets/employee/${employeeId}/date/${date}`),
    getByDateRange: (employeeId: string | number, startDate: string, endDate: string): Promise<AxiosResponse> =>
        api.get(`/timesheets/employee/${employeeId}/range?startDate=${startDate}&endDate=${endDate}`),
};

// ==================== ROSTER APIS ====================
export const rosterAPI = {
    createRoster: (data: object): Promise<AxiosResponse> => api.post('/rosters/create', data),
    updateRoster: (rosterId: number, managerId: number | undefined, data: object): Promise<AxiosResponse> =>
        api.put(`/rosters/update/${rosterId}?managerId=${managerId}`, data),
    getAllRosters: (managerId?: number, startDate?: string, endDate?: string, department?: string | null): Promise<AxiosResponse> => {
        const params = new URLSearchParams();
        if (managerId) params.append('managerId', String(managerId));
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (department) params.append('department', department);
        const query = params.toString();
        return api.get(query ? `/rosters/all?${query}` : '/rosters/all');
    },
    getEmployeeRosters: (employeeId: number): Promise<AxiosResponse> =>
        api.get(`/rosters/employee/${employeeId}`),
    getUpcomingShifts: (employeeId: number): Promise<AxiosResponse> =>
        api.get(`/rosters/employee/${employeeId}/upcoming`),
    getHoursSummary: (employeeId: number, startDate: string, endDate: string): Promise<AxiosResponse> =>
        api.get(`/rosters/employee/${employeeId}/hours-summary?startDate=${startDate}&endDate=${endDate}`),
};

// ==================== AI APIS ====================
export const aiAPI = {
    naturalLanguageQuery: (query: string): Promise<AxiosResponse> =>
        api.post('/ai/query', { query }),
};

// ==================== ANALYTICS APIS ====================
export const analyticsAPI = {
    getWeeklyHours: (): Promise<AxiosResponse> => api.get('/analytics/weekly-hours'),
    getOvertimeTrends: (): Promise<AxiosResponse> => api.get('/analytics/overtime-trends'),
    getDepartmentSummary: (): Promise<AxiosResponse> => api.get('/analytics/department-summary'),
    getPayrollForecast: (): Promise<AxiosResponse> => api.get('/analytics/payroll-forecast'),
};

// ==================== HELPERS ====================
export const getCurrentUser = (): { username: string; role: string; userId: number } | null => {
    const userStr = localStorage.getItem('user');
    try { return userStr ? JSON.parse(userStr) : null; }
    catch { return null; }
};

export const isAuthenticated = (): boolean => !!localStorage.getItem('token');

export const hasRole = (role: string): boolean => {
    const user = getCurrentUser();
    return user?.role === role;
};

export default api;
