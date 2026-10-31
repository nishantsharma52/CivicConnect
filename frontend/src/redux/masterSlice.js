import {
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit';

import { apiRequest } from './api';


// ============================================================
// Fetch Departments
// ============================================================

export const fetchDepartments = createAsyncThunk(
    'master/departments',
    async (
        includeInactive = false,
        { rejectWithValue }
    ) => {
        try {
            return (
                await apiRequest(
                    `/departments${
                        includeInactive
                            ? '?includeInactive=true'
                            : ''
                    }`,
                    {
                        auth: false,
                    }
                )
            ).departments || [];
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


// ============================================================
// Fetch Categories
// ============================================================

export const fetchCategories = createAsyncThunk(
    'master/categories',
    async (
        includeInactive = false,
        { rejectWithValue }
    ) => {
        try {
            return (
                await apiRequest(
                    `/categories${
                        includeInactive
                            ? '?includeInactive=true'
                            : ''
                    }`,
                    {
                        auth: false,
                    }
                )
            ).categories || [];
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


// ============================================================
// Fetch Department Staff
// ============================================================

export const fetchDepartmentStaff =
    createAsyncThunk(
        'master/staff',
        async (
            departmentId,
            { rejectWithValue }
        ) => {
            try {
                return (
                    await apiRequest(
                        `/departments/${departmentId}/staff`
                    )
                ).staff || [];
            } catch (e) {
                return rejectWithValue(
                    e.message
                );
            }
        }
    );


// ============================================================
// Master Slice
// ============================================================

const slice = createSlice({
    name: 'master',

    initialState: {
        departments: [],
        categories: [],
        staff: [],
        loading: false,
        error: null,
    },

    reducers: {},

    extraReducers: (builder) =>
        builder

            // --------------------------------------------------
            // Departments
            // --------------------------------------------------

            .addCase(
                fetchDepartments.pending,
                (state) => {
                    state.loading = true;
                    state.error = null;
                }
            )

            .addCase(
                fetchDepartments.fulfilled,
                (state, action) => {
                    state.loading = false;
                    state.departments =
                        action.payload;
                }
            )

            .addCase(
                fetchDepartments.rejected,
                (state, action) => {
                    state.loading = false;
                    state.error =
                        action.payload;
                }
            )

            // --------------------------------------------------
            // Categories
            // --------------------------------------------------

            .addCase(
                fetchCategories.pending,
                (state) => {
                    state.loading = true;
                    state.error = null;
                }
            )

            .addCase(
                fetchCategories.fulfilled,
                (state, action) => {
                    state.loading = false;
                    state.categories =
                        action.payload;
                }
            )

            .addCase(
                fetchCategories.rejected,
                (state, action) => {
                    state.loading = false;
                    state.error =
                        action.payload;
                }
            )

            // --------------------------------------------------
            // Department Staff
            // --------------------------------------------------

            .addCase(
                fetchDepartmentStaff.fulfilled,
                (state, action) => {
                    state.staff =
                        action.payload;
                }
            ),
});


export default slice.reducer;