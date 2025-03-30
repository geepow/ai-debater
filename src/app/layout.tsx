import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Debate Arena',
  description: 'Watch AI agents debate on any topic',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-indigo-700 text-white shadow-md">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <a href="/" className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xl font-bold">AI Debate Arena</span>
              </a>
              <nav>
                <ul className="flex space-x-6">
                  <li><a href="/debater" className="hover:text-indigo-200 transition">Debate</a></li>
                  <li><a href="#" className="hover:text-indigo-200 transition">Login</a></li>
                </ul>
              </nav>
            </div>
          </header>

          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>

          <footer className="bg-gray-800 text-white py-6">
            <div className="container mx-auto px-4 text-center">
              <p>© {new Date().getFullYear()} AI Debate Arena. All rights reserved.</p>
              <div className="mt-2 flex justify-center space-x-4">
                <a href="#" className="hover:text-indigo-300 transition">Terms</a>
                <a href="#" className="hover:text-indigo-300 transition">Privacy</a>
                <a href="#" className="hover:text-indigo-300 transition">Contact</a>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}