import { useEffect, useState } from "react";

import {
    LockKeyhole,
    Save,
    UserRound,
} from "lucide-react";

import {
    useDispatch,
    useSelector,
} from "react-redux";

import { toast } from "sonner";

import {
    fetchProfile,
    updateProfile,
    changePassword,
} from "@/redux/authSlice";

import {
    DashboardShell,
} from "@/components/AppShell";

import {
    Button,
} from "@/components/ui/button";

import {
    Metric,
    PageHeader,
    Skeleton,
} from "@/components/CivicUI";


// --------------------------------------------------
// Profile Skeleton
// --------------------------------------------------

function ProfileSkeleton() {
    return (
        <div className="grid gap-6 lg:grid-cols-2">

            {/* Personal Details Skeleton */}
            <div className="panel p-6">

                <div className="flex items-center gap-3">
                    <Skeleton className="size-5 rounded" />

                    <Skeleton className="h-5 w-36" />
                </div>


                <div className="mt-6 grid gap-5">

                    {/* Name */}
                    <div>
                        <Skeleton className="h-4 w-16" />

                        <Skeleton className="mt-2 h-10 w-full" />
                    </div>


                    {/* Phone */}
                    <div>
                        <Skeleton className="h-4 w-16" />

                        <Skeleton className="mt-2 h-10 w-full" />
                    </div>


                    {/* Email */}
                    <div>
                        <Skeleton className="h-3 w-12" />

                        <Skeleton className="mt-2 h-4 w-48" />
                    </div>


                    {/* Role */}
                    <div>
                        <Skeleton className="h-3 w-10" />

                        <Skeleton className="mt-2 h-4 w-24" />
                    </div>


                    {/* Save Button */}
                    <Skeleton className="h-10 w-full rounded-md" />
                </div>
            </div>


            {/* Password Skeleton */}
            <div className="panel p-6">

                <div className="flex items-center gap-3">
                    <Skeleton className="size-5 rounded" />

                    <Skeleton className="h-5 w-40" />
                </div>


                <div className="mt-6 grid gap-5">

                    {/* Current Password */}
                    <div>
                        <Skeleton className="h-4 w-32" />

                        <Skeleton className="mt-2 h-10 w-full" />
                    </div>


                    {/* New Password */}
                    <div>
                        <Skeleton className="h-4 w-28" />

                        <Skeleton className="mt-2 h-10 w-full" />
                    </div>


                    {/* Update Button */}
                    <Skeleton className="h-10 w-full rounded-md" />
                </div>
            </div>
        </div>
    );
}


// --------------------------------------------------
// Profile Page
// --------------------------------------------------

export default function Profile() {
    const dispatch = useDispatch();


    // --------------------------------------------------
    // Auth State
    // --------------------------------------------------

    const {
        user,
        loading,
    } = useSelector(
        (state) => state.auth
    );


    // --------------------------------------------------
    // Profile Form
    // --------------------------------------------------

    const [form, setForm] = useState({
        name: "",
        phone: "",
    });


    // --------------------------------------------------
    // Password Form
    // --------------------------------------------------

    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
    });


    // --------------------------------------------------
    // Load Profile
    // --------------------------------------------------

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || "",
                phone: user.phone || "",
            });

            return;
        }

        dispatch(
            fetchProfile()
        );
    }, [
        dispatch,
        user,
    ]);


    // --------------------------------------------------
    // Save Profile
    // --------------------------------------------------

    const save = async (event) => {
        event.preventDefault();

        const result =
            await dispatch(
                updateProfile(form)
            );

        if (
            updateProfile.fulfilled.match(
                result
            )
        ) {
            toast.success(
                "Profile updated"
            );
        } else {
            toast.error(
                result.payload ||
                    "Unable to update profile"
            );
        }
    };


    // --------------------------------------------------
    // Change Password
    // --------------------------------------------------

    const change = async (event) => {
        event.preventDefault();

        const result =
            await dispatch(
                changePassword(
                    passwords
                )
            );

        if (
            changePassword.fulfilled.match(
                result
            )
        ) {
            toast.success(
                "Password changed"
            );

            setPasswords({
                currentPassword: "",
                newPassword: "",
            });
        } else {
            toast.error(
                result.payload ||
                    "Unable to change password"
            );
        }
    };


    // --------------------------------------------------
    // Initial Profile Loading
    // --------------------------------------------------

    if (loading && !user) {
        return (
            <DashboardShell>

                <PageHeader
                    eyebrow="Account"
                    title="Profile"
                    description="Your account details are stored in the CivicConnect database."
                />

                <ProfileSkeleton />

            </DashboardShell>
        );
    }


    // --------------------------------------------------
    // Profile UI
    // --------------------------------------------------

    return (
        <DashboardShell>

            {/* --------------------------------------------------
                Page Header
            -------------------------------------------------- */}

            <PageHeader
                eyebrow="Account"
                title="Profile"
                description="Your account details are stored in the CivicConnect database."
            />


            {/* --------------------------------------------------
                Profile Sections
            -------------------------------------------------- */}

            <div className="grid gap-6 lg:grid-cols-2">

                {/* ==================================================
                    PERSONAL DETAILS
                ================================================== */}

                <form
                    onSubmit={save}
                    className="panel p-6"
                >

                    <div className="flex items-center gap-3">

                        <UserRound className="size-5 text-primary" />

                        <h2 className="font-bold">
                            Personal details
                        </h2>

                    </div>


                    <div className="mt-6 grid gap-4">

                        {/* Name */}
                        <label className="block">

                            <span className="mb-1.5 block text-sm font-medium">
                                Name
                            </span>

                            <input
                                className="field"
                                value={form.name}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        name: event
                                            .target
                                            .value,
                                    })
                                }
                            />

                        </label>


                        {/* Phone */}
                        <label className="block">

                            <span className="mb-1.5 block text-sm font-medium">
                                Phone
                            </span>

                            <input
                                className="field"
                                value={form.phone}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        phone: event
                                            .target
                                            .value,
                                    })
                                }
                            />

                        </label>


                        {/* Email */}
                        <Metric
                            label="Email"
                            value={
                                user?.email ||
                                "—"
                            }
                        />


                        {/* Role */}
                        <Metric
                            label="Role"
                            value={
                                user?.role ||
                                "—"
                            }
                        />


                        {/* Save Button */}
                        <Button
                            type="submit"
                            disabled={loading}
                        >
                            <Save />

                            {loading
                                ? "Saving..."
                                : "Save changes"}
                        </Button>

                    </div>

                </form>


                {/* ==================================================
                    CHANGE PASSWORD
                ================================================== */}

                <form
                    onSubmit={change}
                    className="panel p-6"
                >

                    <div className="flex items-center gap-3">

                        <LockKeyhole className="size-5 text-primary" />

                        <h2 className="font-bold">
                            Change password
                        </h2>

                    </div>


                    <div className="mt-6 grid gap-4">

                        {/* Current Password */}
                        <label className="block">

                            <span className="mb-1.5 block text-sm font-medium">
                                Current password
                            </span>

                            <input
                                className="field"
                                type="password"
                                value={
                                    passwords.currentPassword
                                }
                                onChange={(event) =>
                                    setPasswords({
                                        ...passwords,
                                        currentPassword:
                                            event
                                                .target
                                                .value,
                                    })
                                }
                                required
                            />

                        </label>


                        {/* New Password */}
                        <label className="block">

                            <span className="mb-1.5 block text-sm font-medium">
                                New password
                            </span>

                            <input
                                className="field"
                                type="password"
                                minLength={6}
                                value={
                                    passwords.newPassword
                                }
                                onChange={(event) =>
                                    setPasswords({
                                        ...passwords,
                                        newPassword:
                                            event
                                                .target
                                                .value,
                                    })
                                }
                                required
                            />

                        </label>


                        {/* Update Password */}
                        <Button
                            type="submit"
                            disabled={loading}
                        >
                            <LockKeyhole />

                            {loading
                                ? "Updating..."
                                : "Update password"}
                        </Button>

                    </div>

                </form>

            </div>

        </DashboardShell>
    );
}