import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from '../../components/TaskCard';

vi.mock('lucide-react', () => ({
  Trash2: () => <div data-testid="icon-trash" />,
  AlertCircle: () => <div data-testid="icon-alert" />,
  CheckSquare: () => <div data-testid="icon-check" />,
  Calendar: () => <div data-testid="icon-calendar" />,
  Archive: () => <div data-testid="icon-archive" />,
  Eye: () => <div data-testid="icon-eye" />,
  MessageSquare: () => <div data-testid="icon-message" />,
}));

describe('TaskCard Component', () => {
  const mockTask = {
    id: 'task1',
    title: 'Test Task',
    description: 'Task description',
    priority: 'high',
    status: 'todo',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    tags: [{ label: 'bug', colorId: 'red' }],
    subtasks: [
      { id: 's1', title: 'Subtask 1', completed: true },
      { id: 's2', title: 'Subtask 2', completed: false }
    ],
    assigneeId: 'user2',
    assigneeName: 'John Doe',
    assigneeAvatar: 'http://example.com/avatar.jpg',
    commentCount: 3
  };

  const defaultProps = {
    task: mockTask,
    onDelete: vi.fn(),
    onEdit: vi.fn(),
    onDragStart: vi.fn(),
    onArchive: vi.fn(),
    readOnly: false,
    touchHandlers: {}
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders task title and description', () => {
    render(<TaskCard {...defaultProps} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Task description')).toBeInTheDocument();
  });

  test('displays task ID', () => {
    render(<TaskCard {...defaultProps} />);
    
    expect(screen.getByText(/TSK-/)).toBeInTheDocument();
  });

  test('shows overdue badge when task is overdue', () => {
    const overdueTask = {
      ...mockTask,
      dueDate: new Date(Date.now() - 86400000).toISOString(),
      status: 'todo'
    };

    render(<TaskCard {...defaultProps} task={overdueTask} />);
    
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  test('does not show overdue badge for completed tasks', () => {
    const overdueTask = {
      ...mockTask,
      dueDate: new Date(Date.now() - 86400000).toISOString(),
      status: 'done'
    };

    render(<TaskCard {...defaultProps} task={overdueTask} />);
    
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
  });

  test('displays assignee avatar', () => {
    render(<TaskCard {...defaultProps} />);
    
    const avatar = screen.getByAltText('John Doe');
    expect(avatar).toHaveAttribute('src', 'http://example.com/avatar.jpg');
  });

  test('displays subtask progress', () => {
    render(<TaskCard {...defaultProps} />);
    
    expect(screen.getByText('1/2 Tasks')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  test('displays tags', () => {
    render(<TaskCard {...defaultProps} />);
    
    expect(screen.getByText('bug')).toBeInTheDocument();
  });

  test('displays due date', () => {
    render(<TaskCard {...defaultProps} />);
    
    expect(screen.getByTestId('icon-calendar')).toBeInTheDocument();
  });

  test('displays comment count', () => {
    render(<TaskCard {...defaultProps} />);
    
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('calls onEdit when card is clicked', () => {
    render(<TaskCard {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Test Task'));
    
    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockTask);
  });

  test('calls onDragStart when dragging', () => {
    render(<TaskCard {...defaultProps} />);
    
    const card = screen.getByText('Test Task').closest('div[draggable]');
    fireEvent.dragStart(card);
    
    expect(defaultProps.onDragStart).toHaveBeenCalled();
  });

  test('calls onDelete when delete button is clicked', () => {
    render(<TaskCard {...defaultProps} />);
    
    const deleteBtn = screen.getByTestId('icon-trash').closest('button');
    fireEvent.click(deleteBtn);
    
    expect(defaultProps.onDelete).toHaveBeenCalledWith('task1');
  });

  test('shows archive button for completed tasks', () => {
    const completedTask = { ...mockTask, status: 'done' };
    
    render(<TaskCard {...defaultProps} task={completedTask} />);
    
    expect(screen.getByTestId('icon-archive')).toBeInTheDocument();
  });

  test('calls onArchive when archive button is clicked', () => {
    const completedTask = { ...mockTask, status: 'done' };
    
    render(<TaskCard {...defaultProps} task={completedTask} />);
    
    const archiveBtn = screen.getByTestId('icon-archive').closest('button');
    fireEvent.click(archiveBtn);
    
    expect(defaultProps.onArchive).toHaveBeenCalledWith('task1');
  });

  test('shows read-only mode when readOnly is true', () => {
    render(<TaskCard {...defaultProps} readOnly={true} />);
    
    expect(screen.getByText('View Only')).toBeInTheDocument();
  });

  test('does not show delete button in read-only mode', () => {
    render(<TaskCard {...defaultProps} readOnly={true} />);
    
    expect(screen.queryByTestId('icon-trash')).not.toBeInTheDocument();
  });

  test('prevents drag in read-only mode', () => {
    const { container } = render(<TaskCard {...defaultProps} readOnly={true} />);
    
    const card = container.querySelector('[draggable]');
    expect(card).toHaveAttribute('draggable', 'false');
  });

  test('handles missing description', () => {
    const taskNoDesc = { ...mockTask, description: null };
    
    render(<TaskCard {...defaultProps} task={taskNoDesc} />);
    
    expect(screen.queryByText('Task description')).not.toBeInTheDocument();
  });

  test('handles missing tags', () => {
    const taskNoTags = { ...mockTask, tags: [] };
    
    render(<TaskCard {...defaultProps} task={taskNoTags} />);
    
    expect(screen.queryByText('bug')).not.toBeInTheDocument();
  });

  test('handles missing subtasks', () => {
    const taskNoSubtasks = { ...mockTask, subtasks: [] };
    
    render(<TaskCard {...defaultProps} task={taskNoSubtasks} />);
    
    expect(screen.queryByText(/Tasks/)).not.toBeInTheDocument();
  });

  test('handles missing assignee', () => {
    const taskNoAssignee = { ...mockTask, assigneeId: null, assigneeName: null };
    
    render(<TaskCard {...defaultProps} task={taskNoAssignee} />);
    
    expect(screen.queryByAltText('John Doe')).not.toBeInTheDocument();
  });

  test('handles missing due date', () => {
    const taskNoDueDate = { ...mockTask, dueDate: null };
    
    render(<TaskCard {...defaultProps} task={taskNoDueDate} />);
    
    expect(screen.getByText('No date')).toBeInTheDocument();
  });

  test('handles missing comment count', () => {
    const taskNoComments = { ...mockTask, commentCount: 0 };
    
    render(<TaskCard {...defaultProps} task={taskNoComments} />);
    
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  test('displays low priority task without alert icon', () => {
    const lowPriorityTask = { ...mockTask, priority: 'low' };
    
    render(<TaskCard {...defaultProps} task={lowPriorityTask} />);
    
    expect(screen.queryByTestId('icon-alert')).not.toBeInTheDocument();
  });

  test('stops propagation when delete is clicked', () => {
    render(<TaskCard {...defaultProps} />);
    
    const deleteBtn = screen.getByTestId('icon-trash').closest('button');
    fireEvent.click(deleteBtn);
    
    expect(defaultProps.onDelete).toHaveBeenCalled();
  });
});
