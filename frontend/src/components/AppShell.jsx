import {
    Link,
    NavLink,
    useNavigate,
} from "react-router-dom";

import {
    Bell,
    Building2,
    CircleUserRound,
    FileText,
    LayoutDashboard,
    LogIn,
    LogOut,
    MapPin,
    Menu,
    Search,
    ShieldCheck,
    UserRound,
    X,
} from "lucide-react";

import { useState } from "react";

import {
    useDispatch,
    useSelector,
} from "react-redux";

import { logoutUser } from "@/redux/authSlice";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";


// --------------------------------------------------
// Public Navigation
// --------------------------------------------------

const publicNav = [
    {
        label: "Home",
        to: "/",
    },
    {
        label: "Report Issue",
        to: "/report",
    },
    {
        label: "Track Complaint",
        to: "/track",
    },
    {
        label: "Public Dashboard",
        to: "/public-dashboard",
    },
    {
        label: "About",
        to: "/about",
    },
];


// --------------------------------------------------
// Sidebar Navigation
// --------------------------------------------------

const sideNav = {
    citizen: [
        {
            label: "Dashboard",
            to: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            label: "Report Issue",
            to: "/report",
            icon: FileText,
        },
        {
            label: "My Complaints",
            to: "/complaints",
            icon: Search,
        },
        {
            label: "Track Complaint",
            to: "/track",
            icon: MapPin,
        },
        {
            label: "Public Dashboard",
            to: "/public-dashboard",
            icon: Building2,
        },
    ],

    department: [
        {
            label: "Department Dashboard",
            to: "/department",
            icon: LayoutDashboard,
        },
        {
            label: "Assigned Complaints",
            to: "/complaints",
            icon: FileText,
        },
        {
            label: "Public Dashboard",
            to: "/public-dashboard",
            icon: Building2,
        },
    ],

    admin: [
        {
            label: "Admin Dashboard",
            to: "/admin",
            icon: ShieldCheck,
        },
        {
            label: "All Complaints",
            to: "/complaints",
            icon: FileText,
        },
        {
            label: "Public Dashboard",
            to: "/public-dashboard",
            icon: Building2,
        },
    ],
};


// --------------------------------------------------
// Logo
// --------------------------------------------------

export function Logo({ compact = false }) {
    return (
        <Link
            to="/"
            className="flex items-center gap-2.5"
        >
            <span className="relative flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="size-5" />

                <span className="absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-card bg-success" />
            </span>

            {!compact && (
                <span>
                    <strong className="block font-display text-lg leading-none">
                        CivicConnect
                    </strong>

                    <small className="text-[10px] font-medium text-muted-foreground">
                        Report. Track. Resolve. Together.
                    </small>
                </span>
            )}
        </Link>
    );
}


// --------------------------------------------------
// Account Actions
// --------------------------------------------------

function AccountActions({
    mobile = false,
    close,
}) {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const {
        user,
        token,
    } = useSelector(
        (state) => state.auth
    );

    // User is not logged in
    if (!token || !user) {
        return (
            <Button
                asChild
                className={mobile ? "w-full" : ""}
            >
                <Link to="/login">
                    <LogIn />
                    Login
                </Link>
            </Button>
        );
    }

    // Decide dashboard according to role
    const dashboard =
        user.role === "admin"
            ? "/admin"
            : user.role === "department"
            ? "/department"
            : "/dashboard";

    // Logout user
    const logout = async () => {
        await dispatch(
            logoutUser()
        );

        close?.();

        navigate(
            "/login",
            {
                replace: true,
            }
        );
    };

    return (
        <div
            className={cn(
                "flex items-center gap-2",
                mobile &&
                    "flex-col items-stretch"
            )}
        >
            <Button
                asChild
                variant="outline"
                className={
                    mobile
                        ? "w-full"
                        : ""
                }
            >
                <Link
                    to={dashboard}
                    onClick={close}
                >
                    Dashboard
                </Link>
            </Button>

            <Button
                variant="ghost"
                className={
                    mobile
                        ? "w-full justify-start"
                        : ""
                }
                onClick={logout}
            >
                <LogOut />
                Logout
            </Button>
        </div>
    );
}


// --------------------------------------------------
// Marketing Header
// --------------------------------------------------

export function MarketingHeader() {
    const {
        token,
        user,
    } = useSelector(
        (state) => state.auth
    );

    const [open, setOpen] =
        useState(false);

    return (
        <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
            <div className="mx-auto flex h-17 max-w-7xl items-center justify-between px-4 sm:px-6">

                {/* Logo */}
                <Logo />

                {/* Desktop Navigation */}
                <nav className="hidden items-center gap-1 lg:flex">
                    {publicNav.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={
                                item.to === "/"
                            }
                            className={({
                                isActive,
                            }) =>
                                cn(
                                    "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                                    isActive &&
                                        "bg-primary-soft text-primary"
                                )
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Desktop Account Actions */}
                <div className="hidden items-center gap-2 lg:flex">

                    {token && user && (
                        <Button
                            asChild
                            variant="ghost"
                            size="icon"
                        >
                            <Link
                                to="/notifications"
                                aria-label="Notifications"
                            >
                                <Bell />
                            </Link>
                        </Button>
                    )}

                    <AccountActions />
                </div>

                {/* Mobile Menu Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() =>
                        setOpen(!open)
                    }
                    aria-label="Menu"
                >
                    {open ? (
                        <X />
                    ) : (
                        <Menu />
                    )}
                </Button>
            </div>

            {/* Mobile Navigation */}
            {open && (
                <div className="border-t bg-card p-4 lg:hidden">

                    <nav className="grid gap-1">
                        {publicNav.map(
                            (item) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    onClick={() =>
                                        setOpen(false)
                                    }
                                    className="rounded-md px-3 py-3 text-sm font-medium hover:bg-muted"
                                >
                                    {item.label}
                                </Link>
                            )
                        )}

                        {token && user && (
                            <Link
                                to="/notifications"
                                onClick={() =>
                                    setOpen(false)
                                }
                                className="rounded-md px-3 py-3 text-sm font-medium hover:bg-muted"
                            >
                                Notifications
                            </Link>
                        )}
                    </nav>

                    <div className="mt-2">
                        <AccountActions
                            mobile
                            close={() =>
                                setOpen(false)
                            }
                        />
                    </div>
                </div>
            )}
        </header>
    );
}


// --------------------------------------------------
// Dashboard Shell
// --------------------------------------------------

export function DashboardShell({
    children,
}) {
    const [mobile, setMobile] =
        useState(false);

    const {
        user,
    } = useSelector(
        (state) => state.auth
    );

    const {
        unreadCount,
    } = useSelector(
        (state) =>
            state.notifications
    );

    const dispatch =
        useDispatch();

    const navigate =
        useNavigate();

    const role =
        user?.role ||
        "citizen";

    const nav =
        sideNav[role] ||
        sideNav.citizen;

    // Logout
    const logout = async () => {
        await dispatch(
            logoutUser()
        );

        navigate(
            "/login",
            {
                replace: true,
            }
        );
    };

    return (
        <div className="min-h-screen bg-app">

            {/* ------------------------------------------
                Top Header
            ------------------------------------------ */}

            <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center border-b bg-card">

                {/* Logo Area */}
                <div className="flex w-64 items-center px-5">
                    <Logo />
                </div>

                {/* Header Actions */}
                <div className="ml-auto flex items-center gap-2 px-4">

                    {/* User Name */}
                    <span className="hidden max-w-52 truncate text-sm font-semibold sm:block">
                        {user?.name}
                    </span>

                    {/* Notifications */}
                    <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="relative"
                    >
                        <Link
                            to="/notifications"
                            aria-label="Notifications"
                        >
                            <Bell />

                            <span
                                className={cn(
                                    "absolute right-1 top-1 min-w-4 rounded-full bg-destructive px-1 text-[9px] leading-4 text-white",
                                    !unreadCount &&
                                        "hidden"
                                )}
                            >
                                {unreadCount > 99
                                    ? "99+"
                                    : unreadCount}
                            </span>
                        </Link>
                    </Button>

                    {/* Profile */}
                    <Button
                        asChild
                        variant="ghost"
                        size="icon"
                    >
                        <Link
                            to="/profile"
                            aria-label="Profile"
                        >
                            <CircleUserRound />
                        </Link>
                    </Button>

                    {/* Logout */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={logout}
                        aria-label="Logout"
                    >
                        <LogOut />
                    </Button>

                    {/* Mobile Sidebar Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() =>
                            setMobile(!mobile)
                        }
                        aria-label="Open navigation"
                    >
                        <Menu />
                    </Button>
                </div>
            </header>


            {/* ------------------------------------------
                Sidebar
            ------------------------------------------ */}

            <aside
                className={cn(
                    "fixed inset-y-16 left-0 z-30 w-64 border-r bg-card p-4 transition-transform lg:translate-x-0",
                    mobile
                        ? "translate-x-0"
                        : "-translate-x-full"
                )}
            >
                <nav className="space-y-1">

                    {nav.map(
                        ({
                            label,
                            to,
                            icon: Icon,
                        }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end
                                onClick={() =>
                                    setMobile(false)
                                }
                                className={({
                                    isActive,
                                }) =>
                                    cn(
                                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                                        isActive &&
                                            "bg-primary-soft text-primary"
                                    )
                                }
                            >
                                <Icon className="size-4" />

                                {label}
                            </NavLink>
                        )
                    )}
                </nav>


                {/* Bottom Navigation */}
                <div className="absolute bottom-4 left-4 right-4 border-t pt-4">

                    <Link
                        to="/notifications"
                        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted"
                    >
                        <Bell className="size-4" />

                        Notifications
                    </Link>

                    <Link
                        to="/profile"
                        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted"
                    >
                        <UserRound className="size-4" />

                        Profile
                    </Link>
                </div>
            </aside>


            {/* Mobile Overlay */}
            {mobile && (
                <button
                    className="fixed inset-0 z-20 bg-overlay lg:hidden"
                    onClick={() =>
                        setMobile(false)
                    }
                    aria-label="Close navigation"
                />
            )}


            {/* ------------------------------------------
                Main Content
            ------------------------------------------ */}

            <main className="pt-16 lg:pl-64">
                <div className="mx-auto max-w-[1500px] px-4 py-2 sm:px-5 sm:py-3 lg:px-6 lg:py-4">
                    {children}
                </div>
            </main>
        </div>
    );
}


// --------------------------------------------------
// Smart Shell
// --------------------------------------------------

export function SmartShell({
    children,
    publicPage = false,
}) {
    const {
        token,
        user,
    } = useSelector(
        (state) => state.auth
    );

    // --------------------------------------------------
    // Public Page
    // Example: Home
    // --------------------------------------------------

    if (publicPage) {
        return (
            <>
                <MarketingHeader />

                {children}
            </>
        );
    }


    // --------------------------------------------------
    // Logged-in User
    // --------------------------------------------------

    if (token && user) {
        return (
            <DashboardShell>
                {children}
            </DashboardShell>
        );
    }


    // --------------------------------------------------
    // Logged-out User
    // --------------------------------------------------

    return (
        <>
            <MarketingHeader />

            {children}
        </>
    );
}


// --------------------------------------------------
// Footer
// --------------------------------------------------

export function Footer() {
    return (
        <footer className="border-t bg-civic-dark py-10 text-civic-dark-foreground">
            <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6">

                {/* Footer Brand */}
                <div>
                    <Logo />

                    <p className="mt-3 max-w-md text-sm text-civic-dark-muted">
                        A civic grievance and transparency platform for reporting, tracking, resolving and verifying public issues.
                    </p>
                </div>


                {/* Footer Links */}
                <div className="flex flex-wrap gap-5 text-sm text-civic-dark-muted">

                    <Link to="/about">
                        About
                    </Link>

                    <Link to="/track">
                        Track
                    </Link>

                    <Link to="/public-dashboard">
                        Transparency
                    </Link>

                    <span>
                        Live data from CivicConnect
                    </span>
                </div>
            </div>
        </footer>
    );
}