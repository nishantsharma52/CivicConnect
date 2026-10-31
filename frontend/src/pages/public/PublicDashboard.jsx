import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Activity,
    BarChart3,
    CheckCircle2,
    FileCheck2,
} from "lucide-react";

import {
    useDispatch,
    useSelector,
} from "react-redux";

import {
    fetchPublicAnalytics,
} from "@/redux/analyticsSlice";

import {
    fetchCategories,
    fetchDepartments,
} from "@/redux/masterSlice";

import {
    Footer,
    SmartShell,
} from "@/components/AppShell";

import {
    MapPreview,
    PageHeader,
    Skeleton,
    StatCard,
    StatusBadge,
} from "@/components/CivicUI";


// --------------------------------------------------
// Format Text
// --------------------------------------------------

const pretty = (value = "") => {
    return String(value)
        .replaceAll("_", " ")
        .replace(
            /\b\w/g,
            (char) =>
                char.toUpperCase()
        );
};


// --------------------------------------------------
// Analytics Chart
// --------------------------------------------------

function Chart({
    title,
    data = [],
}) {
    const max = Math.max(
        ...data.map(
            (item) => item.count || 0
        ),
        1
    );

    return (
        <div className="panel p-5">

            <h2 className="font-bold">
                {title}
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
                Live data from CivicConnect
            </p>


            <div
                className="
                    mt-7
                    flex
                    h-52
                    items-end
                    gap-3
                    border-b
                    border-l
                    px-3
                "
            >
                {data
                    .slice(0, 8)
                    .map(
                        (
                            item,
                            index
                        ) => (
                            <div
                                key={`
                                    ${
                                        item.name ||
                                        item.status ||
                                        item.month
                                    }-${index}
                                `}
                                className="
                                    flex
                                    h-full
                                    flex-1
                                    flex-col
                                    justify-end
                                    gap-2
                                "
                            >

                                <div
                                    className="
                                        mx-auto
                                        w-full
                                        max-w-10
                                        rounded-t
                                        bg-primary
                                    "
                                    style={{
                                        height: `${
                                            Math.max(
                                                5,
                                                ((item.count ||
                                                    0) /
                                                    max) *
                                                    100
                                            )
                                        }%`,
                                    }}
                                />

                                <span
                                    className="
                                        truncate
                                        text-center
                                        text-[10px]
                                        text-muted-foreground
                                    "
                                >
                                    {item.name ||
                                        pretty(
                                            item.status
                                        ) ||
                                        `${item.month}/${item.year}`}
                                </span>

                            </div>
                        )
                    )}
            </div>
        </div>
    );
}


// --------------------------------------------------
// Chart Skeleton
// --------------------------------------------------

function ChartSkeleton({
    title,
}) {
    return (
        <div className="panel p-5">

            <Skeleton
                className="h-5 w-48"
            />

            <Skeleton
                className="mt-2 h-3 w-40"
            />


            <div
                className="
                    mt-7
                    flex
                    h-52
                    items-end
                    gap-3
                    border-b
                    border-l
                    px-3
                "
            >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(
                    (item) => (
                        <div
                            key={item}
                            className="flex h-full flex-1 items-end"
                        >
                            <Skeleton
                                className="mx-auto w-full max-w-10 rounded-t"
                                style={{
                                    height: `${
                                        25 +
                                        ((item *
                                            13) %
                                            55)
                                    }%`,
                                }}
                            />
                        </div>
                    )
                )}
            </div>

        </div>
    );
}


// --------------------------------------------------
// Public Dashboard
// --------------------------------------------------

export default function PublicDashboardPage() {
    const dispatch = useDispatch();


    // --------------------------------------------------
    // Analytics State
    // --------------------------------------------------

    const {
        public: data,
        loading,
    } = useSelector(
        (state) =>
            state.analytics
    );


    // --------------------------------------------------
    // Master Data
    // --------------------------------------------------

    const {
        categories,
        departments,
    } = useSelector(
        (state) =>
            state.master
    );


    // --------------------------------------------------
    // Filter State
    // --------------------------------------------------

    const [
        cat,
        setCat,
    ] = useState("");

    const [
        dept,
        setDept,
    ] = useState("");

    const [
        status,
        setStatus,
    ] = useState("");


    // --------------------------------------------------
    // Fetch Categories and Departments
    // --------------------------------------------------

    useEffect(() => {
        if (!categories.length) {
            dispatch(
                fetchCategories()
            );
        }

        if (!departments.length) {
            dispatch(
                fetchDepartments()
            );
        }
    }, [
        dispatch,
        categories.length,
        departments.length,
    ]);


    // --------------------------------------------------
    // Fetch Filtered Public Analytics
    // --------------------------------------------------

    useEffect(() => {
        const params =
            new URLSearchParams();

        if (cat) {
            params.set(
                "category",
                cat
            );
        }

        if (dept) {
            params.set(
                "department",
                dept
            );
        }

        if (status) {
            params.set(
                "status",
                status
            );
        }

        dispatch(
            fetchPublicAnalytics(
                params.toString()
            )
        );
    }, [
        dispatch,
        cat,
        dept,
        status,
    ]);


    // --------------------------------------------------
    // Analytics Data
    // --------------------------------------------------

    const stats = data || {};

    const statusData =
        stats.byStatus || [];

    const categoryData =
        stats.byCategory || [];

    const departmentData =
        stats.byDepartment || [];

    const monthlyData =
        (stats.byMonth || []).map(
            (month) => ({
                month:
                    month.month,
                year:
                    month.year,
                count:
                    month.count,
            })
        );


    // --------------------------------------------------
    // Main UI
    // --------------------------------------------------

    return (
        <SmartShell>

            <main className="page-public">

                <div
                    className="
                        mx-auto
                        max-w-7xl
                        px-0
                        sm:px-2
                    "
                >

                    {/* --------------------------------------------------
                        Page Header
                    -------------------------------------------------- */}

                    <PageHeader
                        eyebrow="Transparent city services"
                        title="CivicConnect Public Dashboard"
                        description="
                            Complaint trends and departmental
                            activity loaded from the database.
                        "
                    />


                    {/* --------------------------------------------------
                        Filters
                    -------------------------------------------------- */}

                    <div
                        className="
                            mb-6
                            grid
                            gap-3
                            rounded-lg
                            border
                            bg-card
                            p-4
                            sm:grid-cols-3
                        "
                    >

                        {/* Category */}
                        <select
                            className="field"
                            value={cat}
                            onChange={(
                                event
                            ) =>
                                setCat(
                                    event
                                        .target
                                        .value
                                )
                            }
                            disabled={
                                loading &&
                                !categories.length
                            }
                        >
                            <option value="">
                                All categories
                            </option>

                            {categories.map(
                                (
                                    category
                                ) => (
                                    <option
                                        key={
                                            category._id
                                        }
                                        value={
                                            category._id
                                        }
                                    >
                                        {
                                            category.name
                                        }
                                    </option>
                                )
                            )}
                        </select>


                        {/* Department */}
                        <select
                            className="field"
                            value={dept}
                            onChange={(
                                event
                            ) =>
                                setDept(
                                    event
                                        .target
                                        .value
                                )
                            }
                            disabled={
                                loading &&
                                !departments.length
                            }
                        >
                            <option value="">
                                All departments
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


                        {/* Status */}
                        <select
                            className="field"
                            value={status}
                            onChange={(
                                event
                            ) =>
                                setStatus(
                                    event
                                        .target
                                        .value
                                )
                            }
                        >
                            <option value="">
                                All statuses
                            </option>

                            {[
                                "submitted",
                                "under_review",
                                "assigned",
                                "in_progress",
                                "resolved",
                                "rejected",
                                "reopened",
                            ].map(
                                (
                                    statusValue
                                ) => (
                                    <option
                                        key={
                                            statusValue
                                        }
                                        value={
                                            statusValue
                                        }
                                    >
                                        {pretty(
                                            statusValue
                                        )}
                                    </option>
                                )
                            )}
                        </select>

                    </div>


                    {/* ==================================================
                        ANALYTICS CONTENT
                    ================================================== */}

                    {loading ? (
                        <>
                            {/* --------------------------------------------------
                                Statistics Skeleton
                            -------------------------------------------------- */}

                            <div
                                className="
                                    grid
                                    gap-4
                                    sm:grid-cols-2
                                    lg:grid-cols-5
                                "
                            >
                                {[
                                    1,
                                    2,
                                    3,
                                    4,
                                    5,
                                ].map(
                                    (
                                        item
                                    ) => (
                                        <div
                                            key={
                                                item
                                            }
                                            className="panel p-5"
                                        >
                                            <div className="flex items-start justify-between">

                                                <div className="flex-1">

                                                    <Skeleton className="h-4 w-28" />

                                                    <Skeleton className="mt-3 h-8 w-16" />

                                                    <Skeleton className="mt-2 h-3 w-20" />

                                                </div>

                                                <Skeleton className="size-10 rounded-lg" />

                                            </div>
                                        </div>
                                    )
                                )}
                            </div>


                            {/* --------------------------------------------------
                                Chart Skeletons
                            -------------------------------------------------- */}

                            <div
                                className="
                                    mt-6
                                    grid
                                    gap-6
                                    lg:grid-cols-2
                                "
                            >
                                <ChartSkeleton
                                    title="Complaints by Category"
                                />

                                <ChartSkeleton
                                    title="Complaints by Department"
                                />

                                <ChartSkeleton
                                    title="Complaints by Status"
                                />

                                <ChartSkeleton
                                    title="Complaints over Time"
                                />
                            </div>


                            {/* --------------------------------------------------
                                Map + Recent Issues Skeleton
                            -------------------------------------------------- */}

                            <div
                                className="
                                    mt-6
                                    grid
                                    gap-6
                                    lg:grid-cols-[1.4fr_0.6fr]
                                "
                            >

                                {/* Map Skeleton */}
                                <div className="panel p-5">

                                    <Skeleton
                                        className="h-5 w-48"
                                    />

                                    <Skeleton
                                        className="mt-2 h-3 w-72"
                                    />

                                    <Skeleton
                                        className="mt-4 h-80 w-full rounded-lg"
                                    />

                                </div>


                                {/* Recent Resolved Skeleton */}
                                <div className="panel p-5">

                                    <Skeleton
                                        className="h-5 w-52"
                                    />

                                    <div className="mt-4 space-y-4">

                                        {[1, 2, 3, 4].map(
                                            (
                                                item
                                            ) => (
                                                <div
                                                    key={
                                                        item
                                                    }
                                                    className="border-b pb-4 last:border-b-0"
                                                >

                                                    <div className="flex items-center justify-between gap-3">

                                                        <Skeleton className="h-4 w-40" />

                                                        <Skeleton className="h-6 w-20 rounded-full" />

                                                    </div>

                                                    <Skeleton className="mt-2 h-3 w-48" />

                                                    <Skeleton className="mt-2 h-3 w-24" />

                                                </div>
                                            )
                                        )}

                                    </div>

                                </div>

                            </div>
                        </>
                    ) : (
                        <>
                            {/* --------------------------------------------------
                                Statistics
                            -------------------------------------------------- */}

                            <div
                                className="
                                    grid
                                    gap-4
                                    sm:grid-cols-2
                                    lg:grid-cols-5
                                "
                            >

                                <StatCard
                                    label="Total Complaints"
                                    value={
                                        stats.totalComplaints ||
                                        0
                                    }
                                    icon={FileCheck2}
                                />

                                <StatCard
                                    label="Resolved"
                                    value={
                                        stats.resolvedComplaints ||
                                        0
                                    }
                                    icon={CheckCircle2}
                                    tone="success"
                                />

                                <StatCard
                                    label="Pending"
                                    value={
                                        stats.pendingComplaints ||
                                        0
                                    }
                                    icon={Activity}
                                    tone="warning"
                                />

                                <StatCard
                                    label="Avg. Resolution"
                                    value={`
                                        ${
                                            stats.averageResolutionDays ||
                                            0
                                        } days
                                    `}
                                    icon={Activity}
                                />

                                <StatCard
                                    label="Resolution Rate"
                                    value={`
                                        ${
                                            stats.resolutionRate ||
                                            0
                                        }%
                                    `}
                                    icon={BarChart3}
                                    tone="success"
                                />

                            </div>


                            {/* --------------------------------------------------
                                Charts
                            -------------------------------------------------- */}

                            <div
                                className="
                                    mt-6
                                    grid
                                    gap-6
                                    lg:grid-cols-2
                                "
                            >

                                <Chart
                                    title="Complaints by Category"
                                    data={
                                        categoryData
                                    }
                                />

                                <Chart
                                    title="Complaints by Department"
                                    data={
                                        departmentData
                                    }
                                />

                                <Chart
                                    title="Complaints by Status"
                                    data={
                                        statusData
                                    }
                                />

                                <Chart
                                    title="Complaints over Time"
                                    data={
                                        monthlyData
                                    }
                                />

                            </div>


                            {/* --------------------------------------------------
                                Map + Recent Resolved Issues
                            -------------------------------------------------- */}

                            <div
                                className="
                                    mt-6
                                    grid
                                    gap-6
                                    lg:grid-cols-[1.4fr_0.6fr]
                                "
                            >

                                {/* Complaint Location Map */}
                                <div className="panel p-5">

                                    <h2 className="font-bold">
                                        Complaint location map
                                    </h2>

                                    <p
                                        className="
                                            mt-1
                                            text-sm
                                            text-muted-foreground
                                        "
                                    >
                                        Complaint locations loaded
                                        from reported coordinates.
                                    </p>

                                    <div className="mt-4">
                                        <MapPreview
                                            large
                                            locations={
                                                stats.locations ||
                                                []
                                            }
                                        />
                                    </div>

                                </div>


                                {/* Recent Resolved Issues */}
                                <div className="panel p-5">

                                    <h2 className="font-bold">
                                        Recent Resolved Issues
                                    </h2>

                                    <div className="mt-4 divide-y">

                                        {(
                                            stats.recentResolved ||
                                            []
                                        ).map(
                                            (
                                                complaint
                                            ) => (
                                                <div
                                                    key={
                                                        complaint._id
                                                    }
                                                    className="py-4"
                                                >

                                                    <div
                                                        className="
                                                            flex
                                                            justify-between
                                                            gap-2
                                                        "
                                                    >

                                                        <p
                                                            className="
                                                                text-sm
                                                                font-semibold
                                                            "
                                                        >
                                                            {
                                                                complaint.title
                                                            }
                                                        </p>

                                                        <StatusBadge
                                                            status="Resolved"
                                                        />

                                                    </div>


                                                    <p
                                                        className="
                                                            mt-1
                                                            text-xs
                                                            text-muted-foreground
                                                        "
                                                    >
                                                        {
                                                            complaint
                                                                .location
                                                                ?.address ||
                                                            "—"
                                                        }

                                                        {" · "}

                                                        {
                                                            complaint
                                                                .department
                                                                ?.name ||
                                                            "Unassigned"
                                                        }
                                                    </p>


                                                    <p
                                                        className="
                                                            mt-1
                                                            text-xs
                                                            text-muted-foreground
                                                        "
                                                    >
                                                        {complaint.resolvedAt
                                                            ? new Date(
                                                                  complaint.resolvedAt
                                                              ).toLocaleDateString()
                                                            : "—"}
                                                    </p>

                                                </div>
                                            )
                                        )}


                                        {/* Empty State */}
                                        {!(
                                            stats.recentResolved ||
                                            []
                                        ).length && (
                                            <p
                                                className="
                                                    text-sm
                                                    text-muted-foreground
                                                "
                                            >
                                                No resolved complaints yet.
                                            </p>
                                        )}

                                    </div>

                                </div>

                            </div>
                        </>
                    )}

                </div>

            </main>


            {/* --------------------------------------------------
                Footer
            -------------------------------------------------- */}

            <Footer />

        </SmartShell>
    );
}