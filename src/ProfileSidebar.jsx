import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PopoutAlert from "./components/PopoutAlert";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function ProfileSidebar({ isOpen, onClose, user, setUser, onOpenLoginModal }) {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const showAlert = (title, message, type = "info", onConfirm = null) => {
    setAlertConfig({ isOpen: true, title, message, type, onConfirm });
  };

  const currentUser = user || {};

  const getAvatarUrl = (picPath) => {
    if (!picPath) {
      return `https://api.dicebear.com/8.x/initials/svg?seed=${
        currentUser.username || "User"
      }`;
    }
    if (picPath.startsWith("http://") || picPath.startsWith("https://")) {
      return picPath;
    }
    return `${API_BASE_URL}${picPath}`;
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem("ck_token");
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  const handleUnauthorized = () => {
    alert("Please log in first!");
    onClose();
    if (onOpenLoginModal) onOpenLoginModal();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/me/upload-avatar`, {
        method: "POST",
        headers: { ...authHeader },
        body: formData,
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setUser({ ...user, profilePic: data.url });
        showAlert("Avatar uploaded successfully!", "", "success");
      } else {
        const errorText = await res.text();
        showAlert("Upload failed!", errorText, "error");
      }
    } catch (error) {
      console.error("Upload error:", error);
      showAlert("Server error during upload.", "", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword) {
      showAlert("Please fill in all password fields.", "", "warning");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      showAlert("New passwords do not match.", "", "warning");
      return;
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/me/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      if (res.ok) {
        showAlert("Password changed successfully!", "", "success");
        setPasswords({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setShowPasswordSection(false);
      } else {
        const errorMsg = await res.text();
        showAlert("Failed to change password!", errorMsg, "error");
      }
    } catch (err) {
      console.error(err);
      showAlert("Server error while changing password.", "", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSave = async () => {
    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...user,
        name: user.username,
      };

      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401 || res.status === 403) {
        handleUnauthorized();
        return;
      }

      if (res.ok) {
        const updatedUser = await res.json();

        const oldUsername = localStorage.getItem("ck_username");
        const newUsername = updatedUser.username || updatedUser.name;

        if (oldUsername && oldUsername !== newUsername) {
          showAlert(
            "Username Changed",
            "Username changed successfully! Please log in again with your new credentials.",
            "success",
            () => {
              localStorage.removeItem("ck_token");
              localStorage.removeItem("ck_username");
              localStorage.removeItem("ck_role");
              onClose();
              window.location.reload();
            },
          );
          return;
        }

        setUser(updatedUser);
        localStorage.setItem("ck_username", newUsername || "");

        // 💡 替換成自訂 PopoutAlert
        showAlert("Success", "Profile updated successfully!", "success");
      } else {
        const errorMsg = await res.text();
        // 💡 替換成自訂 PopoutAlert
        showAlert(
          "Update Failed",
          errorMsg || "Failed to update profile.",
          "error",
        );
      }
    } catch (err) {
      console.error("Save error:", err);
      // 💡 替換成自訂 PopoutAlert
      showAlert(
        "Server Error",
        "Server connection error, please try again later.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoToOrders = () => {
    onClose();
    navigate("/orders");
  };

  return (
    <>
      {/* 蘋果風格毛玻璃背景遮罩 */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-md z-[60] transition-opacity duration-300 ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        onClick={onClose}
      />

      {/* 側邊欄本體 */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-[420px] bg-[#f5f5f7] z-[70] shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header 區域 */}
        <div className="flex justify-between items-center px-6 py-5 bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-10">
          <h2 className="text-base font-bold text-[#1d1d1f] tracking-tight">
            Account Settings
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black flex items-center justify-center transition-colors text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 捲動內容區塊 */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* 📸 頭像上傳白底卡片 */}
          <div className="bg-white rounded-3xl p-6 flex flex-col items-center border border-gray-200/60 shadow-sm">
            <div
              className="group relative w-24 h-24 cursor-pointer rounded-full overflow-hidden border-2 border-gray-200 shadow-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <img
                src={getAvatarUrl(currentUser.profilePic)}
                className={`w-full h-full object-cover transition-all duration-300 ${
                  isUploading ? "animate-pulse opacity-40" : ""
                }`}
                alt="avatar"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold uppercase tracking-wider">
                {isUploading ? "Uploading..." : "Edit"}
              </div>
            </div>
            <p className="mt-3 text-[11px] font-medium text-gray-400">
              Click photo to change avatar
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
          </div>

          {/* 📦 前往訂單歷史 (膠囊風格) */}
          <button
            onClick={handleGoToOrders}
            className="w-full py-3.5 bg-white border border-gray-200/80 rounded-2xl flex items-center justify-between px-5 font-bold text-xs text-[#1d1d1f] shadow-sm hover:bg-black hover:text-white transition-all duration-300 cursor-pointer group"
          >
            <span>📦 View Order History</span>
            <span className="group-hover:translate-x-1 transition-transform">
              →
            </span>
          </button>

          {/* 📝 個人資料表單卡片 */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200/60 shadow-sm space-y-4 text-xs">
            {/* Email (唯讀) */}
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                Email (Account)
              </label>
              <input
                type="text"
                disabled
                value={currentUser.email || currentUser.customerEmail || "N/A"}
                className="w-full px-4 py-3 bg-[#f5f5f7] text-gray-400 rounded-xl font-medium cursor-not-allowed border border-gray-200/40 outline-none"
              />
            </div>

            {/* Username */}
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                Username
              </label>
              <input
                type="text"
                value={currentUser.username || currentUser.name || ""}
                onChange={(e) =>
                  setUser({
                    ...currentUser,
                    username: e.target.value,
                    name: e.target.value,
                  })
                }
                placeholder="Enter username"
                className="w-full px-4 py-3 bg-[#f5f5f7] text-[#1d1d1f] rounded-xl border border-transparent focus:border-[#0071e3] focus:bg-white transition-all outline-none font-medium"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                Contact / Phone
              </label>
              <input
                type="text"
                value={currentUser.phoneNo || currentUser.phone || ""}
                onChange={(e) =>
                  setUser({ ...currentUser, phoneNo: e.target.value })
                }
                placeholder="+60 12-345 6789"
                className="w-full px-4 py-3 bg-[#f5f5f7] text-[#1d1d1f] rounded-xl border border-transparent focus:border-[#0071e3] focus:bg-white transition-all outline-none font-medium"
              />
            </div>

            {/* Address */}
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                Shipping Address
              </label>
              <textarea
                value={currentUser.address || ""}
                onChange={(e) =>
                  setUser({ ...currentUser, address: e.target.value })
                }
                placeholder="Enter delivery address"
                className="w-full px-4 py-3 bg-[#f5f5f7] text-[#1d1d1f] rounded-xl border border-transparent focus:border-[#0071e3] focus:bg-white transition-all outline-none font-medium h-20 resize-none"
              />
            </div>
          </div>

          {/* 🔒 密碼修改卡片 */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200/60 shadow-sm">
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="flex justify-between items-center w-full text-xs font-bold text-[#1d1d1f] cursor-pointer"
            >
              <span>Change Password</span>
              <span className="text-gray-400 text-sm">
                {showPasswordSection ? "−" : "+"}
              </span>
            </button>

            {showPasswordSection && (
              <div className="mt-4 space-y-3 pt-3 border-t border-gray-100 text-xs">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwords.currentPassword}
                    onChange={(e) =>
                      setPasswords({
                        ...passwords,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#f5f5f7] rounded-xl border border-transparent focus:border-[#0071e3] focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) =>
                      setPasswords({
                        ...passwords,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#f5f5f7] rounded-xl border border-transparent focus:border-[#0071e3] focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) =>
                      setPasswords({
                        ...passwords,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#f5f5f7] rounded-xl border border-transparent focus:border-[#0071e3] focus:bg-white outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="w-full py-2.5 bg-[#1d1d1f] hover:bg-black text-white rounded-full text-xs font-bold transition-all duration-200 cursor-pointer"
                >
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 底部 Save 膠囊按鈕 */}
        <div className="p-4 bg-white/80 backdrop-blur-md border-t border-gray-200/60 sticky bottom-0">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-md active:scale-98 disabled:bg-gray-300 cursor-pointer"
          >
            {isSaving ? "SAVING CHANGES..." : "SAVE CHANGES"}
          </button>
        </div>
      </div>
      <PopoutAlert
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
      />
    </>
  );
}

export default ProfileSidebar;
