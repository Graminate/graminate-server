import { InternalServerErrorException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import pool from '@/config/database';

jest.mock('@/config/database');

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(() => {
    service = new InventoryService();
    jest.clearAllMocks();
  });

  describe('findByUserId', () => {
    it('should return items for a given user id', async () => {
      const fakeRows = [{ inventory_id: 1, user_id: 1, item_name: 'Item1' }];
      // @ts-ignore
      pool.query.mockResolvedValue({ rows: fakeRows });

      const result = await service.findByUserId(1);
      expect(result).toEqual(fakeRows);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM inventory WHERE user_id = $1',
        [1],
      );
    });

    it('should throw InternalServerErrorException when query fails', async () => {
      const errorMessage = 'DB Error';
      // @ts-ignore
      pool.query.mockRejectedValue(new Error(errorMessage));

      await expect(service.findByUserId(1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('create', () => {
    it('should create a new inventory item and return it', async () => {
      const createDto = {
        user_id: 1,
        item_name: 'NewItem',
        item_group: 'GroupA',
        units: 'pcs',
        quantity: 5,
        price_per_unit: 50,
      };
      const fakeRow = { inventory_id: 1, ...createDto };
      // @ts-ignore
      pool.query.mockResolvedValue({ rows: [fakeRow] });

      const result = await service.create(createDto);
      expect(result).toEqual(fakeRow);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO inventory'),
        [
          createDto.user_id,
          createDto.item_name,
          createDto.item_group,
          createDto.units,
          createDto.quantity,
          createDto.price_per_unit,
        ],
      );
    });

    it('should throw InternalServerErrorException when creation fails', async () => {
      const createDto = {
        user_id: 1,
        item_name: 'NewItem',
        item_group: 'GroupA',
        units: 'pcs',
        quantity: 5,
        price_per_unit: 50,
      };
      const errorMessage = 'Insert failed';
      // @ts-ignore
      pool.query.mockRejectedValue(new Error(errorMessage));

      await expect(service.create(createDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('update', () => {
    it('should update an inventory item and return the updated row', async () => {
      const updateDto = {
        item_name: 'UpdatedItem',
        item_group: 'GroupB',
        units: 'pcs',
        quantity: 10,
        price_per_unit: 75,
      };
      const fakeRow = { inventory_id: 1, ...updateDto };
      // @ts-ignore
      pool.query.mockResolvedValue({ rows: [fakeRow] });

      const result = await service.update(1, updateDto);
      expect(result).toEqual(fakeRow);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE inventory SET'),
        [
          updateDto.item_name,
          updateDto.item_group,
          updateDto.units,
          updateDto.quantity,
          updateDto.price_per_unit,
          1,
        ],
      );
    });

    it('should throw InternalServerErrorException when update fails', async () => {
      const updateDto = { item_name: 'UpdatedItem' };
      const errorMessage = 'Update failed';
      pool.query.mockRejectedValue(new Error(errorMessage));

      await expect(service.update(1, updateDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('delete', () => {
    it('should return true when an inventory item is successfully deleted', async () => {
      pool.query.mockResolvedValue({ rowCount: 1 });

      const result = await service.delete(1);
      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM inventory WHERE inventory_id = $1',
        [1],
      );
    });

    it('should return false when no inventory item is deleted', async () => {
      pool.query.mockResolvedValue({ rowCount: 0 });

      const result = await service.delete(99);
      expect(result).toBe(false);
    });

    it('should throw InternalServerErrorException when deletion fails', async () => {
      const errorMessage = 'Delete error';
      pool.query.mockRejectedValue(new Error(errorMessage));

      await expect(service.delete(1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('resetTable', () => {
    it('should reset the inventory table and return a confirmation message', async () => {
      pool.query.mockResolvedValue({});
      const result = await service.resetTable(1);
      expect(result).toEqual({ message: 'Inventory table reset for user 1' });
      expect(pool.query).toHaveBeenCalledWith(
        'TRUNCATE inventory RESTART IDENTITY CASCADE',
      );
    });

    it('should throw InternalServerErrorException when reset fails', async () => {
      const errorMessage = 'Reset failed';
      pool.query.mockRejectedValue(new Error(errorMessage));

      await expect(service.resetTable(1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
