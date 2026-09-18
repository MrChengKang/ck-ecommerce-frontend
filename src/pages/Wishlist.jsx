import React from "react";
import { Link } from "react-router-dom";
import { Trash2, ShoppingBag } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";

export default function Wishlist({ getImageUrl, addToCart }) {
  const { wishlistItems, toggleWishlist, clearWishlist } = useWishlist();

  if (wishlistItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center space-y-4">
        <span className="text-6xl">❤️</span>
        <h2 className="text-2xl font-black uppercase">
          Your Wishlist is Empty
        </h2>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">
          Explore products and save your favorites here!
        </p>
        <Link
          to="/"
          className="inline-block mt-4 px-8 py-3 bg-black text-white font-black text-xs uppercase tracking-widest rounded-full hover:bg-gray-800 transition-all"
        >
          Go Shopping
        </Link>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black uppercase tracking-tight">
          My Wishlist ({wishlistItems.length})
        </h1>
        <button
          onClick={clearWishlist}
          className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Trash2 size={14} /> Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {wishlistItems.map((product) => (
          <div
            key={product.id}
            className="group relative bg-[#f3f3f4] rounded-[30px] p-4 border border-gray-200"
          >
            <Link to={`/product/${product.id}`}>
              <div className="aspect-square overflow-hidden rounded-[20px] mb-4">
                <img
                  src={
                    getImageUrl
                      ? getImageUrl(product.imageUrl)
                      : product.imageUrl
                  }
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="font-black text-xs uppercase">{product.name}</h3>
              <p className="font-black text-lg mt-1">RM{product.price}</p>
            </Link>

            {/* 💡 整合「加入購物車」與「移除收藏」按鈕 */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => addToCart && addToCart(product)}
                className="flex-1 py-2.5 bg-black hover:bg-gray-800 text-white rounded-full font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag size={14} /> Add to Cart
              </button>
              <button
                onClick={() => toggleWishlist(product)}
                className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-full font-extrabold text-xs transition-colors flex items-center justify-center cursor-pointer"
                title="Remove from wishlist"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
