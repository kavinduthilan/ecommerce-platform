"use client";

import { useState, useEffect } from "react";
import { Eye, X, Pencil } from "lucide-react";
import { usePathname } from "next/navigation";
import { getUser } from "@/actions/auth/getUser";
import { getSystemMenus } from "@/actions/system-menus/system-menus";
import { getUserMenuPermissions } from "@/actions/user-menu-permission/user-menu-permission";
import {
     getOrder,
     getOrders
} from "@/actions/orders/orders";
import { OrderRow } from "@/lib/type";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import { updateOrderStatus } from "@/actions/orders/orders";


const STATUS_STYLES: Record<string, string> = {
     PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
     PROCESSING: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
     SHIPPED: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
     DELIVERED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
     CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
     REFUNDED: "bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
     UNPAID: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
     PARTIALLY_PAID: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
     PAID: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
     REFUNDED: "bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300",
};

const badgeBase = "px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap";
const fallback = "bg-gray-100 text-gray-600 dark:bg-gray-700/40 dark:text-gray-300";

// Optional: turn PARTIALLY_PAID into "Partially Paid"
const formatLabel = (value: string) =>
     value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());


export default function Order() {
     const [orders, setOrders] = useState<OrderRow[]>([]);
     const [showModal, setShowModal] = useState(false);
     const [error, setError] = useState("");

     const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
     const [viewLoading, setViewLoading] = useState(false);



     const [editOrder, setEditOrder] = useState<OrderRow | null>(null);
     const [editStatus, setEditStatus] = useState<OrderStatus>("PENDING");
     const [editPayment, setEditPayment] = useState<PaymentStatus>("UNPAID");
     const [saving, setSaving] = useState(false);

     // pagination
     const [page, setPage] = useState(1);
     const [pageSize, setPageSize] = useState(5);
     const [totalPages, setTotalPages] = useState(1);

     const pathname = usePathname();


     useEffect(() => {
          const loadPermissions = async () => {
               try {
                    const currentUser = await getUser();
                    if (!currentUser) return;

                    const menus = await getSystemMenus();
                    const currentMenu = menus.find((m) => m.path === pathname);
                    if (!currentMenu) {
                         // setCanAdd(false);
                         // setCanEdit(false);
                         return;
                    }

                    const userPermissions = await getUserMenuPermissions(currentUser.id);
                    const perm = userPermissions.find((p) => p.menuId === currentMenu.id);

                    // setCanAdd(!!perm?.canAdd);
                    // setCanEdit(!!perm?.canEdit);
               } catch (err) {
                    console.error("Failed to load permissions:", err);
                    // setCanAdd(false);
                    // setCanEdit(false);
               }
          };

          void loadPermissions();
     }, [pathname]);


     useEffect(() => {
          let cancelled = false;

          const loadOrders = async () => {
               try {
                    const response = await getOrders();

                    if (!cancelled) {
                         setOrders(response);
                    }
               } catch (err) {
                    if (!cancelled) {
                         console.error("Failed to load orders:", err);
                    }
               }
          };

          loadOrders();

          return () => {
               cancelled = true;
          };
     }, []);


     const handleView = async (id: number) => {
          setError("");
          setSelectedOrder(null);
          setShowModal(true);
          setViewLoading(true);

          try {
               const order = await getOrder(id);
               if (!order) {
                    setError("Order not found.");
               } else {
                    setSelectedOrder(order);
               }
          } catch (err) {
               console.error("Failed to load order:", err);
               setError("Failed to load order details.");
          } finally {
               setViewLoading(false);
          }
     };

     const handleUpdate = (id: number) => {
          const order = orders.find((o) => o.id === id);
          if (!order) return;
          setError("");
          setEditOrder(order);
          setEditStatus(order.status as OrderStatus);
          setEditPayment(order.paymentStatus as PaymentStatus);
     };

     const handleSave = async () => {
          if (!editOrder) return;
          setSaving(true);
          setError("");

          const result = await updateOrderStatus({
               orderId: editOrder.id,
               status: editStatus,
               paymentStatus: editPayment,
          });

          if (result.success) {
               setOrders((prev) =>
                    prev.map((o) => (o.id === result.order.id ? result.order : o))
               );
               setEditOrder(null);
          } else {
               setError(result.error);
          }
          setSaving(false);
     };



     const handleCloseModal = () => {
          setShowModal(false);
          setSelectedOrder(null);
          setError("");
     };

     const money = (n: number) =>
          n.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });



     return (
          <div className="p-6 min-h-screen bg-white dark:bg-[#0f172a] rounded-xl">
               {/* Header */}
               <div className="flex items-center justify-between mb-6">
                    <div>
                         <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                              Orders
                         </h1>
                         <p className="text-sm text-gray-500 dark:text-gray-400">
                              Manage your customers orders efficiently
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
                                   <th className="text-left px-4 py-3 font-medium">Order #</th>
                                   <th className="text-left px-4 py-3 font-medium">Customer</th>
                                   <th className="text-left px-4 py-3 font-medium">Phone</th>
                                   <th className="text-left px-4 py-3 font-medium">Payment Status</th>
                                   <th className="text-left px-4 py-3 font-medium">Status</th>
                                   <th className="text-left px-4 py-3 font-medium">Amount</th>
                                   <th className="text-left px-4 py-3 font-medium">Created At</th>
                                   <th className="px-4 py-3">Actions</th>
                              </tr>
                         </thead>

                         <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                              {orders.length === 0 ? (
                                   <tr>
                                        <td colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                             No orders found
                                        </td>
                                   </tr>
                              ) : (
                                   orders.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                             <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                  {item.orderNumber}
                                             </td>
                                             <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                  {item.customer.name}
                                             </td>
                                             <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                  {item.customer.phone}
                                             </td>
                                             <td className="px-4 py-3">
                                                  <span
                                                       className={`${badgeBase} ${PAYMENT_STATUS_STYLES[item.paymentStatus] ?? fallback}`}
                                                  >
                                                       {formatLabel(item.paymentStatus)}
                                                  </span>
                                             </td>
                                             <td className="px-4 py-3">
                                                  <span
                                                       className={`${badgeBase} ${STATUS_STYLES[item.status] ?? fallback}`}
                                                  >
                                                       {formatLabel(item.status)}
                                                  </span>
                                             </td>
                                             <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                  Rs. {item.totalAmount}
                                             </td>
                                             <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                                  {new Date(item.createdAt).toLocaleString()}
                                             </td>
                                             <td className="px-4 py-3">
                                                  <div className="flex items-center justify-center gap-2">

                                                       <button
                                                            onClick={() => handleView(item.id)}
                                                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                                                            title="Edit"
                                                       >
                                                            <Eye size={18} />
                                                       </button>

                                                       <button
                                                            onClick={() => handleUpdate(item.id)}
                                                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                                                            title="Edit"
                                                       >
                                                            <Pencil size={18} />
                                                       </button>

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


               {showModal && (
                    <div
                         onClick={handleCloseModal}
                         className="fixed inset-0 bg-black/50 dark:bg-black/40 flex items-center justify-center z-100 p-4"
                    >
                         <div
                              onClick={(e) => e.stopPropagation()}
                              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                         >
                              {/* Header */}
                              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                   <h2 className="text-lg font-semibold dark:text-white">
                                        {selectedOrder ? `Order No. : ${selectedOrder.orderNumber}` : "Order details"}
                                   </h2>
                                   <button
                                        onClick={handleCloseModal}
                                        className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white transition"
                                        title="Close"
                                   >
                                        <X size={20} />
                                   </button>
                              </div>

                              <div className="p-6 space-y-6">
                                   {viewLoading && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
                                   )}

                                   {error && (
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">




                                             {error}
                                        </div>
                                   )}

                                   {selectedOrder && (
                                        <>
                                             {/* Status + date */}
                                             <div className="flex flex-wrap items-center gap-3 text-sm">
                                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                       {selectedOrder.status}
                                                  </span>
                                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                       {selectedOrder.paymentStatus}
                                                  </span>
                                                  <span className="text-gray-500 dark:text-gray-400">
                                                       {new Date(selectedOrder.createdAt).toLocaleString()}
                                                  </span>
                                             </div>

                                             {/* Customer */}
                                             <div>
                                                  <h3 className="text-sm font-medium text-gray-800 dark:text-white mb-2">
                                                       Customer
                                                  </h3>
                                                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
                                                       <div>
                                                            <p className="text-xs text-gray-400">Name</p>
                                                            <p>{selectedOrder.customer.name}</p>
                                                       </div>
                                                       <div>
                                                            <p className="text-xs text-gray-400">Phone</p>
                                                            <p>{selectedOrder.customer.phone}</p>
                                                       </div>
                                                       <div>
                                                            <p className="text-xs text-gray-400">Email</p>
                                                            <p>{selectedOrder.customer.email || "-"}</p>
                                                       </div>
                                                       <div>
                                                            <p className="text-xs text-gray-400">Address</p>
                                                            <p>{selectedOrder.customer.address}</p>
                                                       </div>
                                                  </div>
                                             </div>

                                             {/* Items */}
                                             <div>
                                                  <h3 className="text-sm font-medium text-gray-800 dark:text-white mb-2">
                                                       Items
                                                  </h3>
                                                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                                       <table className="w-full text-sm">
                                                            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                                 <tr>
                                                                      <th className="text-left px-3 py-2 font-medium">Product</th>
                                                                      <th className="text-left px-3 py-2 font-medium">SKU</th>
                                                                      <th className="text-right px-3 py-2 font-medium">Qty</th>
                                                                      <th className="text-right px-3 py-2 font-medium">Unit price</th>
                                                                      <th className="text-right px-3 py-2 font-medium">Subtotal</th>
                                                                 </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                                 {selectedOrder.orderItems.map((item) => (
                                                                      <tr key={item.id} className="text-gray-600 dark:text-gray-300">
                                                                           <td className="px-3 py-2">{item.productVariant.name}</td>
                                                                           <td className="px-3 py-2">{item.productVariant.sku}</td>
                                                                           <td className="px-3 py-2 text-right">{item.quantity}</td>
                                                                           <td className="px-3 py-2 text-right">Rs. {money(item.unitPrice)}</td>
                                                                           <td className="px-3 py-2 text-right">Rs. {money(item.subtotal)}</td>
                                                                      </tr>
                                                                 ))}
                                                            </tbody>
                                                       </table>
                                                  </div>
                                             </div>

                                             {/* Totals */}
                                             {(() => {
                                                  const itemsTotal = selectedOrder.orderItems.reduce(
                                                       (sum, i) => sum + i.subtotal,
                                                       0
                                                  );
                                                  const other = selectedOrder.totalAmount - itemsTotal;
                                                  return (
                                                       <div className="ml-auto w-full max-w-xs space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                                            <div className="flex justify-between">
                                                                 <span>Items total</span>
                                                                 <span>Rs. {money(itemsTotal)}</span>
                                                            </div>
                                                            {other !== 0 && (
                                                                 <div className="flex justify-between">
                                                                      <span>Shipping / other</span>
                                                                      <span>Rs. {money(other)}</span>
                                                                 </div>
                                                            )}
                                                            <div className="flex justify-between font-semibold text-gray-800 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-2">
                                                                 <span>Total</span>
                                                                 <span>Rs. {money(selectedOrder.totalAmount)}</span>
                                                            </div>
                                                       </div>
                                                  );
                                             })()}

                                             {/* Notes */}
                                             {selectedOrder.notes && (
                                                  <div>
                                                       <h3 className="text-sm font-medium text-gray-800 dark:text-white mb-1">
                                                            Notes
                                                       </h3>
                                                       <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                                            {selectedOrder.notes}
                                                       </p>
                                                  </div>
                                             )}
                                        </>
                                   )}
                              </div>
                         </div>
                    </div>
               )}


               {/* update modal */}
               {editOrder && (
                    <div
                         onClick={() => setEditOrder(null)}
                         className="fixed inset-0 bg-black/50 flex items-center justify-center z-100 p-4"
                    >
                         <div
                              onClick={(e) => e.stopPropagation()}
                              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-md"
                         >
                              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                   <h2 className="text-lg font-semibold dark:text-white">
                                        Update Order {editOrder.orderNumber}
                                   </h2>
                                   <button onClick={() => setEditOrder(null)} className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white">
                                        <X size={20} />
                                   </button>
                              </div>

                              <div className="p-6 space-y-4">
                                   {error && (
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                                             {error}
                                        </div>
                                   )}

                                   <div>
                                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Status</label>
                                        <select
                                             value={editStatus}
                                             onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                                             className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-2 rounded"
                                        >
                                             {Object.keys(STATUS_STYLES).map((s) => (
                                                  <option key={s} value={s}>{formatLabel(s)}</option>
                                             ))}
                                        </select>
                                   </div>

                                   <div>
                                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Payment status</label>
                                        <select
                                             value={editPayment}
                                             onChange={(e) => setEditPayment(e.target.value as PaymentStatus)}
                                             className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-2 rounded"
                                        >
                                             {Object.keys(PAYMENT_STATUS_STYLES).map((s) => (
                                                  <option key={s} value={s}>{formatLabel(s)}</option>
                                             ))}
                                        </select>
                                   </div>

                                   <div className="flex justify-end gap-2 pt-2">
                                        <button onClick={() => setEditOrder(null)} className="px-4 py-2 text-sm border rounded border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                             Cancel
                                        </button>
                                        <button
                                             onClick={handleSave}
                                             disabled={saving}
                                             className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                        >
                                             {saving ? "Saving..." : "Save"}
                                        </button>
                                   </div>
                              </div>
                         </div>
                    </div>
               )}
          </div>
     );
}