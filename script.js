/**
 * Sales Management Tool - Complete Integrated Version (With Edit/Delete)
 */

// --- Data Store ---
const Store = {
    getKey: () => 'sales_data_v1',
    getAll: () => {
        const data = localStorage.getItem(Store.getKey());
        return data ? JSON.parse(data) : [];
    },
    getById: (id) => Store.getAll().find(r => r.id === id),
    add: (record) => {
        const data = Store.getAll();
        data.push(record);
        localStorage.setItem(Store.getKey(), JSON.stringify(data));
    },
    update: (id, updatedRecord) => {
        const data = Store.getAll();
        const index = data.findIndex(r => r.id === id);
        if (index !== -1) {
            data[index] = { ...updatedRecord, id }; // IDを維持
            localStorage.setItem(Store.getKey(), JSON.stringify(data));
        }
    },
    remove: (id) => {
        const data = Store.getAll().filter(r => r.id !== id);
        localStorage.setItem(Store.getKey(), JSON.stringify(data));
    },
    seed: () => {
        const demoData = [
            { id: '1', date: '2026-01-10', repName: 'Naito', client: '株式会社A', invoiceNumber: 'INV-001', projectName: 'LP制作', amount: 300000, contractorName: 'デザイン工房', outsourcingCost: 50000, outsourcingBreakdown: 'デザイン費' },
            { id: '2', date: '2026-01-15', repName: 'Yokosaka', client: 'B商事', invoiceNumber: 'INV-002', projectName: 'システム改修', amount: 1000000, contractorName: 'Code-X', outsourcingCost: 200000, outsourcingBreakdown: 'コーディング' }
        ];
        localStorage.setItem(Store.getKey(), JSON.stringify(demoData));
        location.reload();
    }
};

// --- App Logic ---
const app = {
    currentPage: 'dashboard',
    editingId: null,

    init: () => app.render(),

    navigateTo: (pageId, id = null) => {
        app.currentPage = pageId;
        app.editingId = id; // IDがある場合は編集モード
        app.updateNavState();
        app.render();
    },

    deleteRecord: (id) => {
        if (confirm('この売上データを削除してもよろしいですか？')) {
            Store.remove(id);
            app.render(); // 再描画
        }
    },

    updateNavState: () => {
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active');
            if (el.getAttribute('onclick').includes(app.currentPage)) el.classList.add('active');
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
            contentArea.innerHTML = UI.getEntryFormHTML(app.editingId ? Store.getById(app.editingId) : null);
            UI.attachFormListeners();
        } else if (app.currentPage === 'list') {
            pageTitle.textContent = '売上一覧';
            contentArea.innerHTML = UI.getListHTML();
        }
        lucide.createIcons(); // アイコンを反映
    }
};

// --- UI Components ---
const UI = {
    getDashboardHTML: () => {
        const data = Store.getAll();
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        const calcTotal = (recs) => recs.reduce((s, r) => s + Number(r.amount), 0);
        const calcProfit = (recs) => recs.reduce((s, r) => s + (Number(r.amount) - Number(r.outsourcingCost)), 0);

        const reps = ['Naito', 'Yokosaka', 'Sagawa'];
        const repStats = reps.map(rep => {
            const repData = data.filter(r => r.repName === rep);
            const monthly = repData.filter(r => {
                const d = new Date(r.date);
                return d.getFullYear() === currentYear && (d.getMonth() + 1) === currentMonth;
            });
            const yearly = repData.filter(r => new Date(r.date).getFullYear() === currentYear);
            return {
                name: rep === 'Naito' ? '内藤' : rep === 'Yokosaka' ? '横坂' : '佐川',
                mSales: calcTotal(monthly), mProfit: calcProfit(monthly),
                ySales: calcTotal(yearly), yProfit: calcProfit(yearly)
            };
        });

        return `
            <div class="dashboard-grid">
                <div class="card stat-card"><span class="stat-title">全体総売上</span><span class="stat-value">¥${calcTotal(data).toLocaleString()}</span></div>
                <div class="card stat-card"><span class="stat-title">全体総粗利</span><span class="stat-value" style="color:var(--success)">¥${calcProfit(data).toLocaleString()}</span></div>
            </div>
            <h3 style="margin-bottom:1rem;">担当者別レポート (${currentYear}年${currentMonth}月 / 年間)</h3>
            <div class="dashboard-grid">
                ${repStats.map(s => `
                    <div class="card rep-card">
                        <h4 style="border-bottom:1px solid #eee; padding-bottom:0.5rem; margin-bottom:1rem;">${s.name}</h4>
                        <div style="margin-bottom:1rem;">
                            <div class="stat-title">月間売上: ¥${s.mSales.toLocaleString()}</div>
                            <div class="stat-title">月間粗利: ¥${s.mProfit.toLocaleString()}</div>
                        </div>
                        <div>
                            <div class="stat-title">年間売上: ¥${s.ySales.toLocaleString()}</div>
                            <div class="stat-title">年間粗利: ¥${s.yProfit.toLocaleString()}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            ${data.length === 0 ? '<button onclick="Store.seed()" class="btn btn-primary">デモデータを生成</button>' : ''}
        `;
    },

    getEntryFormHTML: (data = null) => {
        return `
            <div class="card" style="max-width: 800px; margin: 0 auto;">
                <form id="salesForm">
                    <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr;">
                        <div class="form-group"><label class="form-label">担当者</label>
                            <select name="repName" class="form-select" required>
                                <option value="Naito" ${data?.repName === 'Naito' ? 'selected' : ''}>内藤</option>
                                <option value="Yokosaka" ${data?.repName === 'Yokosaka' ? 'selected' : ''}>横坂</option>
                                <option value="Sagawa" ${data?.repName === 'Sagawa' ? 'selected' : ''}>佐川</option>
                            </select>
                        </div>
                        <div class="form-group"><label class="form-label">売上日</label>
                            <input type="date" name="date" class="form-input" required value="${data?.date || ''}">
                        </div>
                    </div>
                    <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr;">
                        <div class="form-group"><label class="form-label">クライアント名</label>
                            <input type="text" name="client" class="form-input" required value="${data?.client || ''}">
                        </div>
                        <div class="form-group"><label class="form-label">請求書番号</label>
                            <input type="text" name="invoiceNumber" class="form-input" value="${data?.invoiceNumber || ''}">
                        </div>
                    </div>
                    <div class="form-group"><label class="form-label">案件名</label>
                        <input type="text" name="projectName" class="form-input" required value="${data?.projectName || ''}">
                    </div>
                    <div class="form-group"><label class="form-label">売上金額 (税抜)</label>
                        <input type="number" name="amount" id="inputAmount" class="form-input" required value="${data?.amount || ''}">
                    </div>
                    <hr style="border:0; border-top:1px solid #eee; margin:2rem 0;">
                    <h4 style="margin-bottom:1rem;">外注費情報</h4>
                    <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr;">
                        <div class="form-group"><label class="form-label">外注先</label>
                            <input type="text" name="contractorName" class="form-input" value="${data?.contractorName || ''}">
                        </div>
                        <div class="form-group"><label class="form-label">外注費</label>
                            <input type="number" name="outsourcingCost" id="inputCost" class="form-input" value="${data?.outsourcingCost || 0}">
                        </div>
                    </div>
                    <div class="form-group"><label class="form-label">外注費内訳</label>
                        <textarea name="outsourcingBreakdown" class="form-input" rows="2">${data?.outsourcingBreakdown || ''}</textarea>
                    </div>
                    <div style="background: #f1f5f9; padding: 1.5rem; border-radius: 0.5rem; margin-top: 1.5rem;">
                        <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr; margin-bottom:0;">
                            <div><div class="stat-title">予想粗利</div><div class="stat-value" id="previewProfit" style="font-size:1.5rem;">¥0</div></div>
                            <div><div class="stat-title">外注費率</div><div class="stat-value" id="previewRatio" style="font-size:1.5rem;">0%</div></div>
                        </div>
                    </div>
                    <div style="margin-top: 2rem; text-align: right;">
                        <button type="submit" class="btn btn-primary">${data ? '更新する' : '登録する'}</button>
                    </div>
                </form>
            </div>
        `;
    },

    attachFormListeners: () => {
        const form = document.getElementById('salesForm');
        const inputAmt = document.getElementById('inputAmount');
        const inputCost = document.getElementById('inputCost');
        const updatePreview = () => {
            const amt = Number(inputAmt.value) || 0;
            const cost = Number(inputCost.value) || 0;
            const profit = amt - cost;
            const ratio = amt > 0 ? ((cost / amt) * 100).toFixed(1) : 0;
            document.getElementById('previewProfit').textContent = `¥${profit.toLocaleString()}`;
            document.getElementById('previewRatio').textContent = `${ratio}%`;
        };
        inputAmt.addEventListener('input', updatePreview);
        inputCost.addEventListener('input', updatePreview);
        updatePreview();
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const fd = new FormData(form);
            const record = {
                repName: fd.get('repName'), date: fd.get('date'), client: fd.get('client'),
                invoiceNumber: fd.get('invoiceNumber'), projectName: fd.get('projectName'),
                amount: Number(fd.get('amount')), contractorName: fd.get('contractorName'),
                outsourcingCost: Number(fd.get('outsourcingCost')), outsourcingBreakdown: fd.get('outsourcingBreakdown')
            };
            if (app.editingId) Store.update(app.editingId, record);
            else { record.id = Date.now().toString(); Store.add(record); }
            app.navigateTo('list');
        });
    },

    getListHTML: () => {
        const data = Store.getAll().reverse();
        if (data.length === 0) return '<div class="card">データがありません。</div>';
        
        const rows = data.map(r => `
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 1rem;">${r.date}</td>
                <td style="padding: 1rem;">${r.repName === 'Naito' ? '内藤' : r.repName === 'Yokosaka' ? '横坂' : '佐川'}<br><small style="color:#64748b">${r.invoiceNumber || '-'}</small></td>
                <td style="padding: 1rem;">${r.client}</td>
                <td style="padding: 1rem;">${r.projectName}</td>
                <td style="padding: 1rem; text-align: right;">¥${Number(r.amount).toLocaleString()}</td>
                <td style="padding: 1rem; text-align: center;">
                    <div style="display: flex; gap: 0.5rem; justify-content: center;">
                        <button class="btn" style="padding: 0.4rem 0.8rem; background: #e2e8f0; color: #1e293b; font-size: 0.8rem;" onclick="app.navigateTo('entry', '${r.id}')">
                             編集
                        </button>
                        <button class="btn" style="padding: 0.4rem 0.8rem; background: #fee2e2; color: #dc2626; font-size: 0.8rem;" onclick="app.deleteRecord('${r.id}')">
                             削除
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        return `
            <div class="card" style="padding: 0; overflow: hidden;">
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
                        <thead>
                            <tr style="background: #f8fafc; text-align: left; border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 1rem;">日付</th>
                                <th style="padding: 1rem;">担当 / 請求番号</th>
                                <th style="padding: 1rem;">クライアント</th>
                                <th style="padding: 1rem;">案件名</th>
                                <th style="padding: 1rem; text-align: right;">売上金額</th>
                                <th style="padding: 1rem; text-align: center;">操作</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
        `;
    }
};

document.addEventListener('DOMContentLoaded', app.init);
