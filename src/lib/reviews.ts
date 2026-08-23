export const MAX_REVIEW_COMMENT_LENGTH = 1000;

export type ReviewSummaryData = {
  average: number | null;
  count: number;
};

export type EditableReview = {
  id: string;
  rating: number;
  comment: string | null;
};

export type PublicReview = EditableReview & {
  reviewerId: string;
  createdAt: string;
  updatedAt: string;
  author: {
    name: string;
    avatarUrl: string | null;
  } | null;
};

export function calculateReviewSummary(
  reviews: readonly { rating: number }[],
): ReviewSummaryData {
  const validRatings = reviews
    .map((review) => Number(review.rating))
    .filter(
      (rating) => Number.isInteger(rating) && rating >= 1 && rating <= 5,
    );

  if (validRatings.length === 0) {
    return { average: null, count: 0 };
  }

  const total = validRatings.reduce((sum, rating) => sum + rating, 0);

  return {
    average: total / validRatings.length,
    count: validRatings.length,
  };
}
