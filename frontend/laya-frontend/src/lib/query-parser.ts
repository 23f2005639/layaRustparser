import { RecordsQueryParams } from "./types";

export interface ParsedQueryResult {
  isValid: boolean;
  error?: string;
  params: RecordsQueryParams;
}

const UNSUPPORTED_KEYWORDS = [
  "GROUP BY",
  "ORDER BY",
  "JOIN",
  "LEFT JOIN",
  "RIGHT JOIN",
  "INNER JOIN",
  "HAVING",
  "UNION",
  "SUM(",
  "AVG(",
  "COUNT(",
  "MIN(",
  "MAX(",
  "INSERT",
  "UPDATE",
  "DELETE",
  "DROP",
  "ALTER",
  "CREATE",
];

/**
 * Parses an investigation SQL query into backend request parameters.
 * Validates that only supported filters are present.
 */
export function parseSqlQuery(rawQuery: string): ParsedQueryResult {
  const trimmed = rawQuery.trim();
  if (!trimmed) {
    return {
      isValid: true,
      params: {},
    };
  }

  // Check for unsupported SQL operations
  const upper = trimmed.toUpperCase();
  for (const kw of UNSUPPORTED_KEYWORDS) {
    if (upper.includes(kw)) {
      return {
        isValid: false,
        error: `Unsupported query: The backend contract does not support '${kw}' operations. Supported filters are: vendor, disposition, ip, and query.`,
        params: {},
      };
    }
  }

  // Must start with SELECT * FROM records (case insensitive)
  const baseMatch = trimmed.match(/^SELECT\s+\*\s+FROM\s+records(?:\s+WHERE\s+(.+))?$/i);
  if (!baseMatch) {
    // If user typed a bare word or search phrase, we can treat it as a general search query
    // or validate as unsupported SQL
    if (!trimmed.toUpperCase().startsWith("SELECT")) {
      return {
        isValid: false,
        error:
          "Unsupported query syntax: Queries must follow the format 'SELECT * FROM records WHERE <field> = <value>'",
        params: {},
      };
    }

    return {
      isValid: false,
      error:
        "Unsupported query structure: Only 'SELECT * FROM records' is supported by the Parquet investigation engine.",
      params: {},
    };
  }

  const whereClause = baseMatch[1];
  if (!whereClause || !whereClause.trim()) {
    return {
      isValid: true,
      params: {},
    };
  }

  // Parse conditions joined by AND
  const conditionStrings = whereClause.split(/\s+AND\s+/i);
  const params: RecordsQueryParams = {};

  for (const condStr of conditionStrings) {
    const cleanCond = condStr.trim();
    if (!cleanCond) continue;

    // Match: field = 'value' or field = "value" or field = value
    const match = cleanCond.match(/^([a-zA-Z0-9_]+)\s*=\s*(?:'([^']*)'|"([^"]*)"|([^\s]+))$/);
    if (!match) {
      return {
        isValid: false,
        error: `Unsupported condition: '${cleanCond}'. Conditions must use '=' comparison with string values, joined by AND.`,
        params: {},
      };
    }

    const field = match[1].toLowerCase();
    const val = match[2] ?? match[3] ?? match[4] ?? "";

    if (field === "vendor") {
      params.vendor = val;
    } else if (field === "disposition") {
      params.disposition = val;
    } else if (field === "ip") {
      params.ip = val;
    } else if (field === "query" || field === "search" || field === "text") {
      params.query = val;
    } else {
      return {
        isValid: false,
        error: `Unsupported filter field '${match[1]}'. The backend investigation contract only supports filtering by 'vendor', 'disposition', 'ip', or 'query'.`,
        params: {},
      };
    }
  }

  return {
    isValid: true,
    params,
  };
}

/**
 * Builds a SQL query representation from active filter parameters.
 */
export function buildSqlQuery(params: RecordsQueryParams): string {
  const conditions: string[] = [];

  if (params.vendor) {
    conditions.push(`vendor = '${params.vendor}'`);
  }
  if (params.disposition) {
    conditions.push(`disposition = '${params.disposition}'`);
  }
  if (params.ip) {
    conditions.push(`ip = '${params.ip}'`);
  }
  if (params.query) {
    conditions.push(`query = '${params.query}'`);
  }

  if (conditions.length === 0) {
    return "SELECT * FROM records";
  }

  return `SELECT * FROM records\nWHERE ${conditions.join("\n  AND ")}`;
}

export interface QueryPreset {
  label: string;
  description: string;
  sql: string;
}

export const QUERY_PRESETS: QueryPreset[] = [
  {
    label: "All Records",
    description: "Scan all logs in the selected block",
    sql: "SELECT * FROM records",
  },
  {
    label: "Blocked Traffic",
    description: "Filter security firewall drops / denies",
    sql: "SELECT * FROM records\nWHERE disposition = 'Blocked'",
  },
  {
    label: "Cisco Logs",
    description: "Isolate Cisco firewall and edge syslog events",
    sql: "SELECT * FROM records\nWHERE vendor = 'Cisco'",
  },
  {
    label: "Fortinet Denied",
    description: "Isolate Fortinet dropped or denied sessions",
    sql: "SELECT * FROM records\nWHERE vendor = 'Fortinet'\n  AND disposition = 'Blocked'",
  },
];
