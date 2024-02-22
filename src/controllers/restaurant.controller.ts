import mongoose from "mongoose";
import { Request, Response } from "express";
import { v2 as cloudinary } from 'cloudinary';

import Restaurant from "../models/restaurant";
import MenuItem from '../models/menu-item';

interface MenuItemProps {
    price: number;
    name: string
}

const createRestaurant = async (req: Request, res: Response) => {
    try {
        const existingRestaurant = await Restaurant.findOne({ user: req.userId });
        
        if (existingRestaurant) return res.status(409).json('You already have a restaurant');

        const image = req.file as Express.Multer.File;
        const base64Image = Buffer.from(image.buffer).toString("base64")
        const dataURI = `data:${image.mimetype};base64,${base64Image}`;

        const uploadResponse = await cloudinary.uploader.upload(dataURI);

        const restaurant = new Restaurant(req.body);

        restaurant.imageUrl = uploadResponse.url;
        restaurant.user = new mongoose.Types.ObjectId(req.userId);
        const savedRestaurant = await restaurant.save();

        const menuItemPromises = req.body.menuItems.map(async (menuItem: MenuItemProps) => {
            const newMenuItem = new MenuItem({
                price: menuItem.price,
                name: menuItem.name,
                restaurantId: new mongoose.Types.ObjectId(savedRestaurant._id),
            });

            return newMenuItem.save();
        })

        const savedMenuItems = await Promise.all(menuItemPromises);

        return res.status(201).json({
            restaurant: savedRestaurant,
            menuItems: savedMenuItems
        })

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        })
    }
};

export default {
    createRestaurant
}