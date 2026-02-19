import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';

// Mock firebase modules
vi.mock('firebase/auth');
vi.mock('../../lib/firebase', () => ({
  auth: {},
  googleProvider: {},
}));

describe('useAuth Hook', () => {
  const mockUser = { uid: '123', email: 'test@example.com', displayName: 'Test User' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state true', () => {
    onAuthStateChanged.mockReturnValue(vi.fn());
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);
  });

  it('should update user state on auth state change', () => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth());
    
    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual(mockUser);
  });

  it('should handle signInWithGoogle success', async () => {
    signInWithPopup.mockResolvedValue({ user: mockUser });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(signInWithPopup).toHaveBeenCalled();
  });

  it('should handle signInWithEmail login success', async () => {
    signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signInWithEmail('test@example.com', 'password', null, false);
    });

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password');
  });

  it('should handle signInWithEmail signup success', async () => {
    createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });
    updateProfile.mockResolvedValue();
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signInWithEmail('test@example.com', 'password', 'Test User', true);
    });

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password');
    expect(updateProfile).toHaveBeenCalled();
  });

  it('should handle signOut success', async () => {
    signOut.mockResolvedValue();
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(signOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });
});
