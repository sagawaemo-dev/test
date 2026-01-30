/**
 * Sales Management Tool Logic - Enhanced with Edit & Delete Function
 */

// --- Data Store ---
const Store = {
    getKey: () => 'sales_data_v1',
    getAll: () => {
        const data = localStorage.getItem(Store.getKey());
        return data ? JSON.parse(data) : [];
    },
    getById: (id) => {
        const data = Store.getAll();
        return data.find(r => r.id === id);
    },
    add: (record) => {
        const data = Store.getAll();
        data.push(record);
        localStorage.setItem(Store.getKey(), JSON.stringify(data));
    },
    update: (id, updatedRecord) => {
        const data = Store.getAll();
        const index = data.findIndex(r => r.id === id);
        if (index !== -1) {
            data[index] = { ...updatedRecord, id };
            localStorage.setItem(Store.getKey(), JSON.stringify(data));
        }
    },
    // --- 削除機能の追加 ---
    remove: (id) => {
        const data = Store.getAll();
        const filteredData = data.filter(r => r.id !== id);
        localStorage.setItem(Store.getKey(), JSON.stringify(filteredData));
    },
    seed: () => {
        const demoData = [
            { id: '1', date: '2026-01-10', repName: 'Naito', client: '株式会社A', projectName: 'LP制作', amount: 300000, outsourcingCost: 50000, outsourcingBreakdown: 'デザイン費' },
            { id: '2', date: '2026-01-15', repName: 'Yokosaka', client: 'B商事', projectName: 'システム改修', amount: 1000000, outsourcingCost: 200000, outsourcingBreakdown: 'コーディング代行' },
            { id: '3', date: '2026-01-20', repName: 'Sagawa', client: 'Cクリニック', projectName: '新規サイト構築', amount: 800000, outsourcingCost: 0, outsourcingBreakdown: '' }
        ];
        localStorage.setItem(Store.getKey(), JSON.stringify(demoData));
        location.reload();
    }
};

// --- App Logic ---
const app = {
    currentPage: 'dashboard',
    editingId: null,

    init: () => {
        app.render();
    },

    navigateTo: (pageId, id = null) => {
        app.currentPage = pageId;
        app.editingId = id;
        app.updateNavState();
        app.render();
    },

    // --- 削除実行ロジック ---
    deleteRecord: (id) => {
        if (confirm('この売上データを削除してもよろしいですか？')) {
            Store.remove(id);
            app.render(); // 一覧を再描画
        }
    },

    updateNavState: () => {
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active');
            const onclick = el.getAttribute('onclick');
            if (onclick && onclick.includes(app.currentPage)) {
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
        } else if (app.currentPage === 'entry') {
            pageTitle.textContent = app.editingId ? '売上編集' : '売上登録';
            const editData = app.editingId ? Store.getById(app.editingId) : null;
            contentArea.innerHTML = UI.getEntryFormHTML(editData);
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
        const calcTotal = (records) => records.reduce((sum, r) => sum + Number(r.amount), 0);
        const calcProfit = (records) => records.reduce((sum, r) => sum + (Number(r.amount) - Number(r.outsourcingCost)), 0);

        return `
            <div class="dashboard-grid">
                <div class="card stat-card">
                    <span class="stat-title">全体総売上</span>
                    <span class="stat-value">¥${calcTotal(data).toLocaleString()}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-title">全体粗利</span>
                    <span class="stat-value" style="color: var(--success)">¥${calcProfit(data).toLocaleString()}</span>
                </div>
            </div>
            ${data.length === 0 ? '<button onclick="Store.seed()" class="btn btn-primary">デモデータを生成</button>' : ''}
        `;
    },

    getEntryFormHTML: (data = null) => {
        const isEdit = !!data;
        return `
            <div class="card" style="max-width: 800px; margin: 0 auto;">
                <form id="salesForm">
                    <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr;">
                        <div class="form-group">
                            <label class="form-label">担当者</label>
                            <select name="repName" class="form-select" required>
                                <option value="Naito" ${data?.repName === 'Naito' ? 'selected' : ''}>内藤</option>
                                <option value="Yokosaka" ${data?.repName === 'Yokosaka' ? 'selected' : ''}>横坂</option>
                                <option value="Sagawa" ${data?.repName === 'Sagawa' ? 'selected' : ''}>佐川</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">売上日</label>
                            <input type="date" name="date" class="form-input" required value="${data?.date || ''}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">クライアント名</label>
                        <input type="text" name="client" class="form-input" required value="${data?.client || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">案件名</label>
                        <input type="text" name="projectName" class="form-input" required value="${data?.projectName || ''}">
                    </div>
                    <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr;">
                        <div class="form-group">
                            <label class="form-label">売上金額 (税抜)</label>
                            <input type="number" name="amount" id="inputAmount" class="form-input" required value="${data?.amount || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">外注費</label>
                            <input type="number" name="outsourcingCost" id="inputCost" class="form-input" value="${data?.outsourcingCost || 0}">
                        </div>
                    </div>
                    <div style="margin-top: 2rem; text-align: right;">
                        <button type="submit" class="btn btn-primary">${isEdit ? '更新する' : '登録する'}</button>
                    </div>
                </form>
            </div>
        `;
    },

    attachFormListeners: () => {
        const form = document.getElementById('salesForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const record = {
                repName: formData.get('repName'),
                date: formData.get('date'),
                client: formData.get('client'),
                projectName: formData.get('projectName'),
                amount: Number(formData.get('amount')),
                outsourcingCost: Number(formData.get('outsourcingCost'))
            };

            if (app.editingId) {
                Store.update(app.editingId, record);
            } else {
                record.id = Date.now().toString();
                Store.add(record);
            }
            app.navigateTo('list');
        });
    },

    getListHTML: () => {
        const data = Store.getAll().reverse();
        const rows = data.map(r => `
            <tr>
                <td>${r.date}</td>
                <td>${r.repName === 'Naito' ? '内藤' : r.repName === 'Yokosaka' ? '横坂' : '佐川'}</td>
                <td>${r.client}</td>
                <td>${r.projectName}</td>
                <td style="text-align: right;">¥${Number(r.amount).toLocaleString()}</td>
                <td style="text-align: center;">
                    <div style="display: flex; gap: 0.5rem; justify-content: center;">
                        <button class="btn" style="padding: 0.25rem 0.5rem; background: #e2e8f0; font-size: 0.8rem;" onclick="app.navigateTo('entry', '${r.id}')">
                            編集
                        </button>
                        <button class="btn" style="padding: 0.25rem 0.5rem; background: #fee2e2; color: #dc2626; font-size: 0.8rem;" onclick="app.deleteRecord('${r.id}')">
                            削除
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        return `
            <div class="card">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid #e2e8f0; text-align: left;">
                            <th>日付</th><th>担当</th><th>顧客</th><th>案件</th><th style="text-align: right;">売上</th><th style="text-align: center;">操作</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }
};

document.addEventListener('DOMContentLoaded', app.init);
