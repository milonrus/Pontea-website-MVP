"use client";

const ThankYouPageEN = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-6">✓</div>
          <h1 className="text-4xl font-bold text-primary mb-4">
            Thank You for Registering!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            You're on the early access list for PONTEA School
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-xl font-semibold mb-4">What to Expect Next:</h2>
            <ol className="space-y-3">
              <li className="flex items-start">
                <span className="font-semibold mr-2">1.</span>
                <span>Check your email for a confirmation message</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">2.</span>
                <span>We'll notify you as soon as enrollment opens</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">3.</span>
                <span>You'll receive details about pricing and course access</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">4.</span>
                <span>Early access registrants get priority enrollment</span>
              </li>
            </ol>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Timeline:</strong> We're aiming to open enrollment within the next few weeks. You'll be among the first to know.
            </p>
          </div>

          <div className="text-gray-600 text-sm">
            <p>Questions? Contact us via WhatsApp or Telegram</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPageEN;
