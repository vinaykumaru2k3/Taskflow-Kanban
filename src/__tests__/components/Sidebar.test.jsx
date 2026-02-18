import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../../components/Sidebar';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  FolderPlus: () => <div data-testid="icon-folder-plus" />,
  Edit2: () => <div data-testid="icon-edit" />,
  Trash2: () => <div data-testid="icon-trash" />,
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
    expect(screen.getByText('Boards')).toBeInTheDocument();
    expect(screen.getByText('Board 1')).toBeInTheDocument();
    expect(screen.getByText('Board 2')).toBeInTheDocument();
  });

  test('calls setCurrentBoard when a board is clicked', () => {
    render(<Sidebar {...defaultProps} />);
    fireEvent.click(screen.getByText('Board 2'));
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
    expect(screen.getByText(/No boards yet/i)).toBeInTheDocument();
  });
});
