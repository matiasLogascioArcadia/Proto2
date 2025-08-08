import { 
    createSortableHeader, // Not directly used for these nested tables, but good to keep if needed for future enhancements
    createFilterInput, 
    createFilterSelect,
    sortData,
    filterData,
    getNextSortDirection,
    initTableSorting,
    initTableFiltering,
    getTrendIcon,
    getTrendColor
} from '../utils/tableUtils.js'; // Keeping this import as it's a utility for tables

// Format currency values
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Format member metric based on category
function formatMetric(category, value) {
    switch (category) {
        case 'Suspect Conditions':
            return `${value} conditions`;
        case 'Frequent Flyers':
            return `${value} visits`;
        case 'High Utilizers':
            return formatCurrency(value);
        case 'Polypharmacy':
            return `${value} medications`;
        case 'High Pharmacy Cost':
            return formatCurrency(value);
        case 'High Specialty Cost':
            return formatCurrency(value);
        default:
            return value;
    }
}

function formatQualityMeasures(measures) {
    return measures.join(', ');
}

// Dummy KPI data
const kpis = {
    membersSeen: {
        awvCompleted: { label: "AWV Completed (%)", value: "65%", mom: "+3.0%", yoy: "+7.5%", direction: "up" }
    },
    coding: {
        rafScore: { label: "RAF Score", value: "1.00", mom: "+1.2%", yoy: "+4.0%", direction: "up" },
        recaptureRate: { label: "Recapture Rate", value: "78%", mom: "+1.5%", yoy: "+3.6%", direction: "up" }
    },
    partA: {
        edPerK: { label: "ED Visits per 1,000", value: "413", mom: "+1.5%", yoy: "+0.7%", direction: "up" },
        costPerEDVisit: { label: "Cost per ED Visit", value: "$1,098", mom: "-2.1%", yoy: "-3.0%", direction: "down" },
        admitsPerK: { label: "Admits per 1,000", value: "270", mom: "-1.8%", yoy: "-4.2%", direction: "down" },
        costPerAdmission: { label: "Cost per Admission", value: "$14,500", mom: "+0.5%", yoy: "+1.0%", direction: "up" },
        avgLOS: { label: "Average Length of Stay", value: "4.1 days", mom: "+0.3%", yoy: "+1.2%", direction: "up" },
        pmpm: { label: "Part A PMPM", value: "$436", mom: "+2.3%", yoy: "+5.7%", direction: "up" },
        readmitRate: { label: "Readmission Rate", value: "13.2%", mom: "-0.5%", yoy: "-1.8%", direction: "down" }
    },
    partB: {
        specialtyVisitsPerK: { label: "Specialty Visits per 1,000", value: "340", mom: "+0.8%", yoy: "+2.3%", direction: "up" },
        specialtyCostPerVisit: { label: "Specialty Cost per Visit", value: "$298", mom: "-1.1%", yoy: "-0.5%", direction: "down" },
        specialtyCostPMPM: { label: "Specialty Cost PMPM", value: "$115", mom: "+2.0%", yoy: "+4.2%", direction: "up" }
    },
    partD: {
        rxCostPerScript: { label: "Rx Cost per Script", value: "$72", mom: "-0.9%", yoy: "-2.5%", direction: "down" },
        genericPct: { label: "% Generic Scripts", value: "87%", mom: "+1.2%", yoy: "+3.4%", direction: "up" },
        rxPMPM: { label: "Rx PMPM", value: "$94", mom: "+2.9%", yoy: "+6.1%", direction: "up" }
    }
};

async function initMemberPanel(unitName) {
    const memberView = document.getElementById('memberView');
    let pcpFilter; // Declare pcpFilter here to make it accessible
    console.log('initMemberPanel called with unitName:', unitName);
    
    // Show loading state
    memberView.innerHTML = `
        <h1 class="text-2xl font-bold mb-6">Member Panel</h1>
        <div class="max-w-screen-xl mx-auto p-6">
            <div class="flex justify-center items-center h-32">
                <div class="animate-spin h-6 w-6 border-4 border-purple-600 border-t-transparent rounded-full"></div>
            </div>
        </div>
    `;

    try {
        // Load members data
        const response = await fetch('/data/members.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Filter members by unit name
        const members = data.members.filter(m => m.unit_name === unitName);
        console.log('Members after unitName filter:', members);
        
        // Extract unique PCPs for the filter
        const uniquePCPs = [...new Set(members.map(m => m.pcp_name))].sort();

        // Group members by risk category
        const groupedMembers = members.reduce((acc, member) => {
            const category = member.risk_category || 'Other';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(member);
            return acc;
        }, {});
        console.log('Grouped members before rendering:', groupedMembers);

        // Map risk categories to main categories
        const mainCategoryMap = {
            'Suspect Conditions': 'Coding',
            'Frequent Flyers': 'Part A',
            'High Utilizers': 'Part A',
            'Top 10 – Specialty Spend': 'Part B',
            'Polypharmacy': 'Part D',
            'Top 10 – Pharmacy Spend': 'Part D',
            'Quality Gaps': 'Quality',
        };
        const mainCategoryOrder = ['Part A', 'Part B', 'Part D', 'Quality', 'Coding'];
        const mainCategoryTitles = {
            'Part A': 'Part A (Inpatient/ED)',
            'Part B': 'Part B (Specialty)',
            'Part D': 'Part D (Pharmacy)',
            'Quality': 'Quality',
            'Coding': 'Coding',
        };
        // Group risk categories by main category
        function groupByMainCategory(groupedMembers) {
            const result = {};
            Object.entries(groupedMembers).forEach(([riskCategory, members]) => {
                const mainCat = mainCategoryMap[riskCategory] || 'Other';
                if (!result[mainCat]) result[mainCat] = {};
                result[mainCat][riskCategory] = members;
            });
            return result;
        }

        // Define columns and action button text per category
        const categoryConfigs = {
            "Suspect Conditions": {
                headers: ["Member Name", "Suspect Conditions", "PCP", "Risk Score", "Action"],
                renderRow: (member) => `
                    <td><div class="text-sm font-medium text-gray-900">${member.name}</div></td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${member.suspect_conditions}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${member.pcp_name}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${member.risk_score}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onclick="window.showMemberDetailModal('${member.member_id}')" class="text-purple-600 hover:text-purple-900">View Profile</button>
                    </td>
                `
            },
            "Polypharmacy": {
                headers: ["Member Name", "Medications Count", "High-Risk Drugs", "PCP", "Action"],
                renderRow: (member) => `
                    <td><div class="text-sm font-medium text-gray-900">${member.name}</div></td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${member.medications_count}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${member.high_risk_drugs}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${member.pcp_name}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onclick="window.showMemberDetailModal('${member.member_id}')" class="text-purple-600 hover:text-purple-900">Review List</button>
                    </td>
                `
            },
            "Frequent Flyers": {
                headers: ["Member Name", "ED Visits YTD", "IP Admits YTD", "PCP", "Action"],
                renderRow: (member) => `
                    <td><div class="text-sm font-medium text-gray-900">${member.name}</div></td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${member.ed_visits_ytd}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${member.ip_admits_ytd}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${member.pcp_name}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onclick="window.showMemberDetailModal('${member.member_id}')" class="text-purple-600 hover:text-purple-900">Outreach Form</button>
                    </td>
                `
            },
            "High Utilizers": {
                headers: ["Member Name", "Total Visits", "Visit Cost ($)", "PCP", "Action"],
                renderRow: (member) => `
                    <td><div class="text-sm font-medium text-gray-900">${member.name}</div></td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${member.total_visits}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(member.visit_cost)}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${member.pcp_name}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onclick="window.showMemberDetailModal('${member.member_id}')" class="text-purple-600 hover:text-purple-900">Cost Profile</button>
                    </td>
                `
            },
            "Top 10 – Pharmacy Spend": {
                headers: ["Member Name", "Pharmacy Spend ($)", "Medications Count", "PCP", "Action"],
                renderRow: (member) => `
                    <td><div class="text-sm font-medium text-gray-900">${member.name}</div></td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(member.pharmacy_spend)}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${member.medications_count}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onclick="window.showMemberDetailModal('${member.member_id}')" class="text-purple-600 hover:text-purple-900">Cost Detail</button>
                    </td>
                `
            },
            "Top 10 – Specialty Spend": {
                headers: ["Member Name", "Specialty Spend ($)", "Specialty Services Used", "PCP", "Action"],
                renderRow: (member) => `
                    <td><div class="text-sm font-medium text-gray-900">${member.name}</div></td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(member.specialty_spend)}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${member.specialty_services_used}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${member.pcp_name}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onclick="window.showMemberDetailModal('${member.member_id}')" class="text-purple-600 hover:text-purple-900">Detail View</button>
                    </td>
                `
            },
            "Quality Gaps": {
                headers: ["Member Name", "# Open Gaps", "Measures Due", "PCP", "Next Appointment", "Action"],
                renderRow: (member) => `
                    <td><div class="text-sm font-medium text-gray-900">${member.name}</div></td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${member.num_open_gaps}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatQualityMeasures(member.measures_due)}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${member.pcp_name}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${member.next_appointment || '-'}</td>
                    <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onclick="window.showMemberDetailModal('${member.member_id}', 'qualityGaps')" class="text-purple-600 hover:text-purple-900">Review Gaps</button>
                    </td>
                `
            }
        };

        // Create the component HTML
        memberView.innerHTML = `
            <h1 class="text-2xl font-bold mb-6">Member Panel</h1>
            <div class="max-w-screen-xl mx-auto p-6">
                <!-- Member Insights (PCP Filter) -->
                <h2 class="text-xl font-semibold text-gray-800 mb-4">Member Insights</h2>
                <div class="mb-6 p-4 bg-white shadow-md rounded-lg flex flex-wrap gap-4 items-center">
                    <div class="flex items-center space-x-2">
                        <label for="pcpFilter" class="text-sm font-medium text-gray-700">Filter by PCP:</label>
                        <select id="pcpFilter" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md">
                            <option value="">All PCPs</option>
                            ${uniquePCPs.map(pcp => `<option value="${pcp}">${pcp}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <!-- Member Insight Sections (Grouped by Main Category) -->
                <h2 class="text-xl font-semibold text-gray-900 border-b pb-1 mb-4">Member Insight Sections</h2>
                <div class="space-y-10" id="memberInsightSections">
                    ${(() => {
                        const grouped = groupByMainCategory(groupedMembers);
                        return mainCategoryOrder.map(mainCat => {
                            if (!grouped[mainCat]) return '';
                            return `
                                <div class="mb-8">
                                    <h3 class="text-lg font-bold text-purple-700 mb-4">${mainCategoryTitles[mainCat] || mainCat}</h3>
                                    <div class="space-y-6">
                                        ${Object.entries(grouped[mainCat]).map(([category, members]) => {
                                            const config = categoryConfigs[category];
                                            if (!config) return '';
                                            const iconFileName = category.toLowerCase().replace(/[^a-z0-9À-ſ_]/g, '_').replace(/top_10___/g, '') + '.svg';
                                            return `
                                                <div class="bg-white rounded-xl shadow p-4 transition-all duration-300 ease-in-out hover:shadow-md flex flex-col" data-category="${category}">
                                                    <div class="flex items-center mb-2">
                                                        <img src="/assets/icons/${iconFileName}" alt="${category} icon" class="w-6 h-6 mr-2">
                                                        <h4 class="text-md font-semibold text-gray-900">${category}</h4>
                                                    </div>
                                                    <div class="overflow-x-auto">
                                                        <table class="min-w-full divide-y divide-gray-200">
                                                            <thead class="bg-gray-50">
                                                                <tr>
                                                                    ${config.headers.map(header => `
                                                                        <th class="px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${header === 'Action' ? 'text-right' : 'text-left'}">
                                                                            ${header}
                                                                        </th>
                                                                    `).join('')}
                                                                </tr>
                                                            </thead>
                                                            <tbody class="bg-white divide-y divide-gray-200">
                                                                ${members.map(member => `
                                                                    <tr class="transition-colors duration-200 ease-in-out hover:bg-gray-50">
                                                                        ${config.renderRow(member)}
                                                                    </tr>
                                                                `).join('')}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            `;
                        }).join('');
                    })()}
                </div>
                <div class="text-xs text-gray-400 mt-12 text-center">
                    Showing ${members.length} members across ${Object.keys(groupedMembers).length} categories
                </div>
            </div>
        `;

        // Assign pcpFilter AFTER the HTML is rendered
        pcpFilter = document.getElementById('pcpFilter');

        function updateMembersDisplay() {
            const selectedPCP = pcpFilter.value;
            let membersToDisplay = members;
            if (selectedPCP !== '') {
                membersToDisplay = membersToDisplay.filter(m => m.pcp_name === selectedPCP);
            }
            const reGroupedMembers = membersToDisplay.reduce((acc, member) => {
                const category = member.risk_category || 'Other';
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(member);
                return acc;
            }, {});
            const insightSectionsContainer = document.getElementById('memberInsightSections');
            if (insightSectionsContainer) {
                const grouped = groupByMainCategory(reGroupedMembers);
                insightSectionsContainer.innerHTML = mainCategoryOrder.map(mainCat => {
                    if (!grouped[mainCat]) return '';
                    return `
                        <div class="mb-8">
                            <h3 class="text-lg font-bold text-purple-700 mb-4">${mainCategoryTitles[mainCat] || mainCat}</h3>
                            <div class="space-y-6">
                                ${Object.entries(grouped[mainCat]).map(([category, members]) => {
                                    const config = categoryConfigs[category];
                                    if (!config) return '';
                                    const iconFileName = category.toLowerCase().replace(/[^a-z0-9À-ſ_]/g, '_').replace(/top_10___/g, '') + '.svg';
                                    return `
                                        <div class="bg-white rounded-xl shadow p-4 transition-all duration-300 ease-in-out hover:shadow-md flex flex-col" data-category="${category}">
                                            <div class="flex items-center mb-2">
                                                <img src="/assets/icons/${iconFileName}" alt="${category} icon" class="w-6 h-6 mr-2">
                                                <h4 class="text-md font-semibold text-gray-900">${category}</h4>
                                            </div>
                                            <div class="overflow-x-auto">
                                                <table class="min-w-full divide-y divide-gray-200">
                                                    <thead class="bg-gray-50">
                                                        <tr>
                                                            ${config.headers.map(header => `
                                                                <th class="px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${header === 'Action' ? 'text-right' : 'text-left'}">
                                                                    ${header}
                                                                </th>
                                                            `).join('')}
                                                        </tr>
                                                    </thead>
                                                    <tbody class="bg-white divide-y divide-gray-200">
                                                        ${members.map(member => `
                                                            <tr class="transition-colors duration-200 ease-in-out hover:bg-gray-50">
                                                                ${config.renderRow(member)}
                                                            </tr>
                                                        `).join('')}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }).join('');
            }
            document.querySelector('.text-xs.text-gray-400.mt-12.text-center').textContent = `Showing ${membersToDisplay.length} members across ${Object.keys(reGroupedMembers).length} categories`;
        }
        
        // Initial display update
        updateMembersDisplay();

        // Attach event listeners after initial render
        if (pcpFilter) {
            pcpFilter.addEventListener('change', updateMembersDisplay);
        }

    } catch (error) {
        console.error('Error loading members:', error);
        memberView.innerHTML = `
            <div class="max-w-screen-xl mx-auto p-6">
                <div class="text-center opacity-0 animate-fade-in">
                    <div class="text-red-600 text-sm mt-4">
                        Error loading members: ${error.message}
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

// Helper to get a sortable metric value based on category
function getSortableMetric(member, category) {
    switch (category) {
        case 'Suspect Conditions': return member.risk_score; // Assuming risk_score is numeric
        case 'Polypharmacy': return member.medications_count;
        case 'Frequent Flyers': return member.ed_visits_ytd; // Or ip_admits_ytd, depending on preference
        case 'High Utilizers': return member.total_visits; // Or visit_cost
        case 'Top 10 – Pharmacy Spend': return member.pharmacy_spend;
        case 'Top 10 – Specialty Spend': return member.specialty_spend;
        default: return 0;
    }
}

// Format member metric based on risk category
function formatMemberMetric(category, value) {
    switch (category) {
        case 'Suspect Conditions':
            return `${value} conditions`;
        case 'Frequent Flyers':
            return `${value} visits`;
        case 'High Utilizers':
        case 'High Pharmacy Cost':
        case 'High Specialty Cost':
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(value);
        case 'Polypharmacy':
            return `${value} medications`;
        default:
            return value;
    }
}

export default initMemberPanel;