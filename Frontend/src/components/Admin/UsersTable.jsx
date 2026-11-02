// components/UsersTable.jsx
import { Icon } from '@iconify/react';
import { useState } from 'react';

const UsersTable = ({ users, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <TableHeader 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      
      {loading ? (
        <LoadingSpinner />
      ) : (
        <TableContent users={filteredUsers} />
      )}
    </div>
  );
};

const TableHeader = ({ searchTerm, setSearchTerm }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
    <h2 className="text-2xl font-bold text-green-900 mb-4 sm:mb-0">Users Management</h2>
    <div className="flex space-x-3">
      <SearchInput 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      <AddUserButton />
    </div>
  </div>
);

const SearchInput = ({ searchTerm, setSearchTerm }) => (
  <div className="relative">
    <input
      type="text"
      placeholder="Search users..."
      className="pl-10 pr-4 py-2 border rounded-md text-sm w-full sm:w-64"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
    <Icon 
      icon="carbon:search" 
      className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" 
    />
  </div>
);

const AddUserButton = () => (
  <button className="bg-green-700 text-white px-4 py-2 rounded-md text-sm hover:bg-green-800 flex items-center">
    <Icon icon="carbon:add" className="h-4 w-4 mr-2" />
    Add User
  </button>
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <Icon icon="eos-icons:loading" className="h-8 w-8 animate-spin text-green-700" />
  </div>
);

const TableContent = ({ users }) => (
  <div className="bg-white shadow rounded-lg overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <TableHead />
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <TableRow key={user.id} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const TableHead = () => (
  <thead className="bg-gray-50">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
    </tr>
  </thead>
);

const TableRow = ({ user }) => (
  <tr className="hover:bg-gray-50">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
          <Icon icon="carbon:user" className="h-5 w-5 text-gray-600" />
        </div>
        <div className="ml-4">
          <div className="text-sm font-medium text-gray-900">{user.name}</div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
    <td className="px-6 py-4 whitespace-nowrap">
      <RoleBadge role={user.role} />
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <StatusBadge status={user.status} />
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
      <EditButton />
      <DeleteButton />
    </td>
  </tr>
);

const RoleBadge = ({ role }) => (
  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800`}>
    {role}
  </span>
);

const StatusBadge = ({ status }) => (
  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-green-50 text-green-800'}`}>
    {status}
  </span>
);

const EditButton = () => (
  <button className="text-green-600 hover:text-green-900 mr-3">Edit</button>
);

const DeleteButton = () => (
  <button className="text-green-600 hover:text-green-900">Delete</button>
);

export default UsersTable;