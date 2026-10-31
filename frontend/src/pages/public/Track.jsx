import { useState } from "react";

import {
    Search,
    Activity,
    ArrowRight,
} from "lucide-react";

import {
    useDispatch,
    useSelector,
} from "react-redux";

import {
    trackComplaint,
} from "@/redux/complaintSlice";

import {
    Link,
} from "react-router-dom";

import {
    toast,
} from "sonner";

import {
    Button,
} from "@/components/ui/button";

import {
    Footer,
    SmartShell,
} from "@/components/AppShell";

import {
    PageHeader,
    StatusBadge,
    Timeline,
    Metric,
    Skeleton,
} from "@/components/CivicUI";


// --------------------------------------------------
// Track Result Skeleton
// --------------------------------------------------

function TrackResultSkeleton() {
    return (
        <div
            className="
                grid
                gap-5
                lg:grid-cols-[1fr_360px]
            "
        >

            {/* ==================================================
                Complaint Information Skeleton
            ================================================== */}

            <div className="panel p-6">

                <div
                    className="
                        flex
                        flex-wrap
                        items-start
                        justify-between
                        gap-3
                    "
                >

                    <div className="min-w-0 flex-1">

                        {/* Complaint ID */}
                        <Skeleton
                            className="
                                h-4
                                w-40
                            "
                        />


                        {/* Complaint Title */}
                        <Skeleton
                            className="
                                mt-3
                                h-6
                                w-3/4
                                max-w-md
                            "
                        />

                    </div>


                    {/* Status */}
                    <Skeleton
                        className="
                            h-7
                            w-24
                            rounded-full
                        "
                    />

                </div>


                {/* Metrics */}
                <div
                    className="
                        mt-5
                        grid
                        gap-5
                        border-y
                        py-5
                        sm:grid-cols-3
                    "
                >

                    {/* Department */}
                    <div>
                        <Skeleton
                            className="
                                h-3
                                w-24
                            "
                        />

                        <Skeleton
                            className="
                                mt-2
                                h-4
                                w-32
                            "
                        />
                    </div>


                    {/* Area */}
                    <div>
                        <Skeleton
                            className="
                                h-3
                                w-12
                            "
                        />

                        <Skeleton
                            className="
                                mt-2
                                h-4
                                w-36
                            "
                        />
                    </div>


                    {/* Last Updated */}
                    <div>
                        <Skeleton
                            className="
                                h-3
                                w-24
                            "
                        />

                        <Skeleton
                            className="
                                mt-2
                                h-4
                                w-32
                            "
                        />
                    </div>

                </div>


                {/* Sign In Button */}
                <Skeleton
                    className="
                        mt-5
                        h-10
                        w-56
                        rounded-md
                    "
                />

            </div>


            {/* ==================================================
                Timeline Skeleton
            ================================================== */}

            <div className="panel p-6">

                <Skeleton
                    className="
                        h-5
                        w-40
                    "
                />


                <div className="mt-6 space-y-5">

                    {[1, 2, 3, 4].map(
                        (item) => (
                            <div
                                key={item}
                                className="
                                    flex
                                    gap-3
                                "
                            >

                                {/* Timeline Dot */}
                                <Skeleton
                                    className="
                                        mt-1
                                        size-4
                                        shrink-0
                                        rounded-full
                                    "
                                />


                                <div className="min-w-0 flex-1">

                                    <Skeleton
                                        className="
                                            h-4
                                            w-32
                                        "
                                    />

                                    <Skeleton
                                        className="
                                            mt-2
                                            h-3
                                            w-full
                                        "
                                    />

                                    <Skeleton
                                        className="
                                            mt-2
                                            h-3
                                            w-24
                                        "
                                    />

                                </div>

                            </div>
                        )
                    )}

                </div>

            </div>

        </div>
    );
}


// --------------------------------------------------
// Track Page
// --------------------------------------------------

export default function TrackPage() {
    const dispatch = useDispatch();


    // --------------------------------------------------
    // Complaint State
    // --------------------------------------------------

    const {
        current,
        history,
        loading,
    } = useSelector(
        (state) => state.complaints
    );


    // --------------------------------------------------
    // Search State
    // --------------------------------------------------

    const [
        query,
        setQuery,
    ] = useState("");


    const [
        searched,
        setSearched,
    ] = useState(false);


    const hasQuery =
        query.trim().length > 0;


    // --------------------------------------------------
    // Track Complaint
    // --------------------------------------------------

    const submit = async (event) => {
        event.preventDefault();

        const complaintId =
            query.trim();


        if (!complaintId) {
            toast.error(
                "Enter a complaint ID"
            );

            return;
        }


        const result =
            await dispatch(
                trackComplaint(
                    complaintId
                )
            );


        if (
            trackComplaint.rejected.match(
                result
            )
        ) {
            toast.error(
                result.payload ||
                    "Complaint not found"
            );
        }


        setSearched(true);
    };


    // --------------------------------------------------
    // Formatted Status
    // --------------------------------------------------

    const formattedStatus =
        current?.status
            ?.replaceAll("_", " ")
            .replace(
                /\b\w/g,
                (char) =>
                    char.toUpperCase()
            );


    // --------------------------------------------------
    // Render
    // --------------------------------------------------

    return (
        <SmartShell>

            <main className="page-public">

                <div
                    className="
                        mx-auto
                        max-w-5xl
                        px-0
                        sm:px-2
                    "
                >

                    {/* ==================================================
                        Page Header
                    ================================================== */}

                    <PageHeader
                        eyebrow="Complaint tracking"
                        title="Track the progress of an issue"
                        description="
                            Enter a CivicConnect complaint ID to see
                            its current public status and timeline.
                        "
                    />


                    {/* ==================================================
                        Search Form
                    ================================================== */}

                    <form
                        onSubmit={submit}
                        className="
                            panel
                            mb-6
                            flex
                            flex-col
                            gap-3
                            p-4
                            sm:flex-row
                        "
                    >

                        {/* Search Input */}
                        <div className="relative flex-1">

                            {!hasQuery && (
                                <Search
                                    className="
                                        pointer-events-none
                                        absolute
                                        left-3
                                        top-1/2
                                        size-4
                                        -translate-y-1/2
                                        text-muted-foreground
                                    "
                                />
                            )}


                            <input
                                type="text"
                                value={query}
                                onChange={(event) =>
                                    setQuery(
                                        event.target.value
                                    )
                                }
                                className={`
                                    field
                                    h-10
                                    ${
                                        hasQuery
                                            ? "pl-3"
                                            : "pl-9"
                                    }
                                `}
                                placeholder="CC-1789986845287"
                                autoComplete="off"
                            />

                        </div>


                        {/* Track Button */}
                        <Button
                            type="submit"
                            size="lg"
                            disabled={loading}
                        >
                            {loading
                                ? "Tracking..."
                                : "Track Complaint"}
                        </Button>

                    </form>


                    {/* ==================================================
                        Loading State
                    ================================================== */}

                    {searched && loading && (
                        <TrackResultSkeleton />
                    )}


                    {/* ==================================================
                        Complaint Result
                    ================================================== */}

                    {searched &&
                        !loading &&
                        current && (
                            <div
                                className="
                                    grid
                                    gap-5
                                    lg:grid-cols-[1fr_360px]
                                "
                            >

                                {/* ------------------------------------------
                                    Complaint Information
                                ------------------------------------------ */}

                                <div className="panel p-6">

                                    <div
                                        className="
                                            flex
                                            flex-wrap
                                            items-start
                                            justify-between
                                            gap-3
                                        "
                                    >

                                        <div>

                                            <p
                                                className="
                                                    font-mono
                                                    text-sm
                                                    font-semibold
                                                    text-primary
                                                "
                                            >
                                                {
                                                    current.complaintId
                                                }
                                            </p>


                                            <h2
                                                className="
                                                    mt-2
                                                    text-xl
                                                    font-bold
                                                    text-foreground
                                                "
                                            >
                                                {
                                                    current.title
                                                }
                                            </h2>

                                        </div>


                                        <StatusBadge
                                            status={
                                                formattedStatus ||
                                                "Unknown"
                                            }
                                        />

                                    </div>


                                    {/* Metrics */}
                                    <div
                                        className="
                                            mt-5
                                            grid
                                            gap-5
                                            border-y
                                            py-5
                                            sm:grid-cols-3
                                        "
                                    >

                                        <Metric
                                            label="Department"
                                            value={
                                                current
                                                    .department
                                                    ?.name ||
                                                "Unassigned"
                                            }
                                        />


                                        <Metric
                                            label="Area"
                                            value={
                                                current
                                                    .location
                                                    ?.address ||
                                                "—"
                                            }
                                        />


                                        <Metric
                                            label="Last updated"
                                            value={
                                                current.updatedAt
                                                    ? new Date(
                                                          current.updatedAt
                                                      ).toLocaleString()
                                                    : "—"
                                            }
                                        />

                                    </div>


                                    {/* Full Complaint Link */}
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="mt-5"
                                    >
                                        <Link
                                            to={`/login?complaint=${encodeURIComponent(
                                                current.complaintId
                                            )}`}
                                        >
                                            Sign in to manage/view
                                            full complaint

                                            <ArrowRight />
                                        </Link>
                                    </Button>

                                </div>


                                {/* ------------------------------------------
                                    Timeline
                                ------------------------------------------ */}

                                <div className="panel p-6">

                                    <h3 className="mb-5 font-bold">
                                        Progress timeline
                                    </h3>


                                    <Timeline
                                        history={history}
                                        compact
                                    />

                                </div>

                            </div>
                        )}


                    {/* ==================================================
                        Complaint Not Found
                    ================================================== */}

                    {searched &&
                        !loading &&
                        !current && (
                            <div
                                className="
                                    panel
                                    p-10
                                    text-center
                                "
                            >

                                <Activity
                                    className="
                                        mx-auto
                                        size-9
                                        text-destructive
                                    "
                                />


                                <h2 className="mt-3 font-bold">
                                    Complaint not found
                                </h2>


                                <p
                                    className="
                                        mt-1
                                        text-sm
                                        text-muted-foreground
                                    "
                                >
                                    Check the ID and try again.
                                </p>

                            </div>
                        )}

                </div>

            </main>


            {/* Footer */}
            <Footer />

        </SmartShell>
    );
}