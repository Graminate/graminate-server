export class CreateWarehouseDto {
  user_id: number;
  name: string;
  type: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  contact_person?: string;
  phone?: string;
  storage_capacity?: number;
}

export class UpdateWarehouseDto {
  name?: string;
  type?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  contact_person?: string;
  phone?: string;
  storage_capacity?: number;
}

export class ResetWarehouseDto {
  userId: number;
}
