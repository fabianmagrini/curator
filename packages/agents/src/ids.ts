/** Generate a short, unique run id for correlating AG-UI events. */
export function randomRunId(): string {
  return `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
