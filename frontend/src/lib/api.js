import { useMutation, useQuery } from "@tanstack/react-query";

async function customFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || "An error occurred");
  }
  return res.json();
}

export function useRegisterCandidate(options) {
  return useMutation({
    mutationKey: ["registerCandidate"],
    mutationFn: ({ data }) =>
      customFetch(`/api/candidates/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    ...options,
  });
}

export function useGetCandidateProfile(candidateId, options) {
  return useQuery({
    queryKey: [`/api/candidates/${candidateId}`],
    queryFn: () => customFetch(`/api/candidates/${candidateId}`),
    enabled: !!candidateId,
    ...options,
  });
}

export function useGetCandidateResults(candidateId, options) {
  return useQuery({
    queryKey: [`/api/candidates/${candidateId}/results`],
    queryFn: () => customFetch(`/api/candidates/${candidateId}/results`),
    enabled: !!candidateId,
    ...options,
  });
}

export function useListAssessments(options) {
  return useQuery({
    queryKey: [`/api/assessments`],
    queryFn: () => customFetch(`/api/assessments`),
    ...options,
  });
}

export function useGetAssessment(assessmentId, options) {
  return useQuery({
    queryKey: [`/api/assessments/${assessmentId}`],
    queryFn: () => customFetch(`/api/assessments/${assessmentId}`),
    enabled: !!assessmentId,
    ...options,
  });
}

export function useSubmitAssessment(assessmentId, options) {
  return useMutation({
    mutationKey: ["submitAssessment", assessmentId],
    mutationFn: ({ data }) =>
      customFetch(`/api/assessments/${assessmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    ...options,
  });
}

export function useGetCandidateRankings(params, options) {
  return useQuery({
    queryKey: [`/api/recruiters/rankings`, params],
    queryFn: () => {
      const qs = params ? new URLSearchParams(params).toString() : "";
      return customFetch(`/api/recruiters/rankings${qs ? "?" + qs : ""}`);
    },
    ...options,
  });
}

export function useGetRecruitmentStats(options) {
  return useQuery({
    queryKey: [`/api/recruiters/stats`],
    queryFn: () => customFetch(`/api/recruiters/stats`),
    ...options,
  });
}
