// SoulFrame V6.1.4 - pure verification of mutually-exclusive atomic RPC results.
// No network access, database functions or credentials in this module.
export function assertMutationRaceOutcome(updateResult, deleteResult) {
  for (const [operation, result] of [['update', updateResult], ['delete', deleteResult]]) {
    if (result?.error || !result || !result.data || typeof result.data !== 'object' || Array.isArray(result.data)) {
      throw new Error(`${operation} RPC failed or returned an invalid response`);
    }
  }
  const updateStatus = updateResult.data.status;
  const deleteStatus = deleteResult.data.status;
  if (updateStatus === 'ok' && deleteStatus === 'conflict') return 'update';
  if (updateStatus === 'not_found' && deleteStatus === 'ok') return 'delete';
  throw new Error('Concurrent Update/Delete did not produce one winner and one safe loser');
}
