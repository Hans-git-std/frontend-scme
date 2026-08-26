import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, BookOpen, Code, Check } from 'lucide-react';
import {
  STATIC_DOMAIN_CATALOGS,
  searchCatalogSubjects,
  searchCatalogSkills,
  ALL_CATALOG_SUBJECTS,
  ALL_CATALOG_SKILLS,
} from '../../lib/catalog';
import { cn } from '../../lib/utils';

export interface CatalogAutocompleteProps {
  type: 'subject' | 'skill';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  selectedDomain?: string;
  className?: string;
  required?: boolean;
}

export const CatalogAutocomplete: React.FC<CatalogAutocompleteProps> = ({
  type,
  value,
  onChange,
  placeholder,
  selectedDomain = 'ALL',
  className,
  required = false,
}) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Load suggestions with debounce
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        let results: string[] = [];
        if (type === 'subject') {
          results = await searchCatalogSubjects(selectedDomain, query, 25);
        } else {
          results = await searchCatalogSkills(query, 25);
        }
        if (isMounted) {
          setSuggestions(results);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 80);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query, type, selectedDomain, isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setQuery(newVal);
    onChange(newVal);
    setIsOpen(true);
  };

  const handleSelect = (item: string) => {
    setQuery(item);
    onChange(item);
    setIsOpen(false);
  };

  const defaultPlaceholder =
    placeholder ||
    (type === 'subject'
      ? 'e.g. Data Structures & Algorithms, Thermodynamics, RCC Design...'
      : 'e.g. Java, Python, AutoCAD, PyTorch, Docker, SolidWorks...');

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={defaultPlaceholder}
          required={required}
          className={cn(
            'w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all',
            className
          )}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <span className="inline-block w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Suggestion Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 text-xs animate-in fade-in zoom-in-95">
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <span>
              {type === 'subject' ? '1000+ Multi-Domain Subjects' : '1000+ Multi-Branch Skills'}
            </span>
            <span className="text-[9px] text-brand-600 font-normal">Custom typing allowed</span>
          </div>

          {suggestions.map((item, idx) => {
            const isExactMatch = item.toLowerCase() === query.trim().toLowerCase();
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(item)}
                className={cn(
                  'w-full text-left px-3 py-2 flex items-center justify-between hover:bg-brand-50 dark:hover:bg-brand-950/50 text-slate-800 dark:text-slate-200 transition-colors',
                  isExactMatch && 'bg-brand-50/60 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-semibold'
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  {type === 'subject' ? (
                    <BookOpen className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                  ) : (
                    <Code className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  )}
                  <span className="truncate">{item}</span>
                </div>
                {isExactMatch && <Check className="w-3.5 h-3.5 text-brand-600 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
