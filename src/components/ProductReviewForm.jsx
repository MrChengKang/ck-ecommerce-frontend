import { useState } from "react";

export default function ProductReviewForm({
  API_BASE_URL,
  order,
  item,
  reviewed,
  onSubmitted,
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const submitReview = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("ck_token")}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          productId: item.productId,
          rating,
          comment,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Could not submit your review.");
      }

      onSubmitted({ orderId: order.id, productId: item.productId });
      setOpen(false);
      setMessage("Thank you. Your review has been submitted.");
    } catch (error) {
      setMessage(error.message || "Could not submit your review.");
    } finally {
      setSaving(false);
    }
  };

  if (reviewed) {
    return (
      <p className="ml-5 text-xs font-bold text-emerald-700">
        ✓ You reviewed this product
      </p>
    );
  }

  return (
    <div className="ml-5">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-bold text-blue-700 hover:text-blue-900"
        >
          Write a review
        </button>
      ) : (
        <form
          onSubmit={submitReview}
          className="max-w-xl space-y-3 rounded-2xl bg-gray-50 p-4"
        >
          <div>
            <label className="mb-1 block text-xs font-bold text-gray-700">
              Rating
            </label>
            <div
              className="flex gap-1"
              role="radiogroup"
              aria-label="Rating from 1 to 5 stars"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                  onClick={() => setRating(value)}
                  className={`text-2xl ${value <= rating ? "text-amber-500" : "text-gray-300"}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <label className="block text-xs font-bold text-gray-700">
            Your review
            <textarea
              required
              minLength={1}
              maxLength={1000}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-normal outline-none focus:border-blue-400"
              placeholder="Share what you think about this product…"
            />
          </label>

          {message && (
            <p role="alert" className="text-xs font-semibold text-rose-600">
              {message}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || !comment.trim()}
              className="rounded-full bg-blue-700 px-4 py-2 text-[10px] font-black uppercase text-white disabled:opacity-50"
            >
              {saving ? "Submitting…" : "Submit review"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setMessage("");
              }}
              className="rounded-full border border-gray-200 px-4 py-2 text-[10px] font-black uppercase text-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {message && !open && (
        <p role="status" className="mt-2 text-xs font-semibold text-emerald-700">
          {message}
        </p>
      )}
    </div>
  );
}
