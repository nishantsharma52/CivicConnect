import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit';

import { apiRequest } from './api';


// ============================================================
// Analyze Complaint
// ============================================================

export const analyzeComplaintPreview = createAsyncThunk(
    'complaints/analyze',
    async (payload, { rejectWithValue }) => {
        try {
            return (
                await apiRequest(
                    '/complaints/analyze',
                    {
                        method: 'POST',
                        body: payload,
                    }
                )
            ).analysis;
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


// ============================================================
// Fetch My Complaints
// ============================================================

export const fetchMyComplaints = createAsyncThunk(
    'complaints/my',
    async (
        params = '',
        { rejectWithValue }
    ) => {
        try {
            return await apiRequest(
                `/complaints/my${
                    params ? `?${params}` : ''
                }`
            );
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


// ============================================================
// Fetch All Complaints
// ============================================================

export const fetchAllComplaints = createAsyncThunk(
    'complaints/all',
    async (
        params = '',
        { rejectWithValue }
    ) => {
        try {
            return await apiRequest(
                `/complaints${
                    params ? `?${params}` : ''
                }`
            );
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


// ============================================================
// Fetch Single Complaint
// ============================================================

export const fetchComplaint = createAsyncThunk(
    'complaints/detail',
    async (id, { rejectWithValue }) => {
        try {
            return await apiRequest(
                `/complaints/${id}`
            );
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


// ============================================================
// Track Complaint
// ============================================================

export const trackComplaint = createAsyncThunk(
    'complaints/track',
    async (
        complaintId,
        { rejectWithValue }
    ) => {
        try {
            return await apiRequest(
                `/complaints/track/${encodeURIComponent(
                    complaintId
                )}`,
                {
                    auth: false,
                }
            );
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


// ============================================================
// Create Complaint
// ============================================================

export const createComplaint = createAsyncThunk(
    'complaints/create',
    async (
        { fields, files },
        { rejectWithValue }
    ) => {
        try {
            const form = new FormData();

            Object.entries(fields).forEach(
                ([key, value]) => {
                    if (
                        value !== undefined &&
                        value !== null &&
                        value !== ''
                    ) {
                        form.append(key, value);
                    }
                }
            );

            (files || []).forEach((file) => {
                form.append(
                    'evidence',
                    file
                );
            });

            return await apiRequest(
                '/complaints',
                {
                    method: 'POST',
                    body: form,
                }
            );
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


// ============================================================
// Update Complaint
// ============================================================

export const updateComplaint = createAsyncThunk(
    'complaints/update',
    async (
        { id, payload },
        { rejectWithValue }
    ) => {
        try {
            return await apiRequest(
                `/complaints/${id}`,
                {
                    method: 'PUT',
                    body: payload,
                }
            );
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


// ============================================================
// Assign Department
// ============================================================

export const assignDepartment = createAsyncThunk(
    'complaints/assignDepartment',
    async (
        { id, departmentId },
        { rejectWithValue }
    ) => {
        try {
            return await apiRequest(
                `/complaints/${id}/assign-department`,
                {
                    method: 'PUT',
                    body: {
                        departmentId,
                    },
                }
            );
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


// ============================================================
// Assign Staff
// ============================================================

export const assignStaff = createAsyncThunk(
    'complaints/assignStaff',
    async (
        { id, userId },
        { rejectWithValue }
    ) => {
        try {
            return await apiRequest(
                `/complaints/${id}/assign-staff`,
                {
                    method: 'PUT',
                    body: {
                        userId,
                    },
                }
            );
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


// ============================================================
// Update Complaint Status
// ============================================================

export const updateComplaintStatus =
    createAsyncThunk(
        'complaints/status',
        async (
            {
                id,
                status,
                remark,
            },
            { rejectWithValue }
        ) => {
            try {
                return await apiRequest(
                    `/complaints/${id}/status`,
                    {
                        method: 'PUT',
                        body: {
                            status,
                            remark,
                        },
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
// Add Resolution Proof
// ============================================================

export const addResolutionProof =
    createAsyncThunk(
        'complaints/resolution',
        async (
            {
                id,
                departmentRemark,
                files,
            },
            { rejectWithValue }
        ) => {
            try {
                const form = new FormData();

                form.append(
                    'departmentRemark',
                    departmentRemark
                );

                (files || []).forEach((file) => {
                    form.append(
                        'resolutionProof',
                        file
                    );
                });

                return await apiRequest(
                    `/complaints/${id}/resolution-proof`,
                    {
                        method: 'PUT',
                        body: form,
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
// Verify Resolution
// ============================================================

export const verifyResolution =
    createAsyncThunk(
        'complaints/verify',
        async (
            {
                id,
                verified,
                reopenedReason,
            },
            { rejectWithValue }
        ) => {
            try {
                return await apiRequest(
                    `/complaints/${id}/verify-resolution`,
                    {
                        method: 'PUT',
                        body: {
                            verified,
                            reopenedReason,
                        },
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
// Delete Complaint
// ============================================================

export const deleteComplaint = createAsyncThunk(
    'complaints/delete',
    async (id, { rejectWithValue }) => {
        try {
            await apiRequest(
                `/complaints/${id}`,
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
// Workflow Thunks
// ============================================================

const workflowThunks = [
    updateComplaint,
    assignDepartment,
    assignStaff,
    updateComplaintStatus,
    addResolutionProof,
    verifyResolution,
];


const matches = (thunk, key) => (action) =>
    thunk[key].match(action);


// ============================================================
// Complaints Slice
// ============================================================

const slice = createSlice({
    name: 'complaints',

    initialState: {
        items: [],
        current: null,
        history: [],
        currentFeedback: null,
        analysis: null,
        pagination: null,
        loading: false,
        actionLoading: false,
        analysisLoading: false,
        error: null,
    },

    reducers: {

        // Clear complaint error
        clearComplaintError: (state) => {
            state.error = null;
        },

        // Clear current complaint
        clearCurrentComplaint: (state) => {
            state.current = null;
            state.history = [];
            state.currentFeedback = null;
        },
    },

    extraReducers: (builder) => {

        // ------------------------------------------------------
        // Analyze Complaint
        // ------------------------------------------------------

        builder
            .addCase(
                analyzeComplaintPreview.pending,
                (state) => {
                    state.analysisLoading = true;
                    state.error = null;
                }
            )

            .addCase(
                analyzeComplaintPreview.fulfilled,
                (state, action) => {
                    state.analysisLoading = false;
                    state.analysis =
                        action.payload;
                }
            )

            .addCase(
                analyzeComplaintPreview.rejected,
                (state, action) => {
                    state.analysisLoading = false;
                    state.error =
                        action.payload;
                }
            );


        // ------------------------------------------------------
        // Fetch My Complaints
        // ------------------------------------------------------

        builder
            .addCase(
                fetchMyComplaints.pending,
                (state) => {
                    state.loading = true;
                    state.error = null;
                }
            )

            .addCase(
                fetchMyComplaints.fulfilled,
                (state, action) => {
                    state.loading = false;
                    state.items =
                        action.payload.complaints ||
                        [];
                    state.pagination =
                        action.payload.pagination ||
                        null;
                }
            )

            .addCase(
                fetchMyComplaints.rejected,
                (state, action) => {
                    state.loading = false;
                    state.error =
                        action.payload;
                }
            );


        // ------------------------------------------------------
        // Fetch All Complaints
        // ------------------------------------------------------

        builder
            .addCase(
                fetchAllComplaints.pending,
                (state) => {
                    state.loading = true;
                    state.error = null;
                }
            )

            .addCase(
                fetchAllComplaints.fulfilled,
                (state, action) => {
                    state.loading = false;
                    state.items =
                        action.payload.complaints ||
                        [];
                    state.pagination =
                        action.payload.pagination ||
                        null;
                }
            )

            .addCase(
                fetchAllComplaints.rejected,
                (state, action) => {
                    state.loading = false;
                    state.error =
                        action.payload;
                }
            );


        // ------------------------------------------------------
        // Fetch Single Complaint
        // ------------------------------------------------------

        builder
            .addCase(
                fetchComplaint.pending,
                (state) => {
                    state.loading = true;
                    state.error = null;
                }
            )

            .addCase(
                fetchComplaint.fulfilled,
                (state, action) => {
                    state.loading = false;
                    state.current =
                        action.payload.complaint;
                    state.history =
                        action.payload.history ||
                        [];
                    state.currentFeedback =
                        action.payload.feedback ||
                        null;
                }
            )

            .addCase(
                fetchComplaint.rejected,
                (state, action) => {
                    state.loading = false;
                    state.error =
                        action.payload;
                }
            );


        // ------------------------------------------------------
        // Track Complaint
        // ------------------------------------------------------

        builder
            .addCase(
                trackComplaint.pending,
                (state) => {
                    state.loading = true;
                    state.error = null;
                    state.current = null;
                }
            )

            .addCase(
                trackComplaint.fulfilled,
                (state, action) => {
                    state.loading = false;
                    state.current =
                        action.payload.complaint;
                    state.history =
                        action.payload.history ||
                        [];
                }
            )

            .addCase(
                trackComplaint.rejected,
                (state, action) => {
                    state.loading = false;
                    state.error =
                        action.payload;
                }
            );


        // ------------------------------------------------------
        // Create Complaint
        // ------------------------------------------------------

        builder
            .addCase(
                createComplaint.pending,
                (state) => {
                    state.actionLoading = true;
                    state.error = null;
                }
            )

            .addCase(
                createComplaint.fulfilled,
                (state, action) => {
                    state.actionLoading = false;
                    state.current =
                        action.payload.complaint;

                    state.items = [
                        action.payload.complaint,
                        ...state.items,
                    ];
                }
            )

            .addCase(
                createComplaint.rejected,
                (state, action) => {
                    state.actionLoading = false;
                    state.error =
                        action.payload;
                }
            );


        // ------------------------------------------------------
        // Complaint Workflow Actions
        // ------------------------------------------------------

        workflowThunks.forEach((thunk) => {

            builder.addCase(
                thunk.pending,
                (state) => {
                    state.actionLoading = true;
                    state.error = null;
                }
            );

            builder.addCase(
                thunk.fulfilled,
                (state, action) => {
                    state.actionLoading = false;

                    if (
                        action.payload?.complaint
                    ) {
                        state.current =
                            action.payload.complaint;

                        state.items =
                            state.items.map(
                                (item) =>
                                    item._id ===
                                    action.payload
                                        .complaint
                                        ._id
                                        ? action.payload
                                            .complaint
                                        : item
                            );
                    }
                }
            );

            builder.addCase(
                thunk.rejected,
                (state, action) => {
                    state.actionLoading = false;
                    state.error =
                        action.payload;
                }
            );
        });


        // ------------------------------------------------------
        // Delete Complaint
        // ------------------------------------------------------

        builder
            .addCase(
                deleteComplaint.fulfilled,
                (state, action) => {
                    state.items =
                        state.items.filter(
                            (item) =>
                                item._id !==
                                    action.payload &&
                                item.complaintId !==
                                    action.payload
                        );
                }
            )

            .addCase(
                deleteComplaint.rejected,
                (state, action) => {
                    state.error =
                        action.payload;
                }
            );
    },
});


// ============================================================
// Actions
// ============================================================

export const {
    clearComplaintError,
    clearCurrentComplaint,
} = slice.actions;


// ============================================================
// Reducer
// ============================================================

export default slice.reducer;