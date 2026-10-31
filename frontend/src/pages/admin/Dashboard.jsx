import { useEffect, useState } from "react";

import {
    Building2,
    FileText,
    FolderTree,
    Plus,
    ShieldCheck,
    Trash2,
    UserRound,
} from "lucide-react";

import {
    useDispatch,
    useSelector,
} from "react-redux";

import { toast } from "sonner";


// --------------------------------------------------
// Admin Redux
// --------------------------------------------------

import {
    fetchUsers,
    createStaff,
    updateUserStatus,
    deleteUser,
    createDepartment,
    toggleDepartment,
    deleteDepartment,
    createCategory,
    toggleCategory,
    deleteCategory,
} from "@/redux/adminSlice";


// --------------------------------------------------
// Master Redux
// --------------------------------------------------

import {
    fetchDepartments,
    fetchCategories,
} from "@/redux/masterSlice";


// --------------------------------------------------
// Analytics Redux
// --------------------------------------------------

import {
    fetchAdminAnalytics,
} from "@/redux/analyticsSlice";


// --------------------------------------------------
// Complaint Redux
// --------------------------------------------------

import {
    fetchAllComplaints,
} from "@/redux/complaintSlice";


// --------------------------------------------------
// Components
// --------------------------------------------------

import {
    DashboardShell,
} from "@/components/AppShell";

import {
    Button,
} from "@/components/ui/button";

import {
    ComplaintTable,
    ComplaintTableSkeleton,
    EmptyState,
    LoadingCards,
    Metric,
    PageHeader,
    Skeleton,
    StatCard,
} from "@/components/CivicUI";


// --------------------------------------------------
// Admin Dashboard
// --------------------------------------------------

export default function AdminDashboard() {
    const dispatch = useDispatch();


    // --------------------------------------------------
    // Analytics State
    // --------------------------------------------------

    const {
        admin,
    } = useSelector(
        (state) => state.analytics
    );


    // --------------------------------------------------
    // Admin State
    // --------------------------------------------------

    const {
        users,
        loading: adminLoading,
    } = useSelector(
        (state) => state.admin
    );


    // --------------------------------------------------
    // Master Data
    // --------------------------------------------------

    const {
        departments,
        categories,
    } = useSelector(
        (state) => state.master
    );


    // --------------------------------------------------
    // Complaints
    // --------------------------------------------------

    const {
        items,
        loading: complaintsLoading,
    } = useSelector(
        (state) => state.complaints
    );


    // --------------------------------------------------
    // Active Dashboard Tab
    // --------------------------------------------------

    const [tab, setTab] =
        useState("overview");


    // --------------------------------------------------
    // Staff Form
    // --------------------------------------------------

    const [staffForm, setStaffForm] =
        useState({
            name: "",
            email: "",
            phone: "",
            password: "",
            department: "",
        });


    // --------------------------------------------------
    // Department Form
    // --------------------------------------------------

    const [deptForm, setDeptForm] =
        useState({
            name: "",
            description: "",
            category: "road",
            contactEmail: "",
            contactPhone: "",
        });


    // --------------------------------------------------
    // Category Form
    // --------------------------------------------------

    const [catForm, setCatForm] =
        useState({
            name: "",
            description: "",
            department: "",
            subCategories: "",
        });


    // --------------------------------------------------
    // Fetch Admin Dashboard Data
    // --------------------------------------------------

    useEffect(() => {
        dispatch(
            fetchAdminAnalytics()
        );

        dispatch(
            fetchUsers()
        );

        dispatch(
            fetchDepartments(true)
        );

        dispatch(
            fetchCategories(true)
        );

        dispatch(
            fetchAllComplaints()
        );
    }, [dispatch]);


    // --------------------------------------------------
    // Common Action Handler
    // --------------------------------------------------

    const action = async (
        thunk,
        args,
        successMessage
    ) => {
        const result =
            await dispatch(
                thunk(args)
            );

        if (
            thunk.fulfilled.match(
                result
            )
        ) {
            toast.success(
                successMessage
            );

            dispatch(
                fetchDepartments(true)
            );

            dispatch(
                fetchCategories(true)
            );
        } else {
            toast.error(
                result.payload ||
                    "Action failed"
            );
        }
    };


    // --------------------------------------------------
    // Create Department Staff
    // --------------------------------------------------

    const addStaff = async (
        event
    ) => {
        event.preventDefault();

        await action(
            createStaff,
            staffForm,
            "Staff account created"
        );

        setStaffForm({
            name: "",
            email: "",
            phone: "",
            password: "",
            department: "",
        });

        dispatch(
            fetchUsers()
        );
    };


    // --------------------------------------------------
    // Create Department
    // --------------------------------------------------

    const addDept = async (
        event
    ) => {
        event.preventDefault();

        await action(
            createDepartment,
            deptForm,
            "Department created"
        );

        setDeptForm({
            name: "",
            description: "",
            category: "road",
            contactEmail: "",
            contactPhone: "",
        });
    };


    // --------------------------------------------------
    // Create Category
    // --------------------------------------------------

    const addCat = async (
        event
    ) => {
        event.preventDefault();

        await action(
            createCategory,
            {
                ...catForm,

                subCategories:
                    catForm.subCategories
                        .split(",")
                        .map(
                            (value) =>
                                value.trim()
                        )
                        .filter(
                            Boolean
                        ),
            },
            "Category created"
        );

        setCatForm({
            name: "",
            description: "",
            department: "",
            subCategories: "",
        });
    };


    // --------------------------------------------------
    // Dashboard Loading
    // --------------------------------------------------

    const analyticsLoading =
        !admin;

    const dashboardLoading =
        adminLoading ||
        analyticsLoading;


    return (
        <DashboardShell>

            {/* --------------------------------------------------
                Page Header
            -------------------------------------------------- */}

            <PageHeader
                eyebrow="Administration"
                title="Admin Dashboard"
                description="Manage CivicConnect data and monitor the live system."
            />


            {/* --------------------------------------------------
                Dashboard Statistics
            -------------------------------------------------- */}

            {dashboardLoading ? (
                <LoadingCards />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">

                    <StatCard
                        label="Users"
                        value={
                            admin?.totalUsers ??
                            0
                        }
                        icon={UserRound}
                    />


                    <StatCard
                        label="Departments"
                        value={
                            admin?.totalDepartments ??
                            0
                        }
                        icon={Building2}
                    />


                    <StatCard
                        label="Categories"
                        value={
                            admin?.totalCategories ??
                            0
                        }
                        icon={FolderTree}
                    />


                    <StatCard
                        label="Complaints"
                        value={
                            admin?.totalComplaints ??
                            0
                        }
                        icon={FileText}
                    />


                    <StatCard
                        label="Resolved"
                        value={
                            admin?.resolvedComplaints ??
                            0
                        }
                        icon={ShieldCheck}
                        tone="success"
                    />


                    <StatCard
                        label="Resolution rate"
                        value={`${admin?.resolutionRate ?? 0}%`}
                        icon={ShieldCheck}
                        tone="success"
                    />

                </div>
            )}


            {/* --------------------------------------------------
                Dashboard Tabs
            -------------------------------------------------- */}

            <div className="mt-7 flex flex-wrap gap-2">

                {[
                    [
                        "overview",
                        "Overview",
                    ],
                    [
                        "users",
                        "Users",
                    ],
                    [
                        "departments",
                        "Departments",
                    ],
                    [
                        "categories",
                        "Categories",
                    ],
                    [
                        "complaints",
                        "Complaints",
                    ],
                ].map(
                    ([value, label]) => (
                        <Button
                            key={value}
                            variant={
                                tab === value
                                    ? "default"
                                    : "outline"
                            }
                            onClick={() =>
                                setTab(value)
                            }
                        >
                            {label}
                        </Button>
                    )
                )}

            </div>


            {/* ==================================================
                OVERVIEW TAB
            ================================================== */}

            {tab === "overview" && (
                <div className="mt-6 grid gap-6 lg:grid-cols-2">

                    {/* Operational Alerts */}
                    <div className="panel p-6">

                        <h2 className="font-bold">
                            Operational alerts
                        </h2>


                        {dashboardLoading ? (
                            <div className="mt-4 space-y-4">

                                <div>
                                    <Skeleton className="h-3 w-44" />
                                    <Skeleton className="mt-2 h-5 w-12" />
                                </div>

                                <div>
                                    <Skeleton className="h-3 w-52" />
                                    <Skeleton className="mt-2 h-5 w-12" />
                                </div>

                            </div>
                        ) : (
                            <div className="mt-4 grid gap-3">

                                <Metric
                                    label="Critical active complaints"
                                    value={
                                        admin?.criticalComplaints ??
                                        0
                                    }
                                />

                                <Metric
                                    label="Unassigned active complaints"
                                    value={
                                        admin?.unassignedComplaints ??
                                        0
                                    }
                                />

                            </div>
                        )}

                    </div>


                    {/* Quick Actions */}
                    <div className="panel p-6">

                        <h2 className="font-bold">
                            Quick actions
                        </h2>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">

                            <Button
                                onClick={() =>
                                    setTab(
                                        "users"
                                    )
                                }
                            >
                                <UserRound />
                                Manage users
                            </Button>


                            <Button
                                onClick={() =>
                                    setTab(
                                        "departments"
                                    )
                                }
                            >
                                <Building2 />
                                Manage departments
                            </Button>


                            <Button
                                onClick={() =>
                                    setTab(
                                        "categories"
                                    )
                                }
                            >
                                <FolderTree />
                                Manage categories
                            </Button>


                            <Button
                                onClick={() =>
                                    setTab(
                                        "complaints"
                                    )
                                }
                            >
                                <FileText />
                                Manage complaints
                            </Button>

                        </div>

                    </div>

                </div>
            )}


            {/* ==================================================
                USERS TAB
            ================================================== */}

            {tab === "users" && (
                <div className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">

                    {/* Create Staff Form */}
                    <form
                        onSubmit={addStaff}
                        className="panel p-6"
                    >

                        <h2 className="font-bold">
                            Create department staff
                        </h2>


                        <div className="mt-4 grid gap-3">

                            {[
                                [
                                    "name",
                                    "Name",
                                ],
                                [
                                    "email",
                                    "Email",
                                ],
                                [
                                    "phone",
                                    "Phone",
                                ],
                                [
                                    "password",
                                    "Password",
                                ],
                            ].map(
                                ([key, label]) => (
                                    <input
                                        key={key}
                                        className="field"
                                        type={
                                            key ===
                                            "password"
                                                ? "password"
                                                : key ===
                                                  "email"
                                                ? "email"
                                                : "text"
                                        }
                                        placeholder={label}
                                        value={
                                            staffForm[
                                                key
                                            ]
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setStaffForm(
                                                {
                                                    ...staffForm,
                                                    [key]:
                                                        event
                                                            .target
                                                            .value,
                                                }
                                            )
                                        }
                                        required={
                                            key !==
                                            "phone"
                                        }
                                    />
                                )
                            )}


                            <select
                                className="field"
                                value={
                                    staffForm.department
                                }
                                onChange={(
                                    event
                                ) =>
                                    setStaffForm(
                                        {
                                            ...staffForm,
                                            department:
                                                event
                                                    .target
                                                    .value,
                                        }
                                    )
                                }
                                required
                            >
                                <option value="">
                                    Select department
                                </option>

                                {departments.map(
                                    (
                                        department
                                    ) => (
                                        <option
                                            key={
                                                department._id
                                            }
                                            value={
                                                department._id
                                            }
                                        >
                                            {
                                                department.name
                                            }
                                        </option>
                                    )
                                )}
                            </select>


                            <Button
                                disabled={
                                    adminLoading
                                }
                            >
                                <Plus />
                                Create staff
                            </Button>

                        </div>

                    </form>


                    {/* Users Table */}
                    <div className="panel overflow-hidden">

                        {adminLoading ? (
                            <div className="p-5">
                                <div className="space-y-4">

                                    {[1, 2, 3, 4, 5].map(
                                        (item) => (
                                            <div
                                                key={item}
                                                className="grid grid-cols-5 items-center gap-4 border-b pb-4"
                                            >
                                                <div>
                                                    <Skeleton className="h-4 w-28" />
                                                    <Skeleton className="mt-2 h-3 w-36" />
                                                </div>

                                                <Skeleton className="h-4 w-16" />

                                                <Skeleton className="h-4 w-24" />

                                                <Skeleton className="h-4 w-16" />

                                                <Skeleton className="h-8 w-24 rounded-md" />
                                            </div>
                                        )
                                    )}

                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">

                                <table className="w-full text-left text-sm">

                                    <thead className="border-b bg-muted/60 text-xs uppercase text-muted-foreground">
                                        <tr>

                                            <th className="px-5 py-4">
                                                Name
                                            </th>

                                            <th className="px-5 py-4">
                                                Role
                                            </th>

                                            <th className="px-5 py-4">
                                                Department
                                            </th>

                                            <th className="px-5 py-4">
                                                Status
                                            </th>

                                            <th className="px-5 py-4">
                                                Action
                                            </th>

                                        </tr>
                                    </thead>


                                    <tbody className="divide-y">

                                        {users.map(
                                            (user) => (
                                                <tr
                                                    key={
                                                        user._id
                                                    }
                                                >

                                                    <td className="px-5 py-4">
                                                        {
                                                            user.name
                                                        }

                                                        <div className="text-xs text-muted-foreground">
                                                            {
                                                                user.email
                                                            }
                                                        </div>
                                                    </td>


                                                    <td className="px-5 py-4">
                                                        {
                                                            user.role
                                                        }
                                                    </td>


                                                    <td className="px-5 py-4">
                                                        {
                                                            user
                                                                .department
                                                                ?.name ||
                                                            "—"
                                                        }
                                                    </td>


                                                    <td className="px-5 py-4">
                                                        {user.isActive
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </td>


                                                    <td className="flex gap-2 px-5 py-4">

                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                action(
                                                                    updateUserStatus,
                                                                    {
                                                                        id: user._id,

                                                                        isActive:
                                                                            !user.isActive,
                                                                    },
                                                                    `User ${
                                                                        user.isActive
                                                                            ? "deactivated"
                                                                            : "activated"
                                                                    }`
                                                                )
                                                            }
                                                        >
                                                            {user.isActive
                                                                ? "Deactivate"
                                                                : "Activate"}
                                                        </Button>


                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                action(
                                                                    deleteUser,
                                                                    user._id,
                                                                    "User deleted"
                                                                )
                                                            }
                                                        >
                                                            <Trash2 />
                                                        </Button>

                                                    </td>

                                                </tr>
                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>
                        )}

                    </div>

                </div>
            )}


            {/* ==================================================
                DEPARTMENTS TAB
            ================================================== */}

            {tab === "departments" && (
                <div className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">

                    {/* Add Department Form */}
                    <form
                        onSubmit={addDept}
                        className="panel p-6"
                    >

                        <h2 className="font-bold">
                            Add department
                        </h2>


                        <div className="mt-4 grid gap-3">

                            <input
                                className="field"
                                placeholder="Department name"
                                value={
                                    deptForm.name
                                }
                                onChange={(
                                    event
                                ) =>
                                    setDeptForm(
                                        {
                                            ...deptForm,
                                            name:
                                                event
                                                    .target
                                                    .value,
                                        }
                                    )
                                }
                                required
                            />


                            <textarea
                                className="field"
                                placeholder="Description"
                                value={
                                    deptForm.description
                                }
                                onChange={(
                                    event
                                ) =>
                                    setDeptForm(
                                        {
                                            ...deptForm,
                                            description:
                                                event
                                                    .target
                                                    .value,
                                        }
                                    )
                                }
                            />


                            <select
                                className="field"
                                value={
                                    deptForm.category
                                }
                                onChange={(
                                    event
                                ) =>
                                    setDeptForm(
                                        {
                                            ...deptForm,
                                            category:
                                                event
                                                    .target
                                                    .value,
                                        }
                                    )
                                }
                            >
                                {[
                                    "road",
                                    "water",
                                    "electricity",
                                    "sanitation",
                                    "drainage",
                                    "streetlight",
                                    "other",
                                ].map(
                                    (value) => (
                                        <option
                                            key={
                                                value
                                            }
                                            value={
                                                value
                                            }
                                        >
                                            {value}
                                        </option>
                                    )
                                )}
                            </select>


                            <input
                                className="field"
                                placeholder="Contact email"
                                value={
                                    deptForm.contactEmail
                                }
                                onChange={(
                                    event
                                ) =>
                                    setDeptForm(
                                        {
                                            ...deptForm,
                                            contactEmail:
                                                event
                                                    .target
                                                    .value,
                                        }
                                    )
                                }
                            />


                            <input
                                className="field"
                                placeholder="Contact phone"
                                value={
                                    deptForm.contactPhone
                                }
                                onChange={(
                                    event
                                ) =>
                                    setDeptForm(
                                        {
                                            ...deptForm,
                                            contactPhone:
                                                event
                                                    .target
                                                    .value,
                                        }
                                    )
                                }
                            />


                            <Button
                                disabled={
                                    adminLoading
                                }
                            >
                                <Plus />
                                Add department
                            </Button>

                        </div>

                    </form>


                    {/* Department List */}
                    <div className="grid gap-3 md:grid-cols-2">

                        {adminLoading ? (
                            [1, 2, 3, 4].map(
                                (item) => (
                                    <div
                                        key={item}
                                        className="panel p-5"
                                    >
                                        <div className="flex justify-between gap-3">
                                            <Skeleton className="h-5 w-36" />
                                            <Skeleton className="h-4 w-14" />
                                        </div>

                                        <Skeleton className="mt-3 h-4 w-full" />

                                        <Skeleton className="mt-2 h-4 w-3/4" />

                                        <div className="mt-4 flex gap-2">
                                            <Skeleton className="h-8 w-24 rounded-md" />
                                            <Skeleton className="h-8 w-9 rounded-md" />
                                        </div>
                                    </div>
                                )
                            )
                        ) : departments.length > 0 ? (
                            departments.map(
                                (department) => (
                                    <div
                                        className="panel p-5"
                                        key={
                                            department._id
                                        }
                                    >

                                        <div className="flex justify-between gap-3">

                                            <h3 className="font-bold">
                                                {
                                                    department.name
                                                }
                                            </h3>

                                            <span className="text-xs">
                                                {department.isActive
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>

                                        </div>


                                        <p className="mt-2 text-sm text-muted-foreground">
                                            {
                                                department.description ||
                                                "No description"
                                            }
                                        </p>


                                        <div className="mt-4 flex gap-2">

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    action(
                                                        toggleDepartment,
                                                        {
                                                            id: department._id,

                                                            active:
                                                                !department.isActive,
                                                        },
                                                        `Department ${
                                                            department.isActive
                                                                ? "deactivated"
                                                                : "activated"
                                                        }`
                                                    )
                                                }
                                            >
                                                {department.isActive
                                                    ? "Deactivate"
                                                    : "Activate"}
                                            </Button>


                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    action(
                                                        deleteDepartment,
                                                        department._id,
                                                        "Department deleted"
                                                    )
                                                }
                                            >
                                                <Trash2 />
                                            </Button>

                                        </div>

                                    </div>
                                )
                            )
                        ) : (
                            <EmptyState
                                title="No departments found"
                            />
                        )}

                    </div>

                </div>
            )}


            {/* ==================================================
                CATEGORIES TAB
            ================================================== */}

            {tab === "categories" && (
                <div className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">

                    {/* Add Category Form */}
                    <form
                        onSubmit={addCat}
                        className="panel p-6"
                    >

                        <h2 className="font-bold">
                            Add category
                        </h2>


                        <div className="mt-4 grid gap-3">

                            <input
                                className="field"
                                placeholder="Category name"
                                value={
                                    catForm.name
                                }
                                onChange={(
                                    event
                                ) =>
                                    setCatForm(
                                        {
                                            ...catForm,
                                            name:
                                                event
                                                    .target
                                                    .value,
                                        }
                                    )
                                }
                                required
                            />


                            <textarea
                                className="field"
                                placeholder="Description"
                                value={
                                    catForm.description
                                }
                                onChange={(
                                    event
                                ) =>
                                    setCatForm(
                                        {
                                            ...catForm,
                                            description:
                                                event
                                                    .target
                                                    .value,
                                        }
                                    )
                                }
                            />


                            <select
                                className="field"
                                value={
                                    catForm.department
                                }
                                onChange={(
                                    event
                                ) =>
                                    setCatForm(
                                        {
                                            ...catForm,
                                            department:
                                                event
                                                    .target
                                                    .value,
                                        }
                                    )
                                }
                            >
                                <option value="">
                                    No department
                                </option>

                                {departments.map(
                                    (
                                        department
                                    ) => (
                                        <option
                                            key={
                                                department._id
                                            }
                                            value={
                                                department._id
                                            }
                                        >
                                            {
                                                department.name
                                            }
                                        </option>
                                    )
                                )}
                            </select>


                            <input
                                className="field"
                                placeholder="Sub-categories (comma separated)"
                                value={
                                    catForm.subCategories
                                }
                                onChange={(
                                    event
                                ) =>
                                    setCatForm(
                                        {
                                            ...catForm,
                                            subCategories:
                                                event
                                                    .target
                                                    .value,
                                        }
                                    )
                                }
                            />


                            <Button
                                disabled={
                                    adminLoading
                                }
                            >
                                <Plus />
                                Add category
                            </Button>

                        </div>

                    </form>


                    {/* Category List */}
                    <div className="grid gap-3 md:grid-cols-2">

                        {adminLoading ? (
                            [1, 2, 3, 4].map(
                                (item) => (
                                    <div
                                        key={item}
                                        className="panel p-5"
                                    >
                                        <div className="flex justify-between gap-3">
                                            <Skeleton className="h-5 w-32" />
                                            <Skeleton className="h-4 w-14" />
                                        </div>

                                        <Skeleton className="mt-3 h-4 w-40" />

                                        <Skeleton className="mt-2 h-3 w-full" />

                                        <div className="mt-4 flex gap-2">
                                            <Skeleton className="h-8 w-24 rounded-md" />
                                            <Skeleton className="h-8 w-9 rounded-md" />
                                        </div>
                                    </div>
                                )
                            )
                        ) : categories.length > 0 ? (
                            categories.map(
                                (category) => (
                                    <div
                                        className="panel p-5"
                                        key={
                                            category._id
                                        }
                                    >

                                        <div className="flex justify-between gap-3">

                                            <h3 className="font-bold">
                                                {
                                                    category.name
                                                }
                                            </h3>

                                            <span className="text-xs">
                                                {category.isActive
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>

                                        </div>


                                        <p className="mt-2 text-sm text-muted-foreground">
                                            {
                                                category
                                                    .department
                                                    ?.name ||
                                                "Unassigned"
                                            }
                                        </p>


                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {category.subCategories?.join(
                                                ", "
                                            ) ||
                                                "No sub-categories"}
                                        </p>


                                        <div className="mt-4 flex gap-2">

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    action(
                                                        toggleCategory,
                                                        {
                                                            id: category._id,

                                                            active:
                                                                !category.isActive,
                                                        },
                                                        `Category ${
                                                            category.isActive
                                                                ? "deactivated"
                                                                : "activated"
                                                        }`
                                                    )
                                                }
                                            >
                                                {category.isActive
                                                    ? "Deactivate"
                                                    : "Activate"}
                                            </Button>


                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    action(
                                                        deleteCategory,
                                                        category._id,
                                                        "Category deleted"
                                                    )
                                                }
                                            >
                                                <Trash2 />
                                            </Button>

                                        </div>

                                    </div>
                                )
                            )
                        ) : (
                            <EmptyState
                                title="No categories found"
                            />
                        )}

                    </div>

                </div>
            )}


            {/* ==================================================
                COMPLAINTS TAB
            ================================================== */}

            {tab === "complaints" && (
                <div className="mt-6">

                    {complaintsLoading ? (
                        <ComplaintTableSkeleton
                            management
                        />
                    ) : items.length > 0 ? (
                        <ComplaintTable
                            complaints={items}
                            management
                        />
                    ) : (
                        <EmptyState />
                    )}

                </div>
            )}

        </DashboardShell>
    );
}