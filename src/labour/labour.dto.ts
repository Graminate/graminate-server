// src/labour/labour.dto.ts
export class CreateOrUpdateLabourDto {
  user_id?: number;
  labour_id?: number;
  full_name?: string;
  date_of_birth?: string;
  gender?: string;
  contact_number?: string;
  aadhar_card_number?: string;
  ration_card?: string;
  pan_card?: string;
  driving_license?: string;
  mnrega_job_card_number?: string;
  bank_account_number?: string;
  ifsc_code?: string;
  bank_name?: string;
  bank_branch?: string;
  disability_status?: boolean;
  epfo?: string;
  esic?: string;
  pm_kisan?: boolean;
  base_salary?: number;
  bonus?: number;
  overtime_pay?: number;
  housing_allowance?: number;
  travel_allowance?: number;
  meal_allowance?: number;
  payment_frequency?: string;
  role?: string;

  // New structured address fields
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}
