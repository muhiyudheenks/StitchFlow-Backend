import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { GarmentProductService } from '../services/garmentProduct.service';
import { asyncHandler } from '../../../shared/errors';

const service = new GarmentProductService();

export const createGarmentProduct = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const creator = req.user?.id || '';
    const product = await service.createGarmentProduct(req.body, creator);
    return res.status(201).json({
        success: true,
        message: 'Garment product created successfully',
        data: product,
    });
});

export const getGarmentProducts = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const search = req.query.search as string;
    const category = req.query.category as string;
    const status = req.query.status as string;
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const result = await service.getGarmentProducts({ search, category, status, page, limit });
    return res.status(200).json({
        success: true,
        message: 'Garment products retrieved successfully',
        data: result.products,
        pagination: result.pagination,
    });
});

export const getActiveGarmentProducts = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const products = await service.getActiveGarmentProducts();
    return res.status(200).json({
        success: true,
        message: 'Active garment products retrieved successfully',
        data: products,
    });
});

export const getGarmentProductById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const product = await service.getGarmentProductById(req.params.id);
    return res.status(200).json({
        success: true,
        message: 'Garment product retrieved successfully',
        data: product,
    });
});

export const updateGarmentProduct = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const product = await service.updateGarmentProduct(req.params.id, req.body);
    return res.status(200).json({
        success: true,
        message: 'Garment product updated successfully',
        data: product,
    });
});

export const toggleGarmentProductStatus = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const product = await service.toggleGarmentProductStatus(req.params.id);
    return res.status(200).json({
        success: true,
        message: `Garment product ${product.status === 'Active' ? 'activated' : 'deactivated'} successfully`,
        data: product,
    });
});

export const deleteGarmentProduct = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const result = await service.deleteGarmentProduct(req.params.id);
    return res.status(200).json({
        success: true,
        message: result.message,
    });
});
