import {
  QualityGrade,
  MarketStatus,
  UnitOfMeasure,
} from "../constants/harvestTypes.js";

export interface HarvestDTO {
  id: string;
  farmerId: string;
  cropType: string;
  variety?: string | null;
  quantity: number;
  unitOfMeasure: string;
  qualityGrade: string;
  harvestDate: string | Date;
  storageLocation?: string | null;
  expectedPrice: number;
  marketStatus: string;
  buyerId?: string | null;
  transactionId?: string | null;
  blockchainHash?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateHarvestDTO {
  farmerId: string;
  cropType: string;
  variety?: string;
  quantity: number;
  unitOfMeasure: string;
  qualityGrade: string;
  harvestDate: string | Date;
  storageLocation?: string;
  expectedPrice: number;
  marketStatus?: string;
}

export interface UpdateHarvestDTO {
  cropType?: string;
  variety?: string | null;
  quantity?: number;
  unitOfMeasure?: string;
  qualityGrade?: string;
  harvestDate?: string | Date;
  storageLocation?: string | null;
  expectedPrice?: number;
  marketStatus?: string;
}

export interface HarvestQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  cropType?: string;
  qualityGrade?: string | string[];
  marketStatus?: string | string[];
  fromDate?: string;
  toDate?: string;
  minQuantity?: number;
  maxQuantity?: number;
}

export interface SellHarvestDTO {
  buyerId: string;
  transactionId?: string;
}

export interface ReserveHarvestDTO {
  buyerId?: string;
}

export interface HarvestResponse {
  id: string;
  farmerId: string;
  cropType: string;
  variety: string | null;
  quantity: number;
  unitOfMeasure: string;
  qualityGrade: string;
  harvestDate: string;
  storageLocation: string | null;
  expectedPrice: number;
  marketStatus: string;
  totalValue: number;
  buyerId: string | null;
  transactionId: string | null;
  blockchainHash: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HarvestListResponse {
  harvests: HarvestResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
