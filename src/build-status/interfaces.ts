export interface ExtractedBuildInfo {
  definition: string;
  sourceGetVersion: string; // : separated
  branch: string;
  success: boolean;
  triggeredBy: { fullName: string; login: string; }[];
  start: string; // iso encoded
  end: string;
}