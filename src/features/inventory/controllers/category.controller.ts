import { Request, Response } from 'express';
import Category from '../models/category.model';
import GarmentItem from '../models/garment.model';

export async function getCategories(req: Request, res: Response) {
    try {
        const categories = await Category.find().sort({ name: 1 });
        return res.status(200).json({
            success: true,
            data: categories,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch categories',
        });
    }
}

export async function createCategory(req: Request, res: Response) {
    try {
        const { name } = req.body;
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required',
            });
        }

        const cleanName = name.trim();
        const existing = await Category.findOne({ name: { $regex: new RegExp(`^${cleanName}$`, 'i') } });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists',
            });
        }

        const category = await Category.create({ name: cleanName });
        return res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to create category',
        });
    }
}

export async function deleteCategory(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        // Check if any garment products are currently using this category
        const inUse = await GarmentItem.exists({ category: category.name });
        if (inUse) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category '${category.name}' because it is assigned to existing garment products.`,
            });
        }

        await Category.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: `Category '${category.name}' deleted successfully`,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete category',
        });
    }
}
