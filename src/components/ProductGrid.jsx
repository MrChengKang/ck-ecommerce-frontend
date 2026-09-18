import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";

function ProductGrid({
  searchTerm,
  setSearchTerm,
  categories,
  selectedCategory,
  setSelectedCategory,
  filteredProducts,
  getImageUrl,
}) {
  const scrollRef = useRef(null);

  const { isInWishlist, toggleWishlist } = useWishlist();

  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: "smooth",
      });
    }
  };

  return (
    <main className="max-w-7xl mx-auto p-8">
      {/* 搜尋列與分類選單 */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
        {/* 搜尋框 */}
        <div className="relative w-full md:w-[450px] group">
          <input
            type="text"
            placeholder="SEARCH SOMETHING..."
            className="w-full p-4 pl-14 bg-white border border-gray-300 rounded-full outline-none focus:border-black focus:ring-4 focus:ring-black/5 font-extrabold text-xs tracking-wider text-black placeholder:text-gray-400 shadow-sm transition-all duration-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors duration-300">
            🔍
          </span>
        </div>

        {/* 數量顯示 */}
        <div className="hidden xl:flex items-center gap-2">
          <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black tracking-widest text-gray-500 uppercase">
            {filteredProducts.length} ITEMS FOUND
          </span>
        </div>

        {/* 帶箭頭滾動的分類膠囊選單 */}
        <div className="relative flex items-center gap-2 max-w-full md:max-w-md">
          <button
            onClick={() => scroll("left")}
            className="w-8 h-8 shrink-0 rounded-full bg-gray-100 hover:bg-black hover:text-white transition-colors flex items-center justify-center text-xs font-bold cursor-pointer"
          >
            ‹
          </button>

          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all duration-300 transform active:scale-90 cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? "bg-black text-white shadow-[0_10px_20px_rgba(0,0,0,0.2)] scale-105"
                    : "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-black"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={() => scroll("right")}
            className="w-8 h-8 shrink-0 rounded-full bg-gray-100 hover:bg-black hover:text-white transition-colors flex items-center justify-center text-xs font-bold cursor-pointer"
          >
            ›
          </button>
        </div>
      </div>

      {/* 商品列表 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-14">
        {filteredProducts.length > 0 ? (
          <>
            {filteredProducts.map((product) => {
              const isFav = isInWishlist(product.id);

              return (
                <Link
                  to={`/product/${product.id}`}
                  key={product.id}
                  className="group relative"
                >
                  <div className="overflow-hidden rounded-[45px] bg-[#f3f3f4] border border-gray-200/80 aspect-[4/5] mb-6 shadow-sm group-hover:shadow-2xl group-hover:border-gray-300 transition-all duration-700 relative">
                    <img
                      src={getImageUrl(product.imageUrl)}
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-1000"
                      alt={product.name}
                    />

                    {/* 3. 愛心按鈕 (右上角) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist(product);
                      }}
                      className="absolute top-5 right-5 p-3 rounded-full bg-white/80 backdrop-blur-md shadow-md border border-gray-100 hover:scale-110 active:scale-95 transition-all z-20 cursor-pointer"
                    >
                      <Heart
                        size={18}
                        className={`transition-colors ${
                          isFav
                            ? "fill-red-500 text-red-500 stroke-red-500"
                            : "text-gray-400 hover:text-black"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex justify-between items-start px-4">
                    <div>
                      <h3 className="font-black uppercase text-xs tracking-tight group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mt-1">
                        {product.category}
                      </p>
                    </div>
                    <p className="font-black text-xl italic">
                      RM{product.price}
                    </p>
                  </div>
                </Link>
              );
            })}
          </>
        ) : (
          <div className="col-span-full py-20 text-center space-y-4 animate-pulse">
            <span className="text-6xl">📦</span>
            <p className="text-gray-400 font-black uppercase tracking-widest">
              No products found in "{selectedCategory}"
            </p>
            <button
              onClick={() => setSelectedCategory("All")}
              className="text-xs font-black underline underline-offset-4 hover:text-blue-600 cursor-pointer"
            >
              VIEW ALL PRODUCTS
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default ProductGrid;
