// Универсальный редактор пар "ключ → значение".
// value — объект { ключ: значение, ... }
// onChange — функция, принимает новый объект
export default function AttributesEditor({ value = {}, onChange }) {
  const entries = Object.entries(value);

  function updateKey(oldKey, newKey) {
    const next = {};
    for (const [k, v] of entries) {
      if (k === oldKey) next[newKey] = v;
      else next[k] = v;
    }
    onChange(next);
  }

  function updateValue(key, val) {
    onChange({ ...value, [key]: val });
  }

  function remove(key) {
    const next = { ...value };
    delete next[key];
    onChange(next);
  }

  function add() {
    const base = 'Новое поле';
    let name = base;
    let i = 1;
    while (name in value) name = `${base} ${++i}`;
    onChange({ ...value, [name]: '' });
  }

  return (
    <div>
      <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
        Дополнительные поля
      </div>

      {entries.length === 0 && (
        <p style={{ color: '#999', fontSize: 13, margin: '4px 0 8px' }}>
          Пока нет дополнительных полей.
        </p>
      )}

      {entries.map(([k, v]) => (
        <div key={k} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <input
            type="text"
            value={k}
            onChange={(e) => updateKey(k, e.target.value)}
            placeholder="Название поля"
            style={{ flex: 1, padding: 6 }}
          />
          <input
            type="text"
            value={v}
            onChange={(e) => updateValue(k, e.target.value)}
            placeholder="Значение"
            style={{ flex: 1, padding: 6 }}
          />
          <button type="button" onClick={() => remove(k)} title="Удалить поле">×</button>
        </div>
      ))}

      <button type="button" onClick={add} style={{ marginTop: 4 }}>
        + Добавить поле
      </button>
    </div>
  );
}
