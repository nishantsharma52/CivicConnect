import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    FileText,
} from "lucide-react";

import {
    useDispatch,
    useSelector,
} from "react-redux";

import {
    fetchAllComplaints,
} from "@/redux/complaintSlice";

import {
    fetchDepartmentAnalytics,
} from "@/redux/analyticsSlice";

import {
    fetchDepartmentStaff,
} from "@/redux/masterSlice";

import {
    DashboardShell,
} from "@/components/AppShell";

import {
    ComplaintTable,
    ComplaintTableSkeleton,
    EmptyState,
    Filters,
    LoadingCards,
    StatCard,
    Skeleton,
} from "@/components/CivicUI";


export default function DepartmentDashboard() {
    const dispatch = useDispatch();


    // --------------------------------------------------
    // Auth State
    // --------------------------------------------------

    const {
        user,
    } = useSelector(
        (state) => state.auth
    );


    // --------------------------------------------------
    // Complaints State
    // --------------------------------------------------

    const {
        items,
        loading: complaintsLoading,
    } = useSelector(
        (state) =>
            state.complaints
    );


    // --------------------------------------------------
    // Analytics State
    // --------------------------------------------------

    const {
        department,
        loading: analyticsLoading,
    } = useSelector(
        (state) =>
            state.analytics
    );


    // --------------------------------------------------
    // Department Staff
    // --------------------------------------------------

    const {
        staff,
    } = useSelector(
        (state) =>
            state.master
    );


    // --------------------------------------------------
    // Filter State
    // --------------------------------------------------

    const [
        search,
        setSearch,
    ] = useState("");

    const [
        status,
        setStatus,
    ] = useState(
        "All statuses"
    );

    const [
        category,
        setCategory,
    ] = useState(
        "All categories"
    );


    // --------------------------------------------------
    // Fetch Department Data
    // --------------------------------------------------

    useEffect(() => {
        dispatch(
            fetchAllComplaints()
        );

        dispatch(
            fetchDepartmentAnalytics()
        );

        if (user?.department?._id) {
            dispatch(
                fetchDepartmentStaff(
                    user.department._id
                )
            );
        }
    }, [
        dispatch,
        user?.department?._id,
    ]);


    // --------------------------------------------------
    // Search and Filter Complaints
    // --------------------------------------------------

    const list = useMemo(() => {
        const normalizedSearch =
            search
                .trim()
                .toLowerCase();

        const normalizedStatus =
            status
                .toLowerCase()
                .replaceAll(
                    " ",
                    "_"
                );

        return items.filter(
            (complaint) => {

                const complaintText = `
                    ${complaint.complaintId || ""}
                    ${complaint.title || ""}
                `.toLowerCase();


                const matchesSearch =
                    !normalizedSearch ||
                    complaintText.includes(
                        normalizedSearch
                    );


                const matchesStatus =
                    status ===
                        "All statuses" ||
                    complaint.status ===
                        normalizedStatus;


                const complaintCategory =
                    complaint.category?.name ||
                    complaint.category ||
                    "";


                const matchesCategory =
                    category ===
                        "All categories" ||
                    complaintCategory ===
                        category;


                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesCategory
                );
            }
        );
    }, [
        items,
        search,
        status,
        category,
    ]);


    // --------------------------------------------------
    // Loading State
    // --------------------------------------------------

    const dashboardLoading =
        complaintsLoading ||
        analyticsLoading;


    return (
        <DashboardShell>

            {/* --------------------------------------------------
                Page Header
            -------------------------------------------------- */}

            <div className="mb-7">

                <div
                    className="
                        text-xs
                        font-bold
                        uppercase
                        tracking-widest
                        text-primary
                    "
                >
                    Department workspace
                </div>


                <h1
                    className="
                        mt-2
                        font-display
                        text-3xl
                        font-bold
                    "
                >
                    {user?.department?.name ||
                        "Department"}{" "}
                    Dashboard
                </h1>


                <p
                    className="
                        mt-2
                        text-muted-foreground
                    "
                >
                    Manage only the complaints routed
                    to your department.
                </p>

            </div>


            {/* --------------------------------------------------
                Department Statistics
            -------------------------------------------------- */}

            {dashboardLoading ? (
                <LoadingCards />
            ) : (
                <div
                    className="
                        grid
                        gap-4
                        sm:grid-cols-2
                        lg:grid-cols-5
                    "
                >

                    <StatCard
                        label="Total"
                        value={
                            department?.totalComplaints ??
                            0
                        }
                        icon={FileText}
                    />


                    <StatCard
                        label="Pending"
                        value={
                            department?.pendingComplaints ??
                            0
                        }
                        icon={Activity}
                        tone="warning"
                    />


                    <StatCard
                        label="In Progress"
                        value={
                            department
                                ?.inProgressComplaints ??
                            0
                        }
                        icon={Activity}
                    />


                    <StatCard
                        label="Resolved"
                        value={
                            department
                                ?.resolvedComplaints ??
                            0
                        }
                        icon={CheckCircle2}
                        tone="success"
                    />


                    <StatCard
                        label="Critical"
                        value={
                            department
                                ?.criticalComplaints ??
                            0
                        }
                        icon={AlertTriangle}
                        tone="warning"
                    />

                </div>
            )}


            {/* --------------------------------------------------
                Complaints Section
            -------------------------------------------------- */}

            <div className="mt-7">

                {/* Filters stay visible */}
                <Filters
                    search={search}
                    setSearch={setSearch}
                    status={status}
                    setStatus={setStatus}
                    category={category}
                    setCategory={setCategory}
                    categories={[]}
                />


                {/* Complaint List */}
                {complaintsLoading ? (
                    <ComplaintTableSkeleton
                        management
                    />
                ) : list.length > 0 ? (
                    <ComplaintTable
                        complaints={list}
                        management
                    />
                ) : (
                    <EmptyState
                        title="No complaints found"
                    />
                )}

            </div>


            {/* --------------------------------------------------
                Department Staff
            -------------------------------------------------- */}

            <div className="mt-7 panel p-6">

                <h2 className="font-bold">
                    Department staff
                </h2>


                {dashboardLoading ? (
                    <div
                        className="
                            mt-4
                            grid
                            gap-3
                            sm:grid-cols-2
                            lg:grid-cols-3
                        "
                    >
                        {[1, 2, 3].map(
                            (item) => (
                                <div
                                    key={item}
                                    className="rounded-lg border p-4"
                                >
                                    <Skeleton className="h-5 w-32" />

                                    <Skeleton className="mt-2 h-3 w-44" />

                                    <Skeleton className="mt-3 h-3 w-24" />
                                </div>
                            )
                        )}
                    </div>
                ) : (
                    <div
                        className="
                            mt-4
                            grid
                            gap-3
                            sm:grid-cols-2
                            lg:grid-cols-3
                        "
                    >

                        {staff.map(
                            (member) => (
                                <div
                                    key={
                                        member._id
                                    }
                                    className="
                                        rounded-lg
                                        border
                                        p-4
                                    "
                                >

                                    <p className="font-semibold">
                                        {
                                            member.name
                                        }
                                    </p>


                                    <p
                                        className="
                                            text-xs
                                            text-muted-foreground
                                        "
                                    >
                                        {
                                            member.email
                                        }
                                    </p>

                                </div>
                            )
                        )}


                        {!staff.length && (
                            <p
                                className="
                                    text-sm
                                    text-muted-foreground
                                "
                            >
                                No active staff accounts
                                found.
                            </p>
                        )}

                    </div>
                )}

            </div>

        </DashboardShell>
    );
}