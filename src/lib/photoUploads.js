/**
 * Summarise a batch of photo uploads without letting failures kill the booking.
 *
 * Photos are supporting material — they help Matthias prepare, but the booking is the thing
 * worth money. The old code used Promise.all, so one Cloudinary hiccup rejected the whole batch
 * and aborted handleSubmit, losing a completed booking. Worse, the message said "Bitte versuchen
 * Sie es erneut" and never "remove the photos", so the customer retried forever.
 *
 * Takes the output of Promise.allSettled(photos.map(uploadPhoto)).
 *
 * @returns { urls, failed, total, warning } — warning is null when nothing failed
 */
export function summarizePhotoUploads(results) {
  const urls = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  const failed = results.length - urls.length;

  return {
    urls,
    failed,
    total: results.length,
    warning: failed === 0 ? null : buildWarning(failed, results.length),
  };
}

function buildWarning(failed, total) {
  // Always pairs the bad news with the reassurance, because the booking DID succeed — the whole
  // point of the change. A warning that only says "photos failed" reads as "booking failed".
  if (failed === total) {
    return total === 1
      ? 'Ihr Foto konnte nicht übertragen werden — die Buchung ist aber angekommen.'
      : 'Ihre Fotos konnten nicht übertragen werden — die Buchung ist aber angekommen.';
  }
  return `${failed} von ${total} Fotos konnten nicht übertragen werden — die Buchung ist aber angekommen.`;
}
