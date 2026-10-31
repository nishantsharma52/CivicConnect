import { Link } from "react-router-dom";

import {
    ArrowRight,
    Check,
    Clock3,
    MapPin,
    Search,
    UploadCloud,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";


// --------------------------------------------------
// Page Header
// --------------------------------------------------

export function PageHeader({
    eyebrow,
    title,
    description,
    action,
}) {
    return (
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
                    {eyebrow}
                </div>

                <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                    {title}
                </h1>

                {description && (
                    <p className="mt-2 max-w-2xl text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>

            {action}
        </div>
    );
}


// --------------------------------------------------
// Stat Card
// --------------------------------------------------

export function StatCard({
    label,
    value,
    icon: Icon,
    tone = "primary",
    detail,
}) {
    return (
        <div className="panel p-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">
                        {label}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-foreground">
                        {value}
                    </p>

                    {detail && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            {detail}
                        </p>
                    )}
                </div>

                {Icon && (
                    <div
                        className={cn(
                            "flex size-10 items-center justify-center rounded-lg",
                            tone === "success"
                                ? "bg-success-soft text-success"
                                : tone === "warning"
                                ? "bg-warning/10 text-warning"
                                : "bg-primary-soft text-primary"
                        )}
                    >
                        <Icon className="size-5" />
                    </div>
                )}
            </div>
        </div>
    );
}


// --------------------------------------------------
// Status Badge
// --------------------------------------------------

const statusClass = {
    Submitted: "bg-primary-soft text-primary",
    "Under Review": "bg-warning/10 text-warning",
    Assigned: "bg-secondary text-secondary-foreground",
    "In Progress": "bg-warning/10 text-warning",
    Resolved: "bg-success-soft text-success",
    Rejected: "bg-danger-soft text-destructive",
    Reopened: "bg-warning/10 text-warning",
};

export function StatusBadge({ status }) {
    return (
        <span
            className={cn(
                "inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
                statusClass[status] ||
                    "bg-muted text-muted-foreground"
            )}
        >
            {status}
        </span>
    );
}


// --------------------------------------------------
// Priority Text
// --------------------------------------------------

const priorityClass = {
    Low: "text-success",
    Medium: "text-warning",
    High: "text-destructive",
    Critical:
        "rounded-full bg-danger-soft px-2 py-1 text-destructive",
};

export function PriorityText({ priority }) {
    return (
        <span
            className={cn(
                "text-xs font-bold",
                priorityClass[priority] ||
                    "text-muted-foreground"
            )}
        >
            {priority}
        </span>
    );
}


// --------------------------------------------------
// Complaint Table
// --------------------------------------------------

export function ComplaintTable({
    complaints = [],
    management = false,
}) {
    return (
        <div className="panel overflow-hidden">

            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-muted/60 text-xs uppercase text-muted-foreground">
                        <tr>
                            <th className="px-5 py-4">
                                Complaint ID
                            </th>

                            <th className="px-5 py-4">
                                Issue
                            </th>

                            {management && (
                                <th className="px-5 py-4">
                                    Citizen
                                </th>
                            )}

                            <th className="px-5 py-4">
                                Category
                            </th>

                            <th className="px-5 py-4">
                                Priority
                            </th>

                            <th className="px-5 py-4">
                                Status
                            </th>

                            <th className="px-5 py-4">
                                Date
                            </th>

                            <th className="px-5 py-4">
                                Action
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y">
                        {complaints.map((item) => (
                            <tr
                                key={
                                    item._id ||
                                    item.complaintId
                                }
                                className="transition-colors hover:bg-muted/40"
                            >
                                <td className="px-5 py-4 font-mono text-xs font-semibold text-primary">
                                    {item.id ||
                                        item.complaintId}
                                </td>

                                <td className="max-w-60 px-5 py-4">
                                    <p className="font-semibold text-foreground">
                                        {item.title}
                                    </p>

                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {item.department?.name ||
                                            item.department ||
                                            "Unassigned"}
                                    </p>
                                </td>

                                {management && (
                                    <td className="px-5 py-4">
                                        {item.citizen?.name ||
                                            item.citizen ||
                                            "—"}
                                    </td>
                                )}

                                <td className="px-5 py-4">
                                    {item.category?.name ||
                                        item.category ||
                                        "—"}
                                </td>

                                <td className="px-5 py-4">
                                    <PriorityText
                                        priority={
                                            item.priority?.replace?.(
                                                /\b\w/g,
                                                (c) =>
                                                    c.toUpperCase()
                                            ) ||
                                            item.priority
                                        }
                                    />
                                </td>

                                <td className="px-5 py-4">
                                    <StatusBadge
                                        status={
                                            item.status
                                                ?.replace?.(
                                                    /_/g,
                                                    " "
                                                )
                                                .replace(
                                                    /\b\w/g,
                                                    (c) =>
                                                        c.toUpperCase()
                                                ) ||
                                            item.status
                                        }
                                    />
                                </td>

                                <td className="px-5 py-4 text-muted-foreground">
                                    {item.createdAt
                                        ? new Date(
                                              item.createdAt
                                          ).toLocaleDateString()
                                        : item.date || "—"}
                                </td>

                                <td className="px-5 py-4">
                                    <Button
                                        asChild
                                        variant="ghost"
                                        size="sm"
                                    >
                                        <Link
                                            to={`/complaints/${
                                                item._id ||
                                                item.complaintId
                                            }`}
                                        >
                                            View
                                            <ArrowRight />
                                        </Link>
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>


            {/* Mobile Cards */}
            <div className="divide-y md:hidden">
                {complaints.map((item) => (
                    <div
                        key={
                            item._id ||
                            item.complaintId
                        }
                        className="p-4"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="font-mono text-xs font-semibold text-primary">
                                    {item.id ||
                                        item.complaintId}
                                </p>

                                <h3 className="mt-1 font-semibold">
                                    {item.title}
                                </h3>
                            </div>

                            <StatusBadge
                                status={
                                    item.status
                                        ?.replace?.(
                                            /_/g,
                                            " "
                                        )
                                        .replace(
                                            /\b\w/g,
                                            (c) =>
                                                c.toUpperCase()
                                        ) ||
                                    item.status
                                }
                            />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <span>
                                <small className="block text-muted-foreground">
                                    Category
                                </small>

                                {item.category?.name ||
                                    item.category ||
                                    "—"}
                            </span>

                            <span>
                                <small className="block text-muted-foreground">
                                    Priority
                                </small>

                                <PriorityText
                                    priority={
                                        item.priority?.replace?.(
                                            /\b\w/g,
                                            (c) =>
                                                c.toUpperCase()
                                        ) ||
                                        item.priority
                                    }
                                />
                            </span>
                        </div>

                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="mt-4 w-full"
                        >
                            <Link
                                to={`/complaints/${
                                    item._id ||
                                    item.complaintId
                                }`}
                            >
                                View complaint
                            </Link>
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}


// --------------------------------------------------
// Filters
// --------------------------------------------------

export function Filters({
    search,
    setSearch,
    status,
    setStatus,
    category,
    setCategory,
    categories = [],
}) {
    const hasSearchValue =
        search?.trim().length > 0;

    return (
        <div className="mb-5 grid gap-3 rounded-lg border bg-card p-3 sm:grid-cols-[1fr_180px_190px]">

            {/* Search */}
            <label className="relative block">
                {!hasSearchValue && (
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
                    value={search}
                    onChange={(e) =>
                        setSearch(
                            e.target.value
                        )
                    }
                    className={cn(
                        "field",
                        hasSearchValue
                            ? "pl-3"
                            : "pl-9"
                    )}
                    placeholder="Search complaints"
                />
            </label>


            {/* Status Filter */}
            <select
                className="field"
                value={status}
                onChange={(e) =>
                    setStatus(
                        e.target.value
                    )
                }
            >
                <option>
                    All statuses
                </option>

                {[
                    "Submitted",
                    "Under Review",
                    "Assigned",
                    "In Progress",
                    "Resolved",
                    "Rejected",
                    "Reopened",
                ].map((value) => (
                    <option
                        key={value}
                        value={value}
                    >
                        {value}
                    </option>
                ))}
            </select>


            {/* Category Filter */}
            <select
                className="field"
                value={category}
                onChange={(e) =>
                    setCategory(
                        e.target.value
                    )
                }
            >
                <option>
                    All categories
                </option>

                {categories.map((item) => (
                    <option
                        key={item._id}
                        value={item.name}
                    >
                        {item.name}
                    </option>
                ))}
            </select>
        </div>
    );
}


// --------------------------------------------------
// Timeline
// --------------------------------------------------

export function Timeline({
    history = [],
    compact = false,
}) {
    if (!history?.length) {
        return (
            <p className="text-sm text-muted-foreground">
                No status history available.
            </p>
        );
    }

    const items = compact
        ? history.slice(-4)
        : history;

    return (
        <div>
            {items.map((item, index) => (
                <div
                    key={
                        item._id ||
                        `${item.newStatus}-${index}`
                    }
                    className="relative flex gap-4 pb-6 last:pb-0"
                >
                    <div className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-card bg-success-soft text-success">
                        <Check className="size-4" />
                    </div>

                    {index <
                        items.length - 1 && (
                        <span className="absolute left-3 top-7 h-full w-0.5 bg-border" />
                    )}

                    <div>
                        <p className="text-sm font-semibold">
                            {String(
                                item.newStatus || ""
                            )
                                .replaceAll(
                                    "_",
                                    " "
                                )
                                .replace(
                                    /\b\w/g,
                                    (c) =>
                                        c.toUpperCase()
                                )}
                        </p>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {item.createdAt
                                ? new Date(
                                      item.createdAt
                                  ).toLocaleString()
                                : ""}

                            {item.remark
                                ? ` · ${item.remark}`
                                : ""}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}


// --------------------------------------------------
// Map Preview
// --------------------------------------------------

export function MapPreview({
    large = false,
    locations = [],
}) {
    return (
        <div
            className={cn(
                "map-grid relative overflow-hidden rounded-lg border bg-map",
                large
                    ? "h-80"
                    : "h-48"
            )}
        >
            <div className="absolute inset-0 bg-map-routes" />

            {locations.length ? (
                locations
                    .slice(0, 30)
                    .map((item, index) => (
                        <div
                            key={
                                item._id ||
                                index
                            }
                            className="absolute flex size-8 items-center justify-center rounded-full bg-danger-soft text-destructive shadow"
                            style={{
                                left: `${
                                    15 +
                                    ((index *
                                        23) %
                                        70)
                                }%`,
                                top: `${
                                    18 +
                                    ((index *
                                        37) %
                                        62)
                                }%`,
                            }}
                            title={`${item.complaintId || ""} ${
                                item.title || ""
                            }`}
                        >
                            <MapPin className="size-4" />
                        </div>
                    ))
            ) : (
                <div className="absolute left-[28%] top-[34%] flex size-9 items-center justify-center rounded-full bg-danger-soft text-destructive shadow">
                    <MapPin className="size-5" />
                </div>
            )}

            <div className="absolute bottom-3 left-3 rounded-md border bg-card/95 px-3 py-2 text-xs shadow-sm">
                <span className="font-semibold">
                    CivicConnect map
                </span>

                <span className="ml-2 text-muted-foreground">
                    Complaint locations
                </span>
            </div>
        </div>
    );
}


// --------------------------------------------------
// File Upload
// --------------------------------------------------

export function FileUpload({
    onChange,
    multiple = false,
}) {
    return (
        <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-primary/40 bg-primary-soft/40 p-5 text-center transition hover:bg-primary-soft">
            <UploadCloud className="mb-2 size-7 text-primary" />

            <span className="text-sm font-semibold">
                Upload image or video
            </span>

            <span className="mt-1 text-xs text-muted-foreground">
                PNG, JPG, WEBP, MP4, WEBM, MOV ·
                20 MB/file
            </span>

            <input
                type="file"
                className="sr-only"
                accept="image/*,video/*"
                multiple={multiple}
                onChange={(event) => {
                    const files =
                        Array.from(
                            event.target.files ||
                                []
                        );

                    files.forEach(
                        (file) => {
                            onChange?.(file);
                        }
                    );

                    event.target.value =
                        "";
                }}
            />
        </label>
    );
}


// --------------------------------------------------
// Empty State
// --------------------------------------------------

export function EmptyState({
    title = "No complaints found",
}) {
    return (
        <div className="panel flex flex-col items-center p-12 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                <Search className="size-5 text-muted-foreground" />
            </div>

            <h3 className="font-semibold">
                {title}
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your filters or
                search terms.
            </p>
        </div>
    );
}


// --------------------------------------------------
// Basic Skeleton
// --------------------------------------------------

export function Skeleton({
    className = "",
}) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-muted",
                className
            )}
        />
    );
}




export function NotificationSkeleton() {
    return (
        <div className="space-y-3">

            {[1, 2, 3, 4].map(
                (item) => (
                    <div
                        key={item}
                        className="
                            panel
                            flex
                            gap-4
                            p-5
                        "
                    >

                        {/* Notification Icon */}
                        <Skeleton
                            className="
                                size-10
                                shrink-0
                                rounded-lg
                            "
                        />


                        <div
                            className="
                                min-w-0
                                flex-1
                            "
                        >

                            {/* Title + Date */}
                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    gap-3
                                "
                            >

                                <Skeleton
                                    className="
                                        h-4
                                        w-48
                                    "
                                />

                                <Skeleton
                                    className="
                                        h-3
                                        w-24
                                    "
                                />

                            </div>


                            {/* Message */}
                            <Skeleton
                                className="
                                    mt-3
                                    h-3
                                    w-full
                                    max-w-xl
                                "
                            />

                            <Skeleton
                                className="
                                    mt-2
                                    h-3
                                    w-3/4
                                    max-w-lg
                                "
                            />


                            {/* Extra Info */}
                            <Skeleton
                                className="
                                    mt-3
                                    h-3
                                    w-28
                                "
                            />


                            {/* Actions */}
                            <div
                                className="
                                    mt-3
                                    flex
                                    gap-2
                                "
                            >

                                <Skeleton
                                    className="
                                        h-8
                                        w-24
                                        rounded-md
                                    "
                                />

                                <Skeleton
                                    className="
                                        h-8
                                        w-20
                                        rounded-md
                                    "
                                />

                            </div>

                        </div>

                    </div>
                )
            )}

        </div>
    );
}


// --------------------------------------------------
// Loading Cards
// --------------------------------------------------

export function LoadingCards() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(
                (item) => (
                    <div
                        key={item}
                        className="panel p-5"
                    >
                        <div className="flex items-start justify-between">

                            <div className="flex-1">
                                <Skeleton className="h-4 w-24" />

                                <Skeleton className="mt-3 h-8 w-16" />

                                <Skeleton className="mt-2 h-3 w-32" />
                            </div>

                            <Skeleton className="size-10 rounded-lg" />
                        </div>
                    </div>
                )
            )}
        </div>
    );
}


// --------------------------------------------------
// Complaint Table Skeleton
// --------------------------------------------------

export function ComplaintTableSkeleton({
    management = false,
}) {
    return (
        <div className="panel overflow-hidden">

            {/* Desktop Skeleton */}
            <div className="hidden md:block">
                <div className="border-b bg-muted/60 px-5 py-4">
                    <div
                        className={cn(
                            "grid items-center gap-4",
                            management
                                ? "grid-cols-8"
                                : "grid-cols-7"
                        )}
                    >
                        {[...Array(management ? 8 : 7)].map(
                            (_, index) => (
                                <Skeleton
                                    key={index}
                                    className="h-3 w-full"
                                />
                            )
                        )}
                    </div>
                </div>

                <div className="divide-y">
                    {[1, 2, 3, 4, 5].map(
                        (item) => (
                            <div
                                key={item}
                                className={cn(
                                    "grid items-center gap-4 px-5 py-5",
                                    management
                                        ? "grid-cols-8"
                                        : "grid-cols-7"
                                )}
                            >
                                <Skeleton className="h-4 w-24" />

                                <div>
                                    <Skeleton className="h-4 w-36" />
                                    <Skeleton className="mt-2 h-3 w-24" />
                                </div>

                                {management && (
                                    <Skeleton className="h-4 w-24" />
                                )}

                                <Skeleton className="h-4 w-24" />

                                <Skeleton className="h-4 w-16" />

                                <Skeleton className="h-6 w-20 rounded-full" />

                                <Skeleton className="h-4 w-20" />

                                <Skeleton className="h-8 w-16 rounded-md" />
                            </div>
                        )
                    )}
                </div>
            </div>


            {/* Mobile Skeleton */}
            <div className="divide-y md:hidden">
                {[1, 2, 3].map(
                    (item) => (
                        <div
                            key={item}
                            className="p-4"
                        >
                            <div className="flex items-start justify-between gap-3">

                                <div className="flex-1">
                                    <Skeleton className="h-3 w-24" />

                                    <Skeleton className="mt-2 h-5 w-40" />
                                </div>

                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div>
                                    <Skeleton className="h-3 w-16" />

                                    <Skeleton className="mt-2 h-4 w-24" />
                                </div>

                                <div>
                                    <Skeleton className="h-3 w-16" />

                                    <Skeleton className="mt-2 h-4 w-16" />
                                </div>
                            </div>

                            <Skeleton className="mt-4 h-9 w-full rounded-md" />
                        </div>
                    )
                )}
            </div>
        </div>
    );
}


// --------------------------------------------------
// Complaint Details Skeleton
// --------------------------------------------------

export function ComplaintDetailsSkeleton() {
    return (
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">

            {/* Main Details */}
            <div className="panel p-6">

                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <Skeleton className="h-4 w-32" />

                        <Skeleton className="mt-3 h-7 w-72" />
                    </div>

                    <Skeleton className="h-7 w-24 rounded-full" />
                </div>


                <div className="mt-6 grid gap-5 border-y py-5 sm:grid-cols-3">

                    <div>
                        <Skeleton className="h-3 w-20" />

                        <Skeleton className="mt-2 h-4 w-28" />
                    </div>

                    <div>
                        <Skeleton className="h-3 w-16" />

                        <Skeleton className="mt-2 h-4 w-32" />
                    </div>

                    <div>
                        <Skeleton className="h-3 w-24" />

                        <Skeleton className="mt-2 h-4 w-36" />
                    </div>
                </div>

                <Skeleton className="mt-5 h-9 w-52 rounded-md" />
            </div>


            {/* Timeline */}
            <div className="panel p-6">
                <Skeleton className="h-5 w-40" />

                <div className="mt-6 space-y-6">
                    {[1, 2, 3, 4].map(
                        (item) => (
                            <div
                                key={item}
                                className="flex gap-4"
                            >
                                <Skeleton className="size-7 shrink-0 rounded-full" />

                                <div className="flex-1">
                                    <Skeleton className="h-4 w-28" />

                                    <Skeleton className="mt-2 h-3 w-40" />
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
// Metric
// --------------------------------------------------

export function Metric({
    label,
    value,
}) {
    return (
        <div>
            <p className="text-xs font-medium text-muted-foreground">
                {label}
            </p>

            <p className="mt-1 break-words text-sm font-semibold text-foreground">
                {value}
            </p>
        </div>
    );
}


// --------------------------------------------------
// Notice
// --------------------------------------------------

export function Notice({
    children,
}) {
    return (
        <div className="flex gap-3 rounded-lg border border-primary/20 bg-primary-soft p-4 text-sm text-primary">
            <Clock3 className="mt-0.5 size-4 shrink-0" />

            <span>
                {children}
            </span>
        </div>
    );
}