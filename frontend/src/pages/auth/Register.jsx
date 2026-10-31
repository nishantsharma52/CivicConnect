import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import {
    Building2,
    CheckCircle2,
    LockKeyhole,
    Mail,
    Phone,
    ShieldCheck,
    UserRound,
    UsersRound,
} from 'lucide-react';

import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';

import { registerUser } from '@/redux/authSlice';
import { fetchDepartments } from '@/redux/masterSlice';

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


export default function RegisterPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();


    // Auth state
    const {
        loading,
        error,
    } = useSelector((state) => state.auth);


    // Department state
    const {
        departments,
        loading: masterLoading,
        error: masterError,
    } = useSelector((state) => state.master);


    // Registration form
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'citizen',
        department: '',
    });


    // Fetch departments
    useEffect(() => {
        if (!departments.length) {
            dispatch(fetchDepartments());
        }
    }, [dispatch, departments.length]);


    // Update form field
    const update = (key, value) => {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    };


    // Handle registration
    const submit = async (e) => {
        e.preventDefault();


        // Check password confirmation
        if (form.password !== form.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }


        // Department account must have a department
        if (
            form.role === 'department' &&
            !form.department
        ) {
            toast.error(
                'Please select a department for the department account'
            );

            return;
        }


        // Registration payload
        const payload = {
            name: form.name,
            email: form.email,
            phone: form.phone,
            password: form.password,
            role: form.role,

            ...(form.role === 'department'
                ? {
                    department: form.department,
                }
                : {}),
        };


        // Register user
        const result = await dispatch(
            registerUser(payload)
        );


        if (registerUser.fulfilled.match(result)) {
            toast.success(
                'Account created successfully'
            );


            const role = result.payload.user?.role;


            navigate(
                role === 'admin'
                    ? '/admin'
                    : role === 'department'
                        ? '/department'
                        : '/dashboard',
                {
                    replace: true,
                }
            );
        } else {
            toast.error(
                result.payload || 'Registration failed'
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
                                Create your CivicConnect account.
                            </h2>


                            <p
                                className="
                                    mt-4
                                    leading-7
                                    text-civic-dark-muted
                                "
                            >
                                Choose your demo role and use the
                                same frontend with the real backend
                                workflow.
                            </p>

                        </div>


                        {/* Registration Features */}
                        <div
                            className="
                                space-y-3
                                text-sm
                                text-civic-dark-muted
                            "
                        >

                            {[
                                'Secure JWT login',
                                'Complaint tracking',
                                'Role-based dashboards',
                            ].map((item) => (
                                <div
                                    key={item}
                                    className="
                                        flex
                                        items-center
                                        gap-2
                                    "
                                >
                                    <CheckCircle2
                                        className="
                                            size-4
                                            text-civic-dark-accent
                                        "
                                    />

                                    {item}
                                </div>
                            ))}

                        </div>

                    </aside>


                    {/* Registration Section */}
                    <div className="p-6 sm:p-10">

                        <p
                            className="
                                text-sm
                                font-semibold
                                text-primary
                            "
                        >
                            Create your account
                        </p>


                        <h1
                            className="
                                mt-2
                                font-display
                                text-3xl
                                font-bold
                            "
                        >
                            Join CivicConnect
                        </h1>


                        <p
                            className="
                                mt-2
                                text-sm
                                text-muted-foreground
                            "
                        >
                            Select Citizen, Department Staff or
                            Admin for this local project/demo.
                        </p>


                        {/* Error Message */}
                        {(error || masterError) && (
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
                                {error || masterError}
                            </div>
                        )}


                        {/* Registration Form */}
                        <form
                            onSubmit={submit}
                            className="mt-7 space-y-4"
                        >

                            {/* Name */}
                            <Field
                                icon={UserRound}
                                label="Full name"
                                type="text"
                                value={form.name}
                                onChange={(e) =>
                                    update(
                                        'name',
                                        e.target.value
                                    )
                                }
                                placeholder="Your full name"
                            />


                            {/* Phone */}
                            <Field
                                icon={Phone}
                                label="Phone"
                                type="tel"
                                value={form.phone}
                                onChange={(e) =>
                                    update(
                                        'phone',
                                        e.target.value
                                    )
                                }
                                placeholder="9876543210"
                            />


                            {/* Email */}
                            <Field
                                icon={Mail}
                                label="Email"
                                type="email"
                                value={form.email}
                                onChange={(e) =>
                                    update(
                                        'email',
                                        e.target.value
                                    )
                                }
                                placeholder="you@example.com"
                            />


                            {/* Account Role */}
                            <label className="block">

                                <span
                                    className="
                                        mb-1.5
                                        block
                                        text-sm
                                        font-medium
                                    "
                                >
                                    Account role
                                </span>


                                <span className="grid gap-2 sm:grid-cols-3">

                                    {[
                                        {
                                            value: 'citizen',
                                            label: 'Citizen',
                                            icon: UserRound,
                                        },
                                        {
                                            value: 'department',
                                            label: 'Department',
                                            icon: UsersRound,
                                        },
                                        {
                                            value: 'admin',
                                            label: 'Admin',
                                            icon: ShieldCheck,
                                        },
                                    ].map(
                                        ({
                                            value,
                                            label,
                                            icon: Icon,
                                        }) => (
                                            <button
                                                type="button"
                                                key={value}
                                                onClick={() =>
                                                    update(
                                                        'role',
                                                        value
                                                    )
                                                }
                                                className={`
                                                    flex
                                                    items-center
                                                    justify-center
                                                    gap-2
                                                    rounded-lg
                                                    border
                                                    px-3
                                                    py-2.5
                                                    text-sm
                                                    font-semibold
                                                    transition
                                                    ${
                                                        form.role ===
                                                        value
                                                            ? 'border-primary bg-primary-soft text-primary'
                                                            : 'hover:bg-muted'
                                                    }
                                                `}
                                            >
                                                <Icon className="size-4" />

                                                {label}
                                            </button>
                                        )
                                    )}

                                </span>

                            </label>


                            {/* Department Selection */}
                            {form.role === 'department' && (
                                <label className="block">

                                    <span
                                        className="
                                            mb-1.5
                                            block
                                            text-sm
                                            font-medium
                                        "
                                    >
                                        Department
                                    </span>


                                    <select
                                        className="field"
                                        value={form.department}
                                        onChange={(e) =>
                                            update(
                                                'department',
                                                e.target.value
                                            )
                                        }
                                        disabled={
                                            masterLoading ||
                                            !departments.length
                                        }
                                        required
                                    >

                                        <option value="">
                                            {masterLoading
                                                ? 'Loading departments...'
                                                : departments.length
                                                    ? 'Select department'
                                                    : 'No departments available'}
                                        </option>


                                        {departments.map(
                                            (department) => (
                                                <option
                                                    key={department._id}
                                                    value={department._id}
                                                >
                                                    {department.name}
                                                </option>
                                            )
                                        )}

                                    </select>

                                </label>
                            )}


                            {/* Password */}
                            <Field
                                icon={LockKeyhole}
                                label="Password"
                                type="password"
                                value={form.password}
                                onChange={(e) =>
                                    update(
                                        'password',
                                        e.target.value
                                    )
                                }
                                placeholder="At least 6 characters"
                            />


                            {/* Confirm Password */}
                            <Field
                                icon={LockKeyhole}
                                label="Confirm password"
                                type="password"
                                value={form.confirmPassword}
                                onChange={(e) =>
                                    update(
                                        'confirmPassword',
                                        e.target.value
                                    )
                                }
                                placeholder="Repeat password"
                            />


                            {/* Submit Button */}
                            <Button
                                className="w-full"
                                size="lg"
                                disabled={
                                    loading ||
                                    (
                                        form.role ===
                                        'department' &&
                                        !departments.length
                                    )
                                }
                            >
                                {loading
                                    ? 'Creating account...'
                                    : 'Create Account'}
                            </Button>

                        </form>


                        {/* Login Link */}
                        <p
                            className="
                                mt-6
                                text-center
                                text-sm
                                text-muted-foreground
                            "
                        >
                            Already registered?{' '}

                            <Link
                                to="/login"
                                className="
                                    font-semibold
                                    text-primary
                                "
                            >
                                Sign in
                            </Link>
                        </p>

                    </div>

                </div>

            </main>

        </SmartShell>
    );
}