import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../../components/Header';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Layers: () => <div data-testid="icon-layers" />,
  User: () => <div data-testid="icon-user" />,
  LogOut: () => <div data-testid="icon-logout" />,
  BarChart3: () => <div data-testid="icon-chart" />,
  Search: () => <div data-testid="icon-search" />,
  Plus: () => <div data-testid="icon-plus" />,
  Calendar: () => <div data-testid="icon-calendar" />,
  CheckCircle2: () => <div data-testid="icon-check" />,
  AlertCircle: () => <div data-testid="icon-alert" />,
}));

describe('Header Component', () => {
  const defaultProps = {
    user: { displayName: 'John Doe', photoURL: 'http://example.com/photo.jpg' },
    currentBoard: { name: 'My Project', color: '#3B82F6' },
    showSidebar: true,
    setShowSidebar: vi.fn(),
    handleSignOut: vi.fn(),
    showStats: false,
    setShowStats: vi.fn(),
    viewMode: 'kanban',
    setViewMode: vi.fn(),
    searchQuery: '',
    setSearchQuery: vi.fn(),
    handleOpenCreateTask: vi.fn(),
    stats: { total: 10, completed: 5, urgent: 2, overdue: 1 },
  };

  test('renders header with user info and board name', () => {
    render(<Header {...defaultProps} />);
    
    expect(screen.getByText('My Project')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByAltText('John Doe')).toHaveAttribute('src', 'http://example.com/photo.jpg');
  });

  test('toggles sidebar when menu icon clicked (mobile)', () => {
    render(<Header {...defaultProps} />);
    
    // The sidebar toggle is the first Layers icon (in DOM order)
    const menuIcon = screen.getAllByTestId('icon-layers')[0];
    fireEvent.click(menuIcon.parentElement);
    
    expect(defaultProps.setShowSidebar).toHaveBeenCalledWith(!defaultProps.showSidebar); // Expected false-ish
  });

  test('toggles stats view', () => {
    render(<Header {...defaultProps} />);
    
    fireEvent.click(screen.getByText(/Stats/i));
    
    expect(defaultProps.setShowStats).toHaveBeenCalledWith(!defaultProps.showStats); // Expected true
  });

  test('renders stats panel when showStats is true', () => {
    render(<Header {...defaultProps} showStats={true} />);
    
    expect(screen.getByText('10')).toBeInTheDocument(); // total
    expect(screen.getByText('5')).toBeInTheDocument();  // completed
    expect(screen.getByText('2')).toBeInTheDocument();  // urgent
    expect(screen.getByText('1')).toBeInTheDocument();  // overdue
  });

  test('changes view mode between Kanban and Calendar', () => {
    render(<Header {...defaultProps} />);
    
    fireEvent.click(screen.getByText(/Calendar/i));
    expect(defaultProps.setViewMode).toHaveBeenCalledWith('calendar');
    
    fireEvent.click(screen.getByText(/Board/i));
    expect(defaultProps.setViewMode).toHaveBeenCalledWith('kanban');
  });

  test('updates search query', () => {
    render(<Header {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'bug fix' } });
    
    expect(defaultProps.setSearchQuery).toHaveBeenCalled();
  });

  test('calls handleSignOut when logout button is clicked', () => {
    render(<Header {...defaultProps} />);
    
    const logoutBtn = screen.getByTitle('Sign out');
    fireEvent.click(logoutBtn);
    
    expect(defaultProps.handleSignOut).toHaveBeenCalled();
  });

  test('renders Create Task button if board exists (disabled logic removed in latest version but checking existence)', () => {
    // Note: In latest iteration, the "New" button was REMOVED.
    // So this test should check for its ABSENCE if we rely on my edit history.
    // Wait, step 170 removed the "New" button.
    // So I should expect `screen.queryByText('New')` to be null.
    
    render(<Header {...defaultProps} />);
    expect(screen.queryByText(/New Task/i)).not.toBeInTheDocument();
  });
});
