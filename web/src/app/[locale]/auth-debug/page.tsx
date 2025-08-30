'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Button } from 'react-day-picker';

export default function AuthDebugPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [authTest, setAuthTest] = useState<any>(null);

  useEffect(() => {
    // Fetch all users
    fetch('/api/debug/users')
      .then(res => res.json())
      .then(data => setUsers(data.users || []))
      .catch(console.error);
  }, []);

  const testAuthEndpoint = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      setAuthTest({ success: response.ok, data, status: response.status });
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setAuthTest({ success: false, error: errorMessage });
    }
  };

  const clearSession = async () => {
    try {
      const response = await fetch('/api/debug/clear-session', { method: 'POST' });
      const data = await response.json();
      alert('Session cleared: ' + JSON.stringify(data));
      window.location.reload();
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert('Error clearing session: ' + errorMessage);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Auth Debug Page</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Current Session</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Status:</strong> {status}</p>
          <pre className="bg-gray-100 p-4 rounded mt-4 overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auth API Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testAuthEndpoint} className="mb-4">Test /api/auth/me</Button>
          {authTest && (
            <div>
              <p><strong>Success:</strong> {authTest.success ? 'Yes' : 'No'}</p>
              {authTest.status && <p><strong>Status:</strong> {authTest.status}</p>}
              <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto">
                {JSON.stringify(authTest, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users in Database ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users.map(user => (
              <div key={user.id} className="p-2 border rounded">
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Role:</strong> {user.role}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <span onClick={clearSession} className="bg-red-600 hover:bg-red-700 text-white">
            Clear Session & Reload
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
