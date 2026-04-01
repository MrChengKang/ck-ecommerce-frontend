/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 👈 檢查這行有沒有寫錯，特別是括號
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}