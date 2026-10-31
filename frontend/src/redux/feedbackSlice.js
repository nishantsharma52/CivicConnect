import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit';

import { apiRequest } from './api';


// ============================================================
// Create Feedback
// ============================================================

export const createFeedback = createAsyncThunk(
    'feedback/create',
    async (
        {
            complaintId,
            rating,
            comment,
            resolutionSatisfied,
        },
        { rejectWithValue }
    ) => {
        try {
            return (
                await apiRequest(
                    `/feedback/complaint/${complaintId}`,
                    {
                        method: 'POST',
                        body: {
                            rating,
                            comment,
                            resolutionSatisfied,
                        },
                    }
                )
            ).feedback;
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


// ============================================================
// Fetch Feedback
// ============================================================

export const fetchFeedback = createAsyncThunk(
    'feedback/fetch',
    async (
        complaintId,
        { rejectWithValue }
    ) => {
        try {
            return (
                await apiRequest(
                    `/feedback/complaint/${complaintId}`
                )
            ).feedback;
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


// ============================================================
// Fetch All Feedback
// ============================================================

export const fetchAllFeedback = createAsyncThunk(
    'feedback/all',
    async (_, { rejectWithValue }) => {
        try {
            return (
                await apiRequest('/feedback')
            ).feedback || [];
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


// ============================================================
// Feedback Slice
// ============================================================

const slice = createSlice({
    name: 'feedback',

    initialState: {
        current: null,
        items: [],
        loading: false,
        error: null,
    },

    reducers: {},

    extraReducers: (builder) =>
        builder

            // --------------------------------------------------
            // Create Feedback
            // --------------------------------------------------

            .addCase(
                createFeedback.fulfilled,
                (state, action) => {
                    state.current =
                        action.payload;
                }
            )

            // --------------------------------------------------
            // Fetch Feedback
            // --------------------------------------------------

            .addCase(
                fetchFeedback.fulfilled,
                (state, action) => {
                    state.current =
                        action.payload;
                }
            )

            // --------------------------------------------------
            // Fetch All Feedback
            // --------------------------------------------------

            .addCase(
                fetchAllFeedback.pending,
                (state) => {
                    state.loading = true;
                }
            )

            .addCase(
                fetchAllFeedback.fulfilled,
                (state, action) => {
                    state.loading = false;
                    state.items =
                        action.payload;
                }
            )

            .addCase(
                fetchAllFeedback.rejected,
                (state, action) => {
                    state.loading = false;
                    state.error =
                        action.payload;
                }
            ),
});


export default slice.reducer;