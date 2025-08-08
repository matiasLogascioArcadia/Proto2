// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Get status color class
function getStatusColor(status) {
    switch (status.toLowerCase()) {
        case 'completed':
            return 'text-green-600';
        case 'pending':
            return 'text-yellow-600';
        case 'overdue':
            return 'text-red-600';
        default:
            return 'text-gray-600';
    }
}

export async function showQualityModal() {
    try {
        // Load quality gaps data
        const response = await fetch('/data/quality_gaps.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Create modal HTML
        const modalHTML = `
            <div class="fixed top-0 left-0 w-full h-full bg-black bg-opacity-40 z-40" onclick="window.closeQualityModal()">
                <div class="bg-white rounded-xl p-6 shadow-xl max-w-4xl mx-auto mt-20" onclick="event.stopPropagation()">
                    <!-- Header -->
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <h2 class="text-xl font-semibold text-gray-900">Quality Measures</h2>
                            <p class="text-sm text-gray-500">Track and manage quality gaps</p>
                        </div>
                        <button 
                            onclick="window.closeQualityModal()"
                            class="text-gray-400 hover:text-gray-500">
                            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <!-- Measures Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        ${data.quality_gaps.map(measure => `
                            <div class="bg-white rounded-lg border p-4">
                                <h3 class="text-sm font-medium text-gray-900 mb-2">${measure.measure_name}</h3>
                                <div class="flex justify-between items-center">
                                    <div class="text-2xl font-semibold ${measure.numerator / measure.denominator >= 0.7 ? 'text-green-600' : 'text-red-600'}">
                                        ${Math.round((measure.numerator / measure.denominator) * 100)}%
                                    </div>
                                    <div class="text-sm text-gray-500">
                                        ${measure.numerator}/${measure.denominator}
                                    </div>
                                </div>
                                <div class="mt-2 text-sm text-gray-500">
                                    ${measure.members_with_appointments} members with appointments
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Members Table -->
                    <div class="space-y-4">
                        ${data.quality_gaps.map(measure => `
                            <div class="bg-white rounded-lg border">
                                <div class="p-4 border-b">
                                    <h3 class="text-lg font-medium text-gray-900">${measure.measure_name}</h3>
                                </div>
                                <div class="divide-y">
                                    ${measure.members.map(member => `
                                        <div class="p-4 ${member.next_appointment ? 'bg-green-50' : ''}">
                                            <div class="flex justify-between items-center">
                                                <div>
                                                    <p class="font-medium text-gray-900">${member.name}</p>
                                                    <p class="text-sm text-gray-500">Status: 
                                                        <span class="${getStatusColor(member.status)}">${member.status}</span>
                                                    </p>
                                                </div>
                                                <div class="text-right">
                                                    <p class="text-sm text-gray-900">${member.value}</p>
                                                    ${member.next_appointment ? `
                                                        <p class="text-sm text-green-600">
                                                            Next: ${formatDate(member.next_appointment)}
                                                        </p>
                                                    ` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Actions -->
                    <div class="flex justify-end mt-6">
                        <button 
                            onclick="window.closeQualityModal()"
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        const modalContainer = document.createElement('div');
        modalContainer.id = 'qualityModal';
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);

        // Add close function
        window.closeQualityModal = function() {
            const modal = document.getElementById('qualityModal');
            if (modal) {
                modal.remove();
            }
        };

    } catch (error) {
        console.error('Error showing quality measures:', error);
        alert('Error loading quality measures. Please try again.');
    }
}

export default {
    show: showQualityModal
}; 