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
  Filter: () => <div data-testid="icon-filter" />,
  ArrowUpDown: () => <div data-testid="icon-arrow" />,
  X: () => <div data-testid="icon-x" />,
  PanelLeftClose: () => <div data-testid="icon-panel-left-close" />,
  PanelLeft: () => <div data-testid="icon-panel-left" />,
  Folder: () => <div data-testid="icon-folder" />,
  Archive: () => <div data-testid="icon-archive" />,
  MoreHorizontal: () => <div data-testid="icon-more" />,
  Settings: () => <div data-testid="icon-settings" />,
  ChevronDown: () => <div data-testid="icon-chevron" />,
  Tag: () => <div data-testid="icon-tag" />,
  Bell: () => <div data-testid="icon-bell" />,
  Share2: () => <div data-testid="icon-share" />,
  Users: () => <div data-testid="icon-users" />,
  Sun: () => <div data-testid="icon-sun" />,
  Moon: () => <div data-testid="icon-moon" />,
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
    filters: { priority: 'all', status: 'all', assignees: [], tags: [] },
    setFilters: vi.fn(),
  };

  test('renders header with user info and board name', () => {
    render(<Header {...defaultProps} />);
    
    expect(screen.getByText('My Project')).toBeInTheDocument();
    expect(screen.getByAltText('John Doe')).toHaveAttribute('src', 'http://example.com/photo.jpg');
  });

  test('toggles sidebar when menu icon clicked (mobile)', () => {
    render(<Header {...defaultProps} />);
    
    const menuIcon = screen.getByTestId('icon-panel-left-close');
    fireEvent.click(menuIcon.parentElement);
    
    expect(defaultProps.setShowSidebar).toHaveBeenCalledWith(!defaultProps.showSidebar); // Expected false-ish
  });

  test('toggles stats view', () => {
    render(<Header {...defaultProps} />);
    
    const moreMenuBtn = screen.getByTestId('icon-more').parentElement;
    fireEvent.click(moreMenuBtn);

    fireEvent.click(screen.getByText(/Show Statistics/i));
    
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
    
    fireEvent.click(screen.getByRole('button', { name: /Calendar/i }));
    expect(defaultProps.setViewMode).toHaveBeenCalledWith('calendar');
    
    fireEvent.click(screen.getByRole('button', { name: /Board/i }));
    expect(defaultProps.setViewMode).toHaveBeenCalledWith('kanban');
  });

  test('updates search query', () => {
    render(<Header {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search tasks...');
    fireEvent.change(input, { target: { value: 'bug fix' } });
    
    expect(defaultProps.setSearchQuery).toHaveBeenCalled();
  });

  test('calls handleSignOut when logout button is clicked', () => {
    render(<Header {...defaultProps} />);
    
    const userMenuBtn = screen.getByTestId('icon-chevron').parentElement;
    fireEvent.click(userMenuBtn);

    const logoutBtn = screen.getByText('Sign out').closest('button');
    fireEvent.click(logoutBtn);
    
    expect(defaultProps.handleSignOut).toHaveBeenCalled();
  });

  test('renders Create Task button if board exists and user can create', () => {
    render(<Header {...defaultProps} canCreate={true} />);
    expect(screen.getByText(/New Task/i)).toBeInTheDocument();
  });
});
