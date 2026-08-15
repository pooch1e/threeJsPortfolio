/**
 * AdminUserTable — lists users for the admin dashboard, linking each row
 * to its detail page and exposing a delete action.
 */
import { useNavigate } from "react-router-dom";

export default function AdminUserTable({ users, loading, onDelete }) {
  const navigate = useNavigate();

  if (!loading && users.length === 0) {
    return <p className="font-karrik text-gray-400 text-sm py-6 text-center">No users found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      {loading && (
        <p className="font-karrik text-gray-400 text-sm py-2">Loading users…</p>
      )}
      <table className="w-full text-left text-sm font-karrik">
        <thead>
          <tr className="border-b border-gray-700 text-gray-400 uppercase tracking-widest text-xs">
            <th className="py-2 pr-4">ID</th>
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Email</th>
            <th className="py-2 pr-4">Admin</th>
            <th className="py-2 pr-4">Created</th>
            <th className="py-2 pr-4"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-gray-800 text-gray-200 hover:bg-gray-900/60 cursor-pointer"
              onClick={() => navigate(`/admin/users/${user.id}`)}
            >
              <td className="py-2 pr-4 truncate max-w-[8rem]">{user.id}</td>
              <td className="py-2 pr-4">{user.name}</td>
              <td className="py-2 pr-4">{user.email}</td>
              <td className="py-2 pr-4">
                {user.is_admin ? (
                  <span className="text-green-400">Yes</span>
                ) : (
                  <span className="text-gray-500">No</span>
                )}
              </td>
              <td className="py-2 pr-4">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : ""}
              </td>
              <td className="py-2 pr-4 text-right">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(user);
                  }}
                  className="text-red-500 hover:text-red-400 text-xs uppercase tracking-widest"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
