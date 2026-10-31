import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { apiRequest } from './api';


// ============================================================
// Fetch Comments
// ============================================================

export const fetchComments = createAsyncThunk(
    'comments/fetch',
    async (
        complaintId,
        { rejectWithValue }
    ) => {
        try {
            return (
                await apiRequest(
                    `/comments/complaint/${complaintId}`
                )
            ).comments || [];
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


// ============================================================
// Add Comment
// ============================================================

export const addComment = createAsyncThunk(
    'comments/add',
    async (
        {
            complaintId,
            comment,
            isInternal = false,
        },
        { rejectWithValue }
    ) => {
        try {
            return (
                await apiRequest(
                    `/comments/complaint/${complaintId}`,
                    {
                        method: 'POST',
                        body: {
                            comment,
                            isInternal,
                        },
                    }
                )
            ).comment;
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


// ============================================================
// Update Comment
// ============================================================

export const updateComment = createAsyncThunk(
    'comments/update',
    async (
        {
            id,
            comment,
            isInternal,
        },
        { rejectWithValue }
    ) => {
        try {
            return (
                await apiRequest(
                    `/comments/${id}`,
                    {
                        method: 'PUT',
                        body: {
                            comment,
                            isInternal,
                        },
                    }
                )
            ).comment;
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


// ============================================================
// Delete Comment
// ============================================================

export const deleteComment = createAsyncThunk(
    'comments/delete',
    async (id, { rejectWithValue }) => {
        try {
            await apiRequest(
                `/comments/${id}`,
                {
                    method: 'DELETE',
                }
            );

            return id;
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


// ============================================================
// Comments Slice
// ============================================================

const slice = createSlice({
    name: 'comments',

    initialState: {
        items: [],
        loading: false,
        error: null,
    },

    reducers: {},

    extraReducers: (builder) =>
        builder

            // --------------------------------------------------
            // Fetch Comments
            // --------------------------------------------------

            .addCase(
                fetchComments.pending,
                (state) => {
                    state.loading = true;
                    state.error = null;
                }
            )

            .addCase(
                fetchComments.fulfilled,
                (state, action) => {
                    state.loading = false;
                    state.items = action.payload;
                }
            )

            .addCase(
                fetchComments.rejected,
                (state, action) => {
                    state.loading = false;
                    state.error = action.payload;
                }
            )

            // --------------------------------------------------
            // Add Comment
            // --------------------------------------------------

            .addCase(
                addComment.fulfilled,
                (state, action) => {
                    state.items = [
                        ...state.items,
                        action.payload,
                    ];
                }
            )

            // --------------------------------------------------
            // Update Comment
            // --------------------------------------------------

            .addCase(
                updateComment.fulfilled,
                (state, action) => {
                    state.items = state.items.map(
                        (comment) =>
                            comment._id ===
                            action.payload._id
                                ? action.payload
                                : comment
                    );
                }
            )

            // --------------------------------------------------
            // Delete Comment
            // --------------------------------------------------

            .addCase(
                deleteComment.fulfilled,
                (state, action) => {
                    state.items = state.items.filter(
                        (comment) =>
                            comment._id !==
                            action.payload
                    );
                }
            ),
});


export default slice.reducer;