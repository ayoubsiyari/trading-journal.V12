<button
  onClick={() => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }}
  className="text-red-600 hover:underline"
>
  Logout
</button>
