function GET_LAST_ID(col, table, add = 1) {
  return `(SELECT COALESCE(MAX(${col}), 0) + ${add} AS new_id FROM ${table})`;
}

module.exports = GET_LAST_ID;
