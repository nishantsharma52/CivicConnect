import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Activity,
    CheckCircle2,
    FileText,
    Send,
} from "lucide-react";

import {
    useDispatch,
    useSelector,
} from "react-redux";

import { Link } from "react-router-dom";

import {
    fetchMyComplaints,
} from "@/redux/complaintSlice";

import {
    fetchCategories,
} from "@/redux/masterSlice";

import {
    DashboardShell,
} from "@/components/AppShell";

import { Button } from "@/components/ui/button";

import {
    ComplaintTable,
    ComplaintTableSkeleton,
    EmptyState,
    Filters,
    LoadingCards,
    StatCard,
} from "@/components/CivicUI";


export default function Dashboard() {
    const dispatch = useDispatch();


    // --------------------------------------------------
    // Complaints State
    // --------------------------------------------------

    const {
        items,
        loading,
    } = useSelector(
        (state) => state.complaints
    );


    // --------------------------------------------------
    // Categories State
    // --------------------------------------------------

    const {
        categories,
    } = useSelector(
        (state) => state.master
    );


    // --------------------------------------------------
    // Filter State
    // --------------------------------------------------

    const [search, setSearch] =
        useState("");

    const [status, setStatus] =
        useState("All statuses");

    const [category, setCategory] =
        useState("All categories");


    // --------------------------------------------------
    // Fetch Complaints and Categories
    // --------------------------------------------------

    useEffect(() => {
        dispatch(
            fetchMyComplaints()
        );

        if (!categories.length) {
            dispatch(
                fetchCategories()
            );
        }
    }, [
        dispatch,
        categories.length,
    ]);


    // --------------------------------------------------
    // Search and Filter Complaints
    // --------------------------------------------------

    const list = useMemo(() => {
        return items.filter(
            (complaint) => {

                const complaintText = `
                    ${complaint.complaintId || ""}
                    ${complaint.title || ""}
                `.toLowerCase();


                const normalizedSearch =
                    search
                        .trim()
                        .toLowerCase();


                const matchesSearch =
                    complaintText.includes(
                        normalizedSearch
                    );


                const matchesStatus =
                    status === "All statuses" ||
                    complaint.status ===
                        status
                            .toLowerCase()
                            .replaceAll(
                                " ",
                                "_"
                            );


                const matchesCategory =
                    category ===
                        "All categories" ||
                    complaint.category?.name ===
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
    // Count Complaints by Status
    // --------------------------------------------------

    const count = (
        statusValue
    ) => {
        return items.filter(
            (complaint) =>
                complaint.status ===
                statusValue
        ).length;
    };


    return (
        <DashboardShell>

            {/* --------------------------------------------------
                Header
            -------------------------------------------------- */}

            <div
                className="
                    mb-7
                    flex
                    flex-col
                    justify-between
                    gap-4
                    sm:flex-row
                    sm:items-end
                "
            >
                <div>

                    <div
                        className="
                            text-xs
                            font-bold
                            uppercase
                            tracking-widest
                            text-primary
                        "
                    >
                        Citizen workspace
                    </div>


                    <h1
                        className="
                            mt-2
                            font-display
                            text-3xl
                            font-bold
                        "
                    >
                        Welcome back 👋
                    </h1>


                    <p className="mt-2 text-muted-foreground">
                        Track the issues you have reported
                        and their latest progress.
                    </p>

                </div>


                <Button asChild>
                    <Link to="/report">
                        Report an issue
                    </Link>
                </Button>

            </div>


            {/* --------------------------------------------------
                Statistics
            -------------------------------------------------- */}

            {loading ? (
                <LoadingCards />
            ) : (
                <div
                    className="
                        grid
                        gap-4
                        sm:grid-cols-2
                        lg:grid-cols-4
                    "
                >

                    <StatCard
                        label="Total Complaints"
                        value={items.length}
                        icon={FileText}
                    />


                    <StatCard
                        label="Submitted"
                        value={count(
                            "submitted"
                        )}
                        icon={Send}
                    />


                    <StatCard
                        label="In Progress"
                        value={count(
                            "in_progress"
                        )}
                        icon={Activity}
                        tone="warning"
                    />


                    <StatCard
                        label="Resolved"
                        value={count(
                            "resolved"
                        )}
                        icon={CheckCircle2}
                        tone="success"
                    />

                </div>
            )}


            {/* --------------------------------------------------
                Complaints Section
            -------------------------------------------------- */}

            <div className="mt-7">

                {/* Filters remain visible during loading */}
                <Filters
                    search={search}
                    setSearch={setSearch}
                    status={status}
                    setStatus={setStatus}
                    category={category}
                    setCategory={setCategory}
                    categories={categories}
                />


                {/* --------------------------------------------------
                    Complaint List
                -------------------------------------------------- */}

                {loading ? (
                    <ComplaintTableSkeleton />
                ) : list.length > 0 ? (
                    <ComplaintTable
                        complaints={list}
                    />
                ) : (
                    <EmptyState
                        title="No complaints found"
                    />
                )}

            </div>

        </DashboardShell>
    );
}