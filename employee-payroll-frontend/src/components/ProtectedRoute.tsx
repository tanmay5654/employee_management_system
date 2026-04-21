import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { EmployeeRole } from '../types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: EmployeeRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
    const token = localStorage.getItem('token');
    const user: { role?: EmployeeRole } = JSON.parse(localStorage.getItem('user') ?? '{}');

    if (!token) return <Navigate to="/login" />;
    if (requiredRole && user.role !== requiredRole && user.role !== 'ADMIN') {
        return <Navigate to="/" />;
    }
    return <>{children}</>;
};

export default ProtectedRoute;
