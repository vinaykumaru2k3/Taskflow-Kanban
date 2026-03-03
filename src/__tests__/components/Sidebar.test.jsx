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
    expect(screen.getAllByText(/my boards/i).length).toBeGreaterThan(0);
    const boardElements = screen.getAllByText('Board 1');
    expect(boardElements.length).toBeGreaterThan(0);
    expect(screen.getAllByText('Board 2').length).toBeGreaterThan(0);
  });



  test('calls onAddBoard when + button is clicked', () => {
    render(<Sidebar {...defaultProps} />);
    const addButtons = screen.getAllByTitle('Create new board');
    fireEvent.click(addButtons[0]);
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
    expect(screen.getAllByText(/No Boards/i).length).toBeGreaterThan(0);
  });
});
