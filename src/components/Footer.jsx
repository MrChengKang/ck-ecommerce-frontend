import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-black text-white mt-24 border-t border-gray-900">
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* 品牌介紹 */}
          <div className="space-y-4 md:col-span-1">
            <h2 className="text-xl font-black tracking-tighter uppercase italic">
              STORE<span className="text-blue-500">.</span>
            </h2>
            <p className="text-xs font-medium text-gray-400 leading-relaxed">
              Elevating your tech lifestyle with premium gadgets and
              high-performance electronics.
            </p>
          </div>

          {/* 快速連結 */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs font-bold tracking-wider">
              <li>
                <Link to="/" className="hover:text-gray-400 transition-colors">
                  HOME
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-gray-400 transition-colors">
                  PRODUCTS
                </Link>
              </li>
              <li>
                <Link
                  to="/cart"
                  className="hover:text-gray-400 transition-colors"
                >
                  CART
                </Link>
              </li>
            </ul>
          </div>

          {/* 分類導覽 */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
              Categories
            </h4>
            <ul className="space-y-2 text-xs font-bold tracking-wider text-gray-300">
              <li className="hover:text-white transition-colors cursor-pointer">
                PHONES
              </li>
              <li className="hover:text-white transition-colors cursor-pointer">
                LAPTOPS
              </li>
              <li className="hover:text-white transition-colors cursor-pointer">
                ACCESSORIES
              </li>
              <li className="hover:text-white transition-colors cursor-pointer">
                AUDIO
              </li>
            </ul>
          </div>

          {/* 訂閱電子報 / 客服聯絡 */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
              Stay Connected
            </h4>
            <p className="text-xs text-gray-400 font-medium">
              Subscribe to get special offers and updates.
            </p>
            <div className="relative">
              <input
                type="email"
                placeholder="ENTER YOUR EMAIL"
                className="w-full bg-gray-900 border border-gray-800 rounded-full py-3 pl-4 pr-10 text-xs text-white placeholder:text-gray-600 outline-none focus:border-white transition-colors"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white text-black rounded-full text-xs font-bold flex items-center justify-center hover:bg-gray-200 transition-colors">
                →
              </button>
            </div>
          </div>
        </div>

        {/* 底層版權宣告 */}
        <div className="pt-8 border-t border-gray-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
          <p>© {new Date().getFullYear()} STORE INC. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-6">
            <span className="hover:text-gray-300 cursor-pointer transition-colors">
              PRIVACY POLICY
            </span>
            <span className="hover:text-gray-300 cursor-pointer transition-colors">
              TERMS OF SERVICE
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
