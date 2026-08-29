import { useState, useEffect } from "react";
import { getUsers } from "../services/userService";
import type { User } from "../types";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering
  const [searchTerm, setSearchTerm] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Failed to load users data. Check your permissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      u.name?.toLowerCase().includes(searchLower) ||
      u.email?.toLowerCase().includes(searchLower) ||
      u.phone?.toLowerCase().includes(searchLower) ||
      u.id?.toLowerCase().includes(searchLower)
    );
  });

  if (loading && users.length === 0) {
    return (
      <div className="page-loading">
        <span className="spinner"></span>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Users Directory</h1>
          <p>View devotee profiles registered on the platform</p>
        </div>
      </div>

      <div className="table-controls" style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Search by name, email, phone or ID..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', padding: '10px 14px', borderRadius: '4px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
        />
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠</span>
          {error}
        </div>
      )}

      {users.length === 0 && !error ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No users found</h3>
          <p>Devotee profiles will appear here when they register.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Registered Date</th>
                <th>User ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="font-medium">{user.name || "—"}</td>
                    <td>{user.phone || "—"}</td>
                    <td>{user.email || "—"}</td>
                    <td>
                      {user.createdAt?.toDate 
                        ? user.createdAt.toDate().toLocaleDateString() 
                        : 'Unknown'}
                    </td>
                    <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                      {user.id}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px' }}>
                    No users match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="form-help" style={{ marginTop: '16px', textAlign: 'right' }}>
            Total users: {users.length} | Showing: {filteredUsers.length}
          </div>
        </div>
      )}
    </div>
  );
}
