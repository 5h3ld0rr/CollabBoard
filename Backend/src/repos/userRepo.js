import { randomUUID } from 'node:crypto';

// In-memory users store with seeded default users
const users = [
  {
    id: '1',
    name: 'Alex Chen',
    email: 'user1@nsbm.lk',
    // bcrypt hash of 'password123'
    passwordHash: '$2a$10$NgdZ3I5PimDrUHErY68OO.VqgM9sSq413Z4aUIFyD8AXBR1fV0HDO',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Clara Tanaka',
    email: 'user2@nsbm.lk',
    // bcrypt hash of 'password123'
    passwordHash: '$2a$10$NgdZ3I5PimDrUHErY68OO.VqgM9sSq413Z4aUIFyD8AXBR1fV0HDO',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Elena Rostova',
    email: 'user3@nsbm.lk',
    // bcrypt hash of 'password123'
    passwordHash: '$2a$10$NgdZ3I5PimDrUHErY68OO.VqgM9sSq413Z4aUIFyD8AXBR1fV0HDO',
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Marcus Vance',
    email: 'user4@nsbm.lk',
    // bcrypt hash of 'password123'
    passwordHash: '$2a$10$NgdZ3I5PimDrUHErY68OO.VqgM9sSq413Z4aUIFyD8AXBR1fV0HDO',
    createdAt: new Date().toISOString(),
  },
];

/**
 * Strips sensitive fields like passwordHash before returning user object
 * @param {object} user - Raw user entity
 * @returns {object|null} Sanitized user profile
 */
export function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export const userRepo = {
  async findByEmail(email) {
    const normalized = email.toLowerCase().trim();
    return users.find((u) => u.email.toLowerCase() === normalized) ?? null;
  },

  async findById(id) {
    return users.find((u) => String(u.id) === String(id)) ?? null;
  },

  async create({ email, passwordHash, name = 'User' }) {
    const newUser = {
      id: randomUUID(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    return newUser;
  },

  async list() {
    return users.map(publicUser);
  },
};
