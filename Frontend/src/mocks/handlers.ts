import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('*/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as any;
    
    if (body.email === 'test@example.com' && body.password === 'password') {
return HttpResponse.json({
        data: {
          token: 'mock-jwt-token',
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            initials: 'TU',
            color: 'from-blue-500 to-indigo-500'
          },
        },
      });
    }

    return HttpResponse.json(
      { message: 'Failed to log in. Please check your credentials.' },
      { status: 401 }
    );
  }),
  
  http.get('*/api/auth/me', () => {
    return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }),
];
