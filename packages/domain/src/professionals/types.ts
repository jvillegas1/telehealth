export type ProfessionalProfileStatus = "draft" | "pending_review" | "approved" | "rejected";

export type ProfessionalListItem = {
  id: string;
  displayName: string;
  specialties: string[];
  therapeuticApproach: string | null;
  languages: string[];
  feeCents: number | null;
  currency: string | null;
  countryId: string | null;
  photoUrl: string | null;
  photoAlt: string | null;
  status: ProfessionalProfileStatus;
  hasVerifiedCredential: boolean;
  nextAvailabilityAt: Date | null;
};

export type RecommendationContext = {
  suggestedTags: string[];
  patientCountryId: string | null;
  patientLanguages: string[];
};

export type ScoredProfessional = {
  professional: ProfessionalListItem;
  score: number;
  reasons: string[];
};