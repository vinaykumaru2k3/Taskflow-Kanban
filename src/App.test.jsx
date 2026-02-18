import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn((q, callback) => {
    callback({ forEach: vi.fn() });
    return vi.fn(); // Return unsubscribe function
  }),
  query: vi.fn(),
  deleteDoc: vi.fn(),
  updateDoc: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInAnonymously: vi.fn(() => Promise.resolve({ user: { uid: 'test-uid' } })),
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback({ uid: 'test-uid' });
    return vi.fn();
  }),
  signInWithCustomToken: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(() => Promise.resolve({ user: { uid: 'google-test-uid', displayName: 'Test User' } })),
  signOut: vi.fn(() => Promise.resolve()),
}));

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeTruthy();
  });
});
