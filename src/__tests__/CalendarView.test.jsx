import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CalendarView from '../CalendarView';
import { PRIORITIES } from '../utils/constants';

// Mock dependencies
vi.mock('../components/Modal', () => ({
  __esModule: true,
  default: ({ isOpen, title, children, onClose }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-modal">
        <h1>{title}</h1>
        <button onClick={onClose} data-testid="close-modal">Close</button>
        {children}
      </div>
    );
  },
}));

vi.mock('lucide-react', () => ({
  ChevronLeft: () => <div data-testid="icon-left" />,
  ChevronRight: () => <div data-testid="icon-right" />,
  Calendar: () => <div data-testid="icon-calendar" />,
  CheckCircle2: () => <div data-testid="icon-check" />,
  AlertCircle: () => <div data-testid="icon-alert" />,
  Clock: () => <div data-testid="icon-clock" />,
}));

describe('CalendarView Component', () => {
  const mockTasks = [
    { 
      id: '1', 
      title: 'Task 1', 
      dueDate: new Date().toISOString(), // Today
      priority: 'high',
      status: 'todo'
    },
    { 
      id: '2', 
      title: 'Task 2', 
      dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), // Tomorrow
      priority: 'low',
      status: 'done'
    }
  ];

  const defaultProps = {
    tasks: mockTasks,
    onTaskClick: vi.fn(),
  };

  test('renders current month and year', () => {
    render(<CalendarView {...defaultProps} />);
    const today = new Date();
    const month = today.toLocaleString('default', { month: 'long' });
    const year = today.getFullYear();
    
    expect(screen.getByText(month)).toBeInTheDocument();
    expect(screen.getByText(year.toString())).toBeInTheDocument();
  });

  test('renders tasks in the grid', () => {
    render(<CalendarView {...defaultProps} />);
    
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });

  test('opens modal when a day is clicked', () => {
    render(<CalendarView {...defaultProps} />);
    
    // Find today's day number. 
    // Calendar renders day number as text (e.g. "18").
    const todayDate = new Date().getDate().toString();
    
    // There might be multiple "18" strings (e.g. in month name or year if coincidental, or previous/next month days).
    // But the current month day numbers are rendered in spans.
    // We can just click the one inside the cell that contains "Task 1".
    const taskElement = screen.getByText('Task 1');
    const cell = taskElement.closest('div.bg-white dark:bg-slate-900'); // Target the cell div directly if possible
    
    // Let's rely on text content of day number but restricted to the cell containing current task.
    // We already tried closest('.bg-white dark:bg-slate-900'). Let's try finding the number within that scope?
    // Or just click the day number found globally if unique enough? No.
    
    // Let's try clicking the "empty" space of the cell if possible? 
    // Hard to target.
    // Let's try clicking the day number span associated with Task 1?
    // It's a sibling of the task list. 
    // structure: div.flex > span (number) + div (tasks).
    // So taskElement.parentElement (task list) .previousSibling (header row) .firstChild (number span)?
    
    // Simplified strategy: The cell has an onClick handler. 
    // The task element stops propagation.
    // We need to click something ELSE in the cell.
    // The day number span doesn't stop propagation.
    // So let's find the day number span inside the cell.
    
    // Find the cell container first (the one with bg-white dark:bg-slate-900).
    // taskElement has bg-white dark:bg-slate-900. Parent (List) doesn't. Grandparent (Cell) has bg-white dark:bg-slate-900.
    // So taskElement.parentElement.parentElement IS the cell.
    
    const listDiv = taskElement.parentElement;
    const cellDiv = listDiv.parentElement;
    
    fireEvent.click(cellDiv);
    
    expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
  });

  test('navigates to previous month', () => {
    render(<CalendarView {...defaultProps} />);
    
    const prevBtn = screen.getByTestId('icon-left').parentElement;
    fireEvent.click(prevBtn);
    
    const prevMonthDate = new Date();
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonth = prevMonthDate.toLocaleString('default', { month: 'long' });
    
    expect(screen.getByText(prevMonth)).toBeInTheDocument();
  });

  test('navigates to next month', () => {
    render(<CalendarView {...defaultProps} />);
    
    const nextBtn = screen.getByTestId('icon-right').parentElement;
    fireEvent.click(nextBtn);
    
    const nextMonthDate = new Date();
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    const nextMonth = nextMonthDate.toLocaleString('default', { month: 'long' });
    
    expect(screen.getByText(nextMonth)).toBeInTheDocument();
  });

  test('navigates to today', () => {
    render(<CalendarView {...defaultProps} />);
    
    // Move away first
    const nextBtn = screen.getByTestId('icon-right').parentElement;
    fireEvent.click(nextBtn);
    
    // Click Today
    fireEvent.click(screen.getByText(/today/i));
    
    const today = new Date();
    const month = today.toLocaleString('default', { month: 'long' });
    expect(screen.getByText(month)).toBeInTheDocument();
  });
});
