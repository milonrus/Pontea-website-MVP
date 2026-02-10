import type { Metadata } from 'next';
import LocalizedPageTopBar from '@/components/shared/LocalizedPageTopBar';

export const metadata: Metadata = {
  alternates: {
    canonical: '/en',
    languages: {
      en: '/en',
      ru: '/ru'
    }
  }
};

const EarlyAccessPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <LocalizedPageTopBar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-primary mb-4">
            TEST ARCHED Preparation Course
          </h1>
          <p className="text-2xl text-gray-600 mb-2">
            Cohort Opening Soon
          </p>
          <p className="text-lg text-accent font-semibold">
            Register for Early Access
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold mb-6">What You'll Get:</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>Comprehensive video lectures covering all 5 exam subjects</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>Practice exercises and mock exams</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>Saturday School: Weekly group lessons with expert instructors</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>Personal mentorship with progress tracking</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>Group chat support community</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-center">
              Register for Early Access
            </h2>

            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I am a:
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input type="radio" name="role" value="student" className="mr-2" />
                    <span>Student</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="role" value="parent" className="mr-2" />
                    <span>Parent</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp or Telegram
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="+1234567890 or @username"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-secondary transition-colors duration-300"
              >
                Register for Early Access
              </button>
            </form>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <h3 className="font-semibold text-lg mb-2">What Happens Next?</h3>
            <p className="text-gray-600">
              We'll email you as soon as enrollment opens. You'll be among the first to know when spots become available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarlyAccessPage;
