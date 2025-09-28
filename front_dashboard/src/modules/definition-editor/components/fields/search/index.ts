// Field Search and Filter System - Main Exports

// Core Components
export { default as FieldSearchInterface } from './FieldSearchInterface';
export { default as FieldSearchFilterPanel } from './FieldSearchFilterPanel';

// Core Classes
export { default as FieldSearchEngine } from './FieldSearchEngine';

// React Hooks
export { default as useFieldSearch } from './useFieldSearch';

// Types and Interfaces
export type {
  FieldSearchFilter,
  SortOption
} from './FieldSearchFilterPanel';

export type {
  SearchableField,
  SearchResult
} from './FieldSearchEngine';

// Usage Examples and Documentation

/**
 * Basic Usage Example:
 * 
 * 1. Simple Search Interface:
 * ```tsx
 * import { FieldSearchInterface } from './search';
 * 
 * const FieldManager = () => {
 *   const [fields, setFields] = useState([
 *     {
 *       id: 'field1',
 *       name: 'Email Address',
 *       type: 'email',
 *       category: 'contact',
 *       status: 'active',
 *       hasValidation: true,
 *       hasDependencies: false,
 *       complexity: 3,
 *       tags: ['required', 'email'],
 *       favorite: false,
 *       created: new Date(),
 *       modified: new Date(),
 *       properties: {},
 *       metadata: {}
 *     }
 *   ]);
 * 
 *   return (
 *     <FieldSearchInterface
 *       fields={fields}
 *       onFieldEdit={(field) => console.log('Edit:', field)}
 *       onFieldDelete={(id) => console.log('Delete:', id)}
 *       onFieldToggleFavorite={(id, favorite) => console.log('Favorite:', id, favorite)}
 *     />
 *   );
 * };
 * ```
 * 
 * 2. Custom Search Hook Usage:
 * ```tsx
 * import { useFieldSearch } from './search';
 * 
 * const CustomSearchComponent = ({ fields }) => {
 *   const {
 *     searchResult,
 *     currentFilter,
 *     updateFilter,
 *     exportResults,
 *     searchStats
 *   } = useFieldSearch(fields, {
 *     debounceDelay: 500,
 *     enablePersistence: true
 *   });
 * 
 *   const handleSearch = (searchTerm) => {
 *     updateFilter({
 *       ...currentFilter,
 *       searchTerm
 *     });
 *   };
 * 
 *   return (
 *     <div>
 *       <input
 *         type="text"
 *         onChange={(e) => handleSearch(e.target.value)}
 *         placeholder="Search fields..."
 *       />
 *       
 *       <div>
 *         Found {searchResult?.filteredCount} of {searchStats.totalFields} fields
 *       </div>
 *       
 *       <ul>
 *         {searchResult?.fields.map(field => (
 *           <li key={field.id}>{field.name}</li>
 *         ))}
 *       </ul>
 *       
 *       <button onClick={() => console.log(exportResults('csv'))}>
 *         Export CSV
 *       </button>
 *     </div>
 *   );
 * };
 * ```
 * 
 * 3. Search Engine Direct Usage:
 * ```tsx
 * import { FieldSearchEngine } from './search';
 * 
 * const engine = FieldSearchEngine.getInstance();
 * 
 * // Index fields
 * engine.indexFields(myFields);
 * 
 * // Search with filters
 * const result = engine.search({
 *   searchTerm: 'email',
 *   fieldType: ['text', 'email'],
 *   category: [],
 *   status: ['active'],
 *   hasValidation: true,
 *   hasDependencies: null,
 *   complexity: [1, 5],
 *   tags: [],
 *   favorite: null,
 *   dateRange: { start: null, end: null }
 * }, {
 *   field: 'name',
 *   direction: 'asc'
 * });
 * 
 * console.log(`Found ${result.filteredCount} fields in ${result.searchTime}ms`);
 * 
 * // Get suggestions
 * const suggestions = engine.getSuggestions('ema', 5);
 * console.log('Suggestions:', suggestions);
 * 
 * // Get statistics
 * const stats = engine.getStatistics();
 * console.log('Popular tags:', stats.mostUsedTags);
 * ```
 * 
 * Features:
 * - Full-text search with tokenization and indexing
 * - Advanced filtering (type, category, status, complexity, etc.)
 * - Real-time search suggestions
 * - Sortable results
 * - Export functionality (CSV/JSON)
 * - Saved filter presets
 * - Persistent state
 * - List and grid view modes
 * - Glassmorphism UI design
 * - Performance optimized with debouncing
 * - Accessibility features
 * - Statistics and analytics
 */