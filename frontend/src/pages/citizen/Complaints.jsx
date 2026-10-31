import { useEffect, useMemo, useState } from "react";

import {
    useDispatch,
    useSelector,
} from "react-redux";

import {
    fetchAllComplaints,
    fetchMyComplaints,
} from "@/redux/complaintSlice";

import { fetchCategories } from "@/redux/masterSlice";

import { DashboardShell } from "@/components/AppShell";

import {
    ComplaintTable,
    ComplaintTableSkeleton,
    EmptyState,
    Filters,
    PageHeader,
} from "@/components/CivicUI";


export default function Complaints() {
    const dispatch = useDispatch();


    // --------------------------------------------------
    // Auth State
    // --------------------------------------------------

    const { user } = useSelector(
        (state) => state.auth
    );


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
        if (!user?.role) {
            return;
        }

        if (user.role === "citizen") {
            dispatch(
                fetchMyComplaints()
            );
        } else {
            dispatch(
                fetchAllComplaints()
            );
        }

        if (!categories.length) {
            dispatch(
                fetchCategories()
            );
        }
    }, [
        dispatch,
        user?.role,
        categories.length,
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
                    status === "All statuses" ||
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
    // Check Active Filters
    // --------------------------------------------------

    const hasActiveFilters =
        search.trim().length > 0 ||
        status !== "All statuses" ||
        category !== "All categories";


    // --------------------------------------------------
    // Clear All Filters
    // --------------------------------------------------

    const clearFilters = () => {
        setSearch("");
        setStatus("All statuses");
        setCategory("All categories");
    };


    return (
        <DashboardShell>

            {/* --------------------------------------------------
                Page Header
            -------------------------------------------------- */}

            <PageHeader
                eyebrow={
                    user?.role === "citizen"
                        ? "Citizen complaints"
                        : "Complaint management"
                }
                title={
                    user?.role === "citizen"
                        ? "My Complaints"
                        : "Complaints"
                }
                description={
                    user?.role === "citizen"
                        ? "Every complaint you submitted is loaded directly from MongoDB."
                        : "Complaints available to your department or admin role."
                }
            />


            {/* --------------------------------------------------
                Filters
            -------------------------------------------------- */}

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
                Complaints Content
            -------------------------------------------------- */}

            {loading ? (
                <ComplaintTableSkeleton
                    management={
                        user?.role !== "citizen"
                    }
                />
            ) : list.length > 0 ? (
                <ComplaintTable
                    complaints={list}
                    management={
                        user?.role !== "citizen"
                    }
                />
            ) : (
                <div className="space-y-4">

                    <EmptyState
                        title={
                            hasActiveFilters
                                ? "No matching complaints"
                                : "No complaints found"
                        }
                    />


                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                        <div className="flex justify-center">

                            <button
                                type="button"
                                onClick={
                                    clearFilters
                                }
                                className="
                                    text-sm
                                    font-semibold
                                    text-primary
                                    hover:underline
                                "
                            >
                                Clear filters
                            </button>

                        </div>
                    )}

                </div>
            )}

        </DashboardShell>
    );
}