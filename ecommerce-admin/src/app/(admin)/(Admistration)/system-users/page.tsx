"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Settings, X } from "lucide-react";
import { createUser, getUsers, updateUser } from "@/actions/users/users";
import { getSystemMenuSections } from "@/actions/system-menu-sections/system-menu-sections";
import { getSystemMenus } from "@/actions/system-menus/system-menus";
import { Status } from "@/generated/prisma/enums";
import { User, CreateUser, UserMenuPermission, UserSectionPermission } from "@/lib/type";
import { createUserMenuPermissions, getUserMenuPermissions } from "@/actions/user-menu-permission/user-menu-permission";
import {
  createUserSectionPermissions,
  getUserSectionPermissions,
} from "@/actions/user-section-permission/user-section-permission";

type MenuSection = {
  id: number;
  name: string;
  status: Status;
  createdAt: Date;
};

type Menu = {
  id: number;
  name: string;
  path: string;
  status: Status;
  sectionId: number;
  createdAt: Date;
};

// ---- Permission types -------------------------------------------------------
type PermissionKey = "canView" | "canAdd" | "canEdit";

type MenuPermission = Record<PermissionKey, boolean>;

const EMPTY_PERMISSION: MenuPermission = {
  canView: false,
  canAdd: false,
  canEdit: false,
};

const PERMISSION_COLUMNS: { key: PermissionKey; label: string }[] = [
  { key: "canView", label: "View" },
  { key: "canAdd", label: "Add" },
  { key: "canEdit", label: "Edit" },
];

const applyPermissionChange = (
  current: MenuPermission,
  key: PermissionKey,
  value: boolean
): MenuPermission => {
  const next = { ...current, [key]: value };

  if (key === "canView" && !value) {
    next.canAdd = false;
    next.canEdit = false;
  }
  if ((key === "canAdd" || key === "canEdit") && value) {
    next.canView = true;
  }
  return next;
};

const isFullyGranted = (p?: MenuPermission) => !!(p?.canView && p?.canAdd && p?.canEdit);
const isAnyGranted = (p?: MenuPermission) => !!(p?.canView || p?.canAdd || p?.canEdit);

// Checkbox that supports the "some selected" (indeterminate) state
function PermissionCheckbox({
  checked,
  indeterminate = false,
  disabled = false,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate && !checked;
      }}
      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
    />
  );
}

const PERMISSION_GRID = "grid grid-cols-[1fr_4rem_4rem_4rem] items-center";

export default function SystemUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<CreateUser>({
    name: "",
    email: "",
    password: "",
    status: "Active",
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages] = useState(1);

  // filters
  const [filters] = useState({
    id: "",
    name: "",
    status: "",
    createdBy: "",
    createdAt: "",
  });

  // permission modal
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionUser, setPermissionUser] = useState<User | null>(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionError, setPermissionError] = useState("");
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [menuDataLoaded, setMenuDataLoaded] = useState(false);

  // menuId -> { canView, canAdd, canEdit }
  const [permissions, setPermissions] = useState<Record<number, MenuPermission>>({});
  // sectionId -> enabled (independent of menus, so empty sections work)
  const [sectionEnabled, setSectionEnabled] = useState<Record<number, boolean>>({});

  const [, setUserMenuPermissions] = useState<UserMenuPermission[]>([]);
  const [, setUserSectionPermissions] = useState<UserSectionPermission[]>([]);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Supabase error:", error);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchUsers();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fetchUsers]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [filters]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Please enter a name");
      return;
    }

    try {
      if (editingId) {
        await updateUser(editingId, formData.name, formData.email, formData.password);
      } else {
        await createUser(formData.name, formData.email, formData.password);
      }

      setFormData({ name: "", email: "", password: "", status: "Active" });
      setEditingId(null);
      setShowModal(false);
      setError("");

      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error(err);
    }
  };

  // Handle edit
  const handleEdit = (user: User) => {
    setFormData({ name: user.name, email: user.email, password: user.password, status: user.status });
    setEditingId(user.id);
    setShowModal(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ name: "", email: "", password: "", status: "Active" });
    setEditingId(null);
  };

  // Load sections + menus once, lazily, the first time the permission modal is opened
  const ensureMenuDataLoaded = useCallback(async () => {
    if (menuDataLoaded) return;
    const [sectionData, menuData] = await Promise.all([
      getSystemMenuSections(),
      getSystemMenus(),
    ]);
    setSections(sectionData as MenuSection[]);
    setMenus(menuData as Menu[]);
    setMenuDataLoaded(true);
  }, [menuDataLoaded]);

  // Get user menu permissions
  const loadUserMenuPermissions = useCallback(async (userId: number) => {
    const result = await getUserMenuPermissions(userId);
    setUserMenuPermissions(result);
    return result;
  }, []);

  // Get user section permissions (previously called getUserMenuPermissions by mistake)
  const loadUserSectionPermissions = useCallback(async (userId: number) => {
    const result = await getUserSectionPermissions(userId);
    setUserSectionPermissions(result);
    return result;
  }, []);

  // Handle opening the permission modal for a user
  const handleOpenPermissions = async (user: User) => {
    setPermissionUser(user);
    setShowPermissionModal(true);
    setPermissionError("");
    setPermissionsLoading(true);
    setPermissions({});
    setSectionEnabled({});

    try {
      await ensureMenuDataLoaded();
      const savedMenuPermissions = await loadUserMenuPermissions(user.id);
      const savedSectionPermissions = await loadUserSectionPermissions(user.id);

      const initialPermissions: Record<number, MenuPermission> = {};
      savedMenuPermissions.forEach((p) => {
        initialPermissions[p.menuId] = {
          canView: p.canView,
          canAdd: p.canAdd,
          canEdit: p.canEdit,
        };
      });
      setPermissions(initialPermissions);

      const initialSections: Record<number, boolean> = {};
      savedSectionPermissions.forEach((p) => {
        initialSections[p.sectionId] = p.isEnabled;
      });
      setSectionEnabled(initialSections);
    } catch (err) {
      setPermissionError(err instanceof Error ? err.message : "Failed to load permissions");
      console.error(err);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handleClosePermissionModal = () => {
    setShowPermissionModal(false);
    setPermissionUser(null);
    setPermissions({});
    setSectionEnabled({});
    setPermissionError("");
  };

  // Toggle a single permission (view / add / edit) on a single menu,
  // and keep the parent section's enabled flag in sync
  const handleTogglePermission = (menuId: number, key: PermissionKey) => {
    const current = permissions[menuId] ?? EMPTY_PERMISSION;
    const updated = applyPermissionChange(current, key, !current[key]);
    const nextPermissions = { ...permissions, [menuId]: updated };
    setPermissions(nextPermissions);

    const menu = menus.find((m) => m.id === menuId);
    if (menu) {
      const anyGranted = menus
        .filter((m) => m.sectionId === menu.sectionId)
        .some((m) => isAnyGranted(nextPermissions[m.id]));
      setSectionEnabled((prev) => ({ ...prev, [menu.sectionId]: anyGranted }));
    }
  };

  // Section checkbox: grants (or clears) the section and all its menus.
  // Works even when the section has no menus.
  const handleToggleSection = (sectionId: number, sectionMenuIds: number[]) => {
    const allMenusGranted = sectionMenuIds.every((id) => isFullyGranted(permissions[id]));
    const fullyOn = !!sectionEnabled[sectionId] && allMenusGranted;
    const enable = !fullyOn;

    setSectionEnabled((prev) => ({ ...prev, [sectionId]: enable }));

    if (sectionMenuIds.length > 0) {
      setPermissions((prev) => {
        const next = { ...prev };
        sectionMenuIds.forEach((id) => {
          next[id] = enable
            ? { canView: true, canAdd: true, canEdit: true }
            : { ...EMPTY_PERMISSION };
        });
        return next;
      });
    }
  };

  const handleSavePermissions = async () => {
    if (!permissionUser) return;
    setPermissionsLoading(true);
    setPermissionError("");

    try {
      const menuPayload: UserMenuPermission[] = Object.entries(permissions)
        .filter(([, p]) => isAnyGranted(p))
        .map(([menuId, p]) => ({
          userId: permissionUser.id,
          menuId: Number(menuId),
          canView: p.canView,
          canAdd: p.canAdd,
          canEdit: p.canEdit,
        }));

      // Sections come from their own state, not from menus
      const sectionPayload: UserSectionPermission[] = sections
        .filter((s) => sectionEnabled[s.id])
        .map((s) => ({
          userId: permissionUser.id,
          isEnabled: true,
          sectionId: s.id,
        }));

      await createUserMenuPermissions(permissionUser.id, menuPayload);
      await createUserSectionPermissions(permissionUser.id, sectionPayload);

      handleClosePermissionModal();
    } catch (err) {
      setPermissionError(err instanceof Error ? err.message : "Failed to save permissions");
      console.error(err);
    } finally {
      setPermissionsLoading(false);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-white dark:bg-[#0f172a] rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">System Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your users efficiently</p>
        </div>

        <div className="flex gap-3"> 
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 transition text-white rounded-lg text-sm"
          >
            <Plus size={16} /> Add User
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
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Created At</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {users?.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No users found
                </td>
              </tr>
            ) : (
              users?.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === "Active"
                          ? "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
                          : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                      }`}
                    >
                      {item.status}
                    </span>
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

                      <button
                        onClick={() => handleOpenPermissions(item)}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                        title="Permission"
                      >
                        <Settings size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
          </select>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>

            <span className="px-3 py-1 text-gray-700 dark:text-gray-300">
              {page} / {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit User Modal */}
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
              {editingId ? "Edit User" : "Add User"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
                <input
                  type="text"
                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 w-full text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
                <input
                  type="text"
                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 w-full text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Status</label>
                <select
                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 w-full text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Status })}
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

      {/* Permission Modal */}
      {showPermissionModal && permissionUser && (
        <div
          onClick={handleClosePermissionModal}
          className="fixed inset-0 bg-black/50 dark:bg-black/40 flex items-center justify-center z-500"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[85vh] flex flex-col"
          >
            <div className="flex items-start justify-between mb-1">
              <div>
                <h2 className="text-lg font-semibold dark:text-white">Permissions</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {permissionUser.name} &middot; {permissionUser.email}
                </p>
              </div>
              <button
                onClick={handleClosePermissionModal}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {permissionError && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                {permissionError}
              </div>
            )}

            {/* Column headings */}
            <div
              className={`${PERMISSION_GRID} mt-4 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800`}
            >
              <span>Menu</span>
              {PERMISSION_COLUMNS.map((col) => (
                <span key={col.key} className="text-center">
                  {col.label}
                </span>
              ))}
            </div>

            <div className="overflow-y-auto flex-1 pr-1 pt-3 space-y-4">
              {permissionsLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
                  Loading permissions...
                </p>
              ) : sections.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
                  No menu sections found
                </p>
              ) : (
                sections.map((section) => {
                  const sectionMenus = menus.filter((m) => m.sectionId === section.id);
                  const sectionMenuIds = sectionMenus.map((m) => m.id);

                  const enabled = !!sectionEnabled[section.id];
                  const allMenusGranted = sectionMenuIds.every((id) => isFullyGranted(permissions[id]));
                  const allGranted = enabled && allMenusGranted;

                  return (
                    <div
                      key={section.id}
                      className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
                    >
                      {/* Section row: toggles the section itself plus every menu in it.
                          Works even when the section has no menus. */}
                      <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 cursor-pointer">
                        <PermissionCheckbox
                          label={`All permissions in ${section.name}`}
                          checked={allGranted}
                          indeterminate={enabled && !allGranted}
                          onChange={() => handleToggleSection(section.id, sectionMenuIds)}
                        />
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {section.name}
                        </span>
                      </label>

                      {/* Menu rows */}
                      {sectionMenus.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-gray-500 px-3 py-3">
                          No menus in this section
                        </p>
                      ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                          {sectionMenus.map((menu) => {
                            const perm = permissions[menu.id] ?? EMPTY_PERMISSION;

                            return (
                              <div
                                key={menu.id}
                                className={`${PERMISSION_GRID} px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition`}
                              >
                                <span className="text-sm text-gray-600 dark:text-gray-300 pl-6">
                                  {menu.name}
                                </span>
                                {PERMISSION_COLUMNS.map((col) => (
                                  <div key={col.key} className="flex justify-center">
                                    <PermissionCheckbox
                                      label={`${col.label} ${menu.name}`}
                                      checked={perm[col.key]}
                                      onChange={() => handleTogglePermission(menu.id, col.key)}
                                    />
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex gap-2 pt-4 mt-2 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={handleSavePermissions}
                disabled={permissionsLoading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 transition text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleClosePermissionModal}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 transition text-gray-900 dark:text-white rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}