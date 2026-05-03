export const SAVE_FEEDBACK_TOTAL_MS = 3000;
export const SAVE_SUCCESS_FEEDBACK_MS = 800;
export const MIN_SAVE_FEEDBACK_MS = SAVE_FEEDBACK_TOTAL_MS - SAVE_SUCCESS_FEEDBACK_MS;

export async function waitForSaveFeedback(startedAt: number, minDuration = MIN_SAVE_FEEDBACK_MS) {
  const elapsed = Date.now() - startedAt;
  const remaining = Math.max(0, minDuration - elapsed);
  if (remaining > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, remaining));
  }
}

export async function waitForSaveSuccessFeedback(duration = SAVE_SUCCESS_FEEDBACK_MS) {
  await new Promise((resolve) => window.setTimeout(resolve, duration));
}
