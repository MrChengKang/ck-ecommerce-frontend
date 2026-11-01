import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, MessageSquare, Star } from "lucide-react";
import api from "../../api/axios";

export default function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/admin/reviews");
      setReviews(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(requestError.response?.data || "Could not load product reviews.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const toggleVisibility = async (review) => {
    setUpdatingId(review.id);
    setError("");
    try {
      const response = await api.patch(`/api/admin/reviews/${review.id}/visibility`, {
        visible: !review.visible,
      });
      setReviews((current) =>
        current.map((item) => (item.id === review.id ? response.data : item)),
      );
    } catch (requestError) {
      setError(requestError.response?.data || "Could not update review visibility.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Product reviews</h2>
          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
            Review moderation • {reviews.length} total
          </p>
        </div>
        <button
          type="button"
          onClick={loadReviews}
          disabled={loading}
          className="rounded-full border border-gray-200 px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</p>}

      {loading ? (
        <div className="py-16 text-center text-sm font-bold text-gray-400">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 p-12 text-center text-sm text-gray-400">
          <MessageSquare className="mx-auto mb-3" />
          No product reviews yet.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-3xl border border-gray-100 bg-gray-50/70 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-gray-900">{review.reviewerName}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-gray-500">
                      Product #{review.productId} · Order #{review.orderId}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase ${review.visible ? "bg-emerald-50 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                      {review.visible ? "Visible" : "Hidden"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-amber-500" aria-label={`${review.rating} stars`}>
                    {Array.from({ length: review.rating }, (_, index) => <Star key={index} size={14} fill="currentColor" />)}
                    <span className="ml-1 text-xs font-bold text-gray-500">{review.rating}/5</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleVisibility(review)}
                  disabled={updatingId === review.id}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-wider text-gray-700 shadow-sm hover:bg-black hover:text-white disabled:opacity-50"
                >
                  {review.visible ? <EyeOff size={14} /> : <Eye size={14} />}
                  {updatingId === review.id ? "Saving…" : review.visible ? "Hide review" : "Show review"}
                </button>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{review.comment}</p>
              <p className="mt-3 text-[10px] font-medium text-gray-400">
                {review.createdAt ? new Date(review.createdAt).toLocaleString() : ""}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
