import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit';

import { apiRequest } from './api';


// ============================================================
// Fetch Notifications
// ============================================================

export const fetchNotifications = createAsyncThunk(
    'notifications/fetch',
    async (_, { rejectWithValue }) => {
        try {
            return await apiRequest(
                '/notifications?limit=100'
            );
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


// ============================================================
// Mark Notification as Read
// ============================================================

export const markNotificationRead =
    createAsyncThunk(
        'notifications/read',
        async (
            id,
            { rejectWithValue }
        ) => {
            try {
                return await apiRequest(
                    `/notifications/${id}/read`,
                    {
                        method: 'PUT',
                    }
                );
            } catch (e) {
                return rejectWithValue(
                    e.message
                );
            }
        }
    );


// ============================================================
// Mark All Notifications as Read
// ============================================================

export const markAllNotificationsRead =
    createAsyncThunk(
        'notifications/readAll',
        async (_, { rejectWithValue }) => {
            try {
                return await apiRequest(
                    '/notifications/read-all',
                    {
                        method: 'PUT',
                    }
                );
            } catch (e) {
                return rejectWithValue(
                    e.message
                );
            }
        }
    );


// ============================================================
// Delete Notification
// ============================================================

export const deleteNotification =
    createAsyncThunk(
        'notifications/delete',
        async (
            id,
            { rejectWithValue }
        ) => {
            try {
                await apiRequest(
                    `/notifications/${id}`,
                    {
                        method: 'DELETE',
                    }
                );

                return id;
            } catch (e) {
                return rejectWithValue(
                    e.message
                );
            }
        }
    );


// ============================================================
// Notifications Slice
// ============================================================

const slice = createSlice({
    name: 'notifications',

    initialState: {
        items: [],
        unreadCount: 0,
        loading: false,
        error: null,
    },

    reducers: {},

    extraReducers: (builder) =>
        builder

            // --------------------------------------------------
            // Fetch Notifications
            // --------------------------------------------------

            .addCase(
                fetchNotifications.pending,
                (state) => {
                    state.loading = true;
                    state.error = null;
                }
            )

            .addCase(
                fetchNotifications.fulfilled,
                (state, action) => {
                    state.loading = false;

                    state.items =
                        action.payload.notifications ||
                        [];

                    state.unreadCount =
                        action.payload.unreadCount ||
                        0;
                }
            )

            .addCase(
                fetchNotifications.rejected,
                (state, action) => {
                    state.loading = false;
                    state.error =
                        action.payload;
                }
            )

            // --------------------------------------------------
            // Mark Notification as Read
            // --------------------------------------------------

            .addCase(
                markNotificationRead.fulfilled,
                (state, action) => {
                    const id =
                        action.payload
                            .notification?._id;

                    const wasUnread =
                        state.items.find(
                            (notification) =>
                                notification._id === id
                        )?.isRead === false;

                    state.items =
                        state.items.map(
                            (notification) =>
                                notification._id === id
                                    ? action.payload.notification
                                    : notification
                        );

                    if (wasUnread) {
                        state.unreadCount =
                            Math.max(
                                0,
                                state.unreadCount - 1
                            );
                    }
                }
            )

            // --------------------------------------------------
            // Mark All Notifications as Read
            // --------------------------------------------------

            .addCase(
                markAllNotificationsRead.fulfilled,
                (state) => {
                    state.items =
                        state.items.map(
                            (notification) => ({
                                ...notification,
                                isRead: true,
                            })
                        );

                    state.unreadCount = 0;
                }
            )

            // --------------------------------------------------
            // Delete Notification
            // --------------------------------------------------

            .addCase(
                deleteNotification.fulfilled,
                (state, action) => {
                    const removed =
                        state.items.find(
                            (notification) =>
                                notification._id ===
                                action.payload
                        );

                    state.items =
                        state.items.filter(
                            (notification) =>
                                notification._id !==
                                action.payload
                        );

                    if (
                        removed &&
                        !removed.isRead
                    ) {
                        state.unreadCount =
                            Math.max(
                                0,
                                state.unreadCount - 1
                            );
                    }
                }
            ),
});


export default slice.reducer;