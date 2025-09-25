const catalog = window.ItemData;
if (!catalog || !Array.isArray(catalog.list) || !catalog.list.length) {
    console.warn('[Items] Missing ItemData catalog; cannot render items page.');
}
else {
    const resolvedCatalog = catalog;
    const ITEMS_KEY = 'playerItems';
    const store = window.AppState || null;
    const readState = typeof window.readState === 'function'
        ? window.readState
        : () => {
            if (store) {
                if (typeof store.read === 'function')
                    return store.read();
                if (typeof store.all === 'function')
                    return store.all();
            }
            return {};
        };
    const subscribeState = typeof window.subscribeState === 'function' ? window.subscribeState : null;
    const listEl = document.getElementById('itemsList');
    if (!listEl) {
        console.warn('[Items] itemsList container not found.');
    }
    else {
        const rowEntries = resolvedCatalog.list.map((definition) => {
            const element = createRow(definition);
            listEl.appendChild(element);
            return { key: definition.key, element };
        });
        const rowKeyList = rowEntries.map((entry) => entry.key);
        const rowMap = new Map(rowEntries.map((entry) => [entry.key, entry.element]));
        function sanitizeValue(value) {
            const num = Number(value);
            if (!Number.isFinite(num) || num < 0)
                return 0;
            return Math.min(9999, Math.floor(num));
        }
        function normalizeCounts(source) {
            const normalized = {};
            const data = (source && typeof source === 'object') ? source : {};
            rowKeyList.forEach((key) => {
                const value = sanitizeValue(data[key]);
                if (value > 0)
                    normalized[key] = value;
            });
            return normalized;
        }
        function readCounts() {
            const snapshot = readState();
            console.log(snapshot);
            const raw = snapshot && typeof snapshot === 'object' ? snapshot[ITEMS_KEY] : null;
            console.log(raw);
            return normalizeCounts(raw);
        }
        let counts = readCounts();
        function applyCount(key, value) {
            const row = rowMap.get(key);
            if (!row)
                return;
            const valueEl = row.querySelector('[data-count-value]');
            if (valueEl)
                valueEl.textContent = String(value);
        }
        function syncAllRows() {
            rowKeyList.forEach((key) => {
                var _a;
                const value = (_a = counts[key]) !== null && _a !== void 0 ? _a : 0;
                applyCount(key, value);
            });
        }
        function createRow(definition) {
            const row = document.createElement('div');
            row.className = 'item-row';
            row.setAttribute('role', 'listitem');
            row.dataset.itemKey = definition.key;
            const header = document.createElement('div');
            header.className = 'item-header';
            const icon = document.createElement('img');
            icon.className = 'item-icon';
            icon.src = definition.icon;
            icon.alt = `${definition.name} icon`;
            const textWrap = document.createElement('div');
            textWrap.className = 'item-text';
            const nameSpan = document.createElement('span');
            nameSpan.className = 'item-name';
            nameSpan.textContent = definition.name;
            const descSpan = document.createElement('span');
            descSpan.className = 'item-desc';
            descSpan.textContent = definition.description;
            textWrap.appendChild(nameSpan);
            textWrap.appendChild(descSpan);
            header.appendChild(icon);
            header.appendChild(textWrap);
            const countWrap = document.createElement('div');
            countWrap.className = 'item-count';
            const labelSpan = document.createElement('span');
            labelSpan.className = 'count-label';
            labelSpan.textContent = 'Count';
            const valueSpan = document.createElement('span');
            valueSpan.className = 'count-value';
            valueSpan.setAttribute('data-count-value', '0');
            valueSpan.textContent = '0';
            countWrap.appendChild(labelSpan);
            countWrap.appendChild(valueSpan);
            row.appendChild(header);
            row.appendChild(countWrap);
            return row;
        }
        syncAllRows();
        if (subscribeState) {
            subscribeState((snapshot) => {
                const nextCounts = normalizeCounts(snapshot && snapshot[ITEMS_KEY]);
                let changed = false;
                rowKeyList.forEach((key) => {
                    var _a, _b;
                    if (((_a = counts[key]) !== null && _a !== void 0 ? _a : 0) !== ((_b = nextCounts[key]) !== null && _b !== void 0 ? _b : 0))
                        changed = true;
                });
                if (!changed)
                    return;
                counts = nextCounts;
                syncAllRows();
            });
        }
    }
    const closeBtn = document.getElementById('closeBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            window.location.href = 'rocket-select.html';
        });
    }
}
