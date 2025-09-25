type CatalogData = NonNullable<Window['ItemData']>;
type CatalogItem = CatalogData['list'][number];
type CatalogKey = CatalogItem['key'];

const catalog = window.ItemData;

if (!catalog || !Array.isArray(catalog.list) || !catalog.list.length) {
  console.warn('[Items] Missing ItemData catalog; cannot render items page.');
} else {
  const resolvedCatalog: CatalogData = catalog;
  const ITEMS_KEY = 'playerItems';
  const store: any = (window as any).AppState || null;

  const readState: () => any = typeof (window as any).readState === 'function'
    ? (window as any).readState
    : () => {
        if (store) {
          if (typeof store.read === 'function') return store.read();
          if (typeof store.all === 'function') return store.all();
        }
        return {};
      };

  const subscribeState: ((fn: (snapshot: any) => void) => void) | null =
    typeof (window as any).subscribeState === 'function' ? (window as any).subscribeState : null;

  const listEl = document.getElementById('itemsList');
  if (!listEl) {
    console.warn('[Items] itemsList container not found.');
  } else {
    const rowEntries = resolvedCatalog.list.map((definition) => {
      const element = createRow(definition);
      listEl.appendChild(element);
      return { key: definition.key, element };
    });

    const rowKeyList: CatalogKey[] = rowEntries.map((entry) => entry.key);
    const rowMap = new Map<CatalogKey, HTMLElement>(rowEntries.map((entry) => [entry.key, entry.element] as const));

    function sanitizeValue(value: unknown): number {
      const num = Number(value);
      if (!Number.isFinite(num) || num < 0) return 0;
      return Math.min(9999, Math.floor(num));
    }

    function normalizeCounts(source: unknown): Partial<Record<CatalogKey, number>> {
      const normalized: Partial<Record<CatalogKey, number>> = {};
      const data = (source && typeof source === 'object') ? (source as Record<CatalogKey, unknown>) : {};
      rowKeyList.forEach((key) => {
        const value = sanitizeValue(data[key]);
        if (value > 0) normalized[key] = value;
      });
      return normalized;
    }

    function readCounts(): Partial<Record<CatalogKey, number>> {
      const snapshot = readState();
      const raw = snapshot && typeof snapshot === 'object' ? snapshot[ITEMS_KEY] : null;
      return normalizeCounts(raw);
    }

    let counts = readCounts();

    function applyCount(key: CatalogKey, value: number): void {
      const row = rowMap.get(key);
      if (!row) return;
      const valueEl = row.querySelector<HTMLElement>('[data-count-value]');
      if (valueEl) valueEl.textContent = String(value);
    }

    function syncAllRows(): void {
      rowKeyList.forEach((key) => {
        const value = counts[key] ?? 0;
        applyCount(key, value);
      });
    }

    function createRow(definition: CatalogItem): HTMLElement {
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
          if ((counts[key] ?? 0) !== (nextCounts[key] ?? 0)) changed = true;
        });
        if (!changed) return;
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
