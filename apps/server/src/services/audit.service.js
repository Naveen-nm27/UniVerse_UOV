// Store selected safe fields only. Passwords, tokens, device secrets and raw request bodies are excluded.
export async function appendAuditLog(manager, table, rowId, action, actorId, before, after) {
  await manager.query(
    `INSERT INTO AUDIT_LOG (table_name,row_id,action,actor_id,old_value,new_value)
    VALUES (?,?,?,?,?,?)`,
    [
      table,
      rowId,
      action,
      actorId,
      before == null ? null : JSON.stringify(before),
      after == null ? null : JSON.stringify(after),
    ],
  );
}
