import { configureStore } from '@reduxjs/toolkit';

import auth from './authSlice';
import complaints from './complaintSlice';
import notifications from './notificationSlice';
import comments from './commentSlice';
import feedback from './feedbackSlice';
import master from './masterSlice';
import analytics from './analyticsSlice';
import admin from './adminSlice';


// ============================================================
// Redux Store
// ============================================================

export const store = configureStore({
    reducer: {
        auth,
        complaints,
        notifications,
        comments,
        feedback,
        master,
        analytics,
        admin,
    },

    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});