// Admin Dashboard Script
(function () {
    'use strict';

    // Initialize Supabase client
    const supabase = window.supabase.createClient(
        SUPABASE_CONFIG.url,
        SUPABASE_CONFIG.anonKey
    );

    // Simple authentication (replace with proper auth in production)
    const ADMIN_CREDENTIALS = {
        username: 'admin',
        password: 'atomiclabs2025' // Change this!
    };

    // DOM Elements
    const loginScreen = document.getElementById('loginScreen');
    const dashboard = document.getElementById('dashboard');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const dateRangeSelect = document.getElementById('dateRange');

    // Check if already logged in
    function checkAuth() {
        const isLoggedIn = sessionStorage.getItem('admin_logged_in');
        if (isLoggedIn === 'true') {
            showDashboard();
        }
    }

    // Login handler
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            sessionStorage.setItem('admin_logged_in', 'true');
            showDashboard();
        } else {
            loginError.textContent = 'Invalid credentials';
        }
    });

    // Logout handler
    logoutBtn.addEventListener('click', function () {
        sessionStorage.removeItem('admin_logged_in');
        loginScreen.style.display = 'flex';
        dashboard.style.display = 'none';
        loginForm.reset();
        loginError.textContent = '';
    });

    // Show dashboard
    function showDashboard() {
        loginScreen.style.display = 'none';
        dashboard.style.display = 'block';
        loadDashboardData();
    }

    // Refresh button
    refreshBtn.addEventListener('click', function () {
        loadDashboardData();
    });

    // Date range change with smooth transition
    dateRangeSelect.addEventListener('change', function () {
        // Add fade effect
        const chartCard = document.querySelector('.chart-card');
        chartCard.style.opacity = '0.5';
        chartCard.style.transition = 'opacity 0.3s ease';

        loadDashboardData().then(() => {
            chartCard.style.opacity = '1';
        });
    });

    // Get date range
    function getDateRange() {
        const range = dateRangeSelect.value;
        const now = new Date();
        let startDate;

        switch (range) {
            case 'today':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'yesterday':
                startDate = new Date(now.setDate(now.getDate() - 1));
                startDate.setHours(0, 0, 0, 0);
                break;
            case '7days':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case '30days':
                startDate = new Date(now.setDate(now.getDate() - 30));
                break;
            case '90days':
                startDate = new Date(now.setDate(now.getDate() - 90));
                break;
            case 'all':
                startDate = new Date('2024-01-01');
                break;
            default:
                startDate = new Date(now.setDate(now.getDate() - 7));
        }

        return startDate.toISOString();
    }

    // Load dashboard data
    async function loadDashboardData() {
        try {
            const startDate = getDateRange();

            // Update last updated time
            document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();

            // Load all data in parallel
            await Promise.all([
                loadOverviewStats(startDate),
                loadTopPages(startDate),
                loadTrafficSources(startDate),
                loadDevices(startDate),
                loadCTAClicks(startDate),
                loadVisitorsChart(startDate),
                loadRegistrations(startDate)
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    // Load overview stats
    async function loadOverviewStats(startDate) {
        try {
            // Total visitors
            const { data: visitors, error: visitorsError } = await supabase
                .from('visitors')
                .select('*', { count: 'exact' })
                .gte('visited_at', startDate);

            if (visitorsError) throw visitorsError;

            // Unique visitors (by session_id)
            const uniqueSessions = new Set(visitors.map(v => v.session_id));

            // Page views
            const { count: pageViewsCount, error: pageViewsError } = await supabase
                .from('page_views')
                .select('*', { count: 'exact', head: true })
                .gte('viewed_at', startDate);

            if (pageViewsError) throw pageViewsError;

            // CTA clicks
            const { count: ctaClicksCount, error: ctaError } = await supabase
                .from('page_views')
                .select('*', { count: 'exact', head: true })
                .eq('clicked_cta', true)
                .gte('viewed_at', startDate);

            if (ctaError) throw ctaError;

            // Average time on page
            const { data: timeData, error: timeError } = await supabase
                .from('page_views')
                .select('time_on_page')
                .gte('viewed_at', startDate)
                .not('time_on_page', 'is', null);

            if (timeError) throw timeError;

            const avgTime = timeData.length > 0
                ? Math.round(timeData.reduce((sum, item) => sum + item.time_on_page, 0) / timeData.length)
                : 0;

            // Conversion rate
            const conversionRate = uniqueSessions.size > 0
                ? ((ctaClicksCount / uniqueSessions.size) * 100).toFixed(1)
                : 0;

            // Registrations count
            const { count: registrationsCount, error: regError } = await supabase
                .from('registrations')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startDate);

            if (regError) {
                console.error('Error loading registrations count:', regError);
            }

            // Update UI
            document.getElementById('totalVisitors').textContent = visitors.length.toLocaleString();
            document.getElementById('uniqueVisitors').textContent = uniqueSessions.size.toLocaleString();
            document.getElementById('pageViews').textContent = pageViewsCount.toLocaleString();
            document.getElementById('avgTime').textContent = formatTime(avgTime);
            document.getElementById('ctaClicks').textContent = ctaClicksCount.toLocaleString();
            document.getElementById('conversionRate').textContent = conversionRate + '%';

            const regCount = (registrationsCount || 0).toLocaleString();
            document.getElementById('totalRegistrations').textContent = regCount;
            // Also update the main tab stat if it exists
            const mainRegStat = document.getElementById('totalRegistrationsMain');
            if (mainRegStat) mainRegStat.textContent = regCount;
        } catch (error) {
            console.error('Error loading overview stats:', error);
        }
    }

    // Load top pages
    async function loadTopPages(startDate) {
        try {
            const { data, error } = await supabase
                .from('visitors')
                .select('page_url, session_id')
                .gte('visited_at', startDate);

            if (error) throw error;

            // Get page views with time data
            const { data: pageViewData, error: pvError } = await supabase
                .from('page_views')
                .select('page_url, time_on_page')
                .gte('viewed_at', startDate);

            if (pvError) throw pvError;

            // Aggregate data
            const pageStats = {};
            data.forEach(item => {
                const url = new URL(item.page_url).pathname;
                if (!pageStats[url]) {
                    pageStats[url] = { views: 0, uniqueViews: new Set(), totalTime: 0, timeCount: 0 };
                }
                pageStats[url].views++;
                pageStats[url].uniqueViews.add(item.session_id);
            });

            pageViewData.forEach(item => {
                const url = new URL(item.page_url).pathname;
                if (pageStats[url] && item.time_on_page) {
                    pageStats[url].totalTime += item.time_on_page;
                    pageStats[url].timeCount++;
                }
            });

            // Convert to array and sort
            const topPages = Object.entries(pageStats)
                .map(([url, stats]) => ({
                    url,
                    views: stats.views,
                    uniqueViews: stats.uniqueViews.size,
                    avgTime: stats.timeCount > 0 ? Math.round(stats.totalTime / stats.timeCount) : 0
                }))
                .sort((a, b) => b.views - a.views)
                .slice(0, 10);

            // Update table
            const tbody = document.querySelector('#topPagesTable tbody');
            tbody.innerHTML = topPages.map(page => `
                <tr>
                    <td><strong>${page.url}</strong></td>
                    <td>${page.views}</td>
                    <td>${page.uniqueViews}</td>
                    <td>${formatTime(page.avgTime)}</td>
                </tr>
            `).join('') || '<tr><td colspan="4" class="loading">No data</td></tr>';
        } catch (error) {
            console.error('Error loading top pages:', error);
        }
    }

    // Load traffic sources
    async function loadTrafficSources(startDate) {
        try {
            const { data, error } = await supabase
                .from('visitors')
                .select('referrer')
                .gte('visited_at', startDate);

            if (error) throw error;

            // Aggregate sources
            const sources = {};
            let total = 0;

            data.forEach(item => {
                let source = 'Direct';
                if (item.referrer && item.referrer !== 'direct') {
                    try {
                        const url = new URL(item.referrer);
                        source = url.hostname.replace('www.', '');
                    } catch (e) {
                        source = 'Other';
                    }
                }
                sources[source] = (sources[source] || 0) + 1;
                total++;
            });

            // Convert to array and sort
            const topSources = Object.entries(sources)
                .map(([source, count]) => ({
                    source,
                    count,
                    percentage: ((count / total) * 100).toFixed(1)
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            // Update table
            const tbody = document.querySelector('#trafficSourcesTable tbody');
            tbody.innerHTML = topSources.map(item => `
                <tr>
                    <td><strong>${item.source}</strong></td>
                    <td>${item.count}</td>
                    <td>${item.percentage}%</td>
                </tr>
            `).join('') || '<tr><td colspan="3" class="loading">No data</td></tr>';
        } catch (error) {
            console.error('Error loading traffic sources:', error);
        }
    }

    // Load devices
    async function loadDevices(startDate) {
        try {
            const { data, error } = await supabase
                .from('visitors')
                .select('device_type')
                .gte('visited_at', startDate);

            if (error) throw error;

            // Aggregate devices
            const devices = {};
            let total = 0;

            data.forEach(item => {
                const device = item.device_type || 'Unknown';
                devices[device] = (devices[device] || 0) + 1;
                total++;
            });

            // Convert to array and sort
            const deviceStats = Object.entries(devices)
                .map(([device, count]) => ({
                    device: device.charAt(0).toUpperCase() + device.slice(1),
                    count,
                    percentage: ((count / total) * 100).toFixed(1)
                }))
                .sort((a, b) => b.count - a.count);

            // Update table
            const tbody = document.querySelector('#devicesTable tbody');
            tbody.innerHTML = deviceStats.map(item => `
                <tr>
                    <td><strong>${item.device}</strong></td>
                    <td>${item.count}</td>
                    <td>${item.percentage}%</td>
                </tr>
            `).join('') || '<tr><td colspan="3" class="loading">No data</td></tr>';
        } catch (error) {
            console.error('Error loading devices:', error);
        }
    }

    // Load CTA clicks
    async function loadCTAClicks(startDate) {
        try {
            const { data, error } = await supabase
                .from('page_views')
                .select('cta_type, page_url, viewed_at')
                .eq('clicked_cta', true)
                .gte('viewed_at', startDate)
                .order('viewed_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            // Update table
            const tbody = document.querySelector('#ctaClicksTable tbody');
            tbody.innerHTML = data.map(item => {
                const url = new URL(item.page_url).pathname;
                const time = new Date(item.viewed_at).toLocaleString();
                return `
                    <tr>
                        <td><strong>${item.cta_type || 'Unknown'}</strong></td>
                        <td>${url}</td>
                        <td>${time}</td>
                    </tr>
                `;
            }).join('') || '<tr><td colspan="3" class="loading">No data</td></tr>';
        } catch (error) {
            console.error('Error loading CTA clicks:', error);
        }
    }

    // Load visitors chart with Google Trends-like styling
    async function loadVisitorsChart(startDate) {
        const chartContainer = document.getElementById('visitorsChart');

        // Show loading state
        chartContainer.innerHTML = `
            <div class="chart-loading">
                <div class="chart-loading-spinner"></div>
                <p>Loading chart data...</p>
            </div>
            <canvas id="visitorsCanvas"></canvas>
        `;

        try {
            const { data, error } = await supabase
                .from('visitors')
                .select('visited_at, session_id')
                .gte('visited_at', startDate)
                .order('visited_at', { ascending: true });

            if (error) throw error;

            // Group by date with proper time intervals
            const range = dateRangeSelect.value;
            const dailyStats = {};

            data.forEach(item => {
                let dateKey;
                const date = new Date(item.visited_at);

                // Adjust granularity based on date range
                if (range === 'today' || range === 'yesterday') {
                    // Hourly for today/yesterday
                    dateKey = date.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        hour12: true
                    });
                } else {
                    // Daily for longer ranges
                    dateKey = date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: range === 'all' || range === '90days' ? 'numeric' : undefined
                    });
                }

                if (!dailyStats[dateKey]) {
                    dailyStats[dateKey] = { total: 0, unique: new Set(), timestamp: date };
                }
                dailyStats[dateKey].total++;
                dailyStats[dateKey].unique.add(item.session_id);
            });

            // Sort by timestamp and prepare chart data
            const sortedEntries = Object.entries(dailyStats)
                .sort((a, b) => a[1].timestamp - b[1].timestamp);

            const labels = sortedEntries.map(([label]) => label);
            const totalVisitors = sortedEntries.map(([, stats]) => stats.total);
            const uniqueVisitors = sortedEntries.map(([, stats]) => stats.unique.size);

            // Remove loading state
            const loadingDiv = chartContainer.querySelector('.chart-loading');
            if (loadingDiv) loadingDiv.remove();

            // Check if we have data
            if (labels.length === 0) {
                chartContainer.innerHTML = `
                    <div class="chart-empty">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <polyline points="19 12 12 19 5 12"></polyline>
                        </svg>
                        <p>No visitor data for this time period</p>
                    </div>
                    <canvas id="visitorsCanvas"></canvas>
                `;
                return;
            }

            // Create chart with Google Trends styling
            const ctx = document.getElementById('visitorsCanvas').getContext('2d');

            // Destroy existing chart if any
            if (window.visitorsChart) {
                window.visitorsChart.destroy();
            }

            // Create gradient for area fill
            const gradient1 = ctx.createLinearGradient(0, 0, 0, 400);
            gradient1.addColorStop(0, 'rgba(5, 150, 105, 0.3)');
            gradient1.addColorStop(0.5, 'rgba(5, 150, 105, 0.1)');
            gradient1.addColorStop(1, 'rgba(5, 150, 105, 0)');

            const gradient2 = ctx.createLinearGradient(0, 0, 0, 400);
            gradient2.addColorStop(0, 'rgba(74, 144, 226, 0.3)');
            gradient2.addColorStop(0.5, 'rgba(74, 144, 226, 0.1)');
            gradient2.addColorStop(1, 'rgba(74, 144, 226, 0)');

            window.visitorsChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Total Visitors',
                            data: totalVisitors,
                            borderColor: '#059669',
                            backgroundColor: gradient1,
                            borderWidth: 3,
                            tension: 0.4,
                            fill: true,
                            pointRadius: 0,
                            pointHoverRadius: 6,
                            pointHoverBackgroundColor: '#059669',
                            pointHoverBorderColor: '#fff',
                            pointHoverBorderWidth: 2
                        },
                        {
                            label: 'Unique Visitors',
                            data: uniqueVisitors,
                            borderColor: '#4A90E2',
                            backgroundColor: gradient2,
                            borderWidth: 3,
                            tension: 0.4,
                            fill: true,
                            pointRadius: 0,
                            pointHoverRadius: 6,
                            pointHoverBackgroundColor: '#4A90E2',
                            pointHoverBorderColor: '#fff',
                            pointHoverBorderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            align: 'end',
                            labels: {
                                usePointStyle: true,
                                pointStyle: 'circle',
                                padding: 20,
                                font: {
                                    size: 13,
                                    weight: '500',
                                    family: "'Space Grotesk', sans-serif"
                                },
                                color: '#4A4A4A'
                            }
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            titleColor: '#1A1A1A',
                            bodyColor: '#4A4A4A',
                            borderColor: '#E5E5E5',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: true,
                            boxPadding: 6,
                            usePointStyle: true,
                            titleFont: {
                                size: 14,
                                weight: '600',
                                family: "'Space Grotesk', sans-serif"
                            },
                            bodyFont: {
                                size: 13,
                                family: "'Space Grotesk', sans-serif"
                            },
                            callbacks: {
                                title: function (context) {
                                    return context[0].label;
                                },
                                label: function (context) {
                                    return ' ' + context.dataset.label + ': ' + context.parsed.y;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false,
                                drawBorder: false
                            },
                            ticks: {
                                font: {
                                    size: 12,
                                    family: "'Space Grotesk', sans-serif"
                                },
                                color: '#7A7A7A',
                                maxRotation: 0,
                                autoSkip: true,
                                maxTicksLimit: 12
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                precision: 0,
                                font: {
                                    size: 12,
                                    family: "'Space Grotesk', sans-serif"
                                },
                                color: '#7A7A7A',
                                padding: 10
                            }
                        }
                    },
                    animation: {
                        duration: 750,
                        easing: 'easeInOutQuart'
                    }
                }
            });
        } catch (error) {
            console.error('Error loading visitors chart:', error);
        }
    }

    // Tab Switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab') + 'Tab';
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Export Functionality
    document.getElementById('exportBtn')?.addEventListener('click', async () => {
        try {
            const startDate = getDateRange();
            const { data, error } = await supabase
                .from('registrations')
                .select('*')
                .gte('created_at', startDate)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                alert('No data to export');
                return;
            }

            // Convert to CSV
            const headers = ['Full Name', 'Age', 'Location', 'Phone', 'Date'];
            const csvContent = [
                headers.join(','),
                ...data.map(row => [
                    `"${row.full_name}"`,
                    row.age,
                    `"${row.location}"`,
                    `"${row.phone}"`,
                    `"${new Date(row.created_at).toLocaleString()}"`
                ].join(','))
            ].join('\n');

            // Download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `registrations_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Error exporting data');
        }
    });

    // Load registrations
    async function loadRegistrations(startDate) {
        try {
            const { data, error } = await supabase
                .from('registrations')
                .select('*')
                .gte('created_at', startDate)
                .order('created_at', { ascending: false })
                .limit(50); // Increased limit for main table

            if (error) throw error;

            // Update table
            const tbody = document.querySelector('#registrationsTable tbody');
            tbody.innerHTML = data.map(item => {
                const date = new Date(item.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
                return `
                    <tr>
                        <td><strong>${item.full_name}</strong></td>
                        <td>${item.age}</td>
                        <td>${item.location}</td>
                        <td>${item.phone}</td>
                        <td>${date}</td>
                    </tr>
                `;
            }).join('') || '<tr><td colspan="5" class="loading">No registrations yet</td></tr>';
        } catch (error) {
            console.error('Error loading registrations:', error);
            const tbody = document.querySelector('#registrationsTable tbody');
            tbody.innerHTML = '<tr><td colspan="5" class="loading">Error loading registrations</td></tr>';
        }
    }

    // Helper function to format time
    function formatTime(seconds) {
        if (seconds < 60) {
            return seconds + 's';
        }
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }

    // Initialize
    checkAuth();
})();
