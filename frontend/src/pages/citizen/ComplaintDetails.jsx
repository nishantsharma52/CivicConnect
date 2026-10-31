import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    useDispatch,
    useSelector,
} from "react-redux";

import { toast } from "sonner";

import {
    ArrowLeft,
    CheckCircle2,
    MessageSquare,
    Send,
    ShieldCheck,
    UploadCloud,
    UserCheck,
} from "lucide-react";


// --------------------------------------------------
// Complaint Redux
// --------------------------------------------------

import {
    fetchComplaint,
    assignDepartment,
    assignStaff,
    updateComplaintStatus,
    addResolutionProof,
    verifyResolution,
} from "@/redux/complaintSlice";


// --------------------------------------------------
// Master Redux
// --------------------------------------------------

import {
    fetchDepartments,
    fetchDepartmentStaff,
} from "@/redux/masterSlice";


// --------------------------------------------------
// Comments Redux
// --------------------------------------------------

import {
    fetchComments,
    addComment,
} from "@/redux/commentSlice";


// --------------------------------------------------
// Feedback Redux
// --------------------------------------------------

import {
    createFeedback,
} from "@/redux/feedbackSlice";


// --------------------------------------------------
// App Components
// --------------------------------------------------

import {
    DashboardShell,
} from "@/components/AppShell";

import {
    Button,
} from "@/components/ui/button";


// --------------------------------------------------
// Civic UI Components
// --------------------------------------------------

import {
    ComplaintDetailsSkeleton,
    FileUpload,
    Metric,
    PageHeader,
    PriorityText,
    StatusBadge,
    Timeline,
} from "@/components/CivicUI";


// --------------------------------------------------
// Format Status
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
// Complaint Details Page
// --------------------------------------------------

export default function ComplaintDetails() {
    const { id } = useParams();

    const dispatch = useDispatch();

    const navigate = useNavigate();


    // --------------------------------------------------
    // Auth State
    // --------------------------------------------------

    const { user } = useSelector(
        (state) => state.auth
    );


    // --------------------------------------------------
    // Complaint State
    // --------------------------------------------------

    const {
        current,
        history,
        loading,
        actionLoading,
        error,
    } = useSelector(
        (state) =>
            state.complaints
    );


    // --------------------------------------------------
    // Master Data
    // --------------------------------------------------

    const {
        departments,
        staff,
    } = useSelector(
        (state) => state.master
    );


    // --------------------------------------------------
    // Comments
    // --------------------------------------------------

    const comments = useSelector(
        (state) =>
            state.comments.items
    );


    // --------------------------------------------------
    // Feedback
    // --------------------------------------------------

    const feedback = useSelector(
        (state) =>
            state.complaints
                .currentFeedback
    );


    // --------------------------------------------------
    // Local State
    // --------------------------------------------------

    const [
        commentText,
        setCommentText,
    ] = useState("");

    const [
        internal,
        setInternal,
    ] = useState(false);


    const [
        proofFiles,
        setProofFiles,
    ] = useState([]);

    const [
        remark,
        setRemark,
    ] = useState("");


    const [
        reopenReason,
        setReopenReason,
    ] = useState("");


    const [
        rating,
        setRating,
    ] = useState(5);

    const [
        feedbackComment,
        setFeedbackComment,
    ] = useState("");

    const [
        satisfied,
        setSatisfied,
    ] = useState(true);


    const [
        selectedDept,
        setSelectedDept,
    ] = useState("");

    const [
        selectedStaff,
        setSelectedStaff,
    ] = useState("");


    // --------------------------------------------------
    // Fetch Complaint Data
    // --------------------------------------------------

    useEffect(() => {
        if (!id) {
            return;
        }

        dispatch(
            fetchComplaint(id)
        );

        dispatch(
            fetchComments(id)
        );

        dispatch(
            fetchDepartments()
        );
    }, [
        dispatch,
        id,
    ]);


    // --------------------------------------------------
    // Fetch Department Staff
    // --------------------------------------------------

    useEffect(() => {
        if (!current?.department?._id) {
            return;
        }

        dispatch(
            fetchDepartmentStaff(
                current.department._id
            )
        );
    }, [
        dispatch,
        current?.department?._id,
    ]);


    // --------------------------------------------------
    // Set Selected Department and Staff
    // --------------------------------------------------

    useEffect(() => {
        if (current?.department?._id) {
            setSelectedDept(
                current.department._id
            );
        } else {
            setSelectedDept("");
        }

        if (current?.assignedTo?._id) {
            setSelectedStaff(
                current.assignedTo._id
            );
        } else {
            setSelectedStaff("");
        }
    }, [
        current?.department?._id,
        current?.assignedTo?._id,
    ]);


    // --------------------------------------------------
    // Current Complaint Status
    // --------------------------------------------------

    const status =
        current?.status;


    // --------------------------------------------------
    // Management Permission
    // --------------------------------------------------

    const canManage =
        user?.role === "admin" ||
        user?.role === "department";


    // --------------------------------------------------
    // Available Status Actions
    // --------------------------------------------------

    const statusActions = useMemo(() => {
        return (
            {
                submitted: [
                    "under_review",
                    "assigned",
                    "rejected",
                ],

                under_review: [
                    "assigned",
                    "rejected",
                ],

                assigned: [
                    "in_progress",
                    "rejected",
                ],

                in_progress: [
                    "rejected",
                ],

                reopened: [
                    "assigned",
                    "in_progress",
                    "rejected",
                ],
            }[status] || []
        );
    }, [
        status,
    ]);


    // --------------------------------------------------
    // Common Action Handler
    // --------------------------------------------------

    const act = async (
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
                fetchComplaint(id)
            );

            dispatch(
                fetchComments(id)
            );
        } else {
            toast.error(
                result.payload ||
                    "Action failed"
            );
        }
    };


    // --------------------------------------------------
    // Loading State
    // --------------------------------------------------

    if (loading && !current) {
        return (
            <DashboardShell>
                <div className="space-y-6">

                    {/* Back Skeleton */}
                    <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />

                    {/* Header Skeleton */}
                    <div className="space-y-3">
                        <div className="h-3 w-32 animate-pulse rounded bg-muted" />

                        <div className="flex items-center justify-between gap-4">
                            <div className="h-8 w-56 animate-pulse rounded bg-muted" />

                            <div className="h-7 w-24 animate-pulse rounded-full bg-muted" />
                        </div>

                        <div className="h-4 w-72 animate-pulse rounded bg-muted" />
                    </div>

                    {/* Complaint Details Skeleton */}
                    <ComplaintDetailsSkeleton />

                </div>
            </DashboardShell>
        );
    }


    // --------------------------------------------------
    // Complaint Not Found
    // --------------------------------------------------

    if (!current) {
        return (
            <DashboardShell>
                <div className="panel p-12 text-center">

                    <p className="text-destructive">
                        {error ||
                            "Complaint not found"}
                    </p>

                    <Button
                        className="mt-4"
                        onClick={() =>
                            navigate(-1)
                        }
                    >
                        Go back
                    </Button>

                </div>
            </DashboardShell>
        );
    }


    // --------------------------------------------------
    // Add Comment
    // --------------------------------------------------

    const submitComment = async (
        event
    ) => {
        event.preventDefault();

        const comment =
            commentText.trim();

        if (!comment) {
            return;
        }

        await act(
            addComment,
            {
                complaintId:
                    current._id,

                comment,

                isInternal:
                    internal,
            },
            "Comment added"
        );

        setCommentText("");
    };


    // --------------------------------------------------
    // Resolve Complaint
    // --------------------------------------------------

    const doResolution = async () => {
        if (
            !proofFiles.length ||
            !remark.trim()
        ) {
            return toast.error(
                "Resolution proof and department remark are required"
            );
        }

        await act(
            addResolutionProof,
            {
                id: current._id,

                departmentRemark:
                    remark.trim(),

                files: proofFiles,
            },
            "Complaint marked resolved"
        );

        setProofFiles([]);
        setRemark("");
    };


    // --------------------------------------------------
    // Verify or Reopen Resolution
    // --------------------------------------------------

    const doVerify = async (
        verified
    ) => {
        if (
            !verified &&
            !reopenReason.trim()
        ) {
            return toast.error(
                "Please give a reason to reopen"
            );
        }

        await act(
            verifyResolution,
            {
                id: current._id,

                verified,

                reopenedReason:
                    reopenReason.trim(),
            },
            verified
                ? "Resolution verified"
                : "Complaint reopened"
        );

        setReopenReason("");
    };


    // --------------------------------------------------
    // Submit Feedback
    // --------------------------------------------------

    const submitFeedback = async (
        event
    ) => {
        event.preventDefault();

        const result =
            await dispatch(
                createFeedback({
                    complaintId:
                        current._id,

                    rating,

                    comment:
                        feedbackComment,

                    resolutionSatisfied:
                        satisfied,
                })
            );

        if (
            createFeedback.fulfilled.match(
                result
            )
        ) {
            toast.success(
                "Feedback submitted"
            );

            dispatch(
                fetchComplaint(id)
            );
        } else {
            toast.error(
                result.payload ||
                    "Feedback failed"
            );
        }
    };


    // --------------------------------------------------
    // Main UI
    // --------------------------------------------------

    return (
        <DashboardShell>

            {/* --------------------------------------------------
                Back Button
            -------------------------------------------------- */}

            <Button
                variant="ghost"
                className="mb-4"
                onClick={() =>
                    navigate(-1)
                }
            >
                <ArrowLeft />

                Back
            </Button>


            {/* --------------------------------------------------
                Page Header
            -------------------------------------------------- */}

            <PageHeader
                eyebrow="Complaint details"
                title={
                    current.complaintId
                }
                description={
                    current.title
                }
                action={
                    <StatusBadge
                        status={pretty(
                            status
                        )}
                    />
                }
            />


            {/* --------------------------------------------------
                Main Grid
            -------------------------------------------------- */}

            <div className="grid gap-6 xl:grid-cols-[1fr_380px]">


                {/* ==================================================
                    LEFT SECTION
                ================================================== */}

                <div className="space-y-6">

                    {/* --------------------------------------------------
                        Complaint Information
                    -------------------------------------------------- */}

                    <div className="panel p-6">

                        <h2 className="text-lg font-bold">
                            Complaint Information
                        </h2>


                        <p className="mt-4 leading-7 text-muted-foreground">
                            {current.description}
                        </p>


                        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                            <Metric
                                label="Category"
                                value={
                                    current
                                        .category
                                        ?.name ||
                                    "—"
                                }
                            />

                            <Metric
                                label="Sub-category"
                                value={
                                    current.subCategory ||
                                    "General"
                                }
                            />

                            <Metric
                                label="Priority"
                                value={
                                    <PriorityText
                                        priority={pretty(
                                            current.priority
                                        )}
                                    />
                                }
                            />

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
                                label="Assigned staff"
                                value={
                                    current
                                        .assignedTo
                                        ?.name ||
                                    "Unassigned"
                                }
                            />

                            <Metric
                                label="Location"
                                value={
                                    current
                                        .location
                                        ?.address ||
                                    "—"
                                }
                            />

                        </div>

                    </div>


                    {/* --------------------------------------------------
                        Evidence
                    -------------------------------------------------- */}

                    <div className="panel p-6">

                        <h2 className="text-lg font-bold">
                            Evidence
                        </h2>


                        {current.evidence?.length ? (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">

                                {current.evidence.map(
                                    (
                                        file,
                                        index
                                    ) => (
                                        <a
                                            key={
                                                file._id ||
                                                index
                                            }
                                            href={
                                                file.url
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="rounded-lg border p-3 hover:border-primary"
                                        >
                                            <div className="text-xs font-semibold">
                                                {file.type ===
                                                "video"
                                                    ? "Video evidence"
                                                    : "Image evidence"}
                                            </div>

                                            <div className="mt-1 break-all text-xs text-muted-foreground">
                                                Open evidence #
                                                {index +
                                                    1}
                                            </div>
                                        </a>
                                    )
                                )}

                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-muted-foreground">
                                No evidence attached.
                            </p>
                        )}

                    </div>


                    {/* --------------------------------------------------
                        Resolution Proof
                    -------------------------------------------------- */}

                    {current.resolutionProof
                        ?.length > 0 && (
                        <div className="panel p-6">

                            <h2 className="text-lg font-bold">
                                Resolution Proof
                            </h2>


                            <p className="mt-2 text-sm text-muted-foreground">
                                {
                                    current.departmentRemark
                                }
                            </p>


                            <div className="mt-4 grid gap-3 sm:grid-cols-2">

                                {current.resolutionProof.map(
                                    (
                                        file,
                                        index
                                    ) => (
                                        <a
                                            key={
                                                file._id ||
                                                index
                                            }
                                            href={
                                                file.url
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="rounded-lg border p-3 hover:border-primary"
                                        >
                                            Resolution file #
                                            {index +
                                                1}
                                        </a>
                                    )
                                )}

                            </div>


                            <p className="mt-4 text-xs text-muted-foreground">
                                Resolved:{" "}
                                {current.resolvedAt
                                    ? new Date(
                                          current.resolvedAt
                                      ).toLocaleString()
                                    : "—"}
                            </p>

                        </div>
                    )}


                    {/* --------------------------------------------------
                        Status Timeline
                    -------------------------------------------------- */}

                    <div className="panel p-6">

                        <h2 className="mb-6 text-lg font-bold">
                            Status Timeline
                        </h2>

                        <Timeline
                            history={history}
                        />

                    </div>


                    {/* --------------------------------------------------
                        Comments
                    -------------------------------------------------- */}

                    <div className="panel p-6">

                        <div className="flex items-center gap-2">

                            <MessageSquare className="size-5 text-primary" />

                            <h2 className="text-lg font-bold">
                                Comments
                            </h2>

                        </div>


                        <div className="mt-5 space-y-3">

                            {comments.length ? (
                                comments.map(
                                    (
                                        comment
                                    ) => (
                                        <div
                                            key={
                                                comment._id
                                            }
                                            className="rounded-lg border p-4"
                                        >

                                            <div className="flex items-center justify-between gap-3">

                                                <span className="text-sm font-semibold">

                                                    {
                                                        comment
                                                            .user
                                                            ?.name
                                                    }

                                                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                                                        (
                                                        {
                                                            comment
                                                                .user
                                                                ?.role
                                                        }
                                                        )
                                                    </span>

                                                </span>


                                                <span className="text-xs text-muted-foreground">
                                                    {comment.createdAt
                                                        ? new Date(
                                                              comment.createdAt
                                                          ).toLocaleString()
                                                        : ""}
                                                </span>

                                            </div>


                                            <p className="mt-2 text-sm">
                                                {
                                                    comment.comment
                                                }
                                            </p>


                                            {comment.isInternal && (
                                                <span className="mt-2 inline-flex rounded-full bg-warning/10 px-2 py-1 text-[11px] font-semibold text-warning">
                                                    Internal
                                                </span>
                                            )}

                                        </div>
                                    )
                                )
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No comments yet.
                                </p>
                            )}

                        </div>


                        {/* Add Comment */}
                        <form
                            onSubmit={
                                submitComment
                            }
                            className="mt-5 space-y-3"
                        >

                            <textarea
                                className="field min-h-24"
                                placeholder="Write a comment..."
                                value={
                                    commentText
                                }
                                onChange={(
                                    event
                                ) =>
                                    setCommentText(
                                        event.target
                                            .value
                                    )
                                }
                            />


                            {user?.role !==
                                "citizen" && (
                                <label className="flex items-center gap-2 text-sm">

                                    <input
                                        type="checkbox"
                                        checked={
                                            internal
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setInternal(
                                                event
                                                    .target
                                                    .checked
                                            )
                                        }
                                    />

                                    Internal department comment

                                </label>
                            )}


                            <Button
                                disabled={
                                    !commentText.trim()
                                }
                            >
                                <Send />

                                Add Comment
                            </Button>

                        </form>

                    </div>

                </div>


                {/* ==================================================
                    RIGHT SECTION
                ================================================== */}

                <div className="space-y-6">

                    {/* --------------------------------------------------
                        Management Actions
                    -------------------------------------------------- */}

                    {canManage && (
                        <div className="panel p-6">

                            <div className="flex items-center gap-2">

                                <ShieldCheck className="size-5 text-primary" />

                                <h2 className="font-bold">
                                    Management Actions
                                </h2>

                            </div>


                            {/* Admin - Assign Department */}
                            {user.role ===
                                "admin" && (
                                <div className="mt-5 space-y-4">

                                    <label className="block">

                                        <span className="mb-1 block text-xs font-medium">
                                            Assign department
                                        </span>


                                        <select
                                            className="field"
                                            value={
                                                selectedDept
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setSelectedDept(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
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

                                    </label>


                                    <Button
                                        className="w-full"
                                        disabled={
                                            !selectedDept ||
                                            actionLoading
                                        }
                                        onClick={() =>
                                            act(
                                                assignDepartment,
                                                {
                                                    id: current._id,

                                                    departmentId:
                                                        selectedDept,
                                                },
                                                "Department assigned"
                                            )
                                        }
                                    >
                                        <UserCheck />

                                        Assign Department
                                    </Button>

                                </div>
                            )}


                            {/* Assign Staff */}
                            {current.department?._id && (
                                <div className="mt-5 space-y-4">

                                    <label className="block">

                                        <span className="mb-1 block text-xs font-medium">
                                            Assign staff
                                        </span>


                                        <select
                                            className="field"
                                            value={
                                                selectedStaff
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setSelectedStaff(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                        >

                                            <option value="">
                                                Select staff
                                            </option>


                                            {staff.map(
                                                (
                                                    staffMember
                                                ) => (
                                                    <option
                                                        key={
                                                            staffMember._id
                                                        }
                                                        value={
                                                            staffMember._id
                                                        }
                                                    >
                                                        {
                                                            staffMember.name
                                                        }
                                                    </option>
                                                )
                                            )}

                                        </select>

                                    </label>


                                    <Button
                                        className="w-full"
                                        disabled={
                                            !selectedStaff ||
                                            actionLoading
                                        }
                                        onClick={() =>
                                            act(
                                                assignStaff,
                                                {
                                                    id: current._id,

                                                    userId:
                                                        selectedStaff,
                                                },
                                                "Staff assigned"
                                            )
                                        }
                                    >
                                        <UserCheck />

                                        Assign Staff
                                    </Button>

                                </div>
                            )}


                            {/* Status Actions */}
                            {statusActions.length >
                                0 && (
                                <div className="mt-5 grid gap-2">

                                    {statusActions.map(
                                        (
                                            nextStatus
                                        ) => (
                                            <Button
                                                key={
                                                    nextStatus
                                                }
                                                variant={
                                                    nextStatus ===
                                                    "rejected"
                                                        ? "outline"
                                                        : "default"
                                                }
                                                disabled={
                                                    actionLoading
                                                }
                                                onClick={() =>
                                                    act(
                                                        updateComplaintStatus,
                                                        {
                                                            id: current._id,

                                                            status:
                                                                nextStatus,

                                                            remark:
                                                                nextStatus ===
                                                                "rejected"
                                                                    ? window.prompt(
                                                                          "Rejection reason"
                                                                      ) ||
                                                                      ""
                                                                    : "",
                                                        },
                                                        `Status changed to ${pretty(
                                                            nextStatus
                                                        )}`
                                                    )
                                                }
                                            >
                                                {pretty(
                                                    nextStatus
                                                )}
                                            </Button>
                                        )
                                    )}

                                </div>
                            )}

                        </div>
                    )}


                    {/* --------------------------------------------------
                        Resolve Complaint
                    -------------------------------------------------- */}

                    {canManage &&
                        [
                            "assigned",
                            "in_progress",
                            "reopened",
                        ].includes(
                            status
                        ) && (
                            <div className="panel p-6">

                                <div className="flex items-center gap-2">

                                    <UploadCloud className="size-5 text-primary" />

                                    <h2 className="font-bold">
                                        Resolve Complaint
                                    </h2>

                                </div>


                                <div className="mt-4 space-y-4">

                                    <textarea
                                        className="field min-h-24"
                                        placeholder="Resolution remark"
                                        value={
                                            remark
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setRemark(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    />


                                    <FileUpload
                                        onChange={(
                                            file
                                        ) =>
                                            setProofFiles(
                                                (
                                                    previous
                                                ) => [
                                                    ...previous,
                                                    file,
                                                ]
                                            )
                                        }
                                    />


                                    <p className="text-xs text-muted-foreground">
                                        {
                                            proofFiles.length
                                        }{" "}
                                        proof file(s)
                                        selected
                                    </p>


                                    <Button
                                        className="w-full"
                                        disabled={
                                            actionLoading ||
                                            !proofFiles.length ||
                                            !remark.trim()
                                        }
                                        onClick={
                                            doResolution
                                        }
                                    >
                                        Mark Resolved
                                    </Button>

                                </div>

                            </div>
                        )}


                    {/* --------------------------------------------------
                        Verify Resolution
                    -------------------------------------------------- */}

                    {user?.role ===
                        "citizen" &&
                        status ===
                            "resolved" &&
                        !current.citizenVerifiedResolution && (
                            <div className="panel p-6">

                                <div className="flex items-center gap-2">

                                    <ShieldCheck className="size-5 text-success" />

                                    <h2 className="font-bold">
                                        Verify Resolution
                                    </h2>

                                </div>


                                <p className="mt-2 text-sm text-muted-foreground">
                                    Review the resolution proof and confirm whether the issue was actually fixed.
                                </p>


                                <div className="mt-4 space-y-3">

                                    <Button
                                        className="w-full"
                                        onClick={() =>
                                            doVerify(
                                                true
                                            )
                                        }
                                        disabled={
                                            actionLoading
                                        }
                                    >
                                        <CheckCircle2 />

                                        Yes, issue resolved
                                    </Button>


                                    <input
                                        className="field"
                                        placeholder="Reason for reopening"
                                        value={
                                            reopenReason
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setReopenReason(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    />


                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() =>
                                            doVerify(
                                                false
                                            )
                                        }
                                        disabled={
                                            actionLoading
                                        }
                                    >
                                        No, reopen complaint
                                    </Button>

                                </div>

                            </div>
                        )}


                    {/* --------------------------------------------------
                        Give Feedback
                    -------------------------------------------------- */}

                    {user?.role ===
                        "citizen" &&
                        current.status ===
                            "resolved" &&
                        current.citizenVerifiedResolution &&
                        !feedback && (
                            <form
                                className="panel p-6"
                                onSubmit={
                                    submitFeedback
                                }
                            >

                                <h2 className="font-bold">
                                    Give Feedback
                                </h2>


                                {/* Rating */}
                                <div className="mt-4">

                                    <span className="text-sm font-medium">
                                        Rating
                                    </span>


                                    <div className="mt-2 flex gap-1">

                                        {[
                                            1,
                                            2,
                                            3,
                                            4,
                                            5,
                                        ].map(
                                            (
                                                number
                                            ) => (
                                                <button
                                                    type="button"
                                                    key={
                                                        number
                                                    }
                                                    onClick={() =>
                                                        setRating(
                                                            number
                                                        )
                                                    }
                                                    className={`
                                                        text-2xl
                                                        ${
                                                            number <=
                                                            rating
                                                                ? "text-warning"
                                                                : "text-muted-foreground"
                                                        }
                                                    `}
                                                >
                                                    ★
                                                </button>
                                            )
                                        )}

                                    </div>

                                </div>


                                {/* Feedback Comment */}
                                <textarea
                                    className="field mt-4 min-h-24"
                                    placeholder="Tell us about the resolution"
                                    value={
                                        feedbackComment
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setFeedbackComment(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                />


                                {/* Satisfaction */}
                                <label className="mt-4 flex items-center gap-2 text-sm">

                                    <input
                                        type="checkbox"
                                        checked={
                                            satisfied
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setSatisfied(
                                                event
                                                    .target
                                                    .checked
                                            )
                                        }
                                    />

                                    Resolution satisfied

                                </label>


                                <Button className="mt-4 w-full">
                                    Submit Feedback
                                </Button>

                            </form>
                        )}


                    {/* --------------------------------------------------
                        Existing Feedback
                    -------------------------------------------------- */}

                    {feedback && (
                        <div className="panel p-6">

                            <h2 className="font-bold">
                                Citizen Feedback
                            </h2>


                            <p className="mt-3 text-2xl">

                                {"★".repeat(
                                    feedback.rating
                                )}

                                <span className="text-muted-foreground">
                                    {"★".repeat(
                                        5 -
                                            feedback.rating
                                    )}
                                </span>

                            </p>


                            <p className="mt-2 text-sm text-muted-foreground">
                                {feedback.comment ||
                                    "No written comment."}
                            </p>

                        </div>
                    )}

                </div>

            </div>

        </DashboardShell>
    );
}