export interface InsurancePayer {
  id: string;
  name: string;
  shortCode: string;
  contactEmail?: string;
  portalUrl?: string;
  active: boolean;
}

export interface InsurancePolicy {
  id: string;
  patientId: string;
  payerId: string;
  payerName: string;
  shortCode: string;
  policyNumber: string;
  memberNumber?: string;
  groupNumber?: string;
  coverageType?: string;
  validFrom?: string;
  validTo?: string;
  copayAmount?: number;
  deductibleAmount?: number;
  coveragePercentage?: number;
  active: boolean;
  notes?: string;
  createdAt: string;
}

export type ClaimStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PARTIALLY_APPROVED'
  | 'REJECTED'
  | 'APPEALED';

export interface InsuranceClaim {
  id: string;
  claimNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  patientId: string;
  insurancePolicyId: string;
  payerName: string;
  policyNumber: string;
  status: ClaimStatus;
  claimedAmount: number;
  approvedAmount?: number;
  rejectedAmount?: number;
  submittedAt?: string;
  processedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
}
