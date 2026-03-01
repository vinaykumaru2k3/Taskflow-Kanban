import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../../components/Sidebar';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Folder: () => <div data-testid="icon-folder" />,
  FolderPlus: () => <div data-testid="icon-folder-plus" />,
  Edit2: () => <div data-testid="icon-edit" />,
  Trash2: () => <div data-testid="icon-trash" />,
  Hash: () => <div data-testid="icon-hash" />,
  Check: () => <div data-testid="icon-check" />,
  Users: () => <div data-testid="icon-users" />,
  Share2: () => <div data-testid="icon-share2" />,
  ChevronRight: () => <div data-testid="icon-chevron-right" />,
}));

describe('Sidebar Component', () => {
  const mockBoards = [
    { id: '1', name: 'Board 1', color: '#ff0000' },
    { id: '2', name: 'Board 2', color: '#00ff00' },
  ];
  
  const defaultProps = {
    showSidebar: true,
    boards: mockBoards,
    currentBoard: mockBoards[0],
    setCurrentBoard: vi.fn(),
    onAddBoard: vi.fn(),
    onEditBoard: vi.fn(),
    onDeleteBoard: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders sidebar with boards', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText(/my boards/i)).toBeInTheDocument();
    expect(screen.getByText('Board 1')).toBeInTheDocument();
    expect(screen.getByText('Board 2')).toBeInTheDocument();
  });

  test('calls setCurrentBoard when a board is clicked', () => {
    render(<Sidebar {...defaultProps} />);
    const boardItems = screen.getAllByText(/Board/);
    // Find the one that specifically matches just 'Board 2'
    const targetBoard = boardItems.find(el => el.textContent === 'Board 2');
    fireEvent.click(targetBoard);
    expect(defaultProps.setCurrentBoard).toHaveBeenCalledWith(mockBoards[1]);
  });

  test('calls onAddBoard when + button is clicked', () => {
    render(<Sidebar {...defaultProps} />);
    const addButton = screen.getByTitle('Create new board');
    fireEvent.click(addButton);
    expect(defaultProps.onAddBoard).toHaveBeenCalled();
  });

  test('calls onEditBoard and stops propagation', () => {
    render(<Sidebar {...defaultProps} />);
    const editIcons = screen.getAllByTestId('icon-edit');
    const editButton = editIcons[0].closest('button');
    
    expect(editButton).toBeInTheDocument();
    
    // Simulate click on the button
    fireEvent.click(editButton);
    
    expect(defaultProps.onEditBoard).toHaveBeenCalledWith(mockBoards[0]);
    // Ensure parent click (setCurrentBoard) was NOT fired
    expect(defaultProps.setCurrentBoard).not.toHaveBeenCalled();
  });

  test('calls onDeleteBoard', () => {
    render(<Sidebar {...defaultProps} />);
    const trashIcons = screen.getAllByTestId('icon-trash');
    const deleteButton = trashIcons[0].closest('button');
    
    fireEvent.click(deleteButton);
    
    expect(defaultProps.onDeleteBoard).toHaveBeenCalledWith(mockBoards[0]);
  });

  test('renders empty state when no boards', () => {
    render(<Sidebar {...defaultProps} boards={[]} />);
    expect(screen.getByText(/No Boards/i)).toBeInTheDocument();
  });
});
