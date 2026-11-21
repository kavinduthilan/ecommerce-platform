"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { getUser } from "@/actions/auth/getUser";
import { getSystemMenus } from "@/actions/system-menus/system-menus";
import { getUserMenuPermissions } from "@/actions/user-menu-permission/user-menu-permission";
import { getActiveProductVariants } from "@/actions/product-variants/product-variants";
import {
     createInventories,
     getInventories,
     updateInventory,
} from "@/actions/inventory/inventory";
import { Inventory, GetInventory, GetResponse } from "@/lib/type";
import { Status } from "@/generated/prisma/enums";

type InventoryForm = Omit<
     Inventory,
     "quantity" | "reversedQuantity" | "availableQuantity" | "reorderLevel" | "status"
> & {
     quantity: string;
     reversedQuantity: string;
     availableQuantity: string;
     reorderLevel: string;
     status: Status
};

const emptyForm: InventoryForm = {
     productVariantId: "",
     quantity: "",
     reversedQuantity: "",
     availableQuantity: "",
     reorderLevel: "",
     status: "Active"
};



const inputClass =
     "border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 w-full text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100";
const labelClass = "text-sm font-medium text-gray-700 dark:text-gray-200";

export default function Inventory() {
     const [inventories, setInventories] = useState<GetInventory[]>([]);
     const [showModal, setShowModal] = useState(false);
     const [error, setError] = useState("");
     const [formData, setFormData] = useState<InventoryForm>(emptyForm);
     const [editingId, setEditingId] = useState<number | null>(null);

     // pagination
     const [page, setPage] = useState(1);
     const [pageSize, setPageSize] = useState(5);
     const [totalPages, setTotalPages] = useState(1);

     const pathname = usePathname();
     const [canAdd, setCanAdd] = useState(false);
     const [canEdit, setCanEdit] = useState(false);

     const [productVariants, setProductVariants] = useState<GetResponse[]>([]);
     const [refreshKey, setRefreshKey] = useState(0);

     useEffect(() => {
          const loadPermissions = async () => {
               try {
                    const currentUser = await getUser();
                    if (!currentUser) return;

                    const menus = await getSystemMenus();
                    const currentMenu = menus.find((m) => m.path === pathname);
                    if (!currentMenu) {
                         setCanAdd(false);
                         setCanEdit(false);
                         return;
                    }

                    const userPermissions = await getUserMenuPermissions(currentUser.id);
                    const perm = userPermissions.find((p) => p.menuId === currentMenu.id);

                    setCanAdd(!!perm?.canAdd);
                    setCanEdit(!!perm?.canEdit);
               } catch (err) {
                    console.error("Failed to load permissions:", err);
                    setCanAdd(false);
                    setCanEdit(false);
               }
          };

          void loadPermissions();
     }, [pathname]);


     useEffect(() => {
          let cancelled = false;

          const loadInventories = async () => {
               try {
                    const result = await getInventories(page, pageSize);

                    if (!cancelled) {
                         setInventories(result.data);
                         setTotalPages(result.totalPages);
                    }
               } catch (err) {
                    if (!cancelled) {
                         console.error("Failed to load inventories:", err);
                    }
               }
          };

          loadInventories();

          return () => {
               cancelled = true;
          };
     }, [page, pageSize, refreshKey]);

     useEffect(() => {
          let cancelled = false;

          const loadProductVariants = async () => {
               try {
                    const response = await getActiveProductVariants();

                    if (!cancelled) {
                         setProductVariants(response);
                    }
               } catch (err) {
                    if (!cancelled) {
                         console.error("Failed to load product variants:", err);
                    }
               }
          };

          loadProductVariants();

          return () => {
               cancelled = true;
          };
     }, []);


     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setError("");

          if (!formData.productVariantId) {
               setError("Please select a product variant");
               return;
          }

          const payload: Inventory = {
               productVariantId: formData.productVariantId,
               quantity: Number(formData.quantity),
               reversedQuantity: Number(formData.reversedQuantity),
               availableQuantity: Number(formData.availableQuantity),
               reorderLevel: Number(formData.reorderLevel),
               status: formData.status
          };

          try {
               if (editingId) {
                    await updateInventory(editingId, payload);
               } else {
                    await createInventories(payload);
               }

               setFormData(emptyForm);
               setEditingId(null);
               setShowModal(false);

               setRefreshKey((prev) => prev + 1);
          } catch (err) {
               setError(err instanceof Error ? err.message : "An error occurred");
               console.error(err);
          }
     };

     const handleEdit = (item: GetInventory) => {
          setFormData({
               productVariantId: String(item.productVariantId),
               quantity: String(item.quantity),
               reversedQuantity: String(item.reversedQuantity),
               availableQuantity: String(item.availableQuantity),
               reorderLevel: String(item.reorderLevel),
               status: item.status
          });
          setEditingId(item.id);
          setShowModal(true);
     };

     const handleCloseModal = () => {
          setShowModal(false);
          setFormData(emptyForm);
          setEditingId(null);
     };

     const numberField = (
          label: string,
          key: "quantity" | "reversedQuantity" | "availableQuantity" | "reorderLevel"
     ) => (
          <div>
               <label className={labelClass}>{label}</label>
               <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={formData[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    required
               />
          </div>
     );

     return (
          <div className="p-6 min-h-screen bg-white dark:bg-[#0f172a] rounded-xl">
               {/* Header */}
               <div className="flex items-center justify-between mb-6">
                    <div>
                         <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                              Inventories
                         </h1>
                         <p className="text-sm text-gray-500 dark:text-gray-400">
                              Manage your inventory efficiently
                         </p>
                    </div>

                    <div className="flex gap-3">
                         {canAdd && (
                              <button
                                   onClick={() => setShowModal(true)}
                                   className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 transition text-white rounded-lg text-sm"
                              >
                                   <Plus size={16} /> Add Inventory
                              </button>
                         )}
                    </div>
               </div>

               {error && !showModal && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                         {error}
                    </div>
               )}

               {/* Table */}
               <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <table className="w-full text-sm">
                         <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                              <tr>
                                   <th className="text-left px-4 py-3 font-medium">Product Variant</th>
                                   <th className="text-left px-4 py-3 font-medium">Quantity</th>
                                   <th className="text-left px-4 py-3 font-medium">Reversed Quantity</th>
                                   <th className="text-left px-4 py-3 font-medium">Available Quantity</th>
                                   <th className="text-left px-4 py-3 font-medium">Reorder Level</th>
                                   <th className="text-left px-4 py-3 font-medium">Status</th>
                                   <th className="text-left px-4 py-3 font-medium">Created By</th>
                                   <th className="text-left px-4 py-3 font-medium">Created At</th>
                                   <th className="px-4 py-3">Actions</th>
                              </tr>
                         </thead>

                         <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                              {inventories.length === 0 ? (
                                   <tr>
                                        <td colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                             No inventories found
                                        </td>
                                   </tr>
                              ) : (
                                   inventories.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                             <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                  {item.productVariant.name}
                                             </td>
                                             <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.quantity}</td>
                                             <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                  {item.reversedQuantity}
                                             </td>
                                             <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                  {item.availableQuantity}
                                             </td>
                                             <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                  {item.reorderLevel}
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
                                                  {new Date(item.createdAt).toLocaleString()}
                                             </td>
                                             <td className="px-4 py-3">
                                                  <div className="flex items-center justify-center gap-2">
                                                       {canEdit && (
                                                            <button
                                                                 onClick={() => handleEdit(item)}
                                                                 className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                                                                 title="Edit"
                                                            >
                                                                 <Edit2 size={18} />
                                                            </button>
                                                       )}
                                                  </div>
                                             </td>
                                        </tr>
                                   ))
                              )}
                         </tbody>
                    </table>

                    {/* Pagination */}
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

               {/* Modal */}
               {showModal && (
                    <div
                         onClick={handleCloseModal}
                         className="fixed inset-0 bg-black/50 dark:bg-black/40 flex items-center justify-center z-100"
                    >
                         <div
                              onClick={(e) => e.stopPropagation()}
                              className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-lg"
                         >
                              <h2 className="text-lg font-semibold mb-4 dark:text-white">
                                   {editingId ? "Edit Inventory" : "Add Inventory"}
                              </h2>

                              {error && (
                                   <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                                        {error}
                                   </div>
                              )}

                              <form onSubmit={handleSubmit} className="space-y-4">
                                   <div>
                                        <label className={labelClass}>Product Variant</label>
                                        <select
                                             className={inputClass}
                                             value={formData.productVariantId}
                                             onChange={(e) =>
                                                  setFormData({ ...formData, productVariantId: e.target.value })
                                             }
                                             required
                                        >
                                             <option value="">Select Product Variant</option>
                                             {productVariants.map((variant) => (
                                                  <option key={variant.id} value={variant.id}>
                                                       {variant.name}
                                                  </option>
                                             ))}
                                        </select>
                                   </div>

                                   {numberField("Quantity", "quantity")}
                                   {numberField("Reversed Quantity", "reversedQuantity")}
                                   {numberField("Available Quantity", "availableQuantity")}
                                   {numberField("Reorder Level", "reorderLevel")}


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