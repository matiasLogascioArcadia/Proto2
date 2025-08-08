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
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Format member months
function formatMemberMonths(value) {
    return new Intl.NumberFormat('en-US').format(value);
}

// Format percentage
function formatPercentage(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

async function initProviderTable(contractId) {
    console.log('initProviderTable called with contractId:', contractId);
    const providerView = document.getElementById('providerView');
    
    // Show loading state
    providerView.innerHTML = `
        <div class="max-w-screen-xl mx-auto p-6">
            <div class="flex justify-center items-center h-32">
                <div class="animate-spin h-6 w-6 border-4 border-purple-600 border-t-transparent rounded-full"></div>
            </div>
        </div>
    `;

    try {
        // Load contracts data
        const contractsResp = await fetch('/data/contracts.json');
        const contractsData = await contractsResp.json();
        const contracts = contractsData.contracts;
        // Build contract name and type maps
        const contractOptions = contracts.map(c => ({ value: c.id, label: c.contract_name }));
        const contractTypeOptions = [...new Set(contracts.map(c => c.contract_type))].map(type => ({ value: type, label: type }));
        // Find default contract type for pre-selection
        const defaultContract = contracts.find(c => c.id === contractId);
        const defaultContractType = defaultContract ? defaultContract.contract_type : '';

        // Load providers data
        const response = await fetch('/data/providers.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        let providers = data.providers;
        // Preprocess providers to add 'id_number' for display, sorting, and filtering
        providers = providers.map(provider => ({
            ...provider,
            id_number: provider.unit_type === 'TIN' ? provider.tin : provider.npi || 'N/A',
            contract_type: (contracts.find(c => c.id === provider.contract_id) || {}).contract_type || ''
        }));

        // State for sorting and filtering
        let currentSort = { column: 'unit_name', direction: 'asc' };
        let currentFilters = {
            contract_id: contractId || '',
            contract_type: defaultContractType || ''
        };

        // Create the component HTML
        providerView.innerHTML = `
            <div class="max-w-screen-xl mx-auto p-6">
                <h2 class="text-xl font-semibold text-gray-900 border-b pb-1 mb-4">Providers</h2>
                <div class="space-y-4 opacity-0 animate-fade-in">
                    <!-- Filters -->
                    <div class="bg-white rounded-xl shadow p-4 transition-all duration-300 ease-in-out hover:shadow-md">
                        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                                <label for="contractFilter" class="block text-xs font-medium text-gray-700 mb-1">Contract Name</label>
                                <select id="contractFilter" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50 text-sm">
                                    <option value="">All Contracts</option>
                                    ${contractOptions.map(opt => `<option value="${opt.value}" ${opt.value === contractId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label for="contractTypeFilter" class="block text-xs font-medium text-gray-700 mb-1">Contract Type</label>
                                <select id="contractTypeFilter" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50 text-sm">
                                    <option value="">All Types</option>
                                    ${contractTypeOptions.map(opt => `<option value="${opt.value}" ${opt.value === defaultContractType ? 'selected' : ''}>${opt.label}</option>`).join('')}
                                </select>
                            </div>
                            ${createFilterInput('unit_name', 'Filter by Name')}
                            ${createFilterInput('id_number', 'Filter by TIN/NPI')}
                            ${createFilterSelect('unit_type', [
                                { value: 'TIN', label: 'TIN' },
                                { value: 'NPI', label: 'NPI' },
                                { value: 'Practice', label: 'Practice' }
                            ], 'Select Type')}
                        </div>
                    </div>

                    <!-- Providers Table -->
                    <div class="bg-white rounded-xl shadow overflow-hidden transition-all duration-300 ease-in-out hover:shadow-md">
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200" id="providersTable">
                                <thead class="bg-gray-50">
                                    <tr>
                                        ${createSortableHeader('Provider Name', 'unit_name', currentSort, 'px-3 py-2 whitespace-nowrap')}
                                        ${createSortableHeader('Type', 'unit_type', currentSort, 'px-3 py-2 whitespace-nowrap')}
                                        ${createSortableHeader('ID', 'id_number', currentSort, 'px-3 py-2 whitespace-nowrap')}
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Contract Type</th>
                                        ${createSortableHeader('Member Months', 'member_months', currentSort, 'px-2 py-2')}
                                        ${createSortableHeader('Target', 'target', currentSort, 'px-2 py-2')}
                                        ${createSortableHeader('Expense', 'expense', currentSort, 'px-2 py-2')}
                                        ${createSortableHeader('Surplus', 'surplus', currentSort, 'px-2 py-2')}
                                        ${createSortableHeader('Quality Gaps Completed', 'quality_gaps_completed', currentSort, 'px-2 py-2')}
                                        ${createSortableHeader('% AWV completed', 'awv_completed_percentage', currentSort, 'px-2 py-2')}
                                        <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200" id="providersTableBody">
                                    <!-- Table rows will be rendered here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="text-xs text-gray-400 mt-12 text-center">
                    Showing <span id="providersCount">0</span> providers
                </div>
            </div>
        `;

        // Filtering logic
        function applyFilters() {
            let filtered = providers;
            // Contract filter
            if (currentFilters.contract_id) {
                filtered = filtered.filter(p => p.contract_id === currentFilters.contract_id);
            }
            // Contract type filter
            if (currentFilters.contract_type) {
                filtered = filtered.filter(p => p.contract_type === currentFilters.contract_type);
            }
            // Exclusive unit_type filter
            if (currentFilters.unit_type) {
                filtered = filtered.filter(p => p.unit_type === currentFilters.unit_type);
            }
            // Other filters (excluding unit_type)
            const { unit_type, ...otherFilters } = currentFilters;
            filtered = filterData(filtered, otherFilters);
            filtered = sortData(filtered, currentSort.column, currentSort.direction);
            updateTableBody(filtered);
            document.getElementById('providersCount').textContent = filtered.length;
        }

        // Event listeners for new filters
        document.getElementById('contractFilter').addEventListener('change', (e) => {
            currentFilters.contract_id = e.target.value;
            // If contract changes, update contract type to match or clear
            if (e.target.value) {
                const selectedContract = contracts.find(c => c.id === e.target.value);
                currentFilters.contract_type = selectedContract ? selectedContract.contract_type : '';
                document.getElementById('contractTypeFilter').value = currentFilters.contract_type;
            }
            applyFilters();
        });
        document.getElementById('contractTypeFilter').addEventListener('change', (e) => {
            currentFilters.contract_type = e.target.value;
            applyFilters();
        });

        // Initialize sorting
        initTableSorting('providersTable', (column) => {
            currentSort.direction = getNextSortDirection(currentSort.direction);
            currentSort.column = column;
            applyFilters();
        });

        // Initialize filtering
        initTableFiltering('providersTable', (column, value) => {
            currentFilters[column] = value;
            applyFilters();
        });

        // Function to update table body
        function updateTableBody(data) {
            const tbody = document.getElementById('providersTableBody');
            tbody.innerHTML = data.map(provider => `
                <tr class="transition-colors duration-200 ease-in-out hover:bg-gray-50">
                    <td class="px-3 py-2 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">${provider.unit_name}</div>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">${provider.unit_type}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">${provider.id_number}</td>
                    <td class="px-3 py-2 text-sm text-gray-500">${provider.contract_type}</td>
                    <td class="px-2 py-2 text-sm text-gray-500">${formatMemberMonths(Number(provider.member_months))}</td>
                    <td class="px-2 py-2 text-sm text-gray-500">${formatCurrency(Number(provider.target))}</td>
                    <td class="px-2 py-2 text-sm text-gray-500">${formatCurrency(Number(provider.expense))}</td>
                    <td class="px-2 py-2 text-sm ${Number(provider.surplus) >= 0 ? 'text-green-600' : 'text-red-600'}">
                        ${formatCurrency(Number(provider.surplus))}
                    </td>
                    <td class="px-2 py-2 text-sm text-gray-500">${formatPercentage(Number(provider.quality_gaps_completed) / Number(provider.quality_gaps_total))}</td>
                    <td class="px-2 py-2 text-sm text-gray-500">${formatPercentage(Number(provider.awv_completed_percentage))}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                            onclick="window.location.hash = '#/kpi-summary'"
                            class="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 transition-colors duration-200">
                            Go to Panel
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        // Initial render
        applyFilters();

    } catch (error) {
        console.error('Error loading providers:', error);
        providerView.innerHTML = `
            <div class="max-w-screen-xl mx-auto p-6">
                <div class="text-center opacity-0 animate-fade-in">
                    <div class="text-red-600 text-sm mt-4">
                        Error loading providers: ${error.message}
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

export default initProviderTable; 