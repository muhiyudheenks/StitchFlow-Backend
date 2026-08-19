import mongoose from 'mongoose';
import GarmentProduct from '../models/garmentProductModel';
import GarmentItem from '../../inventory/models/garment.model';
import ProductionBatch from '../models/productionBatchModel';
import Task from '../../tasks/models/taskModel';
import { AppError } from '../../../shared/errors';

async function generateNextProductCode(): Promise<string> {
    const count = await GarmentProduct.countDocuments();
    return `GP-${(count + 1).toString().padStart(4, '0')}`;
}

export async function createGarmentProduct(data: any, createdBy: string) {
    const productName = data.productName ? data.productName.trim() : '';
    if (!productName) {
        throw AppError.badRequest('Product Name is required');
    }

    const existingName = await GarmentProduct.findOne({
        productName: { $regex: new RegExp(`^${productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    if (existingName) {
        throw AppError.badRequest(`Garment product '${productName}' already exists`);
    }

    let productCode = data.productCode ? data.productCode.trim().toUpperCase() : '';
    if (!productCode) {
        productCode = await generateNextProductCode();
    } else {
        const existingCode = await GarmentProduct.findOne({ productCode });
        if (existingCode) {
            throw AppError.badRequest(`Product code '${productCode}' already exists`);
        }
    }

    const product = new GarmentProduct({
        productName,
        productCode,
        category: data.category || 'Shirt',
        description: data.description || '',
        defaultTargetQuantity: Number(data.defaultTargetQuantity || data.targetQuantity || 100),
        status: data.status === 'Inactive' ? 'Inactive' : 'Active',
        createdBy: new mongoose.Types.ObjectId(createdBy),
    });

    await product.save();
    return product;
}

export async function getGarmentProducts(queryParams: { search?: string; category?: string; status?: string; page?: number; limit?: number }) {
    const search = queryParams.search ? queryParams.search.trim() : '';
    const category = queryParams.category ? queryParams.category.trim() : '';
    const status = queryParams.status ? queryParams.status.trim() : '';
    const page = Number(queryParams.page) || 1;
    const limit = Number(queryParams.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (search) {
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [{ productName: regex }, { productCode: regex }, { category: regex }, { description: regex }];
    }

    if (category && category !== 'All') {
        filter.category = category;
    }

    if (status && status !== 'All') {
        filter.status = status;
    }

    const [products, total] = await Promise.all([
        GarmentProduct.find(filter)
            .populate('createdBy', 'fullName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        GarmentProduct.countDocuments(filter),
    ]);

    return {
        products,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
}

export async function getActiveGarmentProducts() {
    const [catalogProducts, inventoryGarments] = await Promise.all([
        GarmentProduct.find({ status: { $ne: 'Inactive' } }).lean(),
        GarmentItem.find().lean(),
    ]);

    const productMap = new Map<string, any>();

    catalogProducts.forEach((p: any) => {
        const name = (p.productName || '').trim();
        const key = name.toLowerCase();
        if (name && !productMap.has(key)) {
            productMap.set(key, {
                _id: p._id.toString(),
                productName: name,
                productCode: p.productCode || `GP-${p._id.toString().slice(-4).toUpperCase()}`,
                category: p.category || 'Finished Garment',
                defaultTargetQuantity: p.defaultTargetQuantity || 100,
                description: p.description || '',
                status: p.status || 'Active',
            });
        }
    });

    inventoryGarments.forEach((g: any) => {
        const name = (g.productName || '').trim();
        const key = name.toLowerCase();
        if (name && !productMap.has(key)) {
            productMap.set(key, {
                _id: g._id.toString(),
                productName: name,
                productCode: g.productId || g.styleNumber || `FG-${g._id.toString().slice(-4).toUpperCase()}`,
                category: g.category || 'Finished Garment',
                defaultTargetQuantity: g.totalQuantity || g.quantityAvailable || 100,
                description: `${g.color || ''} ${g.size || ''}`.trim(),
                status: 'Active',
            });
        }
    });

    return Array.from(productMap.values()).sort((a, b) =>
        a.productName.localeCompare(b.productName)
    );
}

export async function getGarmentProductById(id: string) {
    const product = await GarmentProduct.findById(id).populate('createdBy', 'fullName email').lean();
    if (!product) {
        throw AppError.notFound('Garment product not found');
    }
    return product;
}

export async function updateGarmentProduct(id: string, updateData: any) {
    const product = await GarmentProduct.findById(id);
    if (!product) {
        throw AppError.notFound('Garment product not found');
    }

    if (updateData.productName && updateData.productName.trim() !== product.productName) {
        const newName = updateData.productName.trim();
        const existingName = await GarmentProduct.findOne({
            _id: { $ne: id },
            productName: { $regex: new RegExp(`^${newName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        });
        if (existingName) {
            throw AppError.badRequest(`Garment product name '${newName}' already exists`);
        }
        product.productName = newName;
    }

    if (updateData.productCode && updateData.productCode.trim().toUpperCase() !== product.productCode) {
        const newCode = updateData.productCode.trim().toUpperCase();
        const existingCode = await GarmentProduct.findOne({ _id: { $ne: id }, productCode: newCode });
        if (existingCode) {
            throw AppError.badRequest(`Product code '${newCode}' already exists`);
        }
        product.productCode = newCode;
    }

    if (updateData.category !== undefined) product.category = updateData.category;
    if (updateData.description !== undefined) product.description = updateData.description;
    if (updateData.defaultTargetQuantity !== undefined) product.defaultTargetQuantity = Number(updateData.defaultTargetQuantity);
    if (updateData.status !== undefined) product.status = updateData.status;

    await product.save();
    return product;
}

export async function toggleGarmentProductStatus(id: string) {
    const product = await GarmentProduct.findById(id);
    if (!product) {
        throw AppError.notFound('Garment product not found');
    }

    product.status = product.status === 'Active' ? 'Inactive' : 'Active';
    await product.save();
    return product;
}

export async function deleteGarmentProduct(id: string) {
    const product = await GarmentProduct.findById(id);
    if (!product) {
        throw AppError.notFound('Garment product not found');
    }

    const regex = new RegExp(`^${product.productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const [batchCount, taskCount] = await Promise.all([
        ProductionBatch.countDocuments({ $or: [{ garmentName: regex }, { productName: regex }] }),
        Task.countDocuments({ $or: [{ productName: regex }, { taskName: regex }] }),
    ]);

    if (batchCount > 0 || taskCount > 0) {
        throw AppError.badRequest(
            `Cannot delete '${product.productName}' because it is used in ${batchCount} production batch(es) and ${taskCount} task(s). You can deactivate it instead.`
        );
    }

    await GarmentProduct.findByIdAndDelete(id);
    return { message: 'Garment product deleted successfully' };
}

export const garmentProductService = {
    createGarmentProduct,
    getGarmentProducts,
    getActiveGarmentProducts,
    getGarmentProductById,
    updateGarmentProduct,
    toggleGarmentProductStatus,
    deleteGarmentProduct,
};
