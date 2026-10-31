import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import {
    apiRequest,
    clearToken,
    getToken,
    setToken,
} from './api';


// ============================================================
// Register User
// ============================================================

export const registerUser = createAsyncThunk(
    'auth/register',
    async (payload, { rejectWithValue }) => {
        try {
            const data = await apiRequest(
                '/users/register',
                {
                    method: 'POST',
                    body: payload,
                    auth: false,
                }
            );

            setToken(data.token);

            return data;
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


// ============================================================
// Login User
// ============================================================

export const loginUser = createAsyncThunk(
    'auth/login',
    async (payload, { rejectWithValue }) => {
        try {
            const data = await apiRequest(
                '/users/login',
                {
                    method: 'POST',
                    body: payload,
                    auth: false,
                }
            );

            setToken(data.token);

            return data;
        } catch (e) {
            return rejectWithValue(e.message);
        }
    }
);


// ============================================================
// Fetch Profile
// ============================================================

export const fetchProfile = createAsyncThunk(
    'auth/profile',
    async (_, { rejectWithValue }) => {
        try {
            return await apiRequest(
                '/users/profile'
            );
        } catch (e) {
            if (e.status === 401) {
                clearToken();
            }

            return rejectWithValue(e.message);
        }
    }
);


// ============================================================
// Update Profile
// ============================================================

export const updateProfile = createAsyncThunk(
    'auth/updateProfile',
    async (payload, { rejectWithValue }) => {
        try {
            return await apiRequest(
                '/users/profile',
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
// Change Password
// ============================================================

export const changePassword = createAsyncThunk(
    'auth/changePassword',
    async (payload, { rejectWithValue }) => {
        try {
            return await apiRequest(
                '/users/change-password',
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
// Logout User
// ============================================================

export const logoutUser = createAsyncThunk(
    'auth/logout',
    async () => {
        try {
            await apiRequest(
                '/users/logout',
                {
                    method: 'POST',
                }
            );
        } catch {
            // Local logout still succeeds
        }

        clearToken();

        return true;
    }
);


// ============================================================
// Auth Slice
// ============================================================

const slice = createSlice({
    name: 'auth',

    initialState: {
        token: getToken(),
        user: null,
        loading: false,
        initialized: false,
        error: null,
    },

    reducers: {

        // Clear authentication error
        clearAuthError: (state) => {
            state.error = null;
        },

        // Force local logout
        forceLogout: (state) => {
            state.token = null;
            state.user = null;
            state.initialized = true;
            state.error = null;

            clearToken();
        },
    },

    extraReducers: (builder) =>
        builder

            // --------------------------------------------------
            // Register User
            // --------------------------------------------------

            .addCase(
                registerUser.pending,
                (state) => {
                    state.loading = true;
                    state.error = null;
                }
            )

            .addCase(
                registerUser.fulfilled,
                (state, action) => {
                    state.loading = false;
                    state.initialized = true;
                    state.token =
                        action.payload.token;
                    state.user =
                        action.payload.user;
                }
            )

            .addCase(
                registerUser.rejected,
                (state, action) => {
                    state.loading = false;
                    state.error = action.payload;
                }
            )

            // --------------------------------------------------
            // Login User
            // --------------------------------------------------

            .addCase(
                loginUser.pending,
                (state) => {
                    state.loading = true;
                    state.error = null;
                }
            )

            .addCase(
                loginUser.fulfilled,
                (state, action) => {
                    state.loading = false;
                    state.initialized = true;
                    state.token =
                        action.payload.token;
                    state.user =
                        action.payload.user;
                }
            )

            .addCase(
                loginUser.rejected,
                (state, action) => {
                    state.loading = false;
                    state.error = action.payload;
                }
            )

            // --------------------------------------------------
            // Fetch Profile
            // --------------------------------------------------

            .addCase(
                fetchProfile.pending,
                (state) => {
                    state.loading = true;
                    state.error = null;
                }
            )

            .addCase(
                fetchProfile.fulfilled,
                (state, action) => {
                    state.loading = false;
                    state.initialized = true;
                    state.token = getToken();
                    state.user =
                        action.payload.user;
                }
            )

            .addCase(
                fetchProfile.rejected,
                (state, action) => {
                    state.loading = false;
                    state.initialized = true;
                    state.token = null;
                    state.user = null;
                    state.error =
                        action.payload || null;
                }
            )

            // --------------------------------------------------
            // Update Profile
            // --------------------------------------------------

            .addCase(
                updateProfile.pending,
                (state) => {
                    state.loading = true;
                    state.error = null;
                }
            )

            .addCase(
                updateProfile.fulfilled,
                (state, action) => {
                    state.loading = false;
                    state.user =
                        action.payload.user;
                }
            )

            .addCase(
                updateProfile.rejected,
                (state, action) => {
                    state.loading = false;
                    state.error = action.payload;
                }
            )

            // --------------------------------------------------
            // Change Password
            // --------------------------------------------------

            .addCase(
                changePassword.pending,
                (state) => {
                    state.loading = true;
                    state.error = null;
                }
            )

            .addCase(
                changePassword.fulfilled,
                (state) => {
                    state.loading = false;
                }
            )

            .addCase(
                changePassword.rejected,
                (state, action) => {
                    state.loading = false;
                    state.error = action.payload;
                }
            )

            // --------------------------------------------------
            // Logout User
            // --------------------------------------------------

            .addCase(
                logoutUser.fulfilled,
                (state) => {
                    state.loading = false;
                    state.token = null;
                    state.user = null;
                    state.initialized = true;
                }
            ),
});


export const {
    clearAuthError,
    forceLogout,
} = slice.actions;


export default slice.reducer;