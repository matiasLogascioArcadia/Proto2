// Format currency values
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

export async function showMemberDetailModal(memberId) {
    try {
        // Load member data
        const memberResponse = await fetch('/data/members.json');
        if (!memberResponse.ok) throw new Error('Failed to load member data');
        const memberData = await memberResponse.json();
        
        // Find the specific member
        const member = memberData.members.find(m => m.member_id === memberId);
        if (!member) throw new Error('Member not found');

        // Load quality gaps data
        let qualityGaps = [];
        try {
            const qualityResponse = await fetch('/data/quality_gaps.json');
            if (qualityResponse.ok) {
                const qualityData = await qualityResponse.json();
                qualityGaps = qualityData.quality_gaps
                    .filter(gap => gap.members.some(m => m.name === member.name))
                    .map(gap => ({
                        measure: gap.measure_name,
                        status: gap.members.find(m => m.name === member.name).status,
                        value: gap.members.find(m => m.name === member.name).value,
                        nextAppointment: gap.members.find(m => m.name === member.name).next_appointment
                    }));
            }
        } catch (error) {
            console.warn('Could not load quality gaps:', error);
        }

        // Create modal HTML
        const modalHTML = `
            <div class="fixed top-0 left-0 w-full h-full bg-black bg-opacity-40 z-40" onclick="window.closeMemberModal()">
                <div class="bg-white rounded-xl p-6 shadow-xl max-w-lg mx-auto mt-20" onclick="event.stopPropagation()">
                    <!-- Header -->
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <h2 class="text-xl font-semibold text-gray-900">${member.name}</h2>
                            <p class="text-sm text-gray-500">Member ID: ${member.member_id}</p>
                        </div>
                        <button 
                            onclick="window.closeMemberModal()"
                            class="text-gray-400 hover:text-gray-500">
                            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <!-- PCP Information -->
                    <div class="mb-6">
                        <h3 class="text-sm font-medium text-gray-500 mb-2">Primary Care Provider</h3>
                        <div class="bg-gray-50 rounded-lg p-4">
                            <p class="text-gray-900 font-medium">${member.pcp_name}</p>
                            <p class="text-sm text-gray-500">NPI: ${member.pcp_npi}</p>
                        </div>
                    </div>

                    <!-- Risk Flags -->
                    <div class="mb-6">
                        <h3 class="text-sm font-medium text-gray-500 mb-2">Risk Flags</h3>
                        <div class="space-y-3">
                            ${member.suspect_conditions?.length > 0 ? `
                                <div class="bg-red-50 rounded-lg p-4">
                                    <p class="text-sm font-medium text-red-800">Suspect Conditions</p>
                                    <p class="text-sm text-red-600">${member.suspect_conditions.join(', ')}</p>
                                </div>
                            ` : ''}
                            <div class="bg-yellow-50 rounded-lg p-4">
                                <p class="text-sm font-medium text-yellow-800">${member.risk_category}</p>
                                <p class="text-sm text-yellow-600">
                                    ${formatMemberMetric(member.risk_category, member.metric_value)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Quality Gaps -->
                    ${qualityGaps.length > 0 ? `
                        <div class="mb-6">
                            <h3 class="text-sm font-medium text-gray-500 mb-2">Quality Gaps</h3>
                            <div class="space-y-3">
                                ${qualityGaps.map(gap => `
                                    <div class="bg-blue-50 rounded-lg p-4">
                                        <p class="text-sm font-medium text-blue-800">${gap.measure}</p>
                                        <p class="text-sm text-blue-600">Status: ${gap.status}</p>
                                        <p class="text-sm text-blue-600">Value: ${gap.value}</p>
                                        ${gap.nextAppointment ? `
                                            <p class="text-sm text-blue-600">Next Appointment: ${formatDate(gap.nextAppointment)}</p>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Actions -->
                    <div class="flex justify-end space-x-3">
                        <button 
                            onclick="window.closeMemberModal()"
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                            Close
                        </button>
                        <button 
                            onclick="window.handleMemberAction('${member.member_id}')"
                            class="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                            Take Action
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        const modalContainer = document.createElement('div');
        modalContainer.id = 'memberDetailModal';
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);

        // Add close function
        window.closeMemberModal = function() {
            const modal = document.getElementById('memberDetailModal');
            if (modal) {
                modal.remove();
            }
        };

    } catch (error) {
        console.error('Error showing member details:', error);
        alert('Error loading member details. Please try again.');
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
            return formatCurrency(value);
        case 'Polypharmacy':
            return `${value} medications`;
        default:
            return value;
    }
} 