export const anonymizeCandidates = (data, idField = "candidate_id", prefix = "Candidate") => {
  const candidateMap = new Map();
  let currentCandidateIndex = 1;

  return data.map((row) => {
    const rawId = row[idField];
    if (!rawId) return row; // Fallback if no ID field exists

    if (!candidateMap.has(rawId)) {
      candidateMap.set(rawId, `${prefix} ${currentCandidateIndex++}`);
    }

    return {
      ...row,
      [idField]: candidateMap.get(rawId),
    };
  });
};
