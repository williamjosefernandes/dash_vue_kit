export { fakeBackend };

interface User {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface ResponseBody {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  token: string;
}

// Use this variable when actual api call
// const API_URL = import.meta.env.VITE_API_URL;

function fakeBackend() {
  const users: User[] = [{ id: 1, email: 'info@phoenixcoded.co', password: '123456', firstName: 'Phoenixcoded', lastName: '.com' }];

  const realFetch = window.fetch;

  window.fetch = function (url: string, opts: { method: string; headers: { [key: string]: string }; body?: string }) {
    return new Promise<Response>((resolve, reject) => {
      // wrap in timeout to simulate server api call
      setTimeout(handleRoute, 500);

      function handleRoute() {
        switch (true) {
          case url.endsWith('/users/authenticate') && opts.method === 'POST':
            // when you want to use actual api then use below code for api path setup & above code comment
            // case url.endsWith(`${API_URL}/api/account/login`) && opts.method === 'POST':
            return authenticate();
          case url.endsWith('/users') && opts.method === 'GET':
            return getUsers(); // Fetch users from the API
          default:
            return realFetch(url, opts)
              .then((response) => resolve(response))
              .catch((error) => reject(error));
        }
      }

      // route functions
      function authenticate() {
        const { email, password } = body();
        const user = users.find((x) => x.email === email && x.password === password);
        if (!user) return error('Email or password is incorrect');
        return ok({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          token: 'fake-jwt-token'
        });
      }

      // Use below code when actual api call & above code comment
      // async function authenticate() {
      //   const { email, password } = body();
      //   // Implement authentication logic here
      //   const response = await realFetch(`${API_URL}/api/account/login`, {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({ email, password })
      //   });

      //   if (!response.ok) {
      //     const errorResponse = await response.json();
      //     return error(errorResponse.message || 'Authentication failed');
      //   }

      //   const user = await response.json();
      //   return ok(user); // Return authenticated user
      // }

      function getUsers() {
        if (!isAuthenticated()) return unauthorized();
        return ok(users);
      }

      // Use below code when actual api call & above code comment
      // async function getUsers() {
      //   if (!isAuthenticated()) return unauthorized();

      //   // fetch users from the real API
      //   const response = await realFetch(`${API_URL}/api/users`, {
      //     method: 'GET',
      //     headers: { 'Content-Type': 'application/json' }
      //   });

      //   if (!response.ok) {
      //     const errorResponse = await response.json();
      //     return error(errorResponse.message || 'Failed to fetch users');
      //   }

      //   const users: User[] = await response.json(); // Assuming the API returns a list of users
      //   return ok(users); // Return the list of users
      // }

      // helper functions
      function ok(body: User[] | ResponseBody): void {
        resolve({ ok: true, text: () => Promise.resolve(JSON.stringify(body)) } as Response);
      }

      function unauthorized() {
        resolve({ status: 401, text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })) } as Response);
      }

      function error(message: string) {
        resolve({ status: 400, text: () => Promise.resolve(JSON.stringify({ message })) } as Response);
      }

      function isAuthenticated() {
        return opts.headers['Authorization'] === 'Bearer fake-jwt-token';

        // Use below code when actual api call & above code comment
        // return !!localStorage.getItem('user'); // Check if the user is logged in
      }

      function body() {
        return opts.body && JSON.parse(opts.body);
      }
    });
  } as typeof window.fetch; // Type assertion here
}
