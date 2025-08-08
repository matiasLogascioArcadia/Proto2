const Header = () => {
    const headerElement = document.getElementById('header');
    if (headerElement) {
        headerElement.className = 'bg-white border-b shadow-sm px-6 py-3 sticky top-0 z-50';
        headerElement.innerHTML = `
            <div class="flex items-center justify-between">
                <h1 class="text-xl font-semibold text-gray-900">Contract IQ Prototype</h1>
                <nav class="flex gap-4">
                    <a href="#/member-panel" class="text-sm text-purple-700 hover:underline">Member Panel</a>
                    <a href="#/kpi-summary" class="text-sm text-purple-700 hover:underline">KPI Summary</a>
                </nav>
            </div>
        `;
    }
};

export default Header; 