"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Edit2, ImagePlus, X } from "lucide-react";
import { createCategory, getCategories, updateCategory } from "@/actions/categories/category";
import { Status } from "@/generated/prisma/enums";

interface Category {
  id: number;
  name: string;
  imageUrl: string | null;
  status: Status;
  createdAt: Date;
  createdBy: { name: string };
}



export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<{ name: string; status: Status }>({
    name: "",
    status: "Active",
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);


  // filters
  const [filters, setFilters] = useState({
    id: "",
    name: "",
    status: "",
    createdBy: "",
    createdAt: "",
  });

  // component.tsx
  const fetchCategories = useCallback(async () => {
    try {
      const data = await getCategories();

      setCategories(data);
    } catch (error) {
      console.error("Supabase error:", error);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchCategories();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fetchCategories]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [filters]);


  const MAX_SIZE = 2 * 1024 * 1024;

  const resetForm = () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setFormData({ name: "", status: "Active" });
    setEditingId(null);
    setImageFile(null);
    setPreview(null);
    setRemoveImage(false);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPG, PNG or WEBP images are allowed");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Image must be under 2MB");
      return;
    }

    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setError("");
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const handleRemoveImage = () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setImageFile(null);
    setPreview(null);
    setRemoveImage(true); // tells the server to delete the saved image
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Please enter a category");
      return;
    }

    try {
      const body = new FormData();
      body.append("name", formData.name);
      body.append("status", formData.status);
      if (imageFile) body.append("image", imageFile);

      if (editingId) {
        body.append("removeImage", String(removeImage));
        await updateCategory(editingId, body);
      } else {
        await createCategory(body);
      }

      resetForm();
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error(err);
    }
  };

  const handleEdit = (item: Category) => {
    resetForm();
    setFormData({ name: item.name, status: item.status });
    setEditingId(item.id);
    setPreview(item.imageUrl); // show the existing image
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  return (
    <div className="p-6 min-h-screen bg-white dark:bg-[#0f172a] rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Categories
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your product categories efficiently
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 transition text-white rounded-lg text-sm"
          >
            <Plus size={16} /> Add Category
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">

        <>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Id</th>
                <th className="text-left px-4 py-3 font-medium">Category Name</th>
                <th className="text-left px-4 py-3 font-medium">Image</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Created By</th>
                <th className="text-left px-4 py-3 font-medium">Created At</th>
                <th className="px-4 py-3">Actions</th>
              </tr>

            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {categories?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No categories found
                  </td>
                </tr>
              ) : (
                categories?.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">
                      {item.id}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {item.name}
                    </td>
                    <td className="px-4 py-3">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-10 w-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                          <ImagePlus size={16} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === "Active"
                            ? "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
                            : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                          }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {item.createdBy.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {item.createdAt.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )))}
            </tbody>
          </table>

          {/* pagination */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">

            {/* Page Category */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="border border-gray-300 dark:border-gray-600
               bg-white dark:bg-gray-800
               text-gray-800 dark:text-gray-200
               px-2 py-1 rounded focus:outline-none focus:ring-2
               focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>

            {/* Page Controls */}
            <div className="flex items-center gap-2">

              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border rounded
                 border-gray-300 dark:border-gray-600
                 text-gray-700 dark:text-gray-300
                 bg-white dark:bg-gray-800
                 hover:bg-gray-100 dark:hover:bg-gray-700
                 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>

              <span className="px-3 py-1 text-gray-700 dark:text-gray-300">
                {page} / {totalPages}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border rounded
                 border-gray-300 dark:border-gray-600
                 text-gray-700 dark:text-gray-300
                 bg-white dark:bg-gray-800
                 hover:bg-gray-100 dark:hover:bg-gray-700
                 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>

            </div>
          </div>
        </>

      </div>



      {/* Modal */}
      {showModal && (
        <div
          onClick={handleCloseModal}
          className="fixed inset-0 bg-black/50 dark:bg-black/40 flex items-center justify-center z-500"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-lg"
          >
            <h2 className="text-lg font-semibold mb-4 dark:text-white">
              {editingId ? "Edit Category" : "Add Category"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder=""
                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 w-full text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Category Image
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />

                {preview ? (
                  <div className="relative mt-1 w-32 h-32">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-32 h-32 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-red-600 hover:bg-red-700 text-white"
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1 w-full flex flex-col items-center justify-center gap-1 py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition"
                  >
                    <ImagePlus size={22} />
                    Click to upload (JPG, PNG, WEBP, max 2MB)
                  </button>
                )}

                {preview && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Change image
                  </button>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Status
                </label>
                <select
                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 w-full text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as Status })
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Deactivated">Deactivated</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 transition text-white rounded-lg text-sm font-medium"
                >
                  {editingId ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 transition text-gray-900 dark:text-white rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}