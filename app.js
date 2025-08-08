// Import components
import Header from './components/Header.js';
import Breadcrumb from './components/Breadcrumb.js';
import ContractTable from './components/ContractTable.js';
import ProviderTable from './components/ProviderTable.js';
import MemberPanel from './components/MemberPanel.js';
import QualityModal from './components/QualityModal.js';
import KpiSummaryPage from './components/KpiSummaryPage.js';

// Add handler to show KPI Summary Page
window.showKpiSummaryPage = async () => {
    // Hide all main views
    document.getElementById('contractView').classList.add('hidden');
    document.getElementById('providerView').classList.add('hidden');
    document.getElementById('memberView').classList.add('hidden');
    let kpiSummarySection = document.getElementById('kpiSummaryView');
    if (!kpiSummarySection) {
        kpiSummarySection = document.createElement('section');
        kpiSummarySection.id = 'kpiSummaryView';
        kpiSummarySection.className = 'space-y-6';
        document.getElementById('content').appendChild(kpiSummarySection);
    }
    kpiSummarySection.innerHTML = await KpiSummaryPage();
    kpiSummarySection.classList.remove('hidden');
    // Update breadcrumb
    Breadcrumb.update([
        { label: 'Home', href: '#' },
        { label: 'KPI Summary', href: '#' }
    ]);
};

// Update handleHashRouting to be async and use await
async function handleHashRouting() {
    const contractView = document.getElementById('contractView');
    const providerView = document.getElementById('providerView');
    const memberView = document.getElementById('memberView');
    let kpiSummarySection = document.getElementById('kpiSummaryView');
    if (kpiSummarySection) kpiSummarySection.classList.add('hidden');
    if (contractView) contractView.classList.add('hidden');
    if (providerView) providerView.classList.add('hidden');
    if (memberView) memberView.classList.add('hidden');
    const hash = window.location.hash;
    if (hash === '#/kpi-summary') {
        await window.showKpiSummaryPage();
    } else if (hash.startsWith('#/member-panel')) {
        if (memberView) memberView.classList.remove('hidden');
        MemberPanel('Metro Physicians Group');
        Breadcrumb.update([
            { label: 'Home', href: '#' },
            { label: 'Member Panel', href: '#/member-panel' }
        ]);
    } else {
        if (contractView) contractView.classList.remove('hidden');
        Breadcrumb.update([
            { label: 'Home', href: '#' }
        ]);
    }
}

window.addEventListener('hashchange', handleHashRouting);

// Call handleHashRouting on initial load
handleHashRouting();

// Initialize the app
async function initApp() {
    // Initialize header and initial breadcrumb
    Header();
    Breadcrumb.init([
        { label: 'Home', href: '#' }
    ]);

    // Initialize contract table
    await ContractTable();
    // Ensure contract view is visible
    document.getElementById('contractView').classList.remove('hidden');

    // Set up global handlers
    window.handleViewProviders = async (contractId, contractName) => {
        console.log('handleViewProviders called with contractId:', contractId, 'contractName:', contractName);
        // Hide contract view and show provider view
        document.getElementById('contractView').classList.add('hidden');
        document.getElementById('providerView').classList.remove('hidden');
        
        // Update breadcrumb
        Breadcrumb.update([
            { label: 'Home', href: '#' },
            { label: contractName, href: '#' }
        ]);

        // Initialize provider table
        await ProviderTable(contractId);
    };

    window.handleViewMembers = async (providerId, providerName, providerType) => {
        // Hide provider view and show member view
        document.getElementById('providerView').classList.add('hidden');
        document.getElementById('memberView').classList.remove('hidden');
        
        // Update breadcrumb
        Breadcrumb.update([
            { label: 'Home', href: '#' },
            { label: providerType, href: '#' },
            { label: providerName, href: '#' }
        ]);

        // Initialize member panel
        await MemberPanel(providerId);
    };

    window.showMemberDetailModal = async (memberId) => {
        await QualityModal.show(memberId);
    };

    window.handleBackToContracts = () => {
        // Hide all views except contract view
        document.getElementById('providerView').classList.add('hidden');
        document.getElementById('memberView').classList.add('hidden');
        document.getElementById('contractView').classList.remove('hidden');
        
        // Reset breadcrumb
        Breadcrumb.update([
            { label: 'Home', href: '#' }
        ]);
    };

    window.handleBackToProviders = () => {
        // Hide member view and show provider view
        document.getElementById('memberView').classList.add('hidden');
        document.getElementById('providerView').classList.remove('hidden');
        
        // Update breadcrumb to remove last item
        const currentBreadcrumbs = document.querySelectorAll('.breadcrumb-item');
        if (currentBreadcrumbs.length > 1) {
            Breadcrumb.update([
                { label: 'Home', href: '#' },
                { label: currentBreadcrumbs[1].textContent, href: '#' }
            ]);
        }
    };
}

document.addEventListener('DOMContentLoaded', initApp); 