(() => {
  const nativeFetch = window.fetch.bind(window);

  window.fetch = (input, init = {}) => {
    const rawUrl = input instanceof Request ? input.url : String(input || '');
    const url = new URL(rawUrl, window.location.origin);
    if (!url.pathname.startsWith('/api/admin/')) return nativeFetch(input, init);

    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init.headers || {}).forEach((value, key) => headers.set(key, value));
    const token = window.localStorage.getItem('kurukoo_admin') || '';
    if (token) headers.set('x-admin-token', token);

    return nativeFetch(input, {
      ...init,
      headers,
      credentials: init.credentials || 'same-origin',
    });
  };
})();

//# sourceURL=kurukoo-admin-auth.js

