import React, { useRef, useState } from "react";
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
  const [sortBy, setSortBy] = useState("featured");
  const [inStockOnly, setInStockOnly] = useState(false);

  const { isInWishlist, toggleWishlist } = useWishlist();

  const displayedProducts = filteredProducts
    .filter(
      (product) =>
        !inStockOnly || Number(product.stockQuantity ?? 0) > 0,
    )
    .sort((a, b) => {
      if (sortBy === "price-low-high") {
        return Number(a.price ?? 0) - Number(b.price ?? 0);
      }
      if (sortBy === "price-high-low") {
        return Number(b.price ?? 0) - Number(a.price ?? 0);
      }
      if (sortBy === "name-a-z") {
        return (a.name || "").localeCompare(b.name || "");
      }
      return 0;
    });

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
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-8">
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

      <div className="mb-10 flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white/80 px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-3 text-xs font-bold text-gray-600">
          <span className="shrink-0 uppercase tracking-wider">Sort by</span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="min-w-48 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-800 outline-none transition focus:border-blue-400"
          >
            <option value="featured">Featured</option>
            <option value="price-low-high">Price: low to high</option>
            <option value="price-high-low">Price: high to low</option>
            <option value="name-a-z">Name: A to Z</option>
          </select>
        </label>

        <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-gray-600">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(event) => setInStockOnly(event.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
            In stock only
          </label>
          <span
            aria-live="polite"
            className="rounded-full bg-gray-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-gray-500"
          >
            {displayedProducts.length} {displayedProducts.length === 1 ? "item" : "items"}
          </span>
        </div>
      </div>

      {/* 商品列表 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-14">
        {displayedProducts.length > 0 ? (
          <>
            {displayedProducts.map((product) => {
              const isFav = isInWishlist(product.id);
              const reviewCount = Number(product.reviewCount ?? 0);
              const averageRating = Number(product.averageRating ?? 0);

              return (
                <article key={product.id} className="group relative">
                  <Link
                    to={`/product/${product.id}`}
                    aria-label={`View ${product.name}`}
                    className="block rounded-[45px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30"
                  >
                    <div className="relative mb-5 aspect-[4/5] overflow-hidden rounded-[45px] border border-gray-200/80 bg-[#f3f3f4] shadow-sm transition-all duration-500 group-hover:border-gray-300 group-hover:shadow-xl">
                      <img
                        src={getImageUrl(product.imageUrl)}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04] sm:p-6"
                        alt={product.name}
                      />
                      <span
                        className={`absolute bottom-4 left-4 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-wider shadow-sm ${
                          Number(product.stockQuantity ?? 0) <= 0
                            ? "bg-red-600 text-white"
                            : "bg-white/90 text-gray-700"
                        }`}
                      >
                        {Number(product.stockQuantity ?? 0) <= 0
                          ? "Sold Out"
                          : `${product.stockQuantity} in stock`}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3 px-4 pb-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-xs font-black uppercase tracking-tight transition-colors group-hover:text-blue-600">
                          {product.name}
                        </h3>
                        <p className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                          {product.category}
                        </p>
                        <p
                          className="mt-2 flex min-h-4 items-center gap-1 text-[10px] font-semibold text-gray-600"
                          aria-label={
                            reviewCount > 0
                              ? `Rated ${averageRating.toFixed(1)} out of 5 from ${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}`
                              : "No reviews yet"
                          }
                        >
                          {reviewCount > 0 ? (
                            <>
                              <span aria-hidden="true" className="text-amber-500">
                                ★
                              </span>
                              <span>{averageRating.toFixed(1)}</span>
                              <span className="font-medium text-gray-400">
                                ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                              </span>
                            </>
                          ) : (
                            <span className="font-medium text-gray-400">
                              No reviews yet
                            </span>
                          )}
                        </p>
                      </div>
                      <p className="shrink-0 text-lg font-black italic sm:text-xl">
                        RM{product.price}
                      </p>
                    </div>
                  </Link>

                  <button
                    type="button"
                    aria-label={
                      isFav
                        ? `Remove ${product.name} from wishlist`
                        : `Add ${product.name} to wishlist`
                    }
                    aria-pressed={isFav}
                    onClick={() => toggleWishlist(product)}
                    className="absolute right-5 top-5 z-20 rounded-full border border-gray-100 bg-white/90 p-3 shadow-md backdrop-blur-md transition-all hover:scale-110 hover:bg-white active:scale-95"
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
                </article>
              );
            })}
          </>
        ) : (
          <div className="col-span-full py-20 text-center space-y-4 animate-pulse">
            <span className="text-6xl">📦</span>
            <p className="text-gray-400 font-black uppercase tracking-widest">
              No products match your search or filters.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All");
                setSortBy("featured");
                setInStockOnly(false);
              }}
              className="text-xs font-black underline underline-offset-4 hover:text-blue-600 cursor-pointer"
            >
              CLEAR SEARCH AND FILTERS
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default ProductGrid;
