import Category from "../models/Category.model.js";
import Complaint from "../models/Complaint.model.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/ApiResponse.js";
import catchAsync from "../utils/catchAsync.js";
import { assertValidObjectId } from "../utils/validators.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";
import { logAudit } from "../utils/auditLogger.js";

// POST /api/admin/categories - admin only
const createCategory = catchAsync(async (req, res) => {
  const { name, slug, description, subcategories, defaultDepartment, defaultPriority, slaHours } = req.body;
  if (!name || !slug) throw ApiError.badRequest("name and slug are required");

  const exists = await Category.findOne({ $or: [{ name }, { slug: slug.toLowerCase() }] });
  if (exists) throw ApiError.conflict("A category with this name or slug already exists");

  const category = await Category.create({
    name,
    slug,
    description,
    subcategories,
    defaultDepartment,
    defaultPriority,
    slaHours,
  });

  await logAudit({ actorId: req.user._id, action: "category.create", entityType: "Category", entityId: category._id, after: { name, slug } });

  return sendResponse(res, 201, "Category created", category);
});

// GET /api/categories - public
const getCategories = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";
  else filter.isActive = true; // default: only show active categories to the public

  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 50 });
  const [categories, total] = await Promise.all([
    Category.find(filter).populate("defaultDepartment", "name code").sort({ name: 1 }).skip(skip).limit(limit),
    Category.countDocuments(filter),
  ]);

  return sendResponse(res, 200, "Categories fetched", categories, buildPaginationMeta({ page, limit, total }));
});

// GET /api/categories/:id - public
const getCategoryById = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "category id");
  const category = await Category.findById(req.params.id).populate("defaultDepartment", "name code");
  if (!category) throw ApiError.notFound("Category not found");
  return sendResponse(res, 200, "Category fetched", category);
});

// PATCH /api/admin/categories/:id - admin only
const updateCategory = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "category id");
  const allowed = ["name", "slug", "description", "subcategories", "defaultDepartment", "defaultPriority", "slaHours", "isActive"];
  const updates = {};
  for (const field of allowed) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!category) throw ApiError.notFound("Category not found");

  await logAudit({ actorId: req.user._id, action: "category.update", entityType: "Category", entityId: category._id, after: updates });

  return sendResponse(res, 200, "Category updated", category);
});

// DELETE /api/admin/categories/:id - admin only, guarded
const deleteCategory = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "category id");
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound("Category not found");

  const complaintCount = await Complaint.countDocuments({ category: category._id });
  if (complaintCount > 0) {
    throw ApiError.badRequest("This category has existing complaints and cannot be deleted. Deactivate it instead.");
  }

  await category.deleteOne();
  await logAudit({ actorId: req.user._id, action: "category.delete", entityType: "Category", entityId: category._id });

  return sendResponse(res, 200, "Category deleted", null);
});

// GET /api/admin/categories/:id/statistics - admin only
const getCategoryStatistics = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "category id");
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound("Category not found");

  const [statusBreakdown, totalComplaints] = await Promise.all([
    Complaint.aggregate([
      { $match: { category: category._id, isDeleted: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Complaint.countDocuments({ category: category._id, isDeleted: false }),
  ]);

  return sendResponse(res, 200, "Category statistics fetched", {
    category: { _id: category._id, name: category.name },
    totalComplaints,
    statusBreakdown,
  });
});

export {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoryStatistics,
};
