import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">College Tracker</div>
          <div className="space-x-4">
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Your Personalized Path to
            <span className="text-blue-600"> Dream College</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Get AI-powered guidance from an expert admissions counselor.
            No more confusion, no $10k fees. Just clear, actionable steps tailored to you.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-blue-600 text-white text-lg px-8 py-4 rounded-lg hover:bg-blue-700 transition shadow-lg"
          >
            Start Your Journey Free
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • Get your personalized roadmap in 2 minutes
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Personalized Roadmap</h3>
            <p className="text-gray-600">
              AI analyzes your profile and creates a step-by-step plan tailored to your dream schools.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Quick Wins Daily</h3>
            <p className="text-gray-600">
              Get 3 actionable tasks every day. Each takes under 15 minutes but moves you forward.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
            <p className="text-gray-600">
              Earn points, unlock achievements, and see your journey to college applications unfold.
            </p>
          </div>
        </div>

        {/* Pain Points Section */}
        <div className="mt-20 bg-white rounded-lg shadow-md p-8 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-6">Stop Feeling Overwhelmed</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="text-red-500 mr-3">✕</span>
              <p className="text-gray-700">Too busy to see your school counselor</p>
            </div>
            <div className="flex items-start">
              <span className="text-red-500 mr-3">✕</span>
              <p className="text-gray-700">Can't afford $10,000 private counseling</p>
            </div>
            <div className="flex items-start">
              <span className="text-red-500 mr-3">✕</span>
              <p className="text-gray-700">Confused about what to do and when</p>
            </div>
            <div className="flex items-start">
              <span className="text-red-500 mr-3">✕</span>
              <p className="text-gray-700">Stressed about missing important deadlines</p>
            </div>
          </div>
          <div className="mt-6 text-center">
            <span className="text-green-600 font-semibold">✓ College Tracker solves all of this</span>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Take Control?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of students getting into their dream colleges
          </p>
          <Link
            href="/signup"
            className="inline-block bg-blue-600 text-white text-lg px-8 py-4 rounded-lg hover:bg-blue-700 transition shadow-lg"
          >
            Create Your Free Account
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t">
        <div className="text-center text-gray-600">
          <p>&copy; 2026 College Tracker. Your journey to college starts here.</p>
        </div>
      </footer>
    </div>
  );
}
