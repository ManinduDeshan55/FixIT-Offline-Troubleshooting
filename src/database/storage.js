function requireValue(value, label) {
  if (value === null || value === undefined || value === '') {
    throw new Error(`${label} is required.`);
  }
}

async function runDatabaseOperation(message, operation) {
  try {
    return await operation();
  } catch (error) {
    console.error(message, error);
    throw new Error(message);
  }
}

export function createSessionId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export async function addFavourite(db, guideId) {
  requireValue(guideId, 'Guide ID');
  return runDatabaseOperation('Could not save this guide.', async () => {
    const result = await db.runAsync(
      'INSERT OR IGNORE INTO favourites (guide_id) VALUES (?)',
      guideId,
    );
    return result.changes > 0;
  });
}

export async function removeFavourite(db, guideId) {
  requireValue(guideId, 'Guide ID');
  return runDatabaseOperation('Could not remove this saved guide.', async () => {
    const result = await db.runAsync(
      'DELETE FROM favourites WHERE guide_id = ?',
      guideId,
    );
    return result.changes > 0;
  });
}

export async function getAllFavourites(db) {
  return runDatabaseOperation('Could not load saved guides.', async () => {
    const rows = await db.getAllAsync(
      'SELECT guide_id, created_at FROM favourites ORDER BY created_at DESC',
    );
    return rows.map((row) => ({ guideId: row.guide_id, createdAt: row.created_at }));
  });
}

export async function isFavourite(db, guideId) {
  requireValue(guideId, 'Guide ID');
  return runDatabaseOperation('Could not check whether this guide is saved.', async () => {
    const row = await db.getFirstAsync(
      'SELECT guide_id FROM favourites WHERE guide_id = ?',
      guideId,
    );
    return Boolean(row);
  });
}

export async function createSession(db, guideId) {
  requireValue(guideId, 'Guide ID');
  const sessionId = createSessionId();
  return runDatabaseOperation('Could not start a troubleshooting session.', async () => {
    await db.runAsync(
      'INSERT INTO sessions (session_id, guide_id, status, current_step_number) VALUES (?, ?, ?, ?)',
      sessionId,
      guideId,
      'in_progress',
      1,
    );
    return getSessionById(db, sessionId);
  });
}

export async function getSessionById(db, sessionId) {
  requireValue(sessionId, 'Session ID');
  return runDatabaseOperation('Could not load this troubleshooting session.', async () => {
    const row = await db.getFirstAsync(
      `SELECT session_id, guide_id, status, current_step_number, started_at, updated_at
       FROM sessions WHERE session_id = ?`,
      sessionId,
    );
    return row ? {
      sessionId: row.session_id,
      guideId: row.guide_id,
      status: row.status,
      currentStepNumber: row.current_step_number,
      startedAt: row.started_at,
      updatedAt: row.updated_at,
    } : null;
  });
}

export async function getAllSessions(db) {
  return runDatabaseOperation('Could not load troubleshooting history.', async () => {
    const rows = await db.getAllAsync(`
      SELECT
        sessions.session_id,
        sessions.guide_id,
        sessions.status,
        sessions.current_step_number,
        sessions.started_at,
        sessions.updated_at,
        COUNT(completed_steps.step_id) AS completed_step_count
      FROM sessions
      LEFT JOIN completed_steps ON completed_steps.session_id = sessions.session_id
      GROUP BY sessions.session_id
      ORDER BY sessions.updated_at DESC
    `);
    return rows.map((row) => ({
      sessionId: row.session_id,
      guideId: row.guide_id,
      status: row.status,
      currentStepNumber: row.current_step_number,
      startedAt: row.started_at,
      updatedAt: row.updated_at,
      completedStepCount: row.completed_step_count,
    }));
  });
}

export async function getCompletedSteps(db, sessionId) {
  requireValue(sessionId, 'Session ID');
  return runDatabaseOperation('Could not load completed steps.', async () => {
    const rows = await db.getAllAsync(
      `SELECT step_id, step_number, completed_at
       FROM completed_steps WHERE session_id = ? ORDER BY step_number`,
      sessionId,
    );
    return rows.map((row) => ({
      stepId: row.step_id,
      stepNumber: row.step_number,
      completedAt: row.completed_at,
    }));
  });
}

export async function saveStepCompletion(db, sessionId, stepId, stepNumber, isCompleted) {
  requireValue(sessionId, 'Session ID');
  requireValue(stepId, 'Step ID');
  if (!Number.isInteger(stepNumber) || stepNumber < 1) {
    throw new Error('Step number must be a positive whole number.');
  }

  return runDatabaseOperation('Could not save this step.', async () => {
    await db.withTransactionAsync(async () => {
      if (isCompleted) {
        await db.runAsync(
          `INSERT INTO completed_steps (session_id, step_id, step_number)
           VALUES (?, ?, ?)
           ON CONFLICT (session_id, step_id) DO UPDATE SET
             step_number = excluded.step_number,
             completed_at = CURRENT_TIMESTAMP`,
          sessionId,
          stepId,
          stepNumber,
        );
      } else {
        await db.runAsync(
          'DELETE FROM completed_steps WHERE session_id = ? AND step_id = ?',
          sessionId,
          stepId,
        );
      }

      const result = await db.runAsync(
        `UPDATE sessions SET current_step_number = ?, updated_at = CURRENT_TIMESTAMP
         WHERE session_id = ? AND status = 'in_progress'`,
        stepNumber,
        sessionId,
      );
      if (result.changes === 0) {
        throw new Error('This session is no longer in progress.');
      }
    });
  });
}

export async function updateSessionCurrentStep(db, sessionId, stepNumber) {
  requireValue(sessionId, 'Session ID');
  if (!Number.isInteger(stepNumber) || stepNumber < 1) {
    throw new Error('Step number must be a positive whole number.');
  }
  return runDatabaseOperation('Could not update session progress.', async () => {
    const result = await db.runAsync(
      `UPDATE sessions SET current_step_number = ?, updated_at = CURRENT_TIMESTAMP
       WHERE session_id = ? AND status = 'in_progress'`,
      stepNumber,
      sessionId,
    );
    if (result.changes === 0) {
      throw new Error('This session is no longer in progress.');
    }
  });
}

export async function updateSessionStatus(db, sessionId, status) {
  requireValue(sessionId, 'Session ID');
  if (!['solved', 'not_solved'].includes(status)) {
    throw new Error('Session outcome must be solved or not solved.');
  }
  return runDatabaseOperation('Could not save the session outcome.', async () => {
    const result = await db.runAsync(
      `UPDATE sessions SET status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE session_id = ? AND status = 'in_progress'`,
      status,
      sessionId,
    );
    if (result.changes === 0) {
      throw new Error('This session is no longer in progress.');
    }
  });
}
