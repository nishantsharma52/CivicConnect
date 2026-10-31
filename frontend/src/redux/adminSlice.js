import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { apiRequest } from './api';


// ============================================================
// Users
// ============================================================

export const fetchUsers = createAsyncThunk(
    'admin/users',
    async (_, { rejectWithValue }) => {
        try {
            return (
                await apiRequest(
                    '/users/admin?limit=100'
                )
            ).users || [];
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


export const createStaff = createAsyncThunk(
    'admin/createStaff',
    async (payload, { rejectWithValue }) => {
        try {
            return (
                await apiRequest(
                    '/users/admin/staff',
                    {
                        method: 'POST',
                        body: payload,
                    }
                )
            ).user;
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


export const updateUserStatus = createAsyncThunk(
    'admin/userStatus',
    async ({ id, isActive }, { rejectWithValue }) => {
        try {
            return (
                await apiRequest(
                    `/users/admin/${id}/status`,
                    {
                        method: 'PUT',
                        body: {
                            isActive,
                        },
                    }
                )
            ).user;
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


export const updateUserRole = createAsyncThunk(
    'admin/userRole',
    async (
        { id, role, department },
        { rejectWithValue }
    ) => {
        try {
            return (
                await apiRequest(
                    `/users/admin/${id}/role`,
                    {
                        method: 'PUT',
                        body: {
                            role,
                            department,
                        },
                    }
                )
            ).user;
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


export const deleteUser = createAsyncThunk(
    'admin/deleteUser',
    async (id, { rejectWithValue }) => {
        try {
            await apiRequest(
                `/users/admin/${id}`,
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
// Departments
// ============================================================

export const createDepartment = createAsyncThunk(
    'admin/createDepartment',
    async (payload, { rejectWithValue }) => {
        try {
            return (
                await apiRequest(
                    '/departments',
                    {
                        method: 'POST',
                        body: payload,
                    }
                )
            ).department;
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


export const updateDepartment = createAsyncThunk(
    'admin/updateDepartment',
    async (
        { id, payload },
        { rejectWithValue }
    ) => {
        try {
            return (
                await apiRequest(
                    `/departments/${id}`,
                    {
                        method: 'PUT',
                        body: payload,
                    }
                )
            ).department;
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


export const toggleDepartment = createAsyncThunk(
    'admin/toggleDepartment',
    async (
        { id, active },
        { rejectWithValue }
    ) => {
        try {
            const path = active
                ? 'activate'
                : 'deactivate';

            return (
                await apiRequest(
                    `/departments/${id}/${path}`,
                    {
                        method: 'PUT',
                    }
                )
            ).department;
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


export const deleteDepartment = createAsyncThunk(
    'admin/deleteDepartment',
    async (id, { rejectWithValue }) => {
        try {
            await apiRequest(
                `/departments/${id}`,
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
// Categories
// ============================================================

export const createCategory = createAsyncThunk(
    'admin/createCategory',
    async (payload, { rejectWithValue }) => {
        try {
            return (
                await apiRequest(
                    '/categories',
                    {
                        method: 'POST',
                        body: payload,
                    }
                )
            ).category;
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


export const updateCategory = createAsyncThunk(
    'admin/updateCategory',
    async (
        { id, payload },
        { rejectWithValue }
    ) => {
        try {
            return (
                await apiRequest(
                    `/categories/${id}`,
                    {
                        method: 'PUT',
                        body: payload,
                    }
                )
            ).category;
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


export const toggleCategory = createAsyncThunk(
    'admin/toggleCategory',
    async (
        { id, active },
        { rejectWithValue }
    ) => {
        try {
            const path = active
                ? 'activate'
                : 'deactivate';

            return (
                await apiRequest(
                    `/categories/${id}/${path}`,
                    {
                        method: 'PUT',
                    }
                )
            ).category;
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


export const deleteCategory = createAsyncThunk(
    'admin/deleteCategory',
    async (id, { rejectWithValue }) => {
        try {
            await apiRequest(
                `/categories/${id}`,
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
// Admin Slice
// ============================================================

const slice = createSlice({
    name: 'admin',

    initialState: {
        users: [],
        loading: false,
        error: null,
    },

    reducers: {},

    extraReducers: (builder) =>
        builder

            // Fetch Users
            .addCase(
                fetchUsers.pending,
                (state) => {
                    state.loading = true;
                }
            )

            .addCase(
                fetchUsers.fulfilled,
                (state, action) => {
                    state.loading = false;
                    state.users = action.payload;
                }
            )

            .addCase(
                fetchUsers.rejected,
                (state, action) => {
                    state.loading = false;
                    state.error = action.payload;
                }
            )

            // Create Staff
            .addCase(
                createStaff.fulfilled,
                (state, action) => {
                    state.users = [
                        action.payload,
                        ...state.users,
                    ];
                }
            )

            // Update User Status
            .addCase(
                updateUserStatus.fulfilled,
                (state, action) => {
                    state.users = state.users.map(
                        (user) =>
                            user._id === action.payload._id
                                ? action.payload
                                : user
                    );
                }
            )

            // Update User Role
            .addCase(
                updateUserRole.fulfilled,
                (state, action) => {
                    state.users = state.users.map(
                        (user) =>
                            user._id === action.payload._id
                                ? action.payload
                                : user
                    );
                }
            )

            // Delete User
            .addCase(
                deleteUser.fulfilled,
                (state, action) => {
                    state.users = state.users.filter(
                        (user) =>
                            user._id !== action.payload
                    );
                }
            ),
});


export default slice.reducer;