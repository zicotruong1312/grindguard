/**
 * Format today VN timezone to YYYY-MM-DD
 */
function getTodayVN() {
  const now = new Date();
  const vnOffset = 7 * 60; // minutes
  const localOffset = now.getTimezoneOffset(); // minutes
  const vnMs = now.getTime() + (vnOffset + localOffset) * 60 * 1000;
  const vnDate = new Date(vnMs);

  const yyyy = vnDate.getFullYear();
  const mm   = String(vnDate.getMonth() + 1).padStart(2, '0');
  const dd   = String(vnDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Return MongoDB match criteria for a specific timeframe
 */
function getTimeframeMatch(timeframe) {
  const now = new Date();
  const vnOffset = 7 * 60;
  const localOffset = now.getTimezoneOffset();
  const vnMs = now.getTime() + (vnOffset + localOffset) * 60 * 1000;
  const vnDate = new Date(vnMs);

  const yyyy = vnDate.getFullYear();
  const mm   = String(vnDate.getMonth() + 1).padStart(2, '0');
  const dd   = String(vnDate.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  if (timeframe === 'today') return { date: todayStr };
  
  if (timeframe === 'week') {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const pastD = new Date(vnMs - i * 86400000); // subtracts days in ms
      const py = pastD.getFullYear();
      const pm = String(pastD.getMonth() + 1).padStart(2, '0');
      const pd = String(pastD.getDate()).padStart(2, '0');
      dates.push(`${py}-${pm}-${pd}`);
    }
    return { date: { $in: dates } };
  }
  
  if (timeframe === 'month') return { date: { $regex: `^${yyyy}-${mm}` } };
  
  if (timeframe === 'year') return { date: { $regex: `^${yyyy}` } };
  
  // 'all' time
  return {};
}

/**
 * Format seconds → human-readable "Xh Ym Zs"
 */
function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  let result = '';
  if (h > 0) result += `${h}h `;
  if (m > 0) result += `${m}m `;
  if (s > 0) result += `${s}s`;
  return result.trim() || '0s';
}

module.exports = { getTodayVN, getTimeframeMatch, formatDuration };
