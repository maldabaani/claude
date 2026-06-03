export type Role =
  | 'PLATFORM_ADMIN'
  | 'ADMIN'
  | 'DOCTOR'
  | 'NURSE'
  | 'RECEPTIONIST'
  | 'LAB_TECHNICIAN'
  | 'RADIOLOGIST'
  | 'PHARMACIST'
  | 'BILLING_CLERK';

export type Permission =
  | 'PATIENT_READ'    | 'PATIENT_WRITE'    | 'PATIENT_DELETE'
  | 'APPOINTMENT_READ'| 'APPOINTMENT_WRITE'| 'APPOINTMENT_DELETE'
  | 'VISIT_READ'      | 'VISIT_WRITE'
  | 'LAB_READ'        | 'LAB_WRITE'
  | 'PRESCRIPTION_READ'| 'PRESCRIPTION_WRITE'
  | 'RADIOLOGY_READ'  | 'RADIOLOGY_WRITE'
  | 'BILLING_READ'    | 'BILLING_WRITE'
  | 'REPORTS_READ'
  | 'STAFF_READ'      | 'STAFF_WRITE'
  | 'SETTINGS_READ'   | 'SETTINGS_WRITE';

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  role: Role;
  tenantId: string | null;
  permissions: Permission[];
}

export interface CurrentUser {
  id: string;
  email: string;
  role: Role;
  tenantId: string | null;
  userType: 'TENANT' | 'PLATFORM';
  permissions: Permission[];
}
