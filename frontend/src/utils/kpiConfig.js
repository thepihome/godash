/**
 * Normalize KPI query_config from DB (string or object) to a plain object.
 */
export function parseQueryConfig(queryConfig) {
  if (!queryConfig) return null;
  if (typeof queryConfig === 'object') return queryConfig;
  if (typeof queryConfig === 'string') {
    try {
      let parsed = JSON.parse(queryConfig);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      return typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function stringifyQueryConfig(queryConfig) {
  if (!queryConfig) return null;
  if (typeof queryConfig === 'string') return queryConfig;
  return JSON.stringify(queryConfig);
}
