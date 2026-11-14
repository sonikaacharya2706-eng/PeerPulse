const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
  'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his',
  'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my',
  'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than',
  'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this',
  'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what',
  'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'you', 'your', 'yours', 'yourself',
]);

// Extract unique keywords from text
export const extractKeywords = (text) => {
  if (!text) return [];
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
  return Array.from(new Set(tokens));
};

// Calculate Jaccard Similarity between two arrays of tokens
export const calculateJaccard = (tokensA, tokensB) => {
  if (!tokensA.length || !tokensB.length) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
};

// Location string similarity
export const calculateLocationSimilarity = (locA, locB) => {
  if (!locA || !locB) return 0;
  const a = locA.toLowerCase().trim();
  const b = locB.toLowerCase().trim();
  if (a === b) return 1.0;
  if (a.includes(b) || b.includes(a)) return 0.8;
  const tokensA = extractKeywords(a);
  const tokensB = extractKeywords(b);
  return calculateJaccard(tokensA, tokensB);
};

// Algorithm G: Lost-and-found matching
export const calculateMatchScore = (itemA, itemB) => {
  // 1. Same category (40 pts)
  const categoryScore = itemA.category === itemB.category ? 40 : 0;

  // 2. Keyword Jaccard overlap (25 pts)
  const keywordsA = itemA.keywords && itemA.keywords.length > 0
    ? itemA.keywords
    : extractKeywords(`${itemA.title} ${itemA.description}`);
  const keywordsB = itemB.keywords && itemB.keywords.length > 0
    ? itemB.keywords
    : extractKeywords(`${itemB.title} ${itemB.description}`);
  const jaccard = calculateJaccard(keywordsA, keywordsB);
  const keywordScore = 25 * jaccard;

  // 3. Location string similarity (20 pts)
  const locSim = calculateLocationSimilarity(itemA.location, itemB.location);
  const locationScore = 20 * locSim;

  // 4. Date within 7 days, scaled (15 pts)
  const dateA = new Date(itemA.dateOccurred).getTime();
  const dateB = new Date(itemB.dateOccurred).getTime();
  const diffDays = Math.abs(dateA - dateB) / (1000 * 60 * 60 * 24);
  const dateScore = diffDays <= 7 ? 15 * (1 - diffDays / 7) : 0;

  const totalScore = Math.round(categoryScore + keywordScore + locationScore + dateScore);

  return {
    score: totalScore,
    breakdown: {
      categoryScore,
      keywordScore: Math.round(keywordScore),
      locationScore: Math.round(locationScore),
      dateScore: Math.round(dateScore),
    },
  };
};
