import Harvest from "../../models/harvest.model.js";
import { MarketStatus } from "../../constants/harvestTypes.js";

export interface HarvestFilterOptions {
  cropType?: string;
  qualityGrade?: string[];
  marketStatus?: string[];
  fromDate?: Date;
  toDate?: Date;
  farmerId?: string;
  buyerId?: string;
  minQuantity?: number;
  maxQuantity?: number;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface HarvestResult {
  harvests: Harvest[];
  total: number;
  pages: number;
}

export interface IHarvestService {
  getHarvestById(id: string): Promise<Harvest>;

  getFarmerHarvests(
    farmerId: string,
    options?: PaginationOptions,
    filters?: Partial<HarvestFilterOptions>
  ): Promise<HarvestResult>;

  getAvailableHarvests(
    options?: PaginationOptions,
    filters?: Partial<HarvestFilterOptions>
  ): Promise<HarvestResult>;

  createHarvest(harvestData: Partial<Harvest>): Promise<Harvest>;

  updateHarvest(id: string, harvestData: Partial<Harvest>): Promise<Harvest>;

  deleteHarvest(id: string): Promise<boolean>;

  markAsSold(
    id: string,
    buyerId: string,
    transactionId?: string
  ): Promise<Harvest>;

  markAsReserved(id: string, buyerId?: string): Promise<Harvest>;

  searchHarvests(
    filters: HarvestFilterOptions,
    pagination: PaginationOptions
  ): Promise<HarvestResult>;
}
