export const nameKey = (name) => String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();

export const DUP_NAME_MSG = 'Name already used — try a different name.';

export const isDuplicateName = (name, users = [], excludeId) => {
    const key = nameKey(name);
    if (!key) return false;
    return users.some(u => {
        const id = u.id || u._id;
        if (excludeId && id === excludeId) return false;
        return nameKey(u.name) === key;
    });
};
