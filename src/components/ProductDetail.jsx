import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function ProductDetail({ addToCart }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const getImageUrl = (picPath) => {
    if (!picPath) return "https://via.placeholder.com/600x600?text=No+Image";
    if (picPath.startsWith("http://") || picPath.startsWith("https://"))
      return picPath;
    return `${API_BASE_URL}${picPath}`;
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => setProduct(data))
      .catch((err) => console.error("Error fetching product:", err));
  }, [id]);

  const handleAddToCart = () => {
    if (!product || product.stockQuantity <= 0) return;

    addToCart(product, quantity);

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  if (!product) {
    return (
      <div className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest italic animate-pulse">
        Loading product details...
      </div>
    );
  }

  const isOutOfStock = product.stockQuantity <= 0;

  return (
    <div className="max-w-6xl mx-auto px-8 py-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center animate-in fade-in duration-700">
      {/* 左側：Apple 風格防融圖卡 */}
      <div className="overflow-hidden rounded-[40px] shadow-sm hover:shadow-2xl bg-[#f3f3f4] border border-gray-200/80 aspect-square flex items-center justify-center p-8 transition-all duration-700 group">
        <img
          src={getImageUrl(product.imageUrl)}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-1000"
        />
      </div>

      {/* 右側：商品細節與購買 */}
      <div className="flex flex-col justify-center space-y-6">
        <div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] block mb-2">
            {product.category || "General"}
          </span>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-gray-900 leading-tight">
            {product.name}
          </h1>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-3xl font-black text-[#0071e3] italic tracking-tight">
            RM{product.price}
          </p>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              isOutOfStock
                ? "bg-red-50 text-red-500 border-red-200"
                : "bg-emerald-50 text-emerald-600 border-emerald-200"
            }`}
          >
            {isOutOfStock
              ? "Out of Stock"
              : `In Stock (${product.stockQuantity})`}
          </span>
        </div>

        <div className="border-y border-gray-200/60 py-6">
          <p className="text-gray-500 leading-relaxed text-sm font-medium">
            {product.description ||
              "No description available for this product."}
          </p>
        </div>

        {/* 數量選擇與購買按鈕 */}
        {!isOutOfStock && (
          <div className="flex items-center gap-4 bg-gray-100 p-2 rounded-2xl">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest pl-4">
              QTY
            </span>
            <div className="flex items-center gap-3 ml-auto pr-2">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full bg-white text-black font-bold text-sm shadow-sm hover:bg-black hover:text-white transition-colors cursor-pointer"
              >
                −
              </button>
              <span className="font-black text-xs w-6 text-center">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity((q) =>
                    Math.min(product.stockQuantity ?? 10, q + 1),
                  )
                }
                className="w-8 h-8 rounded-full bg-white text-black font-bold text-sm shadow-sm hover:bg-black hover:text-white transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* 購買按鈕 */}
        <button
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          className={`w-full py-5 rounded-full font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg cursor-pointer ${
            isOutOfStock
              ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              : isAdded
                ? "bg-emerald-600 text-white"
                : "bg-[#1d1d1f] hover:bg-black text-white"
          }`}
        >
          {isOutOfStock ? (
            <span className="flex items-center justify-center gap-2">
              <span>🚫</span> SOLD OUT
            </span>
          ) : isAdded ? (
            "✓ ADDED TO CART"
          ) : (
            "ADD TO CART"
          )}
        </button>

        <Link
          to="/"
          className="block text-center text-gray-400 font-black uppercase text-[10px] tracking-[0.3em] hover:text-black transition-colors"
        >
          ← BACK TO SHOP
        </Link>
      </div>
    </div>
  );
}

export default ProductDetail;
