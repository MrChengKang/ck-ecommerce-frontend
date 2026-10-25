import React, { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const getImageUrl = (url) => {
  if (!url) return "";

  if (url.startsWith("blob:") || url.startsWith("data:")) return url;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    if (
      url.includes("localhost:8080") &&
      API_BASE_URL !== "http://localhost:8080"
    ) {
      return url.replace("http://localhost:8080", API_BASE_URL);
    }
    return url;
  }

  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE_URL}${cleanPath}`;
};

export default function ProductsTab({
  products,
  searchTerm,
  setSearchTerm,
  setIsCatModalOpen,
  setEditingId,
  setNewProduct,
  setCroppedImagePreview,
  setIsModalOpen,
  openEditModal,
  handleDeleteProduct,
  refreshData,
}) {
  const [stockDrafts, setStockDrafts] = useState({});
  const [savingStockId, setSavingStockId] = useState(null);
  const [stockError, setStockError] = useState("");

  useEffect(() => {
    setStockDrafts(Object.fromEntries(
      (Array.isArray(products) ? products : []).map((product) => [product.id, String(product.stockQuantity ?? 0)]),
    ));
  }, [products]);

  const saveStock = async (productId) => {
    const value = stockDrafts[productId];
    if (!/^\d+$/.test(value ?? "")) {
      setStockError("Stock must be a whole number of zero or more.");
      return;
    }

    setSavingStockId(productId);
    setStockError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}/stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("ck_token")}`,
        },
        body: JSON.stringify({ stockQuantity: Number(value) }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Could not update stock (HTTP ${response.status}).`);
      }

      if (refreshData) await refreshData();
    } catch (error) {
      setStockError(error.message || "Could not update stock.");
    } finally {
      setSavingStockId(null);
    }
  };

  const filteredProducts = Array.isArray(products)
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.category &&
            p.category.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex justify-between items-center px-4">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">
          Products List
        </h2>
        <div className="flex gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 border border-transparent focus:border-gray-100 rounded-xl text-xs font-bold outline-none transition-all w-64 shadow-sm"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>
          <button
            onClick={() => setIsCatModalOpen(true)}
            className="bg-white text-black border border-gray-100 px-6 py-2 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
          >
            Categories
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setNewProduct({
                name: "",
                price: "",
                category: "",
                imageUrl: "",
                description: "",
                stockQuantity: 0,
              });
              setCroppedImagePreview(null);
              setIsModalOpen(true);
            }}
            className="bg-black text-white px-8 py-2 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-800 shadow-lg active:scale-95 transition-all"
          >
            + Add Product
          </button>
        </div>
      </div>
      {stockError && (
        <p role="alert" className="mx-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          {stockError}
        </p>
      )}

      {/* 標題列 */}
      <div className="grid grid-cols-6 px-12 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
        <div className="col-span-2">Product Details</div>
        <div className="col-span-1 text-center">Category</div>
        <div className="col-span-1 text-center">Price</div>
        <div className="col-span-1 text-center">Stock</div>
        <div className="col-span-1 text-right pr-4">Actions</div>
      </div>

      {/* 產品卡片列表 */}
      <div className="space-y-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-6 items-center px-10 py-5 bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 rounded-[35px] transition-all hover:shadow-xl hover:shadow-gray-100/50 group"
            >
              <div className="col-span-2 flex items-center gap-5">
                <div className="relative w-16 h-16 shrink-0">
                  {/* 💡 這裡套用 getImageUrl(p.imageUrl) */}
                  <img
                    src={getImageUrl(p.imageUrl)}
                    className="w-full h-full object-cover rounded-2xl shadow-sm border border-white"
                    alt={p.name}
                  />
                  {p.stockQuantity <= 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-black">
                      SOLD OUT
                    </span>
                  )}
                </div>
                <div className="truncate">
                  <p className="font-black text-sm uppercase tracking-tight truncate">
                    {p.name}
                  </p>
                  <p className="text-[9px] text-gray-400 font-bold truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    ID: {p.id.toString().slice(-6)}
                  </p>
                </div>
              </div>

              <div className="col-span-1 flex justify-center">
                <span className="text-[10px] font-black bg-white px-4 py-1.5 rounded-full border border-gray-100 uppercase tracking-widest shadow-sm">
                  {p.category || "General"}
                </span>
              </div>

              <div className="col-span-1 text-center font-black italic text-blue-600 tracking-tighter text-lg">
                RM{p.price.toFixed(2)}
              </div>

              <div className="col-span-1 flex flex-col items-center justify-center gap-1">
                <p
                  className={`text-[9px] font-black ${Number(p.stockQuantity ?? 0) < 5 ? "text-orange-500" : "text-gray-600"}`}
                >
                  {Number(p.stockQuantity ?? 0) < 5 ? "LOW STOCK" : "IN STOCK"}
                </p>
                <div className="flex items-center gap-1.5">
                  <input
                    aria-label={`Stock quantity for ${p.name}`}
                    type="number"
                    min="0"
                    step="1"
                    value={stockDrafts[p.id] ?? ""}
                    onChange={(event) => setStockDrafts((current) => ({ ...current, [p.id]: event.target.value }))}
                    className="w-16 rounded-lg border border-gray-200 bg-white px-1 py-1.5 text-center text-xs font-bold outline-none focus:border-blue-400"
                  />
                  <button
                    type="button"
                    disabled={savingStockId === p.id || String(p.stockQuantity ?? 0) === String(stockDrafts[p.id] ?? "")}
                    onClick={() => saveStock(p.id)}
                    className="rounded-lg bg-black px-2 py-1.5 text-[9px] font-black uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {savingStockId === p.id ? "…" : "Save"}
                  </button>
                </div>
              </div>

              <div className="col-span-1 flex justify-end items-center gap-3">
                <button
                  onClick={() => openEditModal(p)}
                  className="w-10 h-10 flex items-center justify-center bg-white text-gray-400 hover:text-black rounded-full border border-transparent hover:border-gray-100 transition-all shadow-sm active:scale-90"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteProduct(p.id)}
                  className="w-10 h-10 flex items-center justify-center bg-white text-gray-400 hover:text-red-500 rounded-full border border-transparent hover:border-gray-100 transition-all shadow-sm active:scale-90"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 text-center flex flex-col items-center opacity-30">
            <span className="text-5xl mb-4">📦</span>
            <p className="font-black italic uppercase tracking-[0.2em] text-xs">
              No products found
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-4 text-[10px] text-blue-500 font-bold hover:underline"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
