// Sort direction indicators
export const SORT_INDICATORS = {
    ASC: '▲',
    DESC: '▼',
    NONE: '↕'
};

// Get next sort direction
export function getNextSortDirection(currentDirection) {
    switch (currentDirection) {
        case 'asc':
            return 'desc';
        case 'desc':
            return 'asc';
        default:
            return 'asc';
    }
}

// Sort data by column
export function sortData(data, column, direction) {
    return [...data].sort((a, b) => {
        let aValue = a[column];
        let bValue = b[column];

        // Handle numeric values
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Handle currency values (remove $ and commas)
        if (typeof aValue === 'string' && aValue.includes('$')) {
            aValue = parseFloat(aValue.replace(/[$,]/g, ''));
            bValue = parseFloat(bValue.replace(/[$,]/g, ''));
            return direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Handle percentage values
        if (typeof aValue === 'string' && aValue.includes('%')) {
            aValue = parseFloat(aValue);
            bValue = parseFloat(bValue);
            return direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Default string comparison
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
        return direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
    });
}

// Filter data by multiple criteria
export function filterData(data, filters) {
    return data.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
            if (!value) return true; // Skip empty filters
            const itemValue = String(item[key]).toLowerCase();
            return itemValue.includes(String(value).toLowerCase());
        });
    });
}

// Create sortable header cell
export function createSortableHeader(label, column, currentSort) {
    const isActive = currentSort.column === column;
    const indicator = isActive ? SORT_INDICATORS[currentSort.direction.toUpperCase()] : SORT_INDICATORS.NONE;
    
    return `
        <th 
            class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
            data-sort-column="${column}"
        >
            <div class="flex items-center gap-1">
                ${label}
                <span class="text-gray-400">${indicator}</span>
            </div>
        </th>
    `;
}

// Create filter input
export function createFilterInput(column, placeholder, type = 'text') {
    return `
        <div class="px-4 sm:px-6 py-2">
            <input
                type="${type}"
                name="${column}"
                id="filter-${column}"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                placeholder="${placeholder}"
                data-filter-column="${column}"
            />
        </div>
    `;
}

// Create filter select
export function createFilterSelect(column, options, placeholder) {
    return `
        <div class="px-4 sm:px-6 py-2">
            <select
                name="${column}"
                id="filter-${column}"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                data-filter-column="${column}"
            >
                <option value="">${placeholder}</option>
                ${options.map(option => `
                    <option value="${option.value}">${option.label}</option>
                `).join('')}
            </select>
        </div>
    `;
}

// Initialize table sorting
export function initTableSorting(tableId, onSort) {
    const table = document.getElementById(tableId);
    if (!table) return;

    table.addEventListener('click', (e) => {
        const header = e.target.closest('th[data-sort-column]');
        if (!header) return;

        const column = header.dataset.sortColumn;
        onSort(column);
    });
}

// Initialize table filtering
export function initTableFiltering(tableId, onFilter) {
    const table = document.getElementById(tableId);
    if (!table) return;

    table.addEventListener('input', (e) => {
        const input = e.target.closest('[data-filter-column]');
        if (!input) return;

        const column = input.dataset.filterColumn;
        const value = input.value;
        onFilter(column, value);
    });
}

// Helper to get trend icon based on direction
export function getTrendIcon(direction) {
    if (direction === 'up') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3"><path d="M5 10l5-5 5 5H5z" /></svg>`;
    } else if (direction === 'down') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3"><path d="M5 10l5 5 5-5H5z" /></svg>`;
    }
    return '';
}

// Helper to get trend color based on direction
export function getTrendColor(direction) {
    if (direction === 'up') {
        return 'text-green-600';
    } else if (direction === 'down') {
        return 'text-red-600';
    }
    return 'text-gray-500';
} 