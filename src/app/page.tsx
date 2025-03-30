export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12 pt-8 sm:pt-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Welcome to AI Debate Arena</h1>
        <p className="text-lg sm:text-xl text-gray-700 sm:text-gray-600 max-w-3xl mx-auto">
          Watch AI agents debate on any topic you choose. Select a sample topic or create your own!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 pb-8">
        {/* Left Section - Popular Topics */}
        <div className="bg-white p-5 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-lg sm:text-xl font-semibold text-indigo-700 mb-3 sm:mb-4">Popular Topics</h2>
          <ul className="space-y-2 sm:space-y-3">
            <li className="p-3 hover:bg-indigo-50 rounded transition cursor-pointer text-gray-800 sm:text-gray-700">
              Should universal basic income be implemented worldwide?
            </li>
            <li className="p-3 hover:bg-indigo-50 rounded transition cursor-pointer text-gray-800 sm:text-gray-700">
              Is artificial intelligence a net positive for humanity?
            </li>
            <li className="p-3 hover:bg-indigo-50 rounded transition cursor-pointer text-gray-800 sm:text-gray-700">
              Should college education be free for everyone?
            </li>
            <li className="p-3 hover:bg-indigo-50 rounded transition cursor-pointer text-gray-800 sm:text-gray-700">
              Does social media do more harm than good to society?
            </li>
          </ul>
        </div>

        {/* Main Section - Call to Action */}
        <div className="bg-white p-5 sm:p-6 rounded-lg shadow-md flex flex-col">
          <h2 className="text-lg sm:text-xl font-semibold text-indigo-700 mb-3 sm:mb-4">Start a New Debate</h2>
          <div className="flex-grow flex flex-col justify-center">
            <p className="text-gray-700 sm:text-gray-600 mb-4 sm:mb-6">
              Enter a topic and watch two AI agents debate it from opposing perspectives.
            </p>
            <a 
              href="/debater" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-md text-center font-medium transition"
            >
              Start Debating Now
            </a>
          </div>
        </div>

        {/* Right Section - Recent Debates */}
        <div className="bg-white p-5 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-lg sm:text-xl font-semibold text-indigo-700 mb-3 sm:mb-4">Recent Debates</h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="border-l-4 border-indigo-500 pl-4">
              <h3 className="font-medium text-gray-800">&quot;Should we colonize Mars?&quot;</h3>
              <p className="text-sm text-gray-600">3 rounds · 5 minutes ago</p>
            </div>
            <div className="border-l-4 border-indigo-500 pl-4">
              <h3 className="font-medium text-gray-800">&quot;Is remote work better than office work?&quot;</h3>
              <p className="text-sm text-gray-600">5 rounds · 1 hour ago</p>
            </div>
            <div className="border-l-4 border-indigo-500 pl-4">
              <h3 className="font-medium text-gray-800">&quot;Should voting be mandatory?&quot;</h3>
              <p className="text-sm text-gray-600">4 rounds · 3 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}