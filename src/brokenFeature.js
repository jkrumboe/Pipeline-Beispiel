// Intentionally broken function for demo purposes
function willAlwaysFail(value) {
  // supposed to return true for truthy values, but has a bug
  if (value === true) return true;
  return false;
}

module.exports = { willAlwaysFail };
