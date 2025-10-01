'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-12 rounded-2xl shadow-xl max-w-2xl w-full text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">
          StageTimer
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Professional synchronized timer for presentations, events, and live shows
        </p>

        <div className="space-y-4 max-w-md mx-auto">
          <Link
            href="/login"
            className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-4 px-6 rounded-lg transition-colors duration-200"
          >
            Create Account
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-4">
            <div className="text-3xl mb-2">⏱️</div>
            <h3 className="font-semibold text-gray-800 mb-1">Multiple Timers</h3>
            <p className="text-sm text-gray-600">Create agenda with unlimited timers for your event</p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2">📱</div>
            <h3 className="font-semibold text-gray-800 mb-1">Sync Devices</h3>
            <p className="text-sm text-gray-600">Real-time sync across all connected viewers</p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2">💬</div>
            <h3 className="font-semibold text-gray-800 mb-1">Messages</h3>
            <p className="text-sm text-gray-600">Send instant messages to all viewers</p>
          </div>
        </div>
      </div>
    </div>
  );
}
