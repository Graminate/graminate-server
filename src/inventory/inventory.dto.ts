export class CreateInventoryDto {
  user_id: number;
  item_name: string;
  item_group: string;
  units: string;
  quantity: number;
  price_per_unit: number;
  warehouse_id?: number;
}

export class UpdateInventoryDto {
  item_name?: string;
  item_group?: string;
  units?: string;
  quantity?: number;
  price_per_unit?: number;
}

export class ResetInventoryDto {
  userId: number;
}
