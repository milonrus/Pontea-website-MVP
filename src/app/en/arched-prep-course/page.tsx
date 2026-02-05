"use client";

import Link from 'next/link';

const ArchedPrepCoursePageEN = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-primary mb-8">
          TEST ARCHED Preparation Course
        </h1>

        <div className="prose max-w-none">
          <p className="text-xl text-gray-600 mb-8">
            Comprehensive preparation for Politecnico di Milano Architecture admission exam
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Course Structure (V1):</h2>
            <ul className="space-y-2">
              <li>1. Hero section (Student / Parent perspectives)</li>
              <li>2. Trust indicators</li>
              <li>3. What's included in the course</li>
              <li>4. How it works (3-step process)</li>
              <li>5. Curriculum (5 exam subjects)</li>
              <li>6. Saturday School (weekly group sessions)</li>
              <li>7. Mentorship support</li>
              <li>8. Pricing tiers</li>
              <li>9. Money-back guarantee</li>
              <li>10. FAQ</li>
              <li>11. Final CTA</li>
            </ul>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white border-2 border-primary rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">For Students</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Structured learning path</li>
                <li>✓ Practice exercises & mock exams</li>
                <li>✓ Community support</li>
                <li>✓ Expert guidance</li>
              </ul>
            </div>

            <div className="bg-white border-2 border-accent rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">For Parents</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Progress visibility</li>
                <li>✓ Mentorship oversight</li>
                <li>✓ 7-day money-back guarantee</li>
                <li>✓ Accountability through Saturday School</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold mb-3">Cohort Opening Soon</h3>
            <p className="mb-4">
              We're currently preparing the next enrollment period. Register for early access to be notified when spots become available.
            </p>
            <a
              href="#register"
              className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-secondary transition-colors duration-300"
            >
              Register for Early Access
            </a>
          </div>

          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-3">What's Included</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Video lectures covering all 5 exam subjects</li>
                <li>Downloadable PDF materials</li>
                <li>Practice exercises for each subject</li>
                <li>Mock exams with answer keys</li>
                <li>Saturday School: Weekly group lessons</li>
                <li>Group chat community</li>
                <li>Personal mentor support (response within 24 hours)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">Saturday School</h2>
              <p className="text-gray-700 mb-3">
                Every Saturday, join live group lessons covering all 5 exam subjects. Some sessions are conducted in English only, others are bilingual (EN/RU).
              </p>
              <p className="text-gray-700">
                English-only sessions are a feature, not a limitation - they help you prepare for the exam which is conducted entirely in English.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">Mentorship Support</h2>
              <p className="text-gray-700 mb-3">
                Get personalized guidance through WhatsApp/Telegram:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Study planning and scheduling</li>
                <li>Questions and clarifications</li>
                <li>Motivation and accountability</li>
                <li>Exam logistics and preparation tips</li>
                <li>Response time: within 24 hours</li>
              </ul>
            </section>
          </div>

          {/* Early Access Registration Form */}
          <div id="register" className="max-w-3xl mx-auto mt-12">
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
    </div>
  );
};

export default ArchedPrepCoursePageEN;
