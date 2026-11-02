import Issue from '../models/Issue.js';

// Common stop words, prepositions, and generic maintenance filler words
const STOP_WORDS = new Set([
  // Articles & Prepositions
  'the', 'is', 'are', 'was', 'were', 'am', 'be', 'been', 'being',
  'at', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'onto', 'to', 'with', 'within',
  'and', 'or', 'not', 'no', 'nor', 'but', 'so', 'as', 'if',
  'near', 'beside', 'behind', 'front', 'area', 'this', 'that', 'these', 'those',
  'there', 'here', 'please', 'help', 'need', 'needs', 'needed',
  'some', 'very', 'have', 'has', 'had', 'having', 'our', 'out', 'all', 'any', 'my', 'your',
  // Generic maintenance filler words
  'issue', 'issues', 'problem', 'problems', 'complaint', 'complaints',
  'trouble', 'report', 'reports', 'reported', 'reporting',
  'repair', 'repairs', 'repaired', 'fixing', 'fixed', 'fix',
  'work', 'working', 'works', 'bad', 'poor', 'urgent', 'immediately',
  'check', 'checking', 'today', 'yesterday', 'daily', 'again', 'still'
]);

// Generic location descriptors (keep specific block/room identifiers like 'a', 'b', '101', 'main', etc.)
const GENERIC_LOCATION_WORDS = new Set([
  'block', 'blocks', 'room', 'rooms', 'floor', 'floors', 'building', 'wing',
  'dept', 'department', 'hall', 'campus', 'hostel', 'lane', 'street', 'road',
  'side', 'near', 'corner', 'gate', 'ground', 'behind', 'front', 'phase'
]);

export const extractKeywords = (text = '', customStopWords = STOP_WORDS) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => {
      if (!word) return false;
      if (customStopWords.has(word)) return false;
      // Allow single alphanumeric identifiers (e.g., 'a', 'b', '1', '2' for Block A, Block B, etc.)
      return word.length >= 1;
    });
};

const calculateWordOverlap = (wordsA, wordsB) => {
  if (!wordsA.length || !wordsB.length) return 0;
  const setB = new Set(wordsB);
  let matches = 0;
  for (const w of wordsA) {
    if (setB.has(w)) matches++;
  }
  return matches;
};

export const findPotentialDuplicates = async ({ title, category, locationText, excludeId = null }) => {
  if (!title || title.trim().length < 3) return [];

  const titleWords = extractKeywords(title, STOP_WORDS);
  const locationStopWords = new Set([...STOP_WORDS, ...GENERIC_LOCATION_WORDS]);
  const locationWords = extractKeywords(locationText, locationStopWords);

  const effectiveTitleWords = titleWords.length > 0
    ? titleWords
    : title.toLowerCase().split(/\s+/).filter(w => w.length >= 2);

  // STRICT REQUIREMENT 1: Category MUST match exactly
  const filter = {
    category,
    status: { $in: ['Submitted', 'Under Review', 'In Progress'] }
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  // Find candidate active issues in the exact same category
  const candidates = await Issue.find(filter)
    .populate('reporterId', 'name')
    .sort({ createdAt: -1 })
    .limit(100);

  const scored = [];
  const normInputTitle = title.trim().toLowerCase().replace(/\s+/g, ' ');

  for (const candidate of candidates) {
    // STRICT REQUIREMENT 2: Location / Block MUST match
    const candLocationWords = extractKeywords(candidate.locationText, locationStopWords);
    const locationOverlap = calculateWordOverlap(locationWords, candLocationWords);

    // If locations do not match (e.g. Block A vs Block B), it is NOT a duplicate
    if (locationOverlap === 0) {
      continue;
    }

    // STRICT REQUIREMENT 3: Issue Title / Subject MUST match
    const candTitleWords = extractKeywords(candidate.title, STOP_WORDS);
    const effectiveCandTitleWords = candTitleWords.length > 0
      ? candTitleWords
      : candidate.title.toLowerCase().split(/\s+/).filter(w => w.length >= 2);

    const normCandTitle = candidate.title.trim().toLowerCase().replace(/\s+/g, ' ');
    const isExactTitle = normInputTitle === normCandTitle;

    const titleOverlap = calculateWordOverlap(effectiveTitleWords, effectiveCandTitleWords);
    const isSubstringMatch = (normInputTitle.length >= 5 && normCandTitle.includes(normInputTitle)) ||
                             (normCandTitle.length >= 5 && normInputTitle.includes(normCandTitle));

    // If title has no meaningful overlap or substring match, it is NOT a duplicate
    if (!isExactTitle && titleOverlap === 0 && !isSubstringMatch) {
      continue;
    }

    // All 3 conditions satisfied (Category + Block/Location + Title): Calculate confidence score
    let titleScore = isExactTitle ? 70 : isSubstringMatch ? 55 : Math.min(35 + titleOverlap * 15, 65);
    let locationScore = Math.min(20 + locationOverlap * 10, 30);
    let categoryScore = 15; // Same category

    const totalScore = Math.min(titleScore + locationScore + categoryScore, 100);

    const matchingWords = effectiveTitleWords.filter(w => effectiveCandTitleWords.includes(w));
    const matchingLocation = locationWords.filter(w => candLocationWords.includes(w));

    scored.push({
      _id: candidate._id,
      title: candidate.title,
      category: candidate.category,
      locationText: candidate.locationText,
      priority: candidate.priority,
      status: candidate.status,
      imageUrl: candidate.imageUrl,
      createdAt: candidate.createdAt,
      reporterName: candidate.reporterId?.name || 'Reporter',
      similarityScore: totalScore,
      matchReason: `Matching category (${category}) • Block (${matchingLocation.join(', ') || candidate.locationText}) • Title (${matchingWords.join(', ') || candidate.title})`
    });
  }

  // Sort by highest similarity first, then newest
  scored.sort((a, b) => b.similarityScore - a.similarityScore || new Date(b.createdAt) - new Date(a.createdAt));

  return scored.slice(0, 5);
};
