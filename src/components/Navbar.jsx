import React from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";

function Navbar({
  isAdminPath,
  isLoggedIn,
  userRole,
  handleOpenProfile,
  handleLogout,
  setIsCartOpen,
  cart,
}) {
  const { wishlistItems } = useWishlist();

  if (isAdminPath) return null;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-gray-200/60 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
        <Link
          to="/"
          className="text-2xl font-black italic tracking-tighter text-[#1d1d1f] hover:opacity-75 transition-opacity"
        >
          CK STORE<span className="text-[#0071e3]">.</span>
        </Link>

        <div className="flex items-center space-x-8 text-sm font-semibold text-[#1d1d1f]">
          <Link
            to="/"
            className="text-gray-600 hover:text-black transition-colors"
          >
            Home
          </Link>

          {isLoggedIn && (
            <Link
              to="/orders"
              className="text-gray-600 hover:text-black transition-colors"
            >
              My Orders
            </Link>
          )}

          <button
            onClick={handleOpenProfile}
            className="text-gray-600 hover:text-black transition-colors cursor-pointer"
          >
            Profile
          </button>

          {isLoggedIn && userRole?.toUpperCase() === "ADMIN" && (
            <Link
              to="/admin"
              className="px-3 py-1 bg-red-50 text-red-600 rounded-full font-bold text-xs hover:bg-red-100 transition-colors"
            >
              Admin
            </Link>
          )}

          {isLoggedIn ? (
            <button
              onClick={() => handleLogout(true)}
              className="text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="text-[#0071e3] font-bold hover:opacity-80 transition-opacity"
            >
              Login
            </Link>
          )}

          {/* 💡 願望清單按鈕 (放置於 Cart 左側) */}
          <Link
            to="/wishlist"
            className="relative p-2 text-gray-600 hover:text-red-500 transition-colors flex items-center"
            title="Wishlist"
          >
            <Heart size={22} />
            {wishlistItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {wishlistItems.length}
              </span>
            )}
          </Link>

          {/* 💡 加大版 Cart 膠囊鈕 */}
          <button
            key={cart.length}
            onClick={() => setIsCartOpen(true)}
            className="bg-[#1d1d1f] hover:bg-black text-white px-6 py-2.5 rounded-full text-xs font-bold tracking-wider flex items-center gap-3 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <span>CART</span>
            <span className="bg-white/20 w-[1px] h-3.5" />
            <span className="bg-[#0071e3] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
