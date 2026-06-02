export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type BloodType = 'A_POSITIVE' | 'A_NEGATIVE' | 'B_POSITIVE' | 'B_NEGATIVE' |
                        'AB_POSITIVE' | 'AB_NEGATIVE' | 'O_POSITIVE' | 'O_NEGATIVE';

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phone?: string;
  email?: string;
  city?: string;
  country?: string;
  bloodType?: BloodType;
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phone?: string;
  email?: string;
  addressLine1?: string;
  city?: string;
  country?: string;
  bloodType?: BloodType;
  allergies?: string;
}
