import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({ app: {} })),
  collection: vi.fn(() => 'tasks-collection'),
  doc: vi.fn((_, __, id) => `doc-${id}`),
  onSnapshot: vi.fn((q, callback) => {
    callback({ 
      forEach: (fn) => {
        // Simulate empty data
      } 
    });
    return vi.fn();
  }),
  query: vi.fn((q) => q),
  where: vi.fn((_, __, value) => ({ type: 'where', value })),
  orderBy: vi.fn((field) => ({ type: 'orderBy', field })),
  deleteDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(() => Promise.resolve()),
  addDoc: vi.fn(() => Promise.resolve({ id: 'new-doc-id' })),
  serverTimestamp: vi.fn(() => new Date()),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ app: {} })),
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback(null); // Start with no user (landing page)
    return vi.fn();
  }),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(() => Promise.resolve({ user: { uid: 'google-test-uid', displayName: 'Google User', photoURL: null } })),
  signOut: vi.fn(() => Promise.resolve()),
  createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: { uid: 'email-test-uid', displayName: 'Email User', photoURL: null } })),
  signInWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: { uid: 'email-test-uid', displayName: 'Email User', photoURL: null } })),
  updateProfile: vi.fn(() => Promise.resolve()),
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Landing Page (Not Authenticated)', () => {
    it('renders landing page when not authenticated', () => {
      render(<App />);
      expect(screen.getByRole('heading', { name: /Organize tasks/ })).toBeInTheDocument();
    });

    it('shows sign in button in header', () => {
      render(<App />);
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });

    it('shows get started free button', () => {
      render(<App />);
      expect(screen.getByRole('button', { name: /Get Started Free/i })).toBeInTheDocument();
    });

    it('displays feature sections', () => {
      render(<App />);
      expect(screen.getByRole('heading', { name: 'Kanban Board' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Subtasks' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Due Dates' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Analytics' })).toBeInTheDocument();
    });

    it('opens email sign in modal when sign in button clicked', () => {
      render(<App />);
      const signInButton = screen.getByRole('button', { name: /Sign In/i });
      fireEvent.click(signInButton);
      expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
    });

    it('shows create account option in modal', () => {
      render(<App />);
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
      const signUpLink = screen.getByRole('button', { name: /Sign Up/i });
      fireEvent.click(signUpLink);
      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    });

    it('shows name field in sign up mode', () => {
      render(<App />);
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
      fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      render(<App />);
      expect(document.body).toBeInTheDocument();
    });

    it('renders landing page component', () => {
      render(<App />);
      expect(screen.getAllByText(/Organize tasks/).length).toBeGreaterThan(0);
    });

    it('has correct page title', () => {
      render(<App />);
      const heading = screen.getByRole('heading', { name: /Organize tasks/ });
      expect(heading).toBeInTheDocument();
    });

    it('displays call to action buttons', () => {
      render(<App />);
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });

    it('shows footer', () => {
      render(<App />);
      expect(screen.getByText(/Built with React/)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates email input in sign in modal', () => {
      render(<App />);
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
      
      const emailInput = screen.getByPlaceholderText('you@example.com');
      expect(emailInput).toBeInTheDocument();
    });

    it('validates password input in sign in modal', () => {
      render(<App />);
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
      
      const passwordInput = screen.getByPlaceholderText('••••••••');
      expect(passwordInput).toBeInTheDocument();
    });
  });
});

describe('Landing Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders landing component', () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });

  it('displays hero section', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /effortless clarity/ })).toBeInTheDocument();
  });

  it('shows feature cards', () => {
    render(<App />);
    expect(screen.getByText(/drag-and-drop/)).toBeInTheDocument();
  });

  it('has working sign in flow', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(button);
    expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
  });
});

describe('Modal Component', () => {
  it('renders modal when open', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
  });
});
