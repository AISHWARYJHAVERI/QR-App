// Name matching rules:
// - capitals, spaces, dots and symbols are ignored ("Aish wary." = "Aishwary")
// - swapped word order matches ("Jhaveri Aishwary" = "Aishwary Jhaveri")
// - letters must be exact ("Rahil" != "Rahul", "Aishwarya" != "Aishwary")
// - a trailing number is a family member number ("Rahul 02" = "Rahul 2", "Rahul 3" != "Rahul 2")

export const parseName = (name) => {
    const words = String(name || '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]+/gu, '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    let num = null;
    if (words.length) {
        const last = words[words.length - 1];
        const m = last.match(/^(\D*)(\d+)$/);
        if (m && (m[1] || words.length > 1)) {
            num = parseInt(m[2], 10);
            if (m[1]) words[words.length - 1] = m[1];
            else words.pop();
        }
    }
    return {
        compact: words.join(''),
        sorted: [...words].sort().join(' '),
        num
    };
};

const sameBase = (a, b) => !!a.compact && (a.compact === b.compact || a.sorted === b.sorted);

export const sameName = (a, b) => {
    const pa = parseName(a);
    const pb = parseName(b);
    return pa.num === pb.num && sameBase(pa, pb);
};

export const nameKey = (name) => {
    const p = parseName(name);
    return p.compact ? `${p.sorted}#${p.num ?? ''}` : '';
};

export const DUP_NAME_MSG = 'Name already used — add a middle name or something different.';

export const findDuplicateName = (name, users = [], excludeId) => {
    const p = parseName(name);
    if (!p.compact) return null;
    return users.find(u => {
        const id = u.id || u._id;
        if (excludeId && id === excludeId) return false;
        const q = parseName(u.name);
        return q.num === p.num && sameBase(p, q);
    }) || null;
};

export const isDuplicateName = (name, users = [], excludeId) => !!findDuplicateName(name, users, excludeId);

// Next free family number for a base name, or 0 if no family exists yet.
export const nextFamilyNumber = (baseName, users = []) => {
    const p = parseName(baseName);
    if (!p.compact) return 0;
    let found = false;
    let max = 0;
    users.forEach(u => {
        const q = parseName(u.name);
        if (!sameBase(p, q)) return;
        found = true;
        if (q.num !== null && q.num > max) max = q.num;
    });
    return found ? max + 1 : 0;
};

export const phoneKey = (phone) => String(phone || '').replace(/\D/g, '').slice(-10);

export const findPhoneOwner = (phone, users = [], excludeId) => {
    const key = phoneKey(phone);
    if (key.length < 6) return null;
    return users.find(u => {
        const id = u.id || u._id;
        if (excludeId && id === excludeId) return false;
        return phoneKey(u.phone) === key;
    }) || null;
};
