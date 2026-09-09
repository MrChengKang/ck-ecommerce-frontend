export const uploadToCloudinary = async (file) => {
  if (!file) return null;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "ml_default"); 

  try {
    const res = await fetch(
      "https://api.cloudinary.com/v1_1/qaplwyt9/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    return data.secure_url; 
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
};