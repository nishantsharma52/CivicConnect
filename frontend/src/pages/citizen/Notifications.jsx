import { useEffect } from "react";

import {
    Bell,
    CheckCheck,
    Trash2,
} from "lucide-react";

import {
    useDispatch,
    useSelector,
} from "react-redux";

import { toast } from "sonner";

import { Link } from "react-router-dom";


// --------------------------------------------------
// Redux
// --------------------------------------------------

import {
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
} from "@/redux/notificationSlice";


// --------------------------------------------------
// Components
// --------------------------------------------------

import {
    DashboardShell,
} from "@/components/AppShell";

import {
    Button,
} from "@/components/ui/button";

import {
    EmptyState,
    NotificationSkeleton,
    PageHeader,
} from "@/components/CivicUI";


// --------------------------------------------------
// Notifications Page
// --------------------------------------------------

export default function Notifications() {
    const dispatch = useDispatch();


    // --------------------------------------------------
    // Notifications State
    // --------------------------------------------------

    const {
        items,
        loading,
    } = useSelector(
        (state) =>
            state.notifications
    );


    // --------------------------------------------------
    // Fetch Notifications
    // --------------------------------------------------

    useEffect(() => {
        dispatch(
            fetchNotifications()
        );
    }, [dispatch]);


    // --------------------------------------------------
    // Mark Single Notification as Read
    // --------------------------------------------------

    const read = async (
        id
    ) => {
        const result =
            await dispatch(
                markNotificationRead(id)
            );

        if (
            markNotificationRead.rejected.match(
                result
            )
        ) {
            toast.error(
                result.payload ||
                    "Unable to mark notification as read"
            );
        }
    };


    // --------------------------------------------------
    // Delete Notification
    // --------------------------------------------------

    const remove = async (
        id
    ) => {
        const result =
            await dispatch(
                deleteNotification(id)
            );

        if (
            deleteNotification.rejected.match(
                result
            )
        ) {
            toast.error(
                result.payload ||
                    "Unable to delete notification"
            );
        }
    };


    // --------------------------------------------------
    // Mark All Notifications as Read
    // --------------------------------------------------

    const markAllRead = async () => {
        const result =
            await dispatch(
                markAllNotificationsRead()
            );

        if (
            markAllNotificationsRead.rejected.match(
                result
            )
        ) {
            toast.error(
                result.payload ||
                    "Unable to mark all notifications as read"
            );
        }
    };


    return (
        <DashboardShell>

            {/* --------------------------------------------------
                Page Header
            -------------------------------------------------- */}

            <PageHeader
                eyebrow="Updates"
                title="Notifications"
                description="
                    Live status and activity messages
                    from CivicConnect.
                "
                action={
                    <Button
                        variant="outline"
                        onClick={markAllRead}
                        disabled={
                            loading ||
                            !items.length
                        }
                    >
                        <CheckCheck />

                        Mark all read
                    </Button>
                }
            />


            {/* --------------------------------------------------
                Notifications Content
            -------------------------------------------------- */}

            {loading ? (
                <NotificationSkeleton />
            ) : !items.length ? (
                <EmptyState
                    title="No notifications yet"
                />
            ) : (
                <div className="space-y-3">

                    {items.map(
                        (notification) => (
                            <div
                                key={
                                    notification._id
                                }
                                className={`
                                    panel
                                    flex
                                    gap-4
                                    p-5
                                    ${
                                        !notification.isRead
                                            ? "border-primary/30 bg-primary-soft/30"
                                            : ""
                                    }
                                `}
                            >

                                {/* ------------------------------------------
                                    Notification Icon
                                ------------------------------------------ */}

                                <div
                                    className="
                                        flex
                                        size-10
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-lg
                                        bg-primary-soft
                                        text-primary
                                    "
                                >
                                    <Bell className="size-5" />
                                </div>


                                {/* ------------------------------------------
                                    Notification Content
                                ------------------------------------------ */}

                                <div
                                    className="
                                        min-w-0
                                        flex-1
                                    "
                                >

                                    {/* Title + Time */}
                                    <div
                                        className="
                                            flex
                                            flex-wrap
                                            items-center
                                            justify-between
                                            gap-2
                                        "
                                    >
                                        <h3 className="font-semibold">
                                            {
                                                notification.title
                                            }
                                        </h3>

                                        <span
                                            className="
                                                text-xs
                                                text-muted-foreground
                                            "
                                        >
                                            {notification.createdAt
                                                ? new Date(
                                                      notification.createdAt
                                                  ).toLocaleString()
                                                : "—"}
                                        </span>
                                    </div>


                                    {/* Message */}
                                    <p
                                        className="
                                            mt-1
                                            text-sm
                                            text-muted-foreground
                                        "
                                    >
                                        {
                                            notification.message
                                        }
                                    </p>


                                    {/* Complaint Link */}
                                    {notification.complaint?._id && (
                                        <Link
                                            className="
                                                mt-2
                                                inline-block
                                                text-xs
                                                font-semibold
                                                text-primary
                                            "
                                            to={`/complaints/${notification.complaint._id}`}
                                        >
                                            View complaint
                                        </Link>
                                    )}


                                    {/* Actions */}
                                    <div
                                        className="
                                            mt-3
                                            flex
                                            flex-wrap
                                            gap-2
                                        "
                                    >

                                        {/* Mark Read */}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            disabled={
                                                notification.isRead
                                            }
                                            onClick={() =>
                                                read(
                                                    notification._id
                                                )
                                            }
                                        >
                                            Mark read
                                        </Button>


                                        {/* Delete */}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                remove(
                                                    notification._id
                                                )
                                            }
                                        >
                                            <Trash2 />

                                            Delete
                                        </Button>

                                    </div>

                                </div>

                            </div>
                        )
                    )}

                </div>
            )}

        </DashboardShell>
    );
}