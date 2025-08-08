import { getTrendIcon, getTrendColor } from '../utils/tableUtils.js';

// Dummy KPI data (copied from MemberPanel.js)
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

async function renderKpiSummaryPage() {
    // Fetch quality gaps data
    let qualityGaps = [];
    let uniquePCPs = [];
    let members = [];
    try {
        const response = await fetch('/data/quality_gaps.json');
        if (response.ok) {
            const data = await response.json();
            qualityGaps = data.quality_gaps || [];
        }
        // Fetch PCPs and members from members.json
        const membersResp = await fetch('/data/members.json');
        if (membersResp.ok) {
            const membersData = await membersResp.json();
            members = membersData.members || [];
            uniquePCPs = [...new Set(members.map(m => m.pcp_name))].filter(Boolean).sort();
        }
    } catch (e) {
        qualityGaps = [];
        uniquePCPs = [];
        members = [];
    }

    // Helper to filter and aggregate KPIs by PCP
    function getFilteredKPIs(selectedPCP) {
        // Filter members by PCP
        const filteredMembers = selectedPCP ? members.filter(m => m.pcp_name === selectedPCP) : members;
        // Aggregate KPIs by risk_category
        const kpiAgg = {
            'Suspect Conditions': [],
            'Polypharmacy': [],
            'Frequent Flyers': [],
            'High Utilizers': [],
            'Top 10 – Pharmacy Spend': [],
            'Top 10 – Specialty Spend': [],
            'Quality Gaps': [],
        };
        filteredMembers.forEach(m => {
            if (kpiAgg[m.risk_category]) kpiAgg[m.risk_category].push(m);
        });
        // For Quality section, filter qualityGaps by members with matching PCP
        let filteredQualityGaps = qualityGaps;
        if (selectedPCP) {
            filteredQualityGaps = qualityGaps.map(measure => {
                // Only count members with this PCP
                const measureMembers = (measure.members || []).filter(mem => mem.pcp_name === selectedPCP);
                // If no member PCPs in quality_gaps, fallback to all
                return {
                    ...measure,
                    // Optionally, you could recalc numerator/denominator if you have PCP info in quality_gaps
                    members_with_appointments: measureMembers.length
                };
            });
        }
        return { kpiAgg, filteredQualityGaps };
    }

    // Initial render with all PCPs
    setTimeout(() => {
        const pcpFilter = document.getElementById('pcpFilter');
        if (pcpFilter) {
            pcpFilter.addEventListener('change', (e) => {
                updateDisplayedKPIs(e.target.value);
            });
        }
    }, 0);

    // Function to update KPI sections
    function updateDisplayedKPIs(selectedPCP) {
        const { kpiAgg, filteredQualityGaps } = getFilteredKPIs(selectedPCP);
        const kpiSections = document.getElementById('kpiSections');
        if (!kpiSections) return;
        kpiSections.innerHTML = `
            ${Object.keys(kpis).map((groupKey, idx) => {
                const groupTitles = {
                    membersSeen: "Members Seen",
                    coding: "Coding",
                    partA: "Part A",
                    partB: "Part B",
                    partD: "Part D",
                };
                const groupTitle = groupTitles[groupKey];
                const groupKpis = Object.values(kpis[groupKey]);
                const sectionId = `kpi-section-${groupKey}`;
                return `
                    <div class="bg-gradient-to-r from-white via-slate-50 to-white border border-gray-300 shadow-md hover:shadow-lg transition-shadow rounded-lg px-4 py-3 mb-3 border-l-4 border-purple-600">
                        <button
                            class="w-full flex justify-between items-center px-4 py-2 text-sm font-semibold text-purple-700"
                            onclick="this.nextElementSibling.classList.toggle('hidden'); this.querySelector('svg').classList.toggle('rotate-180')"
                        >
                            <h3 class="text-md font-bold text-purple-700 mb-2 uppercase tracking-wide">${groupTitle}</h3>
                            <svg class="w-4 h-4 transform transition-transform duration-200" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.061l-4.24 4.25a.75.75 0 01-1.06 0l-4.25-4.25a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                            </svg>
                        </button>
                        <div class="px-4 py-2">
                            <table class="table-auto w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th class="w-1/3 px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase">Metric</th>
                                        <th class="w-1/6 px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                                        <th class="w-1/6 px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase">MoM</th>
                                        <th class="w-1/6 px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase">YoY</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${groupKpis.map(kpi => {
                                        const { label, value, mom, yoy, direction } = kpi;
                                        const trendColorClass = getTrendColor(direction);
                                        const momTrend = mom ? `${getTrendIcon(direction)} ${mom}` : '-';
                                        const yoyTrend = yoy ? `${getTrendIcon(direction)} ${yoy}` : '-';
                                        return `
                                            <tr>
                                                <td class="w-1/3 px-3 py-1 text-sm text-gray-900">${label}</td>
                                                <td class="w-1/6 px-3 py-1 text-sm font-semibold text-gray-900">${value}</td>
                                                <td class="w-1/6 px-3 py-1 text-sm ${trendColorClass}">${momTrend}</td>
                                                <td class="w-1/6 px-3 py-1 text-sm ${trendColorClass}">${yoyTrend}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }).join('')}
            <!-- Quality Section -->
            <div class="bg-gradient-to-r from-white via-slate-50 to-white border border-gray-300 shadow-md hover:shadow-lg transition-shadow rounded-lg px-4 py-3 mb-3 border-l-4 border-purple-600">
                <button
                    class="w-full flex justify-between items-center px-4 py-2 text-sm font-semibold text-purple-700"
                    onclick="this.nextElementSibling.classList.toggle('hidden'); this.querySelector('svg').classList.toggle('rotate-180')"
                >
                    <h3 class="text-md font-bold text-purple-700 mb-2 uppercase tracking-wide">Quality</h3>
                    <svg class="w-4 h-4 transform transition-transform duration-200" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.061l-4.24 4.25a.75.75 0 01-1.06 0l-4.25-4.25a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                    </svg>
                </button>
                <div class="px-4 py-2">
                    <table class="w-full table-auto text-sm border-collapse">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="w-1/3 px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase">Measure</th>
                                <th class="w-1/6 px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase">% Gaps Closed</th>
                                <th class="w-1/6 px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase">MoM</th>
                                <th class="w-1/6 px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase">YoY</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${[
                                { measure: "Breast Cancer Screening", gapsClosed: "70%", mom: "+2.1%", yoy: "+4.5%", direction: "up" },
                                { measure: "Colon Cancer Screening", gapsClosed: "65%", mom: "-1.2%", yoy: "+2.3%", direction: "down" },
                                { measure: "HbA1c Control", gapsClosed: "72%", mom: "+1.5%", yoy: "+3.8%", direction: "up" },
                                { measure: "Nephropathy Screening", gapsClosed: "69%", mom: "+0.8%", yoy: "+2.9%", direction: "up" },
                                { measure: "Eye Exam (Diabetic Retinopathy)", gapsClosed: "74%", mom: "+1.0%", yoy: "+4.1%", direction: "up" },
                                { measure: "Statin Therapy for Patients with Diabetes", gapsClosed: "68%", mom: "+2.6%", yoy: "+3.3%", direction: "up" },
                                { measure: "Osteoporosis Management", gapsClosed: "60%", mom: "+1.7%", yoy: "+2.0%", direction: "up" },
                                { measure: "Depression Screening", gapsClosed: "82%", mom: "+0.5%", yoy: "+5.4%", direction: "up" },
                                { measure: "Annual Wellness Visit", gapsClosed: "75%", mom: "+1.9%", yoy: "+4.8%", direction: "up" },
                                { measure: "Cervical Cancer Screening", gapsClosed: "66%", mom: "-0.9%", yoy: "+1.7%", direction: "down" },
                                { measure: "Medication Reconciliation Post Discharge", gapsClosed: "78%", mom: "+2.2%", yoy: "+3.1%", direction: "up" }
                            ].map(kpi => `
                                <tr>
                                    <td class="w-1/3 px-3 py-1 text-sm text-gray-900">${kpi.measure}</td>
                                    <td class="w-1/6 px-3 py-1 text-sm font-semibold text-gray-900">${kpi.gapsClosed}</td>
                                    <td class="w-1/6 px-3 py-1 text-sm ${kpi.direction === "up" ? "text-green-600" : "text-red-600"}">${kpi.mom}</td>
                                    <td class="w-1/6 px-3 py-1 text-sm ${kpi.direction === "up" ? "text-green-600" : "text-red-600"}">${kpi.yoy}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // Initial render of KPI sections
    setTimeout(() => {
        updateDisplayedKPIs("");
    }, 0);

    return `
        <h1 class="text-2xl font-bold mb-6">KPI Summary Dashboard</h1>
        <div class="mb-6 p-4 bg-white shadow-md rounded-lg flex flex-wrap gap-4 items-center">
            <div class="flex items-center space-x-2">
                <label for="pcpFilter" class="text-sm font-medium text-gray-700">Filter by PCP:</label>
                <select id="pcpFilter" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md">
                    <option value="">All PCPs</option>
                    ${uniquePCPs.map(pcp => `<option value="${pcp}">${pcp}</option>`).join('')}
                </select>
            </div>
        </div>
        <div class="max-w-screen-xl mx-auto p-6">
            <div id="kpiSections" class="space-y-6"></div>
        </div>
    `;
}

export default renderKpiSummaryPage; 