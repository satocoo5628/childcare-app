// データストア
class EpisodeStore {
    constructor() {
        this.storageKey = 'childcare-episodes';
        this.episodes = this.loadEpisodes();
    }

    loadEpisodes() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('データの読み込みに失敗しました:', error);
            return [];
        }
    }

    saveEpisodes() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.episodes));
        } catch (error) {
            console.error('データの保存に失敗しました:', error);
            alert('データの保存に失敗しました。ストレージの容量を確認してください。');
        }
    }

    addEpisode(episode) {
        episode.id = Date.now().toString();
        this.episodes.unshift(episode);
        this.saveEpisodes();
        return episode;
    }

    getEpisodes(filters = {}) {
        let filtered = [...this.episodes];

        if (filters.category && filters.category !== 'all') {
            filtered = filtered.filter(ep => ep.category === filters.category);
        }

        if (filters.support && filters.support !== 'all') {
            filtered = filtered.filter(ep => ep.support === filters.support);
        }

        return filtered;
    }

    deleteEpisode(id) {
        this.episodes = this.episodes.filter(ep => ep.id !== id);
        this.saveEpisodes();
    }

    clearAll() {
        this.episodes = [];
        this.saveEpisodes();
    }

    exportData() {
        return JSON.stringify(this.episodes, null, 2);
    }

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (Array.isArray(data)) {
                this.episodes = data;
                this.saveEpisodes();
                return true;
            }
            return false;
        } catch (error) {
            console.error('インポートに失敗しました:', error);
            return false;
        }
    }

    getStats() {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const thisWeek = this.episodes.filter(ep => {
            const epDate = new Date(ep.date);
            return epDate >= weekAgo;
        });

        return {
            total: this.episodes.length,
            thisWeek: thisWeek.length
        };
    }
}

// アプリケーション
class ChildcareApp {
    constructor() {
        this.store = new EpisodeStore();
        this.currentView = 'home';
        this.filters = {
            category: 'all',
            support: 'all'
        };
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupForms();
        this.setupMenu();
        this.setupFilters();
        this.render();
    }

    setupNavigation() {
        // ボトムナビゲーション
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                this.navigateTo(view);
            });
        });

        // 戻るボタン
        document.getElementById('back-from-add')?.addEventListener('click', () => {
            this.navigateTo('home');
        });
    }

    navigateTo(view) {
        // ビューの切り替え
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`${view}-view`)?.classList.add('active');

        // ナビゲーションのアクティブ状態
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });

        this.currentView = view;

        // ビューごとの処理
        if (view === 'home') {
            this.renderHome();
        } else if (view === 'timeline') {
            this.renderTimeline();
        } else if (view === 'add') {
            this.resetForm();
        }
    }

    setupForms() {
        const form = document.getElementById('episode-form');
        
        // 日時の初期値を現在時刻に設定
        this.resetForm();

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    }

    resetForm() {
        const form = document.getElementById('episode-form');
        form.reset();
        
        // 現在時刻を設定
        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        document.getElementById('episode-date').value = localDateTime;
    }

    handleSubmit() {
        const formData = {
            date: document.getElementById('episode-date').value,
            location: document.getElementById('episode-location').value,
            category: document.getElementById('episode-category').value,
            support: document.querySelector('input[name="support"]:checked').value,
            content: document.getElementById('episode-content').value
        };

        this.store.addEpisode(formData);
        
        // フォームをリセットして成功メッセージ
        this.resetForm();
        this.showToast('記録を保存しました');
        
        // ホーム画面に戻る
        setTimeout(() => {
            this.navigateTo('home');
        }, 500);
    }

    setupMenu() {
        const menuBtn = document.getElementById('menu-btn');
        const menuModal = document.getElementById('menu-modal');
        const closeMenu = document.getElementById('close-menu');

        menuBtn.addEventListener('click', () => {
            menuModal.classList.add('active');
        });

        closeMenu.addEventListener('click', () => {
            menuModal.classList.remove('active');
        });

        menuModal.addEventListener('click', (e) => {
            if (e.target === menuModal) {
                menuModal.classList.remove('active');
            }
        });

        // エクスポート
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportData();
            menuModal.classList.remove('active');
        });

        // インポート
        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-file-input').click();
            menuModal.classList.remove('active');
        });

        document.getElementById('import-file-input').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        // データ削除
        document.getElementById('clear-btn').addEventListener('click', () => {
            if (confirm('すべてのデータを削除してもよろしいですか？この操作は取り消せません。')) {
                this.store.clearAll();
                this.render();
                menuModal.classList.remove('active');
                this.showToast('すべてのデータを削除しました');
            }
        });
    }

    setupFilters() {
        const filterBtn = document.getElementById('filter-btn');
        const filterPanel = document.getElementById('filter-panel');

        filterBtn.addEventListener('click', () => {
            filterPanel.classList.toggle('active');
        });

        // フィルターチップ
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const filterType = chip.dataset.filterType;
                const value = chip.dataset.value;

                // 同じタイプの他のチップを非アクティブに
                document.querySelectorAll(`[data-filter-type="${filterType}"]`).forEach(c => {
                    c.classList.remove('active');
                });

                chip.classList.add('active');
                this.filters[filterType] = value;
                this.renderTimeline();
            });
        });
    }

    render() {
        this.renderHome();
        this.renderTimeline();
    }

    renderHome() {
        // 統計情報
        const stats = this.store.getStats();
        document.getElementById('total-episodes').textContent = stats.total;
        document.getElementById('this-week-episodes').textContent = stats.thisWeek;

        // 最近の記録（最新5件）
        const recentEpisodes = this.store.getEpisodes().slice(0, 5);
        const container = document.getElementById('recent-episodes');
        
        if (recentEpisodes.length === 0) {
            container.innerHTML = this.renderEmptyState();
        } else {
            container.innerHTML = recentEpisodes.map(ep => this.renderEpisodeCard(ep)).join('');
        }
    }

    renderTimeline() {
        const episodes = this.store.getEpisodes(this.filters);
        const container = document.getElementById('timeline-episodes');
        
        if (episodes.length === 0) {
            container.innerHTML = this.renderEmptyState('フィルター条件に一致する記録がありません');
        } else {
            container.innerHTML = episodes.map(ep => this.renderEpisodeCard(ep)).join('');
        }
    }

    renderEpisodeCard(episode) {
        const date = new Date(episode.date);
        const formattedDate = this.formatDate(date);
        const supportClass = this.getSupportClass(episode.support);

        return `
            <div class="episode-card">
                <div class="episode-header">
                    <div class="episode-category">${episode.category}</div>
                    <div class="episode-date">${formattedDate}</div>
                </div>
                <div class="episode-meta">
                    <span class="episode-tag tag-location">${episode.location}</span>
                    <span class="episode-tag tag-support ${supportClass}">${episode.support}</span>
                </div>
                <div class="episode-content">${this.escapeHtml(episode.content)}</div>
            </div>
        `;
    }

    renderEmptyState(message = 'まだ記録がありません') {
        return `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 11l3 3L22 4"></path>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <p>${message}</p>
            </div>
        `;
    }

    getSupportClass(support) {
        const classMap = {
            '一人でできた': '',
            '声かけでできた': 'level-verbal',
            '手助けが必要だった': 'level-physical',
            '全面的に介助した': 'level-full'
        };
        return classMap[support] || '';
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${year}/${month}/${day} ${hours}:${minutes}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    exportData() {
        const data = this.store.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `childcare-records-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('データをエクスポートしました');
    }

    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const success = this.store.importData(e.target.result);
            if (success) {
                this.render();
                this.showToast('データをインポートしました');
            } else {
                alert('データのインポートに失敗しました。ファイル形式を確認してください。');
            }
        };
        reader.readAsText(file);
    }

    showToast(message) {
        // シンプルなトースト通知
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            z-index: 3000;
            animation: fadeIn 0.3s ease;
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

// アプリケーション起動
document.addEventListener('DOMContentLoaded', () => {
    new ChildcareApp();
});
