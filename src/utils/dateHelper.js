/**
 * Returns today's date string in 'YYYY-MM-DD' format (UTC+7 – Vietnam timezone).
 */
function getTodayVN() {
  const now = new Date();
  // Offset to UTC+7
  const vnOffset = 7 * 60; // minutes
  const localOffset = now.getTimezoneOffset(); // minutes (negative east of UTC)
  const vnMs = now.getTime() + (vnOffset + localOffset) * 60 * 1000;
  const vnDate = new Date(vnMs);

  const yyyy = vnDate.getFullYear();
  const mm   = String(vnDate.getMonth() + 1).padStart(2, '0');
  const dd   = String(vnDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

module.exports = { getTodayVN };
