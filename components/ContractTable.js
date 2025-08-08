import { 
    createSortableHeader, 
    createFilterInput, 
    createFilterSelect,
    sortData,
    filterData,
    getNextSortDirection,
    initTableSorting,
    initTableFiltering
} from '../utils/tableUtils.js';

// Format currency values
function formatCurrency(value) {
    console.log('formatCurrency input value:', value, 'type:', typeof value);
    if (value === undefined || value === null) {
        return ''; // Or 'N/A', or '-', depending on desired display for missing data
    }
    // Attempt to parse if it's a string, otherwise use as is
    const numericValue = typeof value === 'string' && !isNaN(parseFloat(value)) ? parseFloat(value) : value;

    console.log('formatCurrency numericValue:', numericValue, 'type:', typeof numericValue);

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numericValue);
}

// Format member months
function formatMemberMonths(value) {
    console.log('formatMemberMonths input value:', value, 'type:', typeof value);
    if (value === undefined || value === null) {
        return ''; // Or 'N/A', or '-'
    }
    const numericValue = typeof value === 'string' && !isNaN(parseFloat(value)) ? parseFloat(value) : value;
    console.log('formatMemberMonths numericValue:', numericValue, 'type:', typeof numericValue);
    return new Intl.NumberFormat('en-US').format(numericValue);
}

async function initContractTable() {
    const contractView = document.getElementById('contractView');
    
    // Show loading state
    contractView.innerHTML = `
        <div class="max-w-screen-xl mx-auto p-6">
            <div class="flex justify-center items-center h-32">
                <div class="animate-spin h-6 w-6 border-4 border-purple-600 border-t-transparent rounded-full"></div>
            </div>
        </div>
    `;

    try {
        // Load contracts data
        const response = await fetch('/data/contracts.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched data:', data);
        let contracts = data.contracts;
        console.log('Contracts array:', contracts);
        
        // State for sorting and filtering
        let currentSort = { column: 'contract_name', direction: 'asc' };
        let currentFilters = {};

        // Create the component HTML
        contractView.innerHTML = `
            <div class="max-w-screen-xl mx-auto p-6">
                <h2 class="text-xl font-semibold text-gray-900 border-b pb-1 mb-4">Contracts</h2>
                <div class="space-y-4 opacity-0 animate-fade-in">
                    <!-- Filters -->
                    <div class="bg-white rounded-xl shadow p-4 transition-all duration-300 ease-in-out hover:shadow-md">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            ${createFilterInput('contract_name', 'Filter by name')}
                            ${createFilterSelect('contract_type', [
                                { value: 'Commercial', label: 'Commercial' },
                                { value: 'Medicare Advantage', label: 'Medicare Advantage' },
                                { value: 'Medicaid', label: 'Medicaid' }
                            ], 'Select contract type')}
                            ${createFilterInput('member_months_ytd', 'Filter by member count', 'number')}
                        </div>
                    </div>

                    <!-- Contracts Table -->
                    <div class="bg-white rounded-xl shadow overflow-hidden transition-all duration-300 ease-in-out hover:shadow-md">
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200" id="contractsTable">
                                <thead class="bg-gray-50">
                                    <tr>
                                        ${createSortableHeader('Contract Name', 'contract_name', currentSort)}
                                        ${createSortableHeader('Type', 'contract_type', currentSort)}
                                        ${createSortableHeader('Member Months', 'member_months_ytd', currentSort)}
                                        ${createSortableHeader('Target', 'target_ytd', currentSort)}
                                        ${createSortableHeader('Expense', 'expense_ytd', currentSort)}
                                        ${createSortableHeader('Surplus', 'surplus_ytd', currentSort)}
                                        ${createSortableHeader('Quality (bonus)', 'quality_bonus_ytd', currentSort)}
                                        ${createSortableHeader('Gainshare', 'gainshare_ytd', currentSort)}
                                        <th class="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200" id="contractsTableBody">
                                    ${contracts.map(contract => `
                                        <tr class="transition-colors duration-200 ease-in-out hover:bg-gray-50">
                                            <td class="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <div class="text-sm font-medium text-gray-900">${contract.contract_name}</div>
                                            </td>
                                            <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${contract.contract_type}</td>
                                            <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatMemberMonths(Number(contract.member_months_ytd))}</td>
                                            <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(Number(contract.target_ytd))}</td>
                                            <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(Number(contract.expense_ytd))}</td>
                                            <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm ${contract.surplus_ytd >= 0 ? 'text-green-600' : 'text-red-600'}">
                                                ${formatCurrency(Number(contract.surplus_ytd))}
                                            </td>
                                            <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(Number(contract.quality_bonus_ytd))}</td>
                                            <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(Number(contract.gainshare_ytd))}</td>
                                            <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button 
                                                    onclick="window.handleViewProviders('${contract.id}', '${contract.contract_name}')"
                                                    class="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 transition-colors duration-200">
                                                    View by...
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="text-xs text-gray-400 mt-12 text-center">
                    Showing ${contracts.length} contracts
                </div>
            </div>
        `;

        // Initialize sorting
        initTableSorting('contractsTable', (column) => {
            currentSort.direction = getNextSortDirection(currentSort.direction);
            currentSort.column = column;
            
            // Update table headers
            const headers = document.querySelectorAll('#contractsTable th[data-sort-column]');
            headers.forEach(header => {
                const headerColumn = header.dataset.sortColumn;
                // Preserve the original header text
                const originalText = header.textContent.replace(/\s[▲▼]$/, '');
                header.innerHTML = createSortableHeader(
                    originalText,
                    headerColumn,
                    currentSort
                );
            });

            // Sort and filter data
            let filteredData = filterData(contracts, currentFilters);
            filteredData = sortData(filteredData, column, currentSort.direction);
            
            // Update table body
            updateTableBody(filteredData);
        });

        // Initialize filtering
        initTableFiltering('contractsTable', (column, value) => {
            currentFilters[column] = value;
            
            // Filter and sort data
            let filteredData = filterData(contracts, currentFilters);
            filteredData = sortData(filteredData, currentSort.column, currentSort.direction);
            
            // Update table body
            updateTableBody(filteredData);
        });

        // Function to update table body
        function updateTableBody(data) {
            const tbody = document.getElementById('contractsTableBody');
            tbody.innerHTML = data.map(contract => `
                <tr class="transition-colors duration-200 ease-in-out hover:bg-gray-50">
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">${contract.contract_name}</div>
                    </td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${contract.contract_type}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatMemberMonths(Number(contract.member_months_ytd))}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(Number(contract.target_ytd))}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(Number(contract.expense_ytd))}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm ${contract.surplus_ytd >= 0 ? 'text-green-600' : 'text-red-600'}">
                        ${formatCurrency(Number(contract.surplus_ytd))}
                    </td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(Number(contract.quality_bonus_ytd))}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(Number(contract.gainshare_ytd))}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                            onclick="window.handleViewProviders('${contract.id}', '${contract.contract_name}')"
                            class="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 transition-colors duration-200">
                            View by...
                        </button>
                    </td>
                </tr>
            `).join('');
        }

    } catch (error) {
        console.error('Error loading contracts:', error);
        contractView.innerHTML = `
            <div class="max-w-screen-xl mx-auto p-6">
                <div class="text-center opacity-0 animate-fade-in">
                    <div class="text-red-600 text-sm mt-4">
                        Error loading contracts: ${error.message}
                    </div>
                    <button 
                        onclick="window.location.reload()"
                        class="mt-4 bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 transition-colors duration-200">
                        Retry
                    </button>
                </div>
            </div>
        `;
    }
}

export default initContractTable; 