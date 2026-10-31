import { useEffect } from 'react';

import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
    useLocation,
} from 'react-router-dom';

import { useDispatch, useSelector } from 'react-redux';

import { Toaster } from '@/components/ui/sonner';
import { DemoProvider } from '@/components/DemoContext';
import { Button } from '@/components/ui/button';

import {
    fetchProfile,
    forceLogout,
} from '@/redux/authSlice';

import { Loader2 } from 'lucide-react';


// Public Pages
import Home from '@/pages/public/Home';
import About from '@/pages/public/About';
import Track from '@/pages/public/Track';
import PublicDashboard from '@/pages/public/PublicDashboard';

// Auth Pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';

// Citizen Pages
import CitizenDashboard from '@/pages/citizen/Dashboard';
import Complaints from '@/pages/citizen/Complaints';
import ComplaintDetails from '@/pages/citizen/ComplaintDetails';
import Report from '@/pages/citizen/Report';
import Notifications from '@/pages/citizen/Notifications';
import Profile from '@/pages/citizen/Profile';

// Department Pages
import DepartmentDashboard from '@/pages/department/Dashboard';

// Admin Pages
import AdminDashboard from '@/pages/admin/Dashboard';

// Error Page
import NotFound from '@/pages/NotFound';


// Bootstrap Authentication
function Bootstrap() {
    const dispatch = useDispatch();

    const {
        token,
        initialized,
    } = useSelector(
        (state) => state.auth
    );


    useEffect(() => {
        if (token && !initialized) {
            dispatch(fetchProfile());
        } else if (!token && !initialized) {
            dispatch(forceLogout());
        }
    }, [
        dispatch,
        token,
        initialized,
    ]);


    return null;
}


// Protected Route
function ProtectedRoute({
    children,
    roles,
}) {
    const {
        user,
        token,
        initialized,
        loading,
    } = useSelector(
        (state) => state.auth
    );

    const location = useLocation();


    // Authentication loading
    if (
        !initialized ||
        (token && loading && !user)
    ) {
        return (
            <div
                className="
                    grid
                    min-h-screen
                    place-items-center
                "
            >
                <Loader2 className="animate-spin" />
            </div>
        );
    }


    // User is not logged in
    if (!token || !user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location.pathname,
                }}
            />
        );
    }


    // User does not have permission
    if (
        roles &&
        !roles.includes(user.role)
    ) {
        return (
            <Navigate
                to={
                    user.role === 'admin'
                        ? '/admin'
                        : user.role === 'department'
                            ? '/department'
                            : '/dashboard'
                }
                replace
            />
        );
    }


    return children;
}


// Public-only Route
function PublicOnly({ children }) {
    const {
        user,
        token,
        initialized,
    } = useSelector(
        (state) => state.auth
    );


    // Authentication initialization
    if (!initialized) {
        return (
            <div
                className="
                    grid
                    min-h-screen
                    place-items-center
                "
            >
                <Loader2 className="animate-spin" />
            </div>
        );
    }


    // Already logged in
    if (token && user) {
        return (
            <Navigate
                to={
                    user.role === 'admin'
                        ? '/admin'
                        : user.role === 'department'
                            ? '/department'
                            : '/dashboard'
                }
                replace
            />
        );
    }


    return children;
}


export default function App() {
    return (
        <DemoProvider>

            {/* Authentication Bootstrap */}
            <Bootstrap />


            <BrowserRouter>

                <Routes>

                    {/* Public Routes */}
                    <Route
                        path="/"
                        element={<Home />}
                    />

                    <Route
                        path="/about"
                        element={<About />}
                    />

                    <Route
                        path="/track"
                        element={<Track />}
                    />

                    <Route
                        path="/public-dashboard"
                        element={<PublicDashboard />}
                    />


                    {/* Authentication Routes */}
                    <Route
                        path="/login"
                        element={
                            <PublicOnly>
                                <Login />
                            </PublicOnly>
                        }
                    />

                    <Route
                        path="/register"
                        element={
                            <PublicOnly>
                                <Register />
                            </PublicOnly>
                        }
                    />


                    {/* Citizen Dashboard */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute
                                roles={['citizen']}
                            >
                                <CitizenDashboard />
                            </ProtectedRoute>
                        }
                    />


                    {/* Complaints */}
                    <Route
                        path="/complaints"
                        element={
                            <ProtectedRoute
                                roles={[
                                    'citizen',
                                    'department',
                                    'admin',
                                ]}
                            >
                                <Complaints />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/complaints/:id"
                        element={
                            <ProtectedRoute
                                roles={[
                                    'citizen',
                                    'department',
                                    'admin',
                                ]}
                            >
                                <ComplaintDetails />
                            </ProtectedRoute>
                        }
                    />


                    {/* Report Complaint */}
                    <Route
                        path="/report"
                        element={
                            <ProtectedRoute
                                roles={['citizen']}
                            >
                                <Report />
                            </ProtectedRoute>
                        }
                    />


                    {/* Notifications */}
                    <Route
                        path="/notifications"
                        element={
                            <ProtectedRoute
                                roles={[
                                    'citizen',
                                    'department',
                                    'admin',
                                ]}
                            >
                                <Notifications />
                            </ProtectedRoute>
                        }
                    />


                    {/* Profile */}
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute
                                roles={[
                                    'citizen',
                                    'department',
                                    'admin',
                                ]}
                            >
                                <Profile />
                            </ProtectedRoute>
                        }
                    />


                    {/* Department Dashboard */}
                    <Route
                        path="/department"
                        element={
                            <ProtectedRoute
                                roles={['department']}
                            >
                                <DepartmentDashboard />
                            </ProtectedRoute>
                        }
                    />


                    {/* Admin Dashboard */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute
                                roles={['admin']}
                            >
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />


                    {/* 404 Page */}
                    <Route
                        path="*"
                        element={<NotFound />}
                    />

                </Routes>

            </BrowserRouter>


            {/* Toast Notifications */}
            <Toaster />

        </DemoProvider>
    );
}