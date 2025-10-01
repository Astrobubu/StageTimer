'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Room {
  id: string;
  name: string;
  room_code: string;
  description: string | null;
  created_at: string;
}

export default function Dashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [user, setUser] = useState<any>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkUser();
    loadRooms();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadRooms = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRooms(data);
    }
    setLoading(false);
  };

  const createRoom = async () => {
    if (!newRoomName.trim() || !user) return;

    setCreating(true);
    const roomCode = Math.random().toString(36).substring(2, 9);

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        name: newRoomName,
        room_code: roomCode,
        description: newRoomDescription || null,
        owner_id: user.id,
      })
      .select()
      .single();

    if (!error && data) {
      setRooms([data, ...rooms]);
      setNewRoomName('');
      setNewRoomDescription('');
      setShowCreateForm(false);
    } else if (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room: ' + error.message);
    }
    setCreating(false);
  };

  const deleteRoom = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    await supabase.from('rooms').delete().eq('id', id);
    setRooms(rooms.filter(r => r.id !== id));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Rooms</h1>
            <p className="text-gray-400">Manage your StageTimer rooms and events</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>

        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="mb-6 bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            + Create New Room
          </button>
        ) : (
          <div className="mb-6 bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h2 className="text-xl font-semibold mb-4">Create New Room</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g., Opera Stage, Main Stadium, Conference Hall A"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  placeholder="Add a description for this room..."
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={createRoom}
                  disabled={creating || !newRoomName.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  {creating ? 'Creating...' : 'Create Room'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewRoomName('');
                    setNewRoomDescription('');
                  }}
                  className="bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-indigo-500 transition-colors"
            >
              <h3 className="text-xl font-semibold mb-2">{room.name}</h3>
              {room.description && (
                <p className="text-gray-400 text-sm mb-4">{room.description}</p>
              )}
              <div className="text-xs text-gray-500 mb-4">
                Room Code: <span className="font-mono text-indigo-400">{room.room_code}</span>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/room/${room.room_code}/controller`}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-center px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Open Controller
                </Link>
                <button
                  onClick={() => deleteRoom(room.id)}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
                  title="Delete room"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {rooms.length === 0 && !showCreateForm && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <p className="text-lg mb-2">No rooms yet</p>
              <p className="text-sm">Create your first room to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
