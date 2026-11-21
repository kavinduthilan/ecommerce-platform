"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { getUser } from "@/actions/auth/getUser";
import { getSystemMenus } from "@/actions/system-menus/system-menus";
import { getUserMenuPermissions } from "@/actions/user-menu-permission/user-menu-permission";
import { getActiveProductVariants } from "@/actions/product-variants/product-variants";
import { createStockMove, getStockMoves } from "@/actions/stock-moves/stock-moves";
import { StockMove, GetStockMove, GetResponse } from "@/lib/type";
import { StockMoveType } from "@/generated/prisma/enums";

type StockMoveForm = Omit<StockMove, "quantity"> & {
     quantity: string;
};

const emptyForm: StockMoveForm = {
     productVariantId: "",
     type: "IN",
     quantity: "",
     reference: "",
     note: "",
};

const inputClass =
     "border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 w-full text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100";
const labelClass = "text-sm font-medium text-gray-700 dark:text-gray-200";

const typeBadge: Record<StockMoveType, string> = {
     IN: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400",
     OUT: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
     ADJUSTMENT: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
     RETURN: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
};

export default function StockMoves() {
     const [stockMoves, setStockMoves] = useState<GetStockMove[]>([]);
     const [showModal, setShowModal] = useState(false);
     const [error, setError] = useState("");
     const [submitting, setSubmitting] = useState(false);
     const [formData, setFormData] = useState<StockMoveForm>(emptyForm);

     // pagination
     const [page, setPage] = useState(1);
     const [pageSize, setPageSize] = useState(5);
     const [totalPages, setTotalPages] = useState(1);

     const pathname = usePathname();
     const [canAdd, setCanAdd] = useState(false);

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
                         return;
                    }

                    const userPermissions = await getUserMenuPermissions(currentUser.id);
                    const perm = userPermissions.find((p) => p.menuId === currentMenu.id);

                    setCanAdd(!!perm?.canAdd);
               } catch (err) {
                    console.error("Failed to load permissions:", err);
                    setCanAdd(false);
               }
          };

          void loadPermissions();
     }, [pathname]);

     useEffect(() => {
          let cancelled = false;

          const loadStockMoves = async () => {
               try {
                    const result = await getStockMoves(page, pageSize);

                    console.log('stock moves', result);

                    if (!cancelled) {
                         setStockMoves(result.data);
                         setTotalPages(result.totalPages);
                    }
               } catch (err) {
                    if (!cancelled) {
                         console.error("Failed to load stock moves:", err);
                    }
               }
          };

          loadStockMoves();

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

          const payload: StockMove = {
               productVariantId: formData.productVariantId,
               type: formData.type,
               quantity: Number(formData.quantity),
               reference: formData.reference?.trim() || null,
               note: formData.note?.trim() || null,
          };

          setSubmitting(true);
          try {
               await createStockMove(payload);

               setFormData(emptyForm);
               setShowModal(false);
               setPage(1);
               setRefreshKey((prev) => prev + 1);
          } catch (err) {
               setError(err instanceof Error ? err.message : "An error occurred");
               console.error(err);
          } finally {
               setSubmitting(false);
          }
     };

     const handleCloseModal = () => {
          setShowModal(false);
          setFormData(emptyForm);
          setError("");
     };

     const formatQuantity = (item: GetStockMove) => {
          if (item.type === "IN") return `+${item.quantity}`;
          if (item.type === "OUT") return `-${item.quantity}`;
          return item.quantity > 0 ? `+${item.quantity}` : String(item.quantity);
     };

     return (
          <div className="p-6 min-h-screen bg-white dark:bg-[#0f172a] rounded-xl">
               {/* Header */}
               <div className="flex items-center justify-between mb-6">
                    <div>
                         <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                              Stock Moves
                         </h1>
                         <p className="text-sm text-gray-500 dark:text-gray-400">
                              Track every stock movement in and out of inventory
                         </p>
                    </div>

                    <div className="flex gap-3">
                         {canAdd && (
                              <button
                                   onClick={() => setShowModal(true)}
                                   className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 transition text-white rounded-lg text-sm"
                              >
                                   <Plus size={16} /> Add Stock Move
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
                                   <th className="text-left px-4 py-3 font-medium">Type</th>
                                   <th className="text-left px-4 py-3 font-medium">Quantity</th>
                                   <th className="text-left px-4 py-3 font-medium">Reference Id</th>
                                   <th className="text-left px-4 py-3 font-medium">Note</th>
                                   <th className="text-left px-4 py-3 font-medium">Created At</th>
                              </tr>
                         </thead>

                         <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                              {stockMoves.length === 0 ? (
                                   <tr>
                                        <td colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                             No stock moves found
                                        </td>
                                   </tr>
                              ) : (
                                   stockMoves.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                             <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                  {item?.inventory?.productVariant?.name}
                                             </td>
                                             <td className="px-4 py-3">
                                                  <span
                                                       className={`px-2 py-1 rounded-full text-xs font-medium ${typeBadge[item.type]}`}
                                                  >
                                                       {item.type}
                                                  </span>
                                             </td>
                                             <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">
                                                  {formatQuantity(item)}
                                             </td>
                                             <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                  {item.referenceId || "-"}
                                             </td>
                                             <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                                                  {item.reason || "-"}
                                             </td>
                                             <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                                  {new Date(item.createdAt).toLocaleString()}
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
                                   Add Stock Move
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

                                   <div>
                                        <label className={labelClass}>Type</label>
                                        <select
                                             className={inputClass}
                                             value={formData.type}
                                             onChange={(e) =>
                                                  setFormData({ ...formData, type: e.target.value as StockMoveType })
                                             }
                                        >
                                             <option value="In">In (receive stock)</option>
                                             <option value="Out">Out (remove stock)</option>
                                             <option value="Adjustment">Adjustment (+/-)</option>
                                        </select>
                                   </div>

                                   <div>
                                        <label className={labelClass}>Quantity</label>
                                        <input
                                             type="number"
                                             step={1}
                                             min={formData.type === "ADJUSTMENT" ? undefined : 1}
                                             className={inputClass}
                                             value={formData.quantity}
                                             onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                             required
                                        />
                                        {formData.type === "ADJUSTMENT" && (
                                             <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                  Use a negative number to reduce stock.
                                             </p>
                                        )}
                                   </div>

                                   <div>
                                        <label className={labelClass}>Reference</label>
                                        <input
                                             type="text"
                                             maxLength={100}
                                             placeholder="e.g. PO-1024"
                                             className={inputClass}
                                             value={formData.reference ?? ""}
                                             onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                        />
                                   </div>

                                   <div>
                                        <label className={labelClass}>Note</label>
                                        <textarea
                                             rows={3}
                                             maxLength={500}
                                             className={inputClass}
                                             value={formData.note ?? ""}
                                             onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                        />
                                   </div>

                                   <div className="flex gap-2 pt-2">
                                        <button
                                             type="submit"
                                             disabled={submitting}
                                             className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 transition text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                             {submitting ? "Saving..." : "Save"}
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