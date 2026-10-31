import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import {
    ArrowRight,
    BarChart3,
    BrainCircuit,
    CheckCircle2,
    CircleCheck,
    Droplets,
    FileCheck2,
    Lightbulb,
    Network,
    Search,
    ShieldCheck,
    Sparkles,
    Trash2,
    Waves,
} from 'lucide-react';

import cityVisual from '@/assets/civic-city.jpg';

import { fetchPublicAnalytics } from '@/redux/analyticsSlice';
import { fetchCategories } from '@/redux/masterSlice';

import {
    Footer,
    SmartShell,
} from '@/components/AppShell';

import { Button } from '@/components/ui/button';


// Issue icons
const issueIcons = {
    road: FileCheck2,
    water: Droplets,
    electricity: Lightbulb,
    sanitation: Trash2,
    drainage: Waves,
    streetlight: Sparkles,
    other: ShieldCheck,
};


// CivicConnect features
const features = [
    [
        'Transparent tracking',
        'Every status change is recorded from submission to verification.',
        Search,
    ],
    [
        'Evidence-based reporting',
        'Attach photos or videos to support the complaint.',
        FileCheck2,
    ],
    [
        'Department routing',
        'Categories are mapped to responsible departments.',
        Network,
    ],
    [
        'Resolution verification',
        'Citizens can confirm whether completed work solved the issue.',
        CircleCheck,
    ],
    [
        'Public analytics',
        'Review complaint trends and service activity.',
        BarChart3,
    ],
    [
        'AI-assisted categorization',
        'Complaint text is analyzed to suggest category, priority and department.',
        BrainCircuit,
    ],
];


// Section title component
function SectionTitle({ label, title }) {
    return (
        <div>
            <p
                className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-widest
                    text-primary
                "
            >
                {label}
            </p>

            <h2
                className="
                    mt-2
                    font-display
                    text-3xl
                    font-bold
                "
            >
                {title}
            </h2>
        </div>
    );
}


export default function Home() {
    const dispatch = useDispatch();

    // Analytics state
    const { public: data } = useSelector(
        (state) => state.analytics
    );

    // Categories state
    const { categories } = useSelector(
        (state) => state.master
    );


    // Fetch public analytics and categories
    useEffect(() => {
        dispatch(fetchPublicAnalytics());

        if (!categories.length) {
            dispatch(fetchCategories());
        }
    }, [
        dispatch,
        categories.length,
    ]);


    // Analytics data
    const stats = data || {};


    return (
        <SmartShell publicPage>

            <main>

                {/* Hero Section */}
                <section
                    className="
                        border-b
                        bg-hero
                    "
                >
                    <div
                        className="
                            mx-auto
                            grid
                            min-h-[620px]
                            max-w-7xl
                            items-center
                            gap-10
                            px-4
                            py-14
                            sm:px-6
                            lg:grid-cols-[0.9fr_1.1fr]
                            lg:py-20
                        "
                    >

                        {/* Hero Content */}
                        <div>

                            <div
                                className="
                                    mb-5
                                    inline-flex
                                    items-center
                                    gap-2
                                    rounded-full
                                    border
                                    border-primary/20
                                    bg-primary-soft
                                    px-3
                                    py-1.5
                                    text-xs
                                    font-semibold
                                    text-primary
                                "
                            >
                                <ShieldCheck className="size-4" />

                                Civic grievance management
                            </div>


                            <h1
                                className="
                                    max-w-2xl
                                    font-display
                                    text-5xl
                                    font-bold
                                    leading-[1.08]
                                    text-foreground
                                    sm:text-6xl
                                "
                            >
                                Make Your City Better,
                                One Complaint at a Time.
                            </h1>


                            <p
                                className="
                                    mt-6
                                    max-w-xl
                                    text-lg
                                    leading-8
                                    text-muted-foreground
                                "
                            >
                                Report civic issues, track progress,
                                and create a transparent resolution
                                workflow for your community.
                            </p>


                            {/* Hero Actions */}
                            <div
                                className="
                                    mt-8
                                    flex
                                    flex-wrap
                                    gap-3
                                "
                            >
                                <Button
                                    asChild
                                    size="lg"
                                >
                                    <Link to="/report">
                                        Report an Issue
                                        <ArrowRight />
                                    </Link>
                                </Button>


                                <Button
                                    asChild
                                    variant="outline"
                                    size="lg"
                                >
                                    <Link to="/track">
                                        Track Complaint
                                    </Link>
                                </Button>
                            </div>

                        </div>


                        {/* City Visual */}
                        <div className="relative">

                            <img
                                src={cityVisual}
                                alt="CivicConnect city reporting"
                                width={1536}
                                height={1024}
                                className="
                                    w-full
                                    rounded-xl
                                    border
                                    bg-card
                                    object-cover
                                    shadow-civic
                                "
                            />


                            {/* Workflow Badge */}
                            <div
                                className="
                                    absolute
                                    bottom-5
                                    left-5
                                    right-5
                                    flex
                                    items-center
                                    gap-3
                                    rounded-lg
                                    border
                                    bg-card/95
                                    p-4
                                    shadow-lg
                                    backdrop-blur
                                    sm:right-auto
                                "
                            >
                                <span
                                    className="
                                        flex
                                        size-10
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-success-soft
                                        text-success
                                    "
                                >
                                    <CheckCircle2 className="size-5" />
                                </span>


                                <span>
                                    <strong
                                        className="
                                            block
                                            text-sm
                                        "
                                    >
                                        Report → Route → Resolve → Verify
                                    </strong>

                                    <small
                                        className="
                                            text-muted-foreground
                                        "
                                    >
                                        One workflow for citizen and
                                        department collaboration
                                    </small>
                                </span>
                            </div>

                        </div>

                    </div>
                </section>


                {/* How CivicConnect Works */}
                <section className="section">

                    <div className="section-inner">

                        <SectionTitle
                            label="A clear path to resolution"
                            title="How CivicConnect Works"
                        />


                        <div
                            className="
                                mt-10
                                grid
                                gap-5
                                md:grid-cols-4
                            "
                        >
                            {[
                                [
                                    '01',
                                    'Report',
                                    'Submit a civic issue with description, location and evidence.',
                                ],
                                [
                                    '02',
                                    'Categorize',
                                    'Smart analysis suggests a category, priority and responsible department.',
                                ],
                                [
                                    '03',
                                    'Track',
                                    'Monitor every status change through the complaint timeline.',
                                ],
                                [
                                    '04',
                                    'Resolve',
                                    'Departments upload proof and citizens verify the result.',
                                ],
                            ].map(([number, title, description]) => (
                                <div
                                    key={title}
                                    className="step-card"
                                >
                                    <span
                                        className="
                                            text-xs
                                            font-bold
                                            text-primary
                                        "
                                    >
                                        STEP {number}
                                    </span>


                                    <h3
                                        className="
                                            mt-4
                                            text-lg
                                            font-bold
                                        "
                                    >
                                        {title}
                                    </h3>


                                    <p
                                        className="
                                            mt-2
                                            text-sm
                                            leading-6
                                            text-muted-foreground
                                        "
                                    >
                                        {description}
                                    </p>
                                </div>
                            ))}
                        </div>

                    </div>

                </section>


                {/* Live System Overview */}
                <section
                    className="
                        border-y
                        bg-civic-dark
                        py-12
                        text-civic-dark-foreground
                    "
                >
                    <div
                        className="
                            mx-auto
                            max-w-7xl
                            px-4
                            sm:px-6
                        "
                    >

                        <div className="mb-7">

                            <p
                                className="
                                    text-sm
                                    font-semibold
                                    text-civic-dark-accent
                                "
                            >
                                Live system overview
                            </p>


                            <h2
                                className="
                                    mt-1
                                    font-display
                                    text-2xl
                                    font-bold
                                "
                            >
                                Civic impact at a glance
                            </h2>

                        </div>


                        <div
                            className="
                                grid
                                grid-cols-2
                                gap-px
                                overflow-hidden
                                rounded-lg
                                bg-civic-dark-border
                                lg:grid-cols-4
                            "
                        >
                            {[
                                [
                                    stats.totalComplaints ?? 0,
                                    'Complaints Reported',
                                ],
                                [
                                    stats.resolvedComplaints ?? 0,
                                    'Issues Resolved',
                                ],
                                [
                                    stats.byDepartment?.length ?? 0,
                                    'Departments with complaints',
                                ],
                                [
                                    `${stats.resolutionRate ?? 0}%`,
                                    'Resolution Rate',
                                ],
                            ].map(([value, label]) => (
                                <div
                                    key={label}
                                    className="
                                        bg-civic-dark
                                        p-6
                                    "
                                >
                                    <div
                                        className="
                                            text-3xl
                                            font-bold
                                        "
                                    >
                                        {value}
                                    </div>

                                    <div
                                        className="
                                            mt-1
                                            text-sm
                                            text-civic-dark-muted
                                        "
                                    >
                                        {label}
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </section>


                {/* Civic Issues */}
                <section
                    className="
                        section
                        bg-muted/40
                    "
                >
                    <div className="section-inner">

                        <SectionTitle
                            label="Common service areas"
                            title="Civic Issues"
                        />


                        <div
                            className="
                                mt-10
                                grid
                                grid-cols-2
                                gap-4
                                md:grid-cols-3
                                lg:grid-cols-6
                            "
                        >
                            {(categories.length
                                ? categories
                                : []
                            )
                                .slice(0, 6)
                                .map((category) => {
                                    const Icon =
                                        issueIcons[
                                            category.department?.category
                                        ] || ShieldCheck;

                                    const count =
                                        data?.byCategory?.find(
                                            (item) =>
                                                item.categoryId ===
                                                category._id
                                        )?.count || 0;

                                    return (
                                        <Link
                                            key={category._id}
                                            to="/report"
                                            className="
                                                panel
                                                group
                                                p-5
                                                transition
                                                hover:-translate-y-1
                                                hover:border-primary/30
                                                hover:shadow-civic
                                            "
                                        >
                                            <span
                                                className="
                                                    flex
                                                    size-10
                                                    items-center
                                                    justify-center
                                                    rounded-lg
                                                    bg-primary-soft
                                                    text-primary
                                                "
                                            >
                                                <Icon className="size-5" />
                                            </span>


                                            <h3
                                                className="
                                                    mt-4
                                                    font-semibold
                                                "
                                            >
                                                {category.name}
                                            </h3>


                                            <p
                                                className="
                                                    mt-1
                                                    text-xs
                                                    text-muted-foreground
                                                "
                                            >
                                                {count} complaints
                                            </p>
                                        </Link>
                                    );
                                })}
                        </div>

                    </div>
                </section>


                {/* Why CivicConnect */}
                <section className="section">

                    <div className="section-inner">

                        <SectionTitle
                            label="Built for accountability"
                            title="Why CivicConnect?"
                        />


                        <div
                            className="
                                mt-10
                                grid
                                gap-x-12
                                gap-y-8
                                md:grid-cols-2
                                lg:grid-cols-3
                            "
                        >
                            {features.map(
                                ([title, text, Icon]) => (
                                    <div
                                        key={title}
                                        className="
                                            flex
                                            gap-4
                                        "
                                    >
                                        <span
                                            className="
                                                flex
                                                size-10
                                                shrink-0
                                                items-center
                                                justify-center
                                                rounded-lg
                                                bg-secondary
                                                text-primary
                                            "
                                        >
                                            <Icon className="size-5" />
                                        </span>


                                        <div>

                                            <h3 className="font-semibold">
                                                {title}
                                            </h3>


                                            <p
                                                className="
                                                    mt-1
                                                    text-sm
                                                    leading-6
                                                    text-muted-foreground
                                                "
                                            >
                                                {text}
                                            </p>

                                        </div>
                                    </div>
                                )
                            )}
                        </div>

                    </div>

                </section>


                {/* Final CTA */}
                <section
                    className="
                        border-t
                        bg-primary
                        py-14
                        text-primary-foreground
                    "
                >
                    <div
                        className="
                            mx-auto
                            flex
                            max-w-7xl
                            flex-col
                            items-start
                            justify-between
                            gap-6
                            px-4
                            sm:flex-row
                            sm:items-center
                            sm:px-6
                        "
                    >

                        <div>

                            <h2
                                className="
                                    font-display
                                    text-3xl
                                    font-bold
                                "
                            >
                                Have an issue? Report it now.
                            </h2>


                            <p
                                className="
                                    mt-2
                                    text-primary-foreground/80
                                "
                            >
                                A safer, cleaner city starts with
                                one clear report.
                            </p>

                        </div>


                        <Button
                            asChild
                            variant="secondary"
                            size="lg"
                        >
                            <Link to="/report">
                                Start a complaint
                                <ArrowRight />
                            </Link>
                        </Button>

                    </div>
                </section>

            </main>


            {/* Footer */}
            <Footer />

        </SmartShell>
    );
}