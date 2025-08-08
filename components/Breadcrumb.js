const Breadcrumb = {
    init: (items = []) => {
        const breadcrumbElement = document.getElementById('breadcrumb');
        if (breadcrumbElement) {
            breadcrumbElement.className = 'bg-white border-b px-6 py-2';
            Breadcrumb._render(breadcrumbElement, items);
        }
    },

    update: (items) => {
        const breadcrumbElement = document.getElementById('breadcrumb');
        if (breadcrumbElement) {
            Breadcrumb._render(breadcrumbElement, items);
        }
    },

    _render: (element, items) => {
        const defaultItems = [
            { label: 'Home', href: '#' }
        ];
        const breadcrumbItems = items.length > 0 ? items : defaultItems;

        element.innerHTML = `
            <ol class="flex gap-2 text-sm text-gray-500">
                ${breadcrumbItems.map((item, index) => `
                    <li class="flex items-center breadcrumb-item">
                        ${index > 0 ? `
                            <svg class="h-4 w-4 text-gray-400 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                        ` : ''}
                        ${item.href ? `
                            <a href="${item.href}" class="hover:text-gray-700">${item.label}</a>
                        ` : `
                            <span class="font-semibold text-gray-700">${item.label}</span>
                        `}
                    </li>
                `).join('')}
            </ol>
        `;
    }
};

export default Breadcrumb; 