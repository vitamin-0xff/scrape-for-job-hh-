
/**
 * @example LOG_LEVEL=debug deno run --allow-env --allow-net main.ts
 * 
 * @example 
 * LOG_LEVEL=debug 
 * deno run --allow-env --allow-net main.ts
 */


type Level = "debug" | "info" | "warn" | "error";

const LEVELS: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const CURRENT =
  LEVELS[Deno.env.get("LOG_LEVEL") as Level] ?? LEVELS.info;

function log(level: Level, ...args: unknown[]) {
  if (LEVELS[level] < CURRENT) return;
  console.log(`[${level}]`, ...args);
}

export const logger = {
  debug: (...a: unknown[]) => log("debug", ...a),
  info:  (...a: unknown[]) => log("info",  ...a),
  warn:  (...a: unknown[]) => log("warn",  ...a),
  error: (...a: unknown[]) => log("error", ...a),
};