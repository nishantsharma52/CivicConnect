export const sameId = (left, right) =>
    left !== undefined && left !== null &&
    right !== undefined && right !== null &&
    String(left) === String(right);

export const isAdmin = (user) => user?.role === "admin";

export const isCitizenOwner = (complaint, user) =>
    user?.role === "citizen" && sameId(complaint?.citizen, user.userId);

export const isDepartmentMember = (complaint, user) => {
    if (user?.role !== "department") return false;

    return (
        sameId(complaint?.department, user.department) ||
        sameId(complaint?.assignedTo, user.userId)
    );
};

export const canAccessComplaint = (complaint, user) =>
    isAdmin(user) || isCitizenOwner(complaint, user) || isDepartmentMember(complaint, user);

export const canManageComplaint = (complaint, user) =>
    isAdmin(user) || isDepartmentMember(complaint, user);
