/**
 * @swagger
 * components:
 *   schemas:
 *     Harvest:
 *       type: object
 *       required:
 *         - id
 *         - farmerId
 *         - cropType
 *         - quantity
 *         - unitOfMeasure
 *         - qualityGrade
 *         - harvestDate
 *         - expectedPrice
 *         - marketStatus
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the harvest
 *         farmerId:
 *           type: string
 *           format: uuid
 *           description: Reference to the farmer who submitted the harvest
 *         cropType:
 *           type: string
 *           description: Type of crop (e.g., maize, wheat, soybeans)
 *         variety:
 *           type: string
 *           nullable: true
 *           description: Specific variety of the crop (if applicable)
 *         quantity:
 *           type: number
 *           format: decimal
 *           description: Harvest quantity in metric tons or other unit
 *         unitOfMeasure:
 *           type: string
 *           enum: [kg, ton, metric_ton, lb, liter, bushel]
 *           description: Unit for quantity measurement
 *         qualityGrade:
 *           type: string
 *           enum: [PREMIUM, A, B, C, ORGANIC, EXPORT, PROCESSING]
 *           description: Quality grade of the harvest
 *         harvestDate:
 *           type: string
 *           format: date
 *           description: Date when the harvest was collected
 *         storageLocation:
 *           type: string
 *           nullable: true
 *           description: Where the harvest is stored
 *         expectedPrice:
 *           type: number
 *           format: decimal
 *           description: Expected selling price per unit
 *         marketStatus:
 *           type: string
 *           enum: [AVAILABLE, SOLD, RESERVED, PROCESSING, REJECTED]
 *           description: Status of the harvest in the marketplace
 *         totalValue:
 *           type: number
 *           format: decimal
 *           description: Total value of the harvest (quantity * expectedPrice)
 *         buyerId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Reference to the buyer if sold
 *         transactionId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Reference to the transaction if sold
 *         blockchainHash:
 *           type: string
 *           nullable: true
 *           description: Blockchain transaction hash if applicable
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the record was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the record was last updated
 *
 *     CreateHarvestRequest:
 *       type: object
 *       required:
 *         - farmerId
 *         - cropType
 *         - quantity
 *         - unitOfMeasure
 *         - qualityGrade
 *         - harvestDate
 *         - expectedPrice
 *       properties:
 *         farmerId:
 *           type: string
 *           format: uuid
 *           description: Reference to the farmer who submitted the harvest
 *         cropType:
 *           type: string
 *           description: Type of crop (e.g., maize, wheat, soybeans)
 *         variety:
 *           type: string
 *           nullable: true
 *           description: Specific variety of the crop
 *         quantity:
 *           type: number
 *           format: decimal
 *           description: Harvest quantity in metric tons or other unit
 *         unitOfMeasure:
 *           type: string
 *           enum: [kg, ton, metric_ton, lb, liter, bushel]
 *           description: Unit for quantity measurement
 *         qualityGrade:
 *           type: string
 *           enum: [PREMIUM, A, B, C, ORGANIC, EXPORT, PROCESSING]
 *           description: Quality grade of the harvest
 *         harvestDate:
 *           type: string
 *           format: date
 *           description: Date when the harvest was collected
 *         storageLocation:
 *           type: string
 *           nullable: true
 *           description: Where the harvest is stored
 *         expectedPrice:
 *           type: number
 *           format: decimal
 *           description: Expected selling price per unit
 *         marketStatus:
 *           type: string
 *           enum: [AVAILABLE, RESERVED, PROCESSING]
 *           default: AVAILABLE
 *           description: Initial status of the harvest
 *
 *     UpdateHarvestRequest:
 *       type: object
 *       minProperties: 1
 *       properties:
 *         cropType:
 *           type: string
 *           description: Type of crop
 *         variety:
 *           type: string
 *           nullable: true
 *           description: Specific variety of the crop
 *         quantity:
 *           type: number
 *           format: decimal
 *           description: Harvest quantity
 *         unitOfMeasure:
 *           type: string
 *           enum: [kg, ton, metric_ton, lb, liter, bushel]
 *           description: Unit for quantity measurement
 *         qualityGrade:
 *           type: string
 *           enum: [PREMIUM, A, B, C, ORGANIC, EXPORT, PROCESSING]
 *           description: Quality grade of the harvest
 *         harvestDate:
 *           type: string
 *           format: date
 *           description: Date when the harvest was collected
 *         storageLocation:
 *           type: string
 *           nullable: true
 *           description: Where the harvest is stored
 *         expectedPrice:
 *           type: number
 *           format: decimal
 *           description: Expected selling price per unit
 *         marketStatus:
 *           type: string
 *           enum: [AVAILABLE, RESERVED, PROCESSING]
 *           description: Current market status of the harvest
 *
 *     SellHarvestRequest:
 *       type: object
 *       required:
 *         - buyerId
 *       properties:
 *         buyerId:
 *           type: string
 *           format: uuid
 *           description: ID of the buyer purchasing this harvest
 *         transactionId:
 *           type: string
 *           format: uuid
 *           description: ID of the transaction record (optional)
 *
 *     ReserveHarvestRequest:
 *       type: object
 *       properties:
 *         buyerId:
 *           type: string
 *           format: uuid
 *           description: ID of the buyer reserving this harvest (optional)
 *
 *     HarvestListResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Harvest'
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             total:
 *               type: integer
 *             totalPages:
 *               type: integer
 *
 *     HarvestResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/Harvest'
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 * 
 * tags:
 *   name: Harvests
 *   description: Harvest management endpoints
 */
