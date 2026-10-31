import { Link } from 'react-router-dom';

import {
    BarChart3,
    BrainCircuit,
    CircleCheck,
    FileCheck2,
    Network,
    Search,
} from 'lucide-react';

import {
    Footer,
    SmartShell,
} from '@/components/AppShell';

import { Button } from '@/components/ui/button';


// CivicConnect features
const features = [
    [
        'Transparent tracking',
        'Every status change is recorded and visible.',
        Search,
    ],
    [
        'Evidence-based reporting',
        'Attach photo or video evidence to a complaint.',
        FileCheck2,
    ],
    [
        'Department routing',
        'Category-to-department mapping sends issues to the right team.',
        Network,
    ],
    [
        'Resolution verification',
        'Citizens verify whether the resolution actually worked.',
        CircleCheck,
    ],
    [
        'Public analytics',
        'Aggregated complaint trends support transparency.',
        BarChart3,
    ],
    [
        'AI-assisted triage',
        'Complaint text can be analyzed for category and priority suggestions.',
        BrainCircuit,
    ],
];


export default function About() {
    return (
        <SmartShell publicPage>

            <main>

                {/* Hero Section */}
                <section
                    className="
                        bg-civic-dark
                        py-20
                        text-civic-dark-foreground
                    "
                >
                    <div
                        className="
                            mx-auto
                            max-w-5xl
                            px-4
                            text-center
                        "
                    >

                        <p
                            className="
                                text-sm
                                font-bold
                                uppercase
                                tracking-widest
                                text-civic-dark-accent
                            "
                        >
                            About CivicConnect
                        </p>


                        <h1
                            className="
                                mt-4
                                font-display
                                text-4xl
                                font-bold
                                sm:text-5xl
                            "
                        >
                            Connecting citizens and departments
                            through accountable action.
                        </h1>


                        <p
                            className="
                                mx-auto
                                mt-6
                                max-w-3xl
                                text-lg
                                leading-8
                                text-civic-dark-muted
                            "
                        >
                            CivicConnect is a grievance and
                            transparency platform designed around
                            a clear workflow: report, categorize,
                            assign, track, resolve and verify.
                        </p>

                    </div>
                </section>


                {/* Workflow and Features */}
                <section className="section">

                    <div className="section-inner">

                        {/* Civic Workflow */}
                        <div
                            className="
                                grid
                                grid-cols-2
                                gap-3
                                md:grid-cols-6
                            "
                        >
                            {[
                                'Report',
                                'Categorize',
                                'Assign',
                                'Track',
                                'Resolve',
                                'Verify',
                            ].map((step, index) => (
                                <div
                                    key={step}
                                    className="
                                        rounded-lg
                                        border
                                        bg-card
                                        p-4
                                        text-center
                                    "
                                >
                                    <span
                                        className="
                                            mx-auto
                                            flex
                                            size-8
                                            items-center
                                            justify-center
                                            rounded-full
                                            bg-primary-soft
                                            text-sm
                                            font-bold
                                            text-primary
                                        "
                                    >
                                        {index + 1}
                                    </span>

                                    <p className="mt-3 font-semibold">
                                        {step}
                                    </p>
                                </div>
                            ))}
                        </div>


                        {/* About and Features */}
                        <div
                            className="
                                mt-16
                                grid
                                gap-10
                                lg:grid-cols-[0.8fr_1.2fr]
                            "
                        >

                            {/* Description */}
                            <div>

                                <h2
                                    className="
                                        font-display
                                        text-3xl
                                        font-bold
                                    "
                                >
                                    Designed for a complete civic
                                    service journey.
                                </h2>


                                <p
                                    className="
                                        mt-4
                                        leading-7
                                        text-muted-foreground
                                    "
                                >
                                    CivicConnect separates structured
                                    complaint management from
                                    social-media posting. Citizens
                                    submit issues with evidence,
                                    responsible teams work them
                                    through defined states,
                                    departments attach resolution
                                    proof, and citizens verify the
                                    outcome.
                                </p>


                                <Button
                                    asChild
                                    className="mt-6"
                                >
                                    <Link to="/track">
                                        Track a complaint
                                    </Link>
                                </Button>

                            </div>


                            {/* Features */}
                            <div
                                className="
                                    grid
                                    gap-4
                                    sm:grid-cols-2
                                "
                            >
                                {features.map(
                                    ([
                                        title,
                                        text,
                                        Icon,
                                    ]) => (
                                        <div
                                            key={title}
                                            className="
                                                panel
                                                p-5
                                            "
                                        >

                                            <Icon
                                                className="
                                                    size-5
                                                    text-primary
                                                "
                                            />


                                            <h3
                                                className="
                                                    mt-3
                                                    font-semibold
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
                                                {text}
                                            </p>

                                        </div>
                                    )
                                )}
                            </div>

                        </div>

                    </div>

                </section>

            </main>


            {/* Footer */}
            <Footer />

        </SmartShell>
    );
}