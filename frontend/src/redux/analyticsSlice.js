import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { apiRequest } from './api';


// ============================================================
// Public Analytics
// ============================================================

export const fetchPublicAnalytics = createAsyncThunk(
    'analytics/public',
    async (
        query = '',
        { rejectWithValue }
    ) => {
        try {
            return (
                await apiRequest(
                    `/analytics/public${
                        query ? `?${query}` : ''
                    }`,
                    {
                        auth: false,
                    }
                )
            ).analytics;
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


// ============================================================
// Admin Analytics
// ============================================================

export const fetchAdminAnalytics = createAsyncThunk(
    'analytics/admin',
    async (_, { rejectWithValue }) => {
        try {
            return (
                await apiRequest(
                    '/analytics/admin'
                )
            ).analytics;
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


// ============================================================
// Department Analytics
// ============================================================

export const fetchDepartmentAnalytics =
    createAsyncThunk(
        'analytics/department',
        async (_, { rejectWithValue }) => {
            try {
                return (
                    await apiRequest(
                        '/analytics/department'
                    )
                ).analytics;
            } catch (e) {
                return rejectWithValue(e.message);
            }
        }
    );


// ============================================================
// Analytics Slice
// ============================================================

const slice = createSlice({
    name: 'analytics',

    initialState: {
        public: null,
        admin: null,
        department: null,
        loading: false,
        error: null,
    },

    reducers: {},

    extraReducers: (builder) =>
        builder

            // --------------------------------------------------
            // Public Analytics
            // --------------------------------------------------

            .addCase(
                fetchPublicAnalytics.pending,
                (state) => {
                    state.loading = true;
                    state.error = null;
                }
            )

            .addCase(
                fetchPublicAnalytics.fulfilled,
                (state, action) => {
                    state.loading = false;
                    state.public = action.payload;
                }
            )

            .addCase(
                fetchPublicAnalytics.rejected,
                (state, action) => {
                    state.loading = false;
                    state.error = action.payload;
                }
            )

            // --------------------------------------------------
            // Admin Analytics
            // --------------------------------------------------

            .addCase(
                fetchAdminAnalytics.pending,
                (state) => {
                    state.loading = true;
                }
            )

            .addCase(
                fetchAdminAnalytics.fulfilled,
                (state, action) => {
                    state.loading = false;
                    state.admin = action.payload;
                }
            )

            .addCase(
                fetchAdminAnalytics.rejected,
                (state, action) => {
                    state.loading = false;
                    state.error = action.payload;
                }
            )

            // --------------------------------------------------
            // Department Analytics
            // --------------------------------------------------

            .addCase(
                fetchDepartmentAnalytics.pending,
                (state) => {
                    state.loading = true;
                }
            )

            .addCase(
                fetchDepartmentAnalytics.fulfilled,
                (state, action) => {
                    state.loading = false;
                    state.department = action.payload;
                }
            )

            .addCase(
                fetchDepartmentAnalytics.rejected,
                (state, action) => {
                    state.loading = false;
                    state.error = action.payload;
                }
            ),
});


export default slice.reducer;