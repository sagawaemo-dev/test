/**
 * Sales Management Tool Logic
 */

// --- Data Store ---
const Store = {
    getKey: () => 'sales_data_v1',
    getAll: () => {
        const data = localStorage.getItem(Store.getKey());
        return data ? JSON.parse(data) : [];
    },
    add: (record) => {
        const data = Store.getAll();
        data.push(record);
        localStorage.setItem(Store.getKey(), JSON.stringify(data));
    },
    // Mock Data Generator for verification
    seed: () => {
        const demoData = [
            { id: '1', date: '2026-01-10', repName: 'Naito', client: '株式会社A', projectName: 'LP制作', amount: 300000, outsourcingCost: 50000, outsourcingBreakdown: 'デザイン費' },
            { id: '2', date: '2026-01-15', repName: 'Yokosaka', client: 'B商事', projectName: 'システム改修', amount: 1000000, outsourcingCost: 200000, outsourcingBreakdown: 'コーディング代行' },
            { id: '3', date: '2026-01-20', repName: 'Sagawa', client: 'Cクリニック', projectName: '新規サイト構築', amount: 800000, outsourcingCost: 0, outsourcingBreakdown: '' },
            { id: '4', date: '2026-02-05', repName: 'Naito', client: 'D商店', projectName: '保守運用', amount: 50000, outsourcingCost: 0, outsourcingBreakdown: '' },
            { id: '5', date: '2026-02-12', repName: 'Sagawa', client: 'Eテック', projectName: 'アプリ開発', amount: 2500000, outsourcingCost: 1500000, outsourcingBreakdown: '開発委託' }
        ];
        localStorage.setItem(Store.getKey(), JSON.stringify(demoData));
        location.reload();
    }
};

// --- App Logic ---
const app = {
    currentPage: 'dashboard',

    init: () => {
        app.render();
    },

    navigateTo: (pageId) => {
        app.currentPage = pageId;
        app.updateNavState();
        app.render();
    },

    updateNavState: () => {
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active');
            // Simple check: looking for onclick containing the pageId
            if (el.getAttribute('onclick').includes(app.currentPage)) {
                el.classList.add('active');
            }
        });
    },

    render: () => {
        const contentArea = document.getElementById('content-area');
        const pageTitle = document.getElementById('page-title');

        if (app.currentPage === 'dashboard') {
            pageTitle.textContent = 'ダッシュボード';
            contentArea.innerHTML = UI.getDashboardHTML();
            UI.renderCharts(); // Render any charts after HTML insertion
        } else if (app.currentPage === 'entry') {
            pageTitle.textContent = '売上登録';
            contentArea.innerHTML = UI.getEntryFormHTML();
            UI.attachFormListeners();
        } else if (app.currentPage === 'list') {
            pageTitle.textContent = '売上一覧';
            contentArea.innerHTML = UI.getListHTML();
        }

        lucide.createIcons();
    }
};

// --- UI Components ---
const UI = {
    getDashboardHTML: () => {
        const data = Store.getAll();

        // --- Aggregation Logic ---
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1; // 1-12

        // Helper: Filter by date range
        const filterByMonth = (r, y, m) => {
            const d = new Date(r.date);
            return d.getFullYear() === y && (d.getMonth() + 1) === m;
        };
        const filterByYear = (r, y) => {
            const d = new Date(r.date);
            return d.getFullYear() === y;
        };

        // Calculations
        const calcTotal = (records) => records.reduce((sum, r) => sum + Number(r.amount), 0);
        const calcProfit = (records) => records.reduce((sum, r) => sum + (Number(r.amount) - Number(r.outsourcingCost)), 0);

        // Overall Totals
        const totalSales = calcTotal(data);
        const totalProfit = calcProfit(data);

        // Per Rep Stats (Monthly & Yearly)
        const reps = ['Naito', 'Yokosaka', 'Sagawa'];
        const repStats = reps.map(rep => {
            const repData = data.filter(r => r.repName === rep);
            const monthlyData = repData.filter(r => filterByMonth(r, currentYear, currentMonth));
            const yearlyData = repData.filter(r => filterByYear(r, currentYear));

            return {
                name: rep === 'Naito' ? '内藤' : rep === 'Yokosaka' ? '横坂' : '佐川',
                monthlySales: calcTotal(monthlyData),
                monthlyProfit: calcProfit(monthlyData),
                yearlySales: calcTotal(yearlyData),
                yearlyProfit: calcProfit(yearlyData)
            };
        });

        // 3-Person Total Aggregation
        const threeRepTotalSales = repStats.reduce((sum, s) => sum + s.yearlySales, 0);

        // HTML Generation
        return `
            <div class="dashboard-grid">
                <div class="card stat-card">
                    <span class="stat-title">全体総売上</span>
                    <span class="stat-value">¥${totalSales.toLocaleString()}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-title">全体粗利</span>
                    <span class="stat-value" style="color: var(--success)">¥${totalProfit.toLocaleString()}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-title">3名合計売上 (全期間)</span>
                    <span class="stat-value">¥${threeRepTotalSales.toLocaleString()}</span>
                </div>
            </div>

            ${data.length === 0 ? `
                <div class="card" style="text-align: center; padding: 3rem;">
                    <p style="margin-bottom: 1rem; color: var(--text-muted);">データがまだありません。</p>
                    <button onclick="Store.seed()" class="btn btn-primary">デモデータを生成する</button>
                </div>
            ` : ''}

            <h3 style="margin-bottom: 1rem; font-size: 1.1rem;">担当者別レポート (${currentYear}年${currentMonth}月 / 年間)</h3>
            <div class="dashboard-grid">
                ${repStats.map(stat => `
                    <div class="card rep-card">
                        <h4 style="margin-bottom: 1rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem;">${stat.name}</h4>
                        
                        <div style="margin-bottom: 1rem;">
                            <div class="stat-title" style="font-size: 0.8rem;">月間売上</div>
                            <div class="stat-value" style="font-size: 1.25rem;">¥${stat.monthlySales.toLocaleString()}</div>
                            <div class="stat-title" style="font-size: 0.8rem; margin-top: 0.25rem;">粗利: ¥${stat.monthlyProfit.toLocaleString()}</div>
                        </div>

                        <div>
                            <div class="stat-title" style="font-size: 0.8rem;">年間売上</div>
                            <div class="stat-value" style="font-size: 1.25rem;">¥${stat.yearlySales.toLocaleString()}</div>
                            <div class="stat-title" style="font-size: 0.8rem; margin-top: 0.25rem;">粗利: ¥${stat.yearlyProfit.toLocaleString()}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="card">
                <h3>データ推移 (Mock)</h3>
                <div style="height: 200px; display: flex; align-items: center; justify-content: center; background: #f8fafc; border-radius: 8px; margin-top: 1rem; color: #94a3b8;">
                    グラフエリア (Chart.jsなどで実装可能)
                </div>
            </div>
        `;
    },

    renderCharts: () => {
        // Placeholder for Chart.js or custom chart I/O
    },

    getEntryFormHTML: () => {
        return `
            <div class="card" style="max-width: 800px; margin: 0 auto;">
                <form id="salesForm">
                    <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr;">
                        <div class="form-group">
                            <label class="form-label">担当者</label>
                            <select name="repName" class="form-select" required>
                                <option value="" disabled selected>選択してください</option>
                                <option value="Naito">内藤</option>
                                <option value="Yokosaka">横坂</option>
                                <option value="Sagawa">佐川</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">売上日</label>
                            <input type="date" name="date" class="form-input" required>
                        </div>
                    </div>

                    <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr;">
                        <div class="form-group">
                            <label class="form-label">クライアント名</label>
                            <input type="text" name="client" class="form-input" required placeholder="例: 株式会社〇〇">
                        </div>
                        <div class="form-group">
                            <label class="form-label">請求書番号</label>
                            <input type="text" name="invoiceNumber" class="form-input" placeholder="INV-001">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">案件名</label>
                        <input type="text" name="projectName" class="form-input" required placeholder="例: 〇〇様 Webサイト制作">
                    </div>

                    <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr;">
                        <div class="form-group">
                            <label class="form-label">売上金額 (税抜)</label>
                            <input type="number" name="amount" id="inputAmount" class="form-input" required min="0">
                        </div>
                    </div>

                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 2rem 0;">
                    <h4 style="margin-bottom: 1rem;">外注費情報</h4>

                    <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr;">
                         <div class="form-group">
                            <label class="form-label">外注先</label>
                            <input type="text" name="contractorName" class="form-input" placeholder="ない場合は空欄">
                        </div>
                        <div class="form-group">
                            <label class="form-label">外注費</label>
                            <input type="number" name="outsourcingCost" id="inputCost" class="form-input" value="0" min="0">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">外注費内訳</label>
                        <textarea name="outsourcingBreakdown" class="form-input" rows="2"></textarea>
                    </div>

                    <!-- Auto Calculation Preview -->
                    <div style="background: #f1f5f9; padding: 1.5rem; border-radius: 0.5rem; margin-top: 1.5rem;">
                        <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 0;">
                            <div>
                                <div class="stat-title">粗利</div>
                                <div class="stat-value" id="previewProfit">¥0</div>
                            </div>
                            <div>
                                <div class="stat-title">外注費率</div>
                                <div class="stat-value" id="previewRatio">0%</div>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 2rem; text-align: right;">
                        <button type="submit" class="btn btn-primary" style="padding: 0.75rem 2rem;">登録する</button>
                    </div>
                </form>
            </div>
        `;
    },

    attachFormListeners: () => {
        const form = document.getElementById('salesForm');
        const inputAmount = document.getElementById('inputAmount');
        const inputCost = document.getElementById('inputCost');
        const previewProfit = document.getElementById('previewProfit');
        const previewRatio = document.getElementById('previewRatio');

        const updatePreview = () => {
            const amount = Number(inputAmount.value) || 0;
            const cost = Number(inputCost.value) || 0;
            const profit = amount - cost;
            const ratio = amount > 0 ? ((cost / amount) * 100).toFixed(1) : 0;

            previewProfit.textContent = `¥${profit.toLocaleString()}`;
            previewRatio.textContent = `${ratio}%`;

            if (amount > 0 && profit < 0) previewProfit.style.color = 'var(--danger)';
            else previewProfit.style.color = 'var(--text-main)';
        };

        inputAmount.addEventListener('input', updatePreview);
        inputCost.addEventListener('input', updatePreview);

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const record = {
                id: Date.now().toString(),
                repName: formData.get('repName'),
                date: formData.get('date'),
                client: formData.get('client'),
                invoiceNumber: formData.get('invoiceNumber'),
                projectName: formData.get('projectName'),
                amount: Number(formData.get('amount')),
                contractorName: formData.get('contractorName'),
                outsourcingCost: Number(formData.get('outsourcingCost')),
                outsourcingBreakdown: formData.get('outsourcingBreakdown')
            };

            Store.add(record);
            alert('登録しました');
            app.navigateTo('dashboard');
        });
    },

    getListHTML: () => {
        const data = Store.getAll().reverse(); // Newest first

        if (data.length === 0) {
            return `<div class="card"><p>データがありません。</p></div>`;
        }

        const rows = data.map(r => `
            <tr>
                <td>${r.date}</td>
                <td>${r.repName === 'Naito' ? '内藤' : r.repName === 'Yokosaka' ? '横坂' : '佐川'}</td>
                <td>${r.client}</td>
                <td>${r.projectName}</td>
                <td style="text-align: right;">¥${Number(r.amount).toLocaleString()}</td>
                <td style="text-align: right;">¥${(Number(r.amount) - Number(r.outsourcingCost)).toLocaleString()}</td>
            </tr>
        `).join('');

        return `
            <div class="card">
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; min-width: 600px;">
                        <thead>
                            <tr style="text-align: left; border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 1rem;">日付</th>
                                <th style="padding: 1rem;">担当</th>
                                <th style="padding: 1rem;">クライアント</th>
                                <th style="padding: 1rem;">案件名</th>
                                <th style="padding: 1rem; text-align: right;">売上</th>
                                <th style="padding: 1rem; text-align: right;">粗利</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', app.init);
