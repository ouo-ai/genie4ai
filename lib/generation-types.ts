export interface GenerationAssets {
  world?: {
    splatUrls?: { label: string; url: string }[];
    colliderMeshUrl?: string;
    panoUrl?: string;
    flipY?: boolean;
    metricScale?: number;
  };
}
export interface WorldJob {
  operationId: string;
  status: "pending" | "completed" | "failed" | "uncertain";
  error?: string;
  thumbnailUrl?: string;
  panoramaUrl?: string;
  colliderUrl?: string;
  splats?: { label: string; url: string }[];
  flipY?: boolean;
  metricScale?: number;
  createdAt?: string;
  refunded?: boolean;
}
export interface AccountData {
  user: { id: string; email: string } | null;
  serviceAvailable: boolean;
  balanceCents?: number;
  generationsRemaining?: number;
  plan?: "creator" | "pro" | null;
  interval?: "month" | "year" | null;
  creditResetAt?: string;
  renewsAt?: string;
  cancelAtEnd?: boolean;
  subscriptionStatus?: string;
  jobs?: WorldJob[];
}
