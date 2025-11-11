const API_BASE_URL = 'http://localhost:8000/api';
let currentEvents = [];
let currentAttendees = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeDates();
    setupEventListeners();
});

function initializeDates() {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    
    document.getElementById('startDate').value = today.toISOString().split('T')[0];
    document.getElementById('endDate').value = nextMonth.toISOString().split('T')[0];
}

function setupEventListeners() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPhase = this.getAttribute('href').substring(1);
            switchPhase(targetPhase);
        });
    });

    document.getElementById('manualEvent').addEventListener('input', function() {
        if (this.value.trim()) {
            document.getElementById('eventSelect').value = '';
        }
    });

    document.getElementById('eventSelect').addEventListener('change', function() {
        if (this.value) {
            document.getElementById('manualEvent').value = '';
        }
    });
}

function switchPhase(phase) {
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector(`.nav-link[href="#${phase}"]`).classList.add('active');

    document.querySelectorAll('.phase-section').forEach(section => section.classList.remove('active'));
    document.getElementById(phase).classList.add('active');
}

// Event Discovery
async function discoverEvents() {
    const location = document.getElementById('location').value.trim();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const maxResults = parseInt(document.getElementById('maxEvents').value);
    
    if (!location) {
        alert('Please enter a location');
        return;
    }

    const categories = Array.from(document.querySelectorAll('.category-checkbox input:checked'))
        .map(checkbox => checkbox.value);

    if (categories.length === 0) {
        alert('Please select at least one category');
        return;
    }

    showLoading(`Discovering ${maxResults} events in ${location}...`);

    try {
        const response = await fetch(`${API_BASE_URL}/discover-events`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                location,
                start_date: startDate,
                end_date: endDate,
                categories,
                max_results: maxResults
            })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();

        if (result.success) {
            currentEvents = result.events || [];
            displayEvents(currentEvents, result);
            updateEventDropdown(currentEvents);
        } else {
            throw new Error(result.error || 'Failed to discover events');
        }
    } catch (error) {
        alert('Error discovering events: ' + error.message);
        console.error('Event discovery error:', error);
    } finally {
        hideLoading();
    }
}

function displayEvents(events, metadata) {
    const tableBody = document.getElementById('eventsTableBody');
    const statsElement = document.getElementById('eventsStats');

    statsElement.innerHTML = `
        <span>Found: ${metadata.total_events || 0}</span>
        <span>API Calls: ${metadata.api_calls_used || 0}</span>
    `;

    tableBody.innerHTML = '';

    if (events.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">No events found</td></tr>';
    } else {
        events.forEach((event, index) => {
            const confidencePercent = Math.round((event.confidence_score || 0.5) * 100);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${event.event_name || 'Unknown'}</strong></td>
                <td>${event.exact_date || 'Date not specified'}</td>
                <td>${event.exact_venue || event.location || 'Venue not specified'}</td>
                <td>${event.category || 'other'}</td>
                <td>${confidencePercent}%</td>
                <td>
                    <button class="btn-secondary" onclick="analyzeAttendees('${(event.event_name || '').replace(/'/g, "\\'")}', ${index})">
                        Analyze
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    document.getElementById('eventsResults').classList.remove('hidden');
}

function updateEventDropdown(events) {
    const eventSelect = document.getElementById('eventSelect');
    while (eventSelect.children.length > 1) {
        eventSelect.removeChild(eventSelect.lastChild);
    }
    
    events.forEach(event => {
        const option = document.createElement('option');
        option.value = event.event_name;
        option.textContent = `${event.event_name} (${event.exact_date})`;
        eventSelect.appendChild(option);
    });
}

// Attendee Discovery
async function discoverAttendees() {
    const eventSelect = document.getElementById('eventSelect');
    const manualEvent = document.getElementById('manualEvent').value.trim();
    const maxResults = parseInt(document.getElementById('maxAttendees').value);

    let eventName = eventSelect.value || manualEvent;
    
    if (!eventName.trim()) {
        alert('Please select or enter an event name');
        return;
    }

    showLoading(`Finding ${maxResults} attendees for "${eventName}"...`);

    try {
        const response = await fetch(`${API_BASE_URL}/discover-attendees`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                event_name: eventName,
                max_results: maxResults
            })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();

        if (result.success) {
            currentAttendees = result.attendees || [];
            displayAttendees(currentAttendees, result);
        } else {
            throw new Error(result.error || 'Failed to discover attendees');
        }
    } catch (error) {
        alert('Error discovering attendees: ' + error.message);
        console.error('Attendee discovery error:', error);
    } finally {
        hideLoading();
    }
}

function displayAttendees(attendees, metadata) {
    const tableBody = document.getElementById('attendeesTableBody');
    const statsElement = document.getElementById('attendeesStats');

    statsElement.innerHTML = `
        <span>Found: ${metadata.total_attendees || 0}</span>
        <span>API Calls: ${metadata.api_calls_used || 0}</span>
    `;

    tableBody.innerHTML = '';

    if (attendees.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">No attendees found</td></tr>';
    } else {
        attendees.forEach(attendee => {
            const row = document.createElement('tr');
            const username = attendee.username || '@unknown';
            const postContent = attendee.post_content || 'No content';
            
            row.innerHTML = `
                <td>${username}</td>
                <td>${attendee.engagement_type || 'general_discussion'}</td>
                <td>${postContent.length > 60 ? postContent.substring(0, 60) + '...' : postContent}</td>
                <td>${attendee.post_date || 'Unknown date'}</td>
                <td>${attendee.followers_count || 0}</td>
                <td>
                    <a href="${attendee.post_link || '#'}" target="_blank" class="btn-secondary">
                        View
                    </a>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    updateAnalytics(attendees);
    document.getElementById('attendeesResults').classList.remove('hidden');
}

function updateAnalytics(attendees) {
    const totalUsers = attendees.length;
    const verifiedUsers = attendees.filter(a => a.verified).length;
    const totalReach = attendees.reduce((sum, a) => sum + (a.followers_count || 0), 0);

    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('verifiedUsers').textContent = verifiedUsers;
    document.getElementById('totalReach').textContent = totalReach.toLocaleString();
}

function analyzeAttendees(eventName, eventIndex) {
    document.getElementById('eventSelect').value = eventName;
    document.getElementById('manualEvent').value = '';
    switchPhase('phase2');
}

// Utility Functions
function showLoading(text) {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingModal').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingModal').classList.add('hidden');
}

function exportEvents(format) {
    if (!currentEvents.length) {
        alert('No events to export');
        return;
    }
    downloadFile(JSON.stringify(currentEvents, null, 2), `events.${format}`, format === 'csv' ? 'text/csv' : 'application/json');
    alert(`Events exported as ${format}`);
}

function exportAttendees(format) {
    if (!currentAttendees.length) {
        alert('No attendees to export');
        return;
    }
    downloadFile(JSON.stringify(currentAttendees, null, 2), `attendees.${format}`, format === 'csv' ? 'text/csv' : 'application/json');
    alert(`Attendees exported as ${format}`);
}

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
