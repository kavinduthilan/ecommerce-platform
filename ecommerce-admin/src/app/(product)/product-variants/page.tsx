"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2 } from "lucide-react";
import { Status } from "@/generated/prisma/enums";
import { GetResponse, GetProductVariant, ProductVariant } from "@/lib/type";
import { usePathname } from "next/navigation";
import { getUser } from "@/actions/auth/getUser";
import { getSystemMenus } from "@/actions/system-menus/system-menus";
import { getUserMenuPermissions } from "@/actions/user-menu-permission/user-menu-permission";
import { getActiveProducts } from "@/actions/products/products";
import { createProductVariant, getProductVariants, updateProductVariant } from "@/actions/product-variants/product-variants";
import { getActiveSizes } from "@/actions/sizes/sizes";


type VariantForm = Omit<ProductVariant, "price" | "costPrice"> & {
     price: string;
     costPrice: string;
};

const emptyForm: VariantForm = {
     name: "",
     productId: "",
     sku: "",
     sizeId: "",
     price: "",
     costPrice: "",
     status: "Active",
};


export default function ProductVariants() {
     const [productVariants, setProductVariants] = useState<GetProductVariant[]>([]);
     const [showModal, setShowModal] = useState(false);
     const [error, setError] = useState("");
     const [formData, setFormData] = useState<VariantForm>(emptyForm);
     const [editingId, setEditingId] = useState<number | null>(null);

     // pagination
     const [page, setPage] = useState(1);
     const [pageSize, setPageSize] = useState(5);
     const [totalPages, setTotalPages] = useState(1);

     const pathname = usePathname();
     const [canAdd, setCanAdd] = useState(false);
     const [canEdit, setCanEdit] = useState(false);

     const [products, setProducts] = useState<GetResponse[]>([]);
     const [sizes, setSizes] = useState<GetResponse[]>([]);


     const [isLoading, setIsLoading] = useState(true);

     useEffect(() => {
          const loadPermissions = async () => {
               try {
                    const currentUser = await getUser();
                    if (!currentUser) return;

                    const menus = await getSystemMenus();
                    const currentMenu = menus.find((m) => m.path === pathname);
                    if (!currentMenu) {
                         // No menu entry matches this route — default to no access rather than open access
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

     // component.tsx
     const fetchProductVariants = useCallback(async () => {
          try {
               const result = await getProductVariants(page, pageSize);
               setProductVariants(result.data);
               setTotalPages(result.totalPages);
          } catch (error) {
               console.error("error:", error);
          }
     }, [page, pageSize]);

     useEffect(() => {
          fetchProductVariants();
     }, [fetchProductVariants]);


     // load products
     const loadProducts = useCallback(async () => {
          try {
               setIsLoading(true);
               const response = await getActiveProducts();
               setProducts(response);
          } catch (err) {
               console.error(err);
          } finally {
               setIsLoading(false);
          }
     }, []);

     useEffect(() => {
          loadProducts();
     }, [loadProducts]);

     // load sizes
     const loadSizes = useCallback(async () => {
          try {
               setIsLoading(true);
               const response = await getActiveSizes();
               setSizes(response);
          } catch (err) {
               console.error(err);
          } finally {
               setIsLoading(false);
          }
     }, []);

     useEffect(() => {
          loadSizes();
     }, [loadSizes]);

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setError("");

          const payload: ProductVariant = {
               ...formData,
               price: Number(formData.price),
               costPrice: Number(formData.costPrice),
          };

          try {
               if (editingId) {
                    await updateProductVariant(editingId, payload);
               } else {
                    await createProductVariant(payload);
               }

               setFormData(emptyForm);
               setEditingId(null);
               setShowModal(false);
               fetchProductVariants();
          } catch (err) {
               setError(err instanceof Error ? err.message : "An error occurred");
               console.error(err);
          }
     };



     const handleEdit = (variant: GetProductVariant) => {
          setFormData({
               name: variant.name,
               sku: variant.sku,
               productId: String(variant.productId),
               sizeId: String(variant.sizeId),
               price: String(variant.price),
               costPrice: String(variant.costPrice),
               status: variant.status,
          });
          setEditingId(variant.id);
          setShowModal(true);
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
                              Product Variants
                         </h1>
                         <p className="text-sm text-gray-500 dark:text-gray-400">
                              Manage your product variants efficiently
                         </p>
                    </div>

                    <div className="flex gap-3">
                         {canAdd && (
                              <button
                                   onClick={() => setShowModal(true)}
                                   className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 transition text-white rounded-lg text-sm"
                              >
                                   <Plus size={16} /> Add Product Variant
                              </button>
                         )}
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
                                        <th className="text-left px-4 py-3 font-medium">Name</th>
                                        <th className="text-left px-4 py-3 font-medium">Product</th>
                                        <th className="text-left px-4 py-3 font-medium">sku</th>
                                        <th className="text-left px-4 py-3 font-medium">Size</th>
                                        <th className="text-left px-4 py-3 font-medium">Price</th>
                                        <th className="text-left px-4 py-3 font-medium">Cost Price</th>
                                        <th className="text-left px-4 py-3 font-medium">Status</th>
                                        <th className="text-left px-4 py-3 font-medium">Created By</th>
                                        <th className="text-left px-4 py-3 font-medium">Created At</th>
                                        <th className="px-4 py-3">Actions</th>
                                   </tr>
                              </thead>

                              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                   {productVariants?.length === 0 ? (
                                        <tr>
                                             <td colSpan={9} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                                  No product variants found
                                             </td>
                                        </tr>
                                   ) : (
                                        productVariants?.map((item) => (
                                             <tr
                                                  key={item.id}
                                                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                                             >
                                                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                       {item.name}
                                                  </td>

                                                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                       {item.product.name}
                                                  </td>

                                                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                       {item.sku}
                                                  </td>

                                                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                       {item.size?.name}
                                                  </td>

                                                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                       Rs. {item.price.toFixed(2)}
                                                  </td>

                                                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                       Rs. {item.costPrice.toFixed(2)}
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
                                        )))}
                              </tbody>
                         </table>

                         {/* pagination */}
                         <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">

                              {/* Page Size */}
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
                                   {editingId ? "Edit Product Variant" : "Add Product Variant"}
                              </h2>

                              <form onSubmit={handleSubmit} className="space-y-4">

                                   <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                             Name
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
                                             Product
                                        </label>
                                        <select
                                             className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 w-full text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                             value={formData.productId}
                                             onChange={(e) =>
                                                  setFormData({ ...formData, productId: e.target.value })
                                             }
                                        >
                                             <option value="">Select Product</option>
                                             {products.map((product) => (
                                                  <option key={product.id} value={product.id}>
                                                       {product.name}
                                                  </option>
                                             ))}
                                        </select>
                                   </div>


                                   <div className="grid grid-cols-2 gap-4">
                                        <div>
                                             <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                  sku
                                             </label>
                                             <input
                                                  type="text"
                                                  placeholder=""
                                                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 w-full text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                                  value={formData.sku}
                                                  onChange={(e) =>
                                                       setFormData({ ...formData, sku: e.target.value })
                                                  }
                                             />
                                        </div>

                                        <div>
                                             <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                  Size
                                             </label>
                                             <select
                                                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 w-full text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                                  value={formData.sizeId}
                                                  onChange={(e) =>
                                                       setFormData({ ...formData, sizeId: e.target.value })
                                                  }
                                             >
                                                  <option value="">Select the size</option>
                                                  {sizes.map((size) => (
                                                       <option key={size.id} value={size.id}>{size.name}</option>
                                                  ))}
                                             </select>
                                        </div>


                                        <div>
                                             <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                  Price
                                             </label>
                                             <input
                                                  type="number"
                                                  min="0"
                                                  step="0.01"
                                                  placeholder="Enter price"
                                                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 w-full text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                                  value={formData.price}
                                                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                  required
                                             />
                                        </div>

                                        <div>
                                             <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                  Cost Price
                                             </label>
                                             <input
                                                  type="number"
                                                  min="0"
                                                  step="0.01"
                                                  placeholder="Enter cost price"
                                                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 w-full text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                                  value={formData.costPrice}
                                                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                                                  required
                                             />
                                        </div>
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