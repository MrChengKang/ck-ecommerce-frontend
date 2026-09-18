import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import PopoutAlert from "./components/PopoutAlert";
import { useWishlist } from "./context/WishlistContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const AuthInput = ({
  type,
  placeholder,
  value,
  onChange,
  isPasswordField,
  showPassword,
  setShowPassword,
}) => (
  <div className="relative w-full group">
    <input
      type={isPasswordField ? (showPassword ? "text" : "password") : type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required
      className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-xs font-black text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-black transition-all shadow-inner"
    />

    {isPasswordField && (
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
      >
        {showPassword ? (
          <EyeOff size={18} strokeWidth={2.5} />
        ) : (
          <Eye size={18} strokeWidth={2.5} />
        )}
      </button>
    )}
  </div>
);

export default function AuthPage({ setIsLoggedIn, setUserRole }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
  });
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });

  const showAlert = (title, message, type = "info", onConfirm = null) => {
    setAlertConfig({ isOpen: true, title, message, type, onConfirm });
  };

  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("ck_remember_user");
    if (savedUser) {
      setFormData((prev) => ({ ...prev, username: savedUser }));
      setRememberMe(true);
    }

    const token = localStorage.getItem("ck_token");
    const role = localStorage.getItem("ck_role");

    if (token && role && role.toUpperCase() === "ADMIN") {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  const { fetchWishlist } = useWishlist();

  const validateForm = () => {
    if (!isLogin) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) return "INVALID EMAIL FORMAT";

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
      if (!passwordRegex.test(formData.password))
        return "PASSWORD TOO WEAK (8+ chars, Upper & Lower case)";

      if (formData.password !== confirmPassword)
        return "PASSWORDS DO NOT MATCH!";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get("content-type");
      const data = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      if (response.ok) {
        if (isLogin) {
          if (rememberMe)
            localStorage.setItem("ck_remember_user", formData.username);
          else localStorage.removeItem("ck_remember_user");

          localStorage.setItem("ck_token", data.token);
          localStorage.setItem("ck_role", data.role);
          localStorage.setItem("ck_user_id", data.id);
          localStorage.setItem("ck_email", data.email);
          localStorage.setItem(
            "ck_username",
            data.username || formData.username,
          );

          // 💡 關鍵新增：登入成功寫入 Token 後，立刻撈取該使用者的 Wishlist 資料
          await fetchWishlist();

          setIsExiting(true);

          setTimeout(() => {
            setIsLoggedIn(true);
            setUserRole(data.role);
            data.role === "ADMIN"
              ? navigate("/admin", { replace: true })
              : navigate("/", { replace: true });
          }, 500);
        } else {
          showAlert(
            "Success",
            "Registration completed! Please sign in with your account.",
            "success",
            () => setIsLogin(true),
          );
        }
      } else {
        const errorMessages = {
          USERNAME_ALREADY_EXISTS: "Username taken!",
          EMAIL_ALREADY_REGISTERED: "Email in use!",
          INVALID_CREDENTIALS: "Wrong username/email or password.",
        };
        setError(
          errorMessages[data] ||
            (typeof data === "string" ? data : "AUTH_FAILED"),
        );
      }
    } catch (err) {
      setError("Server Error! Backend might be down.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (step === 2 && newPassword !== confirmPassword) {
      setError("PASSWORDS DO NOT MATCH!");
      return;
    }

    setIsLoading(true);
    const endpoint =
      step === 1 ? "/api/auth/forgot-password" : "/api/auth/reset-password";
    const body =
      step === 1
        ? { email: formData.email }
        : { email: formData.email, otp, newPassword };

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const msg = await res.text();
      if (res.ok) {
        if (step === 1) {
          showAlert(
            "OTP Sent",
            "Verification code sent! Check your email.",
            "info",
            () => setStep(2),
          );
        } else {
          showAlert(
            "Success",
            "Password updated successfully!",
            "success",
            () => {
              setIsForgotPassword(false);
              setIsLogin(true);
              setStep(1);
            },
          );
        }
      } else {
        setError(msg);
      }
    } catch (err) {
      setError("Server error during reset.");
    } finally {
      setIsLoading(false);
    }
  };

  const primaryBtnClass =
    "w-full bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 mt-2 hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-black/10";

  return (
    <div
      className={`min-h-[85vh] flex items-center justify-center px-4 py-12 relative bg-gray-50/50 transition-all duration-500 ${
        isExiting ? "opacity-0 scale-90 blur-sm" : "opacity-100 scale-100"
      }`}
    >
      {/* 質感幾何背景 */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

      {/* 主卡片 */}
      <div className="w-full max-w-[420px] bg-white border-2 border-gray-200/80 p-8 sm:p-10 rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] relative z-10">
        {/* 標題與簡介 */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black italic uppercase tracking-tight text-[#1d1d1f]">
            {isForgotPassword ? "RESET" : isLogin ? "SIGN IN" : "REGISTER"}
          </h2>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mt-2">
            {isForgotPassword
              ? "Account Recovery"
              : isLogin
                ? "Welcome back to CK Store"
                : "Create your account"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3.5 rounded-xl mb-6 text-[10px] font-black text-center uppercase tracking-widest border-2 border-red-200 animate-pulse">
            {error}
          </div>
        )}

        {isForgotPassword ? (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            {step === 1 ? (
              <AuthInput
                type="email"
                placeholder="EMAIL ADDRESS"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            ) : (
              <>
                <AuthInput
                  type="text"
                  placeholder="6-DIGIT OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <AuthInput
                  type="password"
                  placeholder="NEW PASSWORD"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  isPasswordField={true}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                />
                <AuthInput
                  type="password"
                  placeholder="CONFIRM NEW PASSWORD"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  isPasswordField={true}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                />
              </>
            )}
            <button disabled={isLoading} className={primaryBtnClass}>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : step === 1 ? (
                "Send Code"
              ) : (
                "Reset Password"
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setStep(1);
                setError("");
              }}
              className="w-full mt-3 text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-black transition-colors cursor-pointer text-center"
            >
              ← Back to Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput
              type="text"
              placeholder={isLogin ? "USERNAME OR EMAIL" : "USERNAME"}
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
            />
            {!isLogin && (
              <AuthInput
                type="email"
                placeholder="EMAIL ADDRESS"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            )}
            <AuthInput
              type="password"
              placeholder="PASSWORD"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              isPasswordField={true}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />
            {!isLogin && (
              <AuthInput
                type="password"
                placeholder="CONFIRM PASSWORD"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                isPasswordField={true}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
              />
            )}

            <button disabled={isLoading} className={primaryBtnClass}>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Register Now"
              )}
            </button>

            {isLogin && (
              <div className="flex items-center justify-between mt-5 px-1 pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                  />
                  <div
                    className={`w-4 h-4 border-2 rounded-md flex items-center justify-center transition-all ${
                      rememberMe
                        ? "bg-black border-black text-white"
                        : "border-gray-300 group-hover:border-black"
                    }`}
                  >
                    {rememberMe && <span className="text-[9px]">✓</span>}
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider group-hover:text-black transition-colors">
                    Remember
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError("");
                  }}
                  className="text-[10px] font-black text-gray-400 uppercase tracking-wider hover:text-black transition-colors cursor-pointer"
                >
                  Forgot?
                </button>
              </div>
            )}
          </form>
        )}

        {!isForgotPassword && (
          <div className="mt-8 pt-6 border-t-2 border-gray-100 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-gray-400 text-[11px] font-black uppercase tracking-wider hover:text-black transition-colors cursor-pointer"
            >
              {isLogin
                ? "Need an account? Sign Up"
                : "Already a member? Sign In"}
            </button>
          </div>
        )}
      </div>

      <PopoutAlert
        isOpen={alertConfig.isOpen}
        onClose={() => {
          if (typeof alertConfig.onConfirm === "function") {
            alertConfig.onConfirm();
          }
          setAlertConfig((prev) => ({ ...prev, isOpen: false }));
        }}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
      />
    </div>
  );
}
