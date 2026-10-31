import { createContext, useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    fetchCategories,
    fetchDepartments,
    fetchDepartmentStaff,
} from '@/redux/masterSlice';

import {
    fetchAllComplaints,
    fetchMyComplaints,
    updateComplaintStatus,
    updateComplaint as updateComplaintThunk,
} from '@/redux/complaintSlice';

import { fetchNotifications } from '@/redux/notificationSlice';


// Convert status into display-friendly text
const toDisplayStatus = (status = '') => {
    return status
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
};


// Normalize complaint data for frontend use
const normalizeComplaint = (item) => {
    return {
        ...item,

        id: item.complaintId || item._id,

        title: item.title || 'Untitled complaint',

        category:
            item.category?.name ||
            item.aiCategory?.name ||
            'Other',

        subcategory: item.subCategory || 'General',

        department: item.department?.name || 'Unassigned',

        priority: toDisplayStatus(item.priority || 'medium'),

        status: toDisplayStatus(item.status || 'submitted'),

        date: item.createdAt
            ? new Date(item.createdAt).toLocaleDateString()
            : '—',

        area: item.location?.address || '—',

        citizen: item.citizen?.name || '—',

        staff: item.assignedTo?.name || 'Unassigned',

        evidence: item.evidence || [],

        remark: item.departmentRemark || '',
    };
};


const DemoContext = createContext(null);


export function DemoProvider({ children }) {
    const dispatch = useDispatch();

    const auth = useSelector((state) => state.auth);

    const complaintsState = useSelector(
        (state) => state.complaints
    );

    const notificationsState = useSelector(
        (state) => state.notifications
    );

    const master = useSelector(
        (state) => state.master
    );

    const commentsState = useSelector(
        (state) => state.comments
    );


    // Fetch departments and categories
    useEffect(() => {
        dispatch(fetchDepartments());
        dispatch(fetchCategories());
    }, [dispatch]);


    // Fetch data according to logged-in user's role
    useEffect(() => {
        if (!auth.user) return;

        if (auth.user.role === 'citizen') {
            dispatch(fetchMyComplaints());
        } else {
            dispatch(fetchAllComplaints());
        }

        dispatch(fetchNotifications());

        if (
            auth.user.role === 'department' &&
            auth.user.department?._id
        ) {
            dispatch(
                fetchDepartmentStaff(
                    auth.user.department._id
                )
            );
        }
    }, [dispatch, auth.user]);


    // Normalize complaints before sending them to components
    const complaints = useMemo(() => {
        return (complaintsState.items || []).map(
            normalizeComplaint
        );
    }, [complaintsState.items]);


    // Normalize notifications before sending them to components
    const notifications = useMemo(() => {
        return (notificationsState.items || []).map((n) => ({
            ...n,

            id: n._id,

            text: n.message,

            time: n.createdAt
                ? new Date(n.createdAt).toLocaleString()
                : '—',

            read: n.isRead,
        }));
    }, [notificationsState.items]);


    const value = useMemo(() => ({
        role: auth.user?.role || 'citizen',

        setRole: () => {},

        loggedIn: Boolean(
            auth.token && auth.user
        ),

        setLoggedIn: () => {},

        complaints,

        notifications,

        comments: commentsState.items,

        departments: master.departments,

        categories: master.categories,

        staff: master.staff,

        loading: complaintsState.loading,


        // Update complaint
        updateComplaint: async (id, patch) => {
            const item = complaintsState.items.find(
                (c) =>
                    (c.complaintId || c._id) === id ||
                    c._id === id
            );

            const realId = item?._id || id;


            // Update complaint status
            if (patch.status) {
                return dispatch(
                    updateComplaintStatus({
                        id: realId,

                        status: patch.status
                            .toLowerCase()
                            .replaceAll(' ', '_'),

                        remark: patch.remark,
                    })
                );
            }


            // Update other complaint fields
            return dispatch(
                updateComplaintThunk({
                    id: realId,
                    payload: patch,
                })
            );
        },


        // Refresh complaints according to user's role
        refreshComplaints: () =>
            auth.user?.role === 'citizen'
                ? dispatch(fetchMyComplaints())
                : dispatch(fetchAllComplaints()),

    }), [
        auth.user,
        auth.token,
        complaints,
        notifications,
        commentsState.items,
        master.departments,
        master.categories,
        master.staff,
        complaintsState.loading,
        complaintsState.items,
        dispatch,
    ]);


    return (
        <DemoContext.Provider value={value}>
            {children}
        </DemoContext.Provider>
    );
}


// Custom hook for using DemoContext
export function useDemo() {
    const value = useContext(DemoContext);

    if (!value) {
        throw new Error(
            'useDemo must be used inside DemoProvider'
        );
    }

    return value;
}