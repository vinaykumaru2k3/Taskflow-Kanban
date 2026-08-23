import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

const MultiSelect = ({
  options = [],
  selectedValues = [],
  onChange,
  placeholder = 'Select options...',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    // [fix] pointerdown fires on touch AND mouse; mousedown is mouse-only.
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  const handleToggleOption = (optionId) => {
    if (disabled) return;
    const isSelected = selectedValues.includes(optionId);
    let newSelected;
    if (isSelected) {
      newSelected = selectedValues.filter(id => id !== optionId);
    } else {
      newSelected = [...selectedValues, optionId];
    }
    onChange(newSelected);
  };

  const handleRemoveValue = (e, valId) => {
    e.stopPropagation();
    if (disabled) return;
    const newSelected = selectedValues.filter(id => id !== valId);
    onChange(newSelected);
  };

  const filteredOptions = options.filter(opt =>
    opt.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Area */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) setIsOpen(o => !o);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
        className={`w-full min-h-[46px] px-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all ${
          disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-slate-300 dark:hover:border-slate-700'
        } ${isOpen ? 'border-slate-900/10 dark:border-slate-600 bg-white dark:bg-slate-950' : 'border-transparent'}`}
      >
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {selectedValues.length === 0 ? (
            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold truncate">
              {placeholder}
            </span>
          ) : (
            selectedValues.map(valId => {
              const option = options.find(opt => opt.id === valId);
              if (!option) return null;
              return (
                <span
                  key={valId}
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-slate-200/60 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-300/40 dark:border-slate-600/40 rounded-md transition-all hover:bg-slate-300/50 dark:hover:bg-slate-600"
                >
                  <span className="truncate max-w-[120px]">{option.title}</span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveValue(e, valId)}
                      className="hover:text-rose-500 rounded p-0.5"
                    >
                      <X size={10} />
                    </button>
                  )}
                </span>
              );
            })
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-400 flex-shrink-0 transition-transform duration-250 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Header */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Search size={14} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none placeholder-slate-400"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-[160px] overflow-y-auto p-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                No tasks found
              </div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = selectedValues.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleToggleOption(option.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate flex-1 pr-4">{option.title}</span>
                    {isSelected && (
                      <Check size={14} className="text-slate-900 dark:text-white flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
