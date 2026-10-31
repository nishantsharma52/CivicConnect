import { useEffect, useMemo, useState } from "react";

import {
    ArrowLeft,
    ArrowRight,
    BrainCircuit,
    CheckCircle2,
    LocateFixed,
} from "lucide-react";

import {
    useDispatch,
    useSelector,
} from "react-redux";

import { toast } from "sonner";

import { useNavigate } from "react-router-dom";

import {
    analyzeComplaintPreview,
    createComplaint,
} from "@/redux/complaintSlice";

import {
    fetchCategories,
    fetchDepartments,
} from "@/redux/masterSlice";

import {
    SmartShell,
} from "@/components/AppShell";

import {
    Button,
} from "@/components/ui/button";

import {
    FileUpload,
    MapPreview,
    Metric,
    PageHeader,
    PriorityText,
    Skeleton,
} from "@/components/CivicUI";


// --------------------------------------------------
// Format status and priority text
// --------------------------------------------------

const pretty = (value) => {
    return String(value || "")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) =>
            char.toUpperCase()
        );
};


// --------------------------------------------------
// Reusable form label
// --------------------------------------------------

function Label({ text, children }) {
    return (
        <label className="block">

            <span
                className="
                    mb-1.5
                    block
                    text-sm
                    font-semibold
                "
            >
                {text}
            </span>

            {children}

        </label>
    );
}


// --------------------------------------------------
// Report Form Skeleton
// --------------------------------------------------

function ReportFormSkeleton() {
    return (
        <div
            className="
                grid
                gap-6
                xl:grid-cols-[1fr_380px]
            "
        >

            {/* ==================================================
                Complaint Details Skeleton
            ================================================== */}

            <div className="panel p-5 sm:p-7">

                <Skeleton className="h-6 w-52" />

                <div className="mt-6 grid gap-5">

                    {/* Title */}
                    <div>
                        <Skeleton className="h-4 w-36" />

                        <Skeleton
                            className="
                                mt-2
                                h-10
                                w-full
                            "
                        />
                    </div>


                    {/* Description */}
                    <div>
                        <Skeleton className="h-4 w-24" />

                        <Skeleton
                            className="
                                mt-2
                                h-32
                                w-full
                                rounded-md
                            "
                        />
                    </div>


                    {/* Category + Sub-category */}
                    <div
                        className="
                            grid
                            gap-4
                            sm:grid-cols-2
                        "
                    >
                        <div>
                            <Skeleton className="h-4 w-20" />

                            <Skeleton
                                className="
                                    mt-2
                                    h-10
                                    w-full
                                "
                            />
                        </div>

                        <div>
                            <Skeleton className="h-4 w-28" />

                            <Skeleton
                                className="
                                    mt-2
                                    h-10
                                    w-full
                                "
                            />
                        </div>
                    </div>


                    {/* Priority */}
                    <div>
                        <Skeleton className="h-4 w-20" />

                        <div
                            className="
                                mt-2
                                grid
                                grid-cols-2
                                gap-2
                                sm:grid-cols-4
                            "
                        >
                            <Skeleton
                                className="h-10 w-full rounded-md"
                            />

                            <Skeleton
                                className="h-10 w-full rounded-md"
                            />

                            <Skeleton
                                className="h-10 w-full rounded-md"
                            />

                            <Skeleton
                                className="h-10 w-full rounded-md"
                            />
                        </div>
                    </div>


                    {/* Evidence */}
                    <div>
                        <Skeleton className="h-4 w-20" />

                        <Skeleton
                            className="
                                mt-2
                                h-28
                                w-full
                                rounded-md
                            "
                        />
                    </div>

                </div>

            </div>


            {/* ==================================================
                Location Skeleton
            ================================================== */}

            <div className="space-y-6">

                <div className="panel p-5">

                    <Skeleton className="h-5 w-20" />

                    <div className="mt-4 space-y-4">

                        {/* Address */}
                        <div>
                            <Skeleton className="h-4 w-20" />

                            <Skeleton
                                className="
                                    mt-2
                                    h-10
                                    w-full
                                "
                            />
                        </div>


                        {/* Coordinates */}
                        <div
                            className="
                                grid
                                grid-cols-2
                                gap-3
                            "
                        >
                            <div>
                                <Skeleton className="h-4 w-20" />

                                <Skeleton
                                    className="
                                        mt-2
                                        h-10
                                        w-full
                                    "
                                />
                            </div>

                            <div>
                                <Skeleton className="h-4 w-24" />

                                <Skeleton
                                    className="
                                        mt-2
                                        h-10
                                        w-full
                                    "
                                />
                            </div>
                        </div>


                        {/* Location Button */}
                        <Skeleton
                            className="
                                h-10
                                w-full
                                rounded-md
                            "
                        />


                        {/* Map */}
                        <Skeleton
                            className="
                                h-56
                                w-full
                                rounded-lg
                            "
                        />

                    </div>

                </div>


                {/* Review Button */}
                <Skeleton
                    className="
                        h-11
                        w-full
                        rounded-md
                    "
                />

            </div>

        </div>
    );
}


// --------------------------------------------------
// AI Analysis Skeleton
// --------------------------------------------------

function AIAnalysisSkeleton() {
    return (
        <div
            className="
                rounded-lg
                border
                border-primary/20
                bg-primary-soft
                p-5
            "
        >

            <div className="flex items-center gap-2">

                <Skeleton className="size-5 rounded" />

                <Skeleton className="h-5 w-28" />

            </div>


            <Skeleton
                className="
                    mt-3
                    h-3
                    w-64
                "
            />


            <div className="mt-5 space-y-5">

                {/* Category */}
                <div>
                    <Skeleton className="h-3 w-28" />

                    <Skeleton
                        className="
                            mt-2
                            h-4
                            w-36
                        "
                    />
                </div>


                {/* Department */}
                <div>
                    <Skeleton className="h-3 w-36" />

                    <Skeleton
                        className="
                            mt-2
                            h-4
                            w-40
                        "
                    />
                </div>


                {/* Priority */}
                <div>
                    <Skeleton className="h-3 w-32" />

                    <Skeleton
                        className="
                            mt-2
                            h-5
                            w-20
                        "
                    />
                </div>


                {/* Confidence */}
                <div>
                    <Skeleton className="h-3 w-20" />

                    <Skeleton
                        className="
                            mt-2
                            h-2
                            w-full
                            rounded-full
                        "
                    />

                    <Skeleton
                        className="
                            mt-2
                            ml-auto
                            h-3
                            w-10
                        "
                    />
                </div>

            </div>

        </div>
    );
}


// --------------------------------------------------
// Report Page
// --------------------------------------------------

export default function ReportPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();


    // --------------------------------------------------
    // Master Data
    // --------------------------------------------------

    const {
        categories,
        departments,
    } = useSelector(
        (state) => state.master
    );


    // --------------------------------------------------
    // Complaint State
    // --------------------------------------------------

    const {
        analysis,
        analysisLoading,
        actionLoading,
        error,
    } = useSelector(
        (state) => state.complaints
    );


    // --------------------------------------------------
    // Master Data Loading
    // --------------------------------------------------

    const [
        masterLoading,
        setMasterLoading,
    ] = useState(
        !categories.length ||
        !departments.length
    );


    // --------------------------------------------------
    // Report Steps
    // --------------------------------------------------

    const [step, setStep] = useState(1);


    // --------------------------------------------------
    // Evidence Files
    // --------------------------------------------------

    const [files, setFiles] = useState([]);


    // --------------------------------------------------
    // Submitted Complaint
    // --------------------------------------------------

    const [submitted, setSubmitted] =
        useState(null);


    // --------------------------------------------------
    // Complaint Form
    // --------------------------------------------------

    const [form, setForm] = useState({
        title: "",
        description: "",
        category: "",
        subcategory: "",
        priority: "medium",
        address: "",
        lat: "",
        lng: "",
    });


    // --------------------------------------------------
    // Fetch Categories and Departments
    // --------------------------------------------------

    useEffect(() => {
        let active = true;

        const loadMasterData = async () => {
            try {
                const requests = [];

                if (!categories.length) {
                    requests.push(
                        dispatch(
                            fetchCategories()
                        )
                    );
                }

                if (!departments.length) {
                    requests.push(
                        dispatch(
                            fetchDepartments()
                        )
                    );
                }

                await Promise.all(
                    requests
                );

            } catch {
                toast.error(
                    "Unable to load report data"
                );
            } finally {
                if (active) {
                    setMasterLoading(false);
                }
            }
        };

        if (
            !categories.length ||
            !departments.length
        ) {
            loadMasterData();
        } else {
            setMasterLoading(false);
        }

        return () => {
            active = false;
        };
    }, [
        dispatch,
        categories.length,
        departments.length,
    ]);


    // --------------------------------------------------
    // Set Default Category
    // --------------------------------------------------

    useEffect(() => {
        if (
            !form.category &&
            categories.length
        ) {
            setForm((current) => ({
                ...current,
                category:
                    categories[0]._id,
                subcategory:
                    categories[0]
                        .subCategories?.[0] || "",
            }));
        }
    }, [
        categories,
        form.category,
    ]);


    // --------------------------------------------------
    // Selected Category
    // --------------------------------------------------

    const selectedCategory =
        categories.find(
            (category) =>
                category._id ===
                form.category
        );


    // --------------------------------------------------
    // Update Form Field
    // --------------------------------------------------

    const update = (
        key,
        value
    ) => {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    };


    // --------------------------------------------------
    // Update Category
    // --------------------------------------------------

    const updateCategory = (id) => {
        const category =
            categories.find(
                (item) =>
                    item._id === id
            );

        setForm((current) => ({
            ...current,
            category: id,
            subcategory:
                category
                    ?.subCategories?.[0] ||
                "",
        }));
    };


    // --------------------------------------------------
    // Prepare Location Payload
    // --------------------------------------------------

    const location = useMemo(() => {
        const value = {};

        if (form.address.trim()) {
            value.address =
                form.address.trim();
        }

        if (form.lat !== "") {
            value.latitude =
                Number(form.lat);
        }

        if (form.lng !== "") {
            value.longitude =
                Number(form.lng);
        }

        return value;
    }, [
        form.address,
        form.lat,
        form.lng,
    ]);


    // --------------------------------------------------
    // Use Current Browser Location
    // --------------------------------------------------

    const useCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error(
                "Geolocation is not supported by this browser"
            );

            return;
        }

        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setForm((current) => ({
                    ...current,
                    lat: coords.latitude.toFixed(6),
                    lng: coords.longitude.toFixed(6),
                }));

                toast.success(
                    "Current coordinates added"
                );
            },
            () => {
                toast.error(
                    "Location permission was denied or unavailable"
                );
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
            }
        );
    };


    // --------------------------------------------------
    // Review Complaint with AI Analysis
    // --------------------------------------------------

    const review = async (event) => {
        event.preventDefault();

        if (
            !form.title.trim() ||
            !form.description.trim() ||
            !form.category
        ) {
            return toast.error(
                "Title, description and category are required"
            );
        }

        if (!files.length) {
            return toast.error(
                "Please attach at least one image or video"
            );
        }

        if (files.length > 5) {
            return toast.error(
                "Maximum 5 evidence files are allowed"
            );
        }

        const result = await dispatch(
            analyzeComplaintPreview({
                title: form.title,
                description:
                    form.description,
                category:
                    form.category,
                location:
                    JSON.stringify(
                        location
                    ),
            })
        );

        if (
            analyzeComplaintPreview.fulfilled.match(
                result
            )
        ) {
            setStep(2);
        } else {
            toast.error(
                result.payload ||
                    "Analysis failed"
            );
        }
    };


    // --------------------------------------------------
    // Submit Complaint
    // --------------------------------------------------

    const submit = async () => {
        const result = await dispatch(
            createComplaint({
                fields: {
                    title: form.title,
                    description:
                        form.description,
                    category:
                        form.category,
                    subCategory:
                        form.subcategory,
                    priority:
                        form.priority,
                    location:
                        JSON.stringify(
                            location
                        ),
                },
                files,
            })
        );

        if (
            createComplaint.fulfilled.match(
                result
            )
        ) {
            setSubmitted(
                result.payload.complaint
            );

            setStep(3);

            toast.success(
                "Complaint submitted successfully"
            );
        } else {
            toast.error(
                result.payload ||
                    "Complaint submission failed"
            );
        }
    };


    // --------------------------------------------------
    // Render
    // --------------------------------------------------

    return (
        <SmartShell>

            {/* ==================================================
                Page Header
            ================================================== */}

            <PageHeader
                eyebrow="New civic report"
                title="Report an Issue"
                description="
                    Provide clear details and evidence so
                    the right department can respond quickly.
                "
            />


            {/* ==================================================
                Progress Steps
            ================================================== */}

            <div
                className="
                    mb-7
                    flex
                    max-w-3xl
                    items-center
                "
            >
                {[
                    "Describe Issue",
                    "Review Complaint",
                    "Submitted",
                ].map((label, index) => (
                    <div
                        key={label}
                        className="
                            flex
                            flex-1
                            items-center
                            last:flex-none
                        "
                    >

                        <span
                            className={`
                                flex
                                size-8
                                items-center
                                justify-center
                                rounded-full
                                text-sm
                                font-bold
                                ${
                                    step >= index + 1
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                }
                            `}
                        >
                            {step > index + 1 ? (
                                <CheckCircle2 className="size-4" />
                            ) : (
                                index + 1
                            )}
                        </span>


                        <span
                            className="
                                ml-2
                                hidden
                                text-xs
                                font-semibold
                                sm:block
                            "
                        >
                            {label}
                        </span>


                        {index < 2 && (
                            <span
                                className="
                                    mx-3
                                    h-px
                                    flex-1
                                    bg-border
                                "
                            />
                        )}

                    </div>
                ))}
            </div>


            {/* ==================================================
                Step 1 - Describe Issue
            ================================================== */}

            {step === 1 && (
                masterLoading ? (
                    <ReportFormSkeleton />
                ) : (
                    <form
                        onSubmit={review}
                        className="
                            grid
                            gap-6
                            xl:grid-cols-[1fr_380px]
                        "
                    >

                        {/* ------------------------------------------
                            Complaint Details
                        ------------------------------------------ */}

                        <div className="panel p-5 sm:p-7">

                            <h2 className="text-xl font-bold">
                                Describe Your Issue
                            </h2>


                            <div className="mt-6 grid gap-5">

                                {/* Title */}
                                <Label text="Complaint title">

                                    <input
                                        className="field"
                                        value={
                                            form.title
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            update(
                                                "title",
                                                event.target.value
                                            )
                                        }
                                        placeholder="
                                            e.g. Large pothole on main road
                                        "
                                    />

                                </Label>


                                {/* Description */}
                                <Label text="Description">

                                    <textarea
                                        className="
                                            field
                                            min-h-32
                                            resize-y
                                        "
                                        value={
                                            form.description
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            update(
                                                "description",
                                                event.target.value
                                            )
                                        }
                                        placeholder="
                                            Describe the problem,
                                            impact and safety concerns...
                                        "
                                    />

                                </Label>


                                {/* Category + Sub-category */}
                                <div
                                    className="
                                        grid
                                        gap-4
                                        sm:grid-cols-2
                                    "
                                >

                                    <Label text="Category">

                                        <select
                                            className="field"
                                            value={
                                                form.category
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateCategory(
                                                    event.target.value
                                                )
                                            }
                                            disabled={
                                                !categories.length
                                            }
                                        >

                                            <option value="">
                                                {categories.length
                                                    ? "Select category"
                                                    : "No categories available"}
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

                                    </Label>


                                    <Label text="Sub-category">

                                        <select
                                            className="field"
                                            value={
                                                form.subcategory
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                update(
                                                    "subcategory",
                                                    event.target.value
                                                )
                                            }
                                        >

                                            <option value="">
                                                General
                                            </option>


                                            {selectedCategory
                                                ?.subCategories
                                                ?.map(
                                                    (
                                                        subcategory
                                                    ) => (
                                                        <option
                                                            key={
                                                                subcategory
                                                            }
                                                            value={
                                                                subcategory
                                                            }
                                                        >
                                                            {
                                                                subcategory
                                                            }
                                                        </option>
                                                    )
                                                )}

                                        </select>

                                    </Label>

                                </div>


                                {/* Priority */}
                                <Label text="Priority">

                                    <div
                                        className="
                                            grid
                                            grid-cols-2
                                            gap-2
                                            sm:grid-cols-4
                                        "
                                    >
                                        {[
                                            "low",
                                            "medium",
                                            "high",
                                            "critical",
                                        ].map(
                                            (
                                                priority
                                            ) => (
                                                <button
                                                    type="button"
                                                    key={
                                                        priority
                                                    }
                                                    onClick={() =>
                                                        update(
                                                            "priority",
                                                            priority
                                                        )
                                                    }
                                                    className={`
                                                        rounded-md
                                                        border
                                                        p-2
                                                        text-sm
                                                        font-semibold
                                                        ${
                                                            form.priority ===
                                                            priority
                                                                ? "border-primary bg-primary-soft text-primary"
                                                                : "bg-card"
                                                        }
                                                    `}
                                                >
                                                    {pretty(
                                                        priority
                                                    )}
                                                </button>
                                            )
                                        )}
                                    </div>

                                </Label>


                                {/* Evidence */}
                                <Label text="Evidence">

                                    <FileUpload
                                        onChange={(
                                            selected
                                        ) => {
                                            if (
                                                selected
                                            ) {
                                                setFiles(
                                                    (
                                                        previous
                                                    ) => [
                                                        ...previous,
                                                        selected,
                                                    ]
                                                );
                                            }
                                        }}
                                    />


                                    {files.length > 0 && (
                                        <div
                                            className="
                                                mt-2
                                                space-y-1
                                            "
                                        >
                                            {files.map(
                                                (
                                                    file,
                                                    index
                                                ) => (
                                                    <div
                                                        key={`${file.name}-${index}`}
                                                        className="
                                                            rounded-md
                                                            bg-success-soft
                                                            px-3
                                                            py-2
                                                            text-xs
                                                            font-medium
                                                            text-success
                                                        "
                                                    >
                                                        {
                                                            file.name
                                                        }
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}

                                </Label>

                            </div>

                        </div>


                        {/* ------------------------------------------
                            Location Section
                        ------------------------------------------ */}

                        <div className="space-y-6">

                            <div className="panel p-5">

                                <h2 className="font-bold">
                                    Location
                                </h2>


                                <div className="mt-4 space-y-4">

                                    {/* Address */}
                                    <Label text="Address">

                                        <input
                                            className="field"
                                            value={
                                                form.address
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                update(
                                                    "address",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="
                                                Street / ward / area
                                            "
                                        />

                                    </Label>


                                    {/* Coordinates */}
                                    <div
                                        className="
                                            grid
                                            grid-cols-2
                                            gap-3
                                        "
                                    >

                                        <Label text="Latitude">

                                            <input
                                                className="field"
                                                value={
                                                    form.lat
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    update(
                                                        "lat",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="28.6139"
                                            />

                                        </Label>


                                        <Label text="Longitude">

                                            <input
                                                className="field"
                                                value={
                                                    form.lng
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    update(
                                                        "lng",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="77.2090"
                                            />

                                        </Label>

                                    </div>


                                    {/* Current Location */}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={
                                            useCurrentLocation
                                        }
                                    >
                                        <LocateFixed />

                                        Use Current Location
                                    </Button>


                                    <MapPreview />

                                </div>

                            </div>


                            {/* Review Button */}
                            <Button
                                size="lg"
                                className="w-full"
                                disabled={
                                    !categories.length ||
                                    analysisLoading
                                }
                            >
                                {analysisLoading
                                    ? "Analyzing..."
                                    : "Review Complaint"}

                                {!analysisLoading && (
                                    <ArrowRight />
                                )}
                            </Button>

                        </div>

                    </form>
                )
            )}


            {/* ==================================================
                Step 2 - Review Complaint
            ================================================== */}

            {step === 2 && (
                <div
                    className="
                        grid
                        gap-6
                        xl:grid-cols-[1fr_380px]
                    "
                >

                    {/* ------------------------------------------
                        Complaint Review
                    ------------------------------------------ */}

                    <div className="panel p-6">

                        <h2 className="text-xl font-bold">
                            Review Complaint
                        </h2>


                        <p
                            className="
                                mt-1
                                text-sm
                                text-muted-foreground
                            "
                        >
                            Confirm the details before
                            submitting.
                        </p>


                        <div
                            className="
                                mt-6
                                border-y
                                py-5
                            "
                        >

                            <h3 className="text-lg font-semibold">
                                {form.title}
                            </h3>


                            <p
                                className="
                                    mt-2
                                    text-sm
                                    leading-6
                                    text-muted-foreground
                                "
                            >
                                {form.description}
                            </p>

                        </div>


                        {/* Complaint Metrics */}
                        <div
                            className="
                                mt-5
                                grid
                                gap-5
                                sm:grid-cols-2
                            "
                        >

                            <Metric
                                label="Category"
                                value={
                                    selectedCategory?.name ||
                                    analysis?.suggestedCategory ||
                                    "—"
                                }
                            />


                            <Metric
                                label="Sub-category"
                                value={
                                    form.subcategory ||
                                    "General"
                                }
                            />


                            <Metric
                                label="Suggested department"
                                value={
                                    analysis?.suggestedDepartment ||
                                    selectedCategory
                                        ?.department?.name ||
                                    "—"
                                }
                            />


                            <Metric
                                label="AI priority"
                                value={pretty(
                                    analysis
                                        ?.suggestedPriority ||
                                    form.priority
                                )}
                            />


                            <Metric
                                label="Location"
                                value={
                                    form.address ||
                                    "Not provided"
                                }
                            />


                            <Metric
                                label="Evidence"
                                value={`${files.length} file(s)`}
                            />

                        </div>

                    </div>


                    {/* ------------------------------------------
                        AI Analysis
                    ------------------------------------------ */}

                    <div className="space-y-5">

                        {analysisLoading ? (
                            <AIAnalysisSkeleton />
                        ) : (
                            <div
                                className="
                                    rounded-lg
                                    border
                                    border-primary/20
                                    bg-primary-soft
                                    p-5
                                "
                            >

                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-2
                                        text-primary
                                    "
                                >

                                    <BrainCircuit className="size-5" />

                                    <h2 className="font-bold">
                                        AI Analysis
                                    </h2>

                                </div>


                                <p
                                    className="
                                        mt-2
                                        text-xs
                                        text-muted-foreground
                                    "
                                >
                                    {error ||
                                        analysis?.reason ||
                                        "Analysis completed."}
                                </p>


                                <div className="mt-5 space-y-4">

                                    <Metric
                                        label="Suggested Category"
                                        value={
                                            analysis
                                                ?.suggestedCategory ||
                                            "—"
                                        }
                                    />


                                    <Metric
                                        label="Suggested Department"
                                        value={
                                            analysis
                                                ?.suggestedDepartment ||
                                            "—"
                                        }
                                    />


                                    {/* Suggested Priority */}
                                    <div>

                                        <p className="text-xs text-muted-foreground">
                                            Suggested Priority
                                        </p>


                                        <div className="mt-1">

                                            <PriorityText
                                                priority={pretty(
                                                    analysis
                                                        ?.suggestedPriority ||
                                                    form.priority
                                                )}
                                            />

                                        </div>

                                    </div>


                                    {/* Confidence */}
                                    <div>

                                        <p className="text-xs text-muted-foreground">
                                            Confidence
                                        </p>


                                        <div
                                            className="
                                                mt-2
                                                h-2
                                                rounded-full
                                                bg-card
                                            "
                                        >

                                            <div
                                                className="
                                                    h-2
                                                    rounded-full
                                                    bg-primary
                                                "
                                                style={{
                                                    width: `${Math.round(
                                                        (
                                                            analysis?.confidence ||
                                                            0
                                                        ) * 100
                                                    )}%`,
                                                }}
                                            />

                                        </div>


                                        <p
                                            className="
                                                mt-1
                                                text-right
                                                text-xs
                                                font-bold
                                                text-primary
                                            "
                                        >
                                            {Math.round(
                                                (
                                                    analysis?.confidence ||
                                                    0
                                                ) * 100
                                            )}
                                            %
                                        </p>

                                    </div>


                                    {/* Duplicate Warning */}
                                    {analysis?.isDuplicate && (
                                        <div
                                            className="
                                                rounded-md
                                                border
                                                border-warning/30
                                                bg-warning/10
                                                p-3
                                                text-xs
                                                font-medium
                                            "
                                        >
                                            A similar active complaint
                                            was detected. Your complaint
                                            can still be submitted for
                                            review.
                                        </div>
                                    )}

                                </div>

                            </div>
                        )}


                        {/* ------------------------------------------
                            Review Actions
                        ------------------------------------------ */}

                        <div className="flex gap-3">

                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() =>
                                    setStep(1)
                                }
                                disabled={
                                    actionLoading
                                }
                            >
                                <ArrowLeft />

                                Edit
                            </Button>


                            <Button
                                className="flex-1"
                                onClick={submit}
                                disabled={
                                    actionLoading ||
                                    analysisLoading
                                }
                            >
                                {actionLoading
                                    ? "Submitting..."
                                    : "Submit"}
                            </Button>

                        </div>

                    </div>

                </div>
            )}


            {/* ==================================================
                Step 3 - Submitted
            ================================================== */}

            {step === 3 && submitted && (
                <div
                    className="
                        mx-auto
                        max-w-2xl
                        panel
                        p-7
                        text-center
                        sm:p-10
                    "
                >

                    {/* Success Icon */}
                    <span
                        className="
                            mx-auto
                            flex
                            size-16
                            items-center
                            justify-center
                            rounded-full
                            bg-success-soft
                            text-success
                        "
                    >
                        <CheckCircle2 className="size-8" />
                    </span>


                    <h2
                        className="
                            mt-5
                            font-display
                            text-3xl
                            font-bold
                        "
                    >
                        Complaint Submitted Successfully!
                    </h2>


                    <p
                        className="
                            mt-2
                            text-muted-foreground
                        "
                    >
                        Your issue has been sent to the
                        appropriate department.
                    </p>


                    {/* Complaint Summary */}
                    <div
                        className="
                            mt-7
                            rounded-lg
                            border
                            bg-muted/40
                            p-5
                            text-left
                        "
                    >

                        <Metric
                            label="Complaint ID"
                            value={
                                submitted.complaintId
                            }
                        />


                        <div
                            className="
                                mt-5
                                grid
                                gap-4
                                sm:grid-cols-3
                            "
                        >

                            <Metric
                                label="Submitted"
                                value={new Date(
                                    submitted.createdAt
                                ).toLocaleString()}
                            />


                            <Metric
                                label="Department"
                                value={
                                    submitted
                                        .department
                                        ?.name ||
                                    "Unassigned"
                                }
                            />


                            <Metric
                                label="Status"
                                value={pretty(
                                    submitted.status
                                )}
                            />

                        </div>

                    </div>


                    {/* Navigation Actions */}
                    <div
                        className="
                            mt-6
                            flex
                            flex-col
                            gap-3
                            sm:flex-row
                            sm:justify-center
                        "
                    >

                        <Button
                            onClick={() =>
                                navigate(
                                    `/complaints/${submitted._id}`
                                )
                            }
                        >
                            Track this complaint

                            <ArrowRight />
                        </Button>


                        <Button
                            variant="outline"
                            onClick={() =>
                                navigate(
                                    "/complaints"
                                )
                            }
                        >
                            My Complaints
                        </Button>

                    </div>

                </div>
            )}

        </SmartShell>
    );
}