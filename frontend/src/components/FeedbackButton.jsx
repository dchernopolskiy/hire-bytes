import { useState } from 'react';
import { MessageSquare } from 'lucide-react';

export const FeedbackButton = ({ className = '' }) => {
  const [showModal, setShowModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          feedback,
          timestamp: new Date().toISOString(),
          userId: localStorage.getItem('userId'),
          username: localStorage.getItem('username'),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSubmitted(true);
      setTimeout(() => {
        setShowModal(false);
        // Reset state after closing
        setRating(0);
        setFeedback('');
        setSubmitted(false);
      }, 2000);

    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-600 
          text-white p-3 rounded-full shadow-lg transition-colors ${className}`}
        title="Provide Feedback"
      >
        <MessageSquare className="w-5 h-5" />
      </button>
      
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            {submitted ? (
              <div className="text-center py-8">
                <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
                <p className="text-gray-400">Your feedback has been submitted.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Provide Feedback</h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-white"
                    type="button"
                  >
                    ×
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Rate your experience
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center
                          ${rating >= value
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-700 text-gray-400'
                          } hover:bg-blue-600 transition-colors`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your feedback
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about your experience..."
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !rating}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50
                    text-white py-2 px-4 rounded-md transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};