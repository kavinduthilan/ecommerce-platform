"use client";

import { useState, useEffect,Fragment } from "react";
import { Edit2, Eye, X, ChevronDown, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { getUser } from "@/actions/auth/getUser";
import { getSystemMenus } from "@/actions/system-menus/system-menus";
import { getUserMenuPermissions } from "@/actions/user-menu-permission/user-menu-permission";
import { getActiveProductVariants } from "@/actions/product-variants/product-variants";
import { GetResponse, Customer, GetCustomer } from "@/lib/type";
import { Status } from "@/generated/prisma/enums";
import { getCustomers, updateCustomer, getCustomerOrders } from "@/actions/customers/customers";
import {
     STATUS_STYLES,
     PAYMENT_STATUS_STYLES,
     badgeBase,
     badgeFallback,
     formatLabel,
} from "@/lib/styles";
import { CustomerOrderHistory } from "@/lib/type";



const emptyForm: Customer = {
     name: "",
     email: "",
     phone: 0,
     address: "",
     status: "Active"
};



const inputClass =
     "border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 w-full text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100";
const labelClass = "text-sm font-medium text-gray-700 dark:text-gray-200";

export default function Customers() {
     const [customers, setCustomers] = useState<GetCustomer[]>([]);
     const [showModal, setShowModal] = useState(false);
     const [error, setError] = useState("");
     const [formData, setFormData] = useState<Customer>(emptyForm);
     const [editingId, setEditingId] = useState<number | null>(null);

     const [showHistory, setShowHistory] = useState(false);
     const [history, setHistory] = useState<CustomerOrderHistory | null>(null);
     const [historyLoading, setHistoryLoading] = useState(false);
     const [historyError, setHistoryError] = useState("");
     const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

     const money = (n: number) =>
          n.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

     // pagination
     const [page, setPage] = useState(1);
     const [pageSize, setPageSize] = useState(5);
     const [totalPages, setTotalPages] = useState(1);

     const pathname = usePathname();
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
                         // setCanAdd(false);
                         setCanEdit(false);
                         return;
                    }

                    const userPermissions = await getUserMenuPermissions(currentUser.id);
                    const perm = userPermissions.find((p) => p.menuId === currentMenu.id);

                    // setCanAdd(!!perm?.canAdd);
                    setCanEdit(!!perm?.canEdit);
               } catch (err) {
                    console.error("Failed to load permissions:", err);
                    // setCanAdd(false);
                    setCanEdit(false);
               }
          };

          void loadPermissions();
     }, [pathname]);


     useEffect(() => {
          let cancelled = false;

          const loadCustomers = async () => {
               try {
                    const result = await getCustomers(page, pageSize);

                    if (!cancelled) {
                         setCustomers(result.data);
                         setTotalPages(result.totalPages);
                    }
               } catch (err) {
                    if (!cancelled) {
                         console.error("Failed to load inventories:", err);
                    }
               }
          };

          loadCustomers();

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

          if (!formData.name) {
               setError("Please select a product variant");
               return;
          }

          const payload: Customer = {
               name: formData.name,
               email: formData?.email,
               phone: Number(formData?.phone),
               address: formData?.address,
               status: formData.status
          };

          try {
               if (editingId) {
                    await updateCustomer(editingId, payload);
               } else {
                    // await createCustomer(payload);
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

     const handleEdit = (item: GetCustomer) => {
          setFormData({
               name: item.name,
               email: item.email,
               phone: item.phone,
               address: item.address,
               status: item.status
          });
          setEditingId(item.id);
          setShowModal(true);
     };

     const handleViewHistory = async (customerId: number) => {
          setHistoryError("");
          setHistory(null);
          setExpandedOrderId(null);
          setShowHistory(true);
          setHistoryLoading(true);

          try {
               const result = await getCustomerOrders(customerId);
               if (!result) {
                    setHistoryError("Customer not found.");
               } else {
                    setHistory(result);
               }
          } catch (err) {
               console.error("Failed to load order history:", err);
               setHistoryError("Failed to load order history.");
          } finally {
               setHistoryLoading(false);
          }
     };

     const handleCloseHistory = () => {
          setShowHistory(false);
          setHistory(null);
          setHistoryError("");
          setExpandedOrderId(null);
     };

     const handleCloseModal = () => {
          setShowModal(false);
          setFormData(emptyForm);
          setEditingId(null);
     };

     return (
          <div className="p-6 min-h-screen bg-white dark:bg-[#0f172a] rounded-xl">
               {/* Header */}
               <div className="flex items-center justify-between mb-6">
                    <div>
                         <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                              Customers
                         </h1>
                         <p className="text-sm text-gray-500 dark:text-gray-400">
                              Manage your customers efficiently
                         </p>
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
                                   <th className="text-left px-4 py-3 font-medium">Name</th>
                                   <th className="text-left px-4 py-3 font-medium">Email</th>
                                   <th className="text-left px-4 py-3 font-medium">Phone</th>
                                   <th className="text-left px-4 py-3 font-medium">Address</th>
                                   <th className="text-left px-4 py-3 font-medium">Status</th>
                                   <th className="text-left px-4 py-3 font-medium">Created At</th>
                                   <th className="px-4 py-3">Actions</th>
                              </tr>
                         </thead>

                         <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                              {customers.length === 0 ? (
                                   <tr>
                                        <td colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                             No customers found
                                        </td>
                                   </tr>
                              ) : (
                                   customers.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                             <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                  {item.name ?? ""}
                                             </td>
                                             <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                  {item.email ?? ""}
                                             </td>
                                             <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                  {item.phone ?? ""}
                                             </td>
                                             <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                  {item.address ?? ""}
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

                                             <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                                  {new Date(item.createdAt).toLocaleString()}
                                             </td>
                                             <td className="px-4 py-3">
                                                  <div className="flex items-center justify-center gap-2">
                                                       <button
                                                            onClick={() => handleViewHistory(item.id)}
                                                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                                                            title="View order history"
                                                       >
                                                            <Eye size={18} />
                                                       </button>

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
                                   {editingId ? "Edit Customer" : "Add Customer"}
                              </h2>

                              {error && (
                                   <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                                        {error}
                                   </div>
                              )}

                              <form onSubmit={handleSubmit} className="space-y-4">
                                   <div>
                                        <label className={labelClass}>Name</label>
                                        <input
                                             type="text"
                                             placeholder="Enter the name"
                                             className={inputClass}
                                             value={formData.name}
                                             onChange={(e) =>
                                                  setFormData({ ...formData, name: e.target.value })
                                             }
                                             required
                                        />
                                   </div>

                                   <div>
                                        <label className={labelClass}>Email</label>
                                        <input
                                             type="text"
                                             placeholder="Enter the email"
                                             className={inputClass}
                                             value={formData.email}
                                             onChange={(e) =>
                                                  setFormData({ ...formData, email: e.target.value })
                                             }
                                             required
                                        />
                                   </div>

                                   <div>
                                        <label className={labelClass}>Phone</label>
                                        <input
                                             type="number"
                                             placeholder="Enter the mobile number"
                                             className={inputClass}
                                             value={formData.phone}
                                             onChange={(e) =>
                                                  setFormData({ ...formData, phone: Number(e.target.value) })
                                             }
                                             required
                                        />
                                   </div>

                                   <div>
                                        <label className={labelClass}>Address</label>
                                        <textarea
                                             placeholder="Enter the address"
                                             className={inputClass}
                                             value={formData.address}
                                             onChange={(e) =>
                                                  setFormData({ ...formData, address: e.target.value })
                                             }
                                             required
                                        />
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

               {showHistory && (
                    <div
                         onClick={handleCloseHistory}
                         className="fixed inset-0 bg-black/50 dark:bg-black/40 flex items-center justify-center z-100 p-4"
                    >
                         <div
                              onClick={(e) => e.stopPropagation()}
                              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                         >
                              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                   <h2 className="text-lg font-semibold dark:text-white">
                                        {history ? `Order history: ${history.customer.name}` : "Order history"}
                                   </h2>
                                   <button
                                        onClick={handleCloseHistory}
                                        className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white transition"
                                        title="Close"
                                   >
                                        <X size={20} />
                                   </button>
                              </div>

                              <div className="p-6 space-y-6">
                                   {historyLoading && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
                                   )}

                                   {historyError && (
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                                             {historyError}
                                        </div>
                                   )}

                                   {history && (
                                        <>
                                             {/* Summary */}
                                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                                                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                                                       <p className="text-xs text-gray-400">Total orders</p>
                                                       <p className="text-lg font-semibold text-gray-800 dark:text-white">
                                                            {history.summary.totalOrders}
                                                       </p>
                                                  </div>
                                                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                                                       <p className="text-xs text-gray-400">Total spent</p>
                                                       <p className="text-lg font-semibold text-gray-800 dark:text-white">
                                                            Rs. {money(history.summary.totalSpent)}
                                                       </p>
                                                  </div>
                                                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 col-span-2 sm:col-span-1">
                                                       <p className="text-xs text-gray-400">Contact</p>
                                                       <p className="text-gray-700 dark:text-gray-300 truncate">
                                                            {history.customer.phone}
                                                       </p>
                                                       <p className="text-gray-500 dark:text-gray-400 truncate text-xs">
                                                            {history.customer.email}
                                                       </p>
                                                  </div>
                                             </div>

                                             {/* Orders */}
                                             {history.orders.length === 0 ? (
                                                  <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-6">
                                                       This customer has no orders yet.
                                                  </p>
                                             ) : (
                                                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                                       <table className="w-full text-sm">
                                                            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                                 <tr>
                                                                      <th className="w-8 px-3 py-2" />
                                                                      <th className="text-left px-3 py-2 font-medium">Order #</th>
                                                                      <th className="text-left px-3 py-2 font-medium">Date</th>
                                                                      <th className="text-left px-3 py-2 font-medium">Payment</th>
                                                                      <th className="text-left px-3 py-2 font-medium">Status</th>
                                                                      <th className="text-right px-3 py-2 font-medium">Total</th>
                                                                 </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                                 {history.orders.map((order) => {
                                                                      const expanded = expandedOrderId === order.id;
                                                                      return (
                                                                           <Fragment key={order.id}>
                                                                                <tr
                                                                                     onClick={() => setExpandedOrderId(expanded ? null : order.id)}
                                                                                     className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                                                                                >
                                                                                     <td className="px-3 py-2 text-gray-400">
                                                                                          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                                                     </td>
                                                                                     <td className="px-3 py-2">{order.orderNumber}</td>
                                                                                     <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                                                                                          {new Date(order.createdAt).toLocaleDateString()}
                                                                                     </td>
                                                                                     <td className="px-3 py-2">
                                                                                          <span className={`${badgeBase} ${PAYMENT_STATUS_STYLES[order.paymentStatus] ?? badgeFallback}`}>
                                                                                               {formatLabel(order.paymentStatus)}
                                                                                          </span>
                                                                                     </td>
                                                                                     <td className="px-3 py-2">
                                                                                          <span className={`${badgeBase} ${STATUS_STYLES[order.status] ?? badgeFallback}`}>
                                                                                               {formatLabel(order.status)}
                                                                                          </span>
                                                                                     </td>
                                                                                     <td className="px-3 py-2 text-right">Rs. {money(order.totalAmount)}</td>
                                                                                </tr>

                                                                                {expanded && (
                                                                                     <tr className="bg-gray-50/60 dark:bg-gray-800/40">
                                                                                          <td colSpan={6} className="px-6 py-3">
                                                                                               <table className="w-full text-xs text-gray-600 dark:text-gray-300">
                                                                                                    <thead className="text-gray-400">
                                                                                                         <tr>
                                                                                                              <th className="text-left py-1 font-medium">Product</th>
                                                                                                              <th className="text-left py-1 font-medium">SKU</th>
                                                                                                              <th className="text-right py-1 font-medium">Qty</th>
                                                                                                              <th className="text-right py-1 font-medium">Unit</th>
                                                                                                              <th className="text-right py-1 font-medium">Subtotal</th>
                                                                                                         </tr>
                                                                                                    </thead>
                                                                                                    <tbody>
                                                                                                         {order.orderItems.map((i) => (
                                                                                                              <tr key={i.id}>
                                                                                                                   <td className="py-1">{i.productVariant.name}</td>
                                                                                                                   <td className="py-1">{i.productVariant.sku}</td>
                                                                                                                   <td className="py-1 text-right">{i.quantity}</td>
                                                                                                                   <td className="py-1 text-right">Rs. {money(i.unitPrice)}</td>
                                                                                                                   <td className="py-1 text-right">Rs. {money(i.subtotal)}</td>
                                                                                                              </tr>
                                                                                                         ))}
                                                                                                    </tbody>
                                                                                               </table>
                                                                                               {order.notes && (
                                                                                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                                                                                                         Notes: {order.notes}
                                                                                                    </p>
                                                                                               )}
                                                                                          </td>
                                                                                     </tr>
                                                                                )}
                                                                           </Fragment>
                                                                      );
                                                                 })}
                                                            </tbody>
                                                       </table>
                                                  </div>
                                             )}
                                        </>
                                   )}
                              </div>
                         </div>
                    </div>
               )}
          </div>
     );
}