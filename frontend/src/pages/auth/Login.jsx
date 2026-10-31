import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import {
    Building2,
    CheckCircle2,
    LockKeyhole,
    Mail,
    ShieldCheck,
} from 'lucide-react';

import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';

import { loginUser } from '@/redux/authSlice';

import { Button } from '@/components/ui/button';
import { SmartShell } from '@/components/AppShell';


// Reusable input field
function Field({
    icon: Icon,
    label,
    value,
    ...props
}) {
    const hasValue = value?.length > 0;

    return (
        <label className="block">

            <span className="mb-1.5 block text-sm font-medium">
                {label}
            </span>


            <span className="relative block">

                {!hasValue && (
                    <Icon
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
                    {...props}
                    value={value}
                    className={`field h-10 ${
                        hasValue ? 'pl-3' : 'pl-9'
                    }`}
                    required
                />

            </span>

        </label>
    );
}


export default function LoginPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();


    // Auth state
    const {
        loading,
        error,
    } = useSelector((state) => state.auth);


    // Login form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');


    // Redirect user according to role
    const redirectFor = (role) => {
        if (role === 'admin') {
            return '/admin';
        }

        if (role === 'department') {
            return '/department';
        }

        return location.state?.from || '/dashboard';
    };


    // Handle login
    const submit = async (e) => {
        e.preventDefault();

        const result = await dispatch(
            loginUser({
                email,
                password,
            })
        );


        if (loginUser.fulfilled.match(result)) {
            toast.success(
                `Welcome back, ${
                    result.payload.user?.name || 'User'
                }`
            );

            navigate(
                redirectFor(
                    result.payload.user?.role
                ),
                {
                    replace: true,
                }
            );
        } else {
            toast.error(
                result.payload || 'Login failed'
            );
        }
    };


    return (
        <SmartShell publicPage>

            <main className="min-h-[calc(100vh-68px)] bg-auth px-4 py-12">

                <div
                    className="
                        mx-auto
                        grid
                        max-w-5xl
                        overflow-hidden
                        rounded-xl
                        border
                        bg-card
                        shadow-civic
                        lg:grid-cols-[0.85fr_1.15fr]
                    "
                >

                    {/* Left Information Panel */}
                    <aside
                        className="
                            hidden
                            bg-civic-dark
                            p-10
                            text-civic-dark-foreground
                            lg:flex
                            lg:flex-col
                            lg:justify-between
                        "
                    >

                        <div>

                            <div
                                className="
                                    flex
                                    size-12
                                    items-center
                                    justify-center
                                    rounded-lg
                                    bg-civic-dark-accent
                                "
                            >
                                <Building2 />
                            </div>


                            <h2
                                className="
                                    mt-8
                                    font-display
                                    text-3xl
                                    font-bold
                                "
                            >
                                Your voice shapes your city.
                            </h2>


                            <p
                                className="
                                    mt-4
                                    leading-7
                                    text-civic-dark-muted
                                "
                            >
                                Access complaints, updates, and
                                civic performance from one trusted
                                workspace.
                            </p>

                        </div>


                        {/* Features */}
                        <div
                            className="
                                space-y-3
                                text-sm
                                text-civic-dark-muted
                            "
                        >

                            {[
                                'Track every complaint',
                                'Receive status notifications',
                                'Verify completed work',
                            ].map((text) => (
                                <div
                                    key={text}
                                    className="flex items-center gap-2"
                                >
                                    <CheckCircle2
                                        className="
                                            size-4
                                            text-civic-dark-accent
                                        "
                                    />

                                    {text}
                                </div>
                            ))}

                        </div>

                    </aside>


                    {/* Login Section */}
                    <div className="p-6 sm:p-10">

                        <p className="text-sm font-semibold text-primary">
                            Welcome back
                        </p>


                        <h1
                            className="
                                mt-2
                                font-display
                                text-3xl
                                font-bold
                            "
                        >
                            Sign in to CivicConnect
                        </h1>


                        <p
                            className="
                                mt-2
                                text-sm
                                text-muted-foreground
                            "
                        >
                            Use the account stored in your
                            CivicConnect database.
                        </p>


                        {/* Error Message */}
                        {error && (
                            <div
                                className="
                                    mt-4
                                    rounded-md
                                    border
                                    border-destructive/20
                                    bg-destructive/5
                                    p-3
                                    text-sm
                                    text-destructive
                                "
                            >
                                {error}
                            </div>
                        )}


                        {/* Login Form */}
                        <form
                            onSubmit={submit}
                            className="mt-7 space-y-4"
                        >

                            <Field
                                icon={Mail}
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                placeholder="rahul@example.com"
                            />


                            <Field
                                icon={LockKeyhole}
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                placeholder="••••••••"
                            />


                            <Button
                                className="w-full"
                                size="lg"
                                disabled={loading}
                            >
                                {loading
                                    ? 'Signing in...'
                                    : 'Login'}
                            </Button>

                        </form>


                        {/* Role Based Access Information */}
                        <div
                            className="
                                mt-6
                                rounded-lg
                                border
                                bg-muted/30
                                p-4
                                text-sm
                            "
                        >

                            <div className="flex items-start gap-3">

                                <ShieldCheck
                                    className="
                                        mt-0.5
                                        size-5
                                        text-primary
                                    "
                                />


                                <div>

                                    <p className="font-semibold">
                                        Role-based access
                                    </p>

                                    <p
                                        className="
                                            mt-1
                                            text-muted-foreground
                                        "
                                    >
                                        Your dashboard is selected
                                        automatically from the role
                                        stored in MongoDB.
                                    </p>

                                </div>

                            </div>

                        </div>


                        {/* Register Link */}
                        <p
                            className="
                                mt-6
                                text-center
                                text-sm
                                text-muted-foreground
                            "
                        >
                            New to CivicConnect?{' '}

                            <Link
                                to="/register"
                                className="font-semibold text-primary"
                            >
                                Create account
                            </Link>
                        </p>

                    </div>

                </div>

            </main>

        </SmartShell>
    );
}