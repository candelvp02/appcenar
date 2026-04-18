export default {
  eq: (a, b) => a === b,
  neq: (a, b) => a !== b,
  formatDate: (date) => new Date(date).toLocaleString(),
  statusLabel: (status) => {
    if (status === 'pending') return 'Pendiente';
    if (status === 'in_progress') return 'En proceso';
    return 'Completado';
  },
  statusClass: (status) => {
    if (status === 'pending') return 'warning';
    if (status === 'in_progress') return 'info';
    return 'success';
  },
  ifCond: (v1, op, v2, options) => {
    if (op === '===') return v1 === v2 ? options.fn(this) : options.inverse(this);
    if (op === '!==') return v1 !== v2 ? options.fn(this) : options.inverse(this);
    return options.inverse(this);
  },
  multiply: (a, b) => a * b,
  sum: (a, b) => a + b
};