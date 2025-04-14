import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
  ResetInventoryDto,
} from './inventory.dto';

describe('InventoryController', () => {
  let controller: InventoryController;
  let service: InventoryService;

  const mockInventoryService = {
    findByUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    resetTable: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        { provide: InventoryService, useValue: mockInventoryService },
      ],
    }).compile();

    controller = module.get<InventoryController>(InventoryController);
    service = module.get<InventoryService>(InventoryService);
    jest.clearAllMocks();
  });

  describe('getInventory', () => {
    it('should return items for a given user id', async () => {
      const userId = '1';
      const items = [{ inventory_id: 1, item_name: 'Test Item' }];
      mockInventoryService.findByUserId.mockResolvedValue(items);

      const result = await controller.getInventory(userId);
      expect(result).toEqual({ items });
      expect(mockInventoryService.findByUserId).toHaveBeenCalledWith(
        Number(userId),
      );
    });

    it('should apply filtering and pagination when query parameters are provided', async () => {
      const userId = '1';
      const items = [
        { inventory_id: 1, item_group: 'A' },
        { inventory_id: 2, item_group: 'B' },
        { inventory_id: 3, item_group: 'A' },
      ];
      mockInventoryService.findByUserId.mockResolvedValue(items);

      // Filter for item_group 'A', offset 1, limit 1
      const queryLimit = '1';
      const queryOffset = '1';
      const queryItemGroup = 'A';
      const result = await controller.getInventory(
        userId,
        queryLimit,
        queryOffset,
        queryItemGroup,
      );
      expect(result.items).toEqual([{ inventory_id: 3, item_group: 'A' }]);
    });
  });

  describe('addInventory', () => {
    it('should add a new inventory item', async () => {
      const createDto: CreateInventoryDto = {
        user_id: 1,
        item_name: 'New Item',
        item_group: 'GroupA',
        units: 'pcs',
        quantity: 10,
        price_per_unit: 100,
      };
      const newItem = { inventory_id: 1, ...createDto };
      mockInventoryService.create.mockResolvedValue(newItem);

      const result = await controller.addInventory(createDto);
      expect(result).toEqual(newItem);
      expect(mockInventoryService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('updateInventory', () => {
    it('should update an existing inventory item', async () => {
      const id = '1';
      const updateDto: UpdateInventoryDto = { item_name: 'Updated Item' };
      const updatedItem = { inventory_id: 1, ...updateDto };
      mockInventoryService.update.mockResolvedValue(updatedItem);

      const result = await controller.updateInventory(id, updateDto);
      expect(result).toEqual(updatedItem);
      expect(mockInventoryService.update).toHaveBeenCalledWith(
        Number(id),
        updateDto,
      );
    });

    it('should throw NotFound exception if update returns null', async () => {
      const id = '99';
      const updateDto: UpdateInventoryDto = { item_name: 'Non-existent Item' };
      mockInventoryService.update.mockResolvedValue(null);

      await expect(controller.updateInventory(id, updateDto)).rejects.toThrow(
        HttpException,
      );
      try {
        await controller.updateInventory(id, updateDto);
      } catch (error) {
        expect(error.getStatus()).toEqual(HttpStatus.NOT_FOUND);
        expect(error.message).toEqual('Inventory item not found');
      }
    });
  });

  describe('deleteInventory', () => {
    it('should delete an inventory item successfully', async () => {
      const id = '1';
      mockInventoryService.delete.mockResolvedValue(true);

      const result = await controller.deleteInventory(id);
      expect(result).toEqual({ message: 'Deleted successfully' });
      expect(mockInventoryService.delete).toHaveBeenCalledWith(Number(id));
    });

    it('should throw NotFound exception if deletion fails', async () => {
      const id = '99';
      mockInventoryService.delete.mockResolvedValue(false);

      await expect(controller.deleteInventory(id)).rejects.toThrow(
        HttpException,
      );
      try {
        await controller.deleteInventory(id);
      } catch (error) {
        expect(error.getStatus()).toEqual(HttpStatus.NOT_FOUND);
        expect(error.message).toEqual('Inventory item not found');
      }
    });
  });

  describe('resetInventory', () => {
    it('should reset the inventory table for a given user', async () => {
      const resetDto: ResetInventoryDto = { userId: 1 };
      const expected = { message: 'Inventory table reset for user 1' };
      mockInventoryService.resetTable.mockResolvedValue(expected);

      const result = await controller.resetInventory(resetDto);
      expect(result).toEqual(expected);
      expect(mockInventoryService.resetTable).toHaveBeenCalledWith(
        resetDto.userId,
      );
    });
  });
});
