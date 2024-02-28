import mongoose from "mongoose";
import { Request, Response } from "express";
import { v2 as cloudinary } from 'cloudinary';

import Restaurant from "../models/restaurant";
import MenuItem from '../models/menu-item';
import Order from "../models/order";

interface MenuItemProps {
    _id?: string;
    price: number;
    name: string
}


const uploadImage = async (file: Express.Multer.File) => {
    const image = file;
    const base64Image = Buffer.from(image.buffer).toString("base64")
    const dataURI = `data:${image.mimetype};base64,${base64Image}`;

    const uploadResponse = await cloudinary.uploader.upload(dataURI);

    return {
        public_id: uploadResponse.public_id,
        imageUrl: uploadResponse.url
    }
}

const createRestaurant = async (req: Request, res: Response) => {
    try {
        const existingRestaurant = await Restaurant.findOne({ user: req.userId });

        if (existingRestaurant) return res.status(409).json('You already have a restaurant');
        const restaurant = new Restaurant(req.body);

        if (req.file) {
            const uploadResponse = await uploadImage(req.file);
            restaurant.imageUrl = uploadResponse.imageUrl;
            restaurant.publicId = uploadResponse.public_id;
        }

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
        return res.status(500).json({
            message: "Error creating restaurant"
        })
    }
};

const getMyRestaurant = async (req: Request, res: Response) => {
    try {
        const restaurant = await Restaurant.findOne({
            user: req.userId
        });

        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

        const menuItems = await MenuItem.find({
            restaurantId: restaurant._id
        });

        return res.status(200).json({ restaurant, menuItems });
    } catch (error) {
        return res.status(500).json({
            message: "Error fetching restaurant"
        })
    }
}

const removeRestaurantImage = async (req: Request, res: Response) => {
    try {
        const restaurant = await Restaurant.findOne({
            user: req.userId
        });;

        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

        const publicId = restaurant.publicId;
        if (publicId && restaurant.imageUrl) {

            await cloudinary.uploader.destroy(publicId, {
                resource_type: "image"
            });

            restaurant.imageUrl = '';
            restaurant.publicId = null;

            await restaurant.save();

            return res.status(200).json({
                message: "Restaurant image removed"
            });
        }

        return res.sendStatus(204);
    } catch (error) {
        return res.status(500).json({
            message: "Error deleting image"
        })
    }
}



const updateMyRestaurant = async (req: Request, res: Response) => {
    try {
        const { name, city, country, deliveryPrice, description, estimatedDeliveryTime, cuisines } = req.body;
        const restaurant = await Restaurant.findOne({
            user: req.userId
        });
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

        restaurant.name = name;
        restaurant.city = city;
        restaurant.country = country;
        restaurant.deliveryPrice = deliveryPrice;
        restaurant.estimatedDeliveryTime = estimatedDeliveryTime;
        restaurant.cuisines = cuisines;
        restaurant.description = description;

        if (req.file) {
            const uploadResponse = await uploadImage(req.file)
            restaurant.imageUrl = uploadResponse.imageUrl;
            restaurant.publicId = uploadResponse.public_id;
        }

        await restaurant.save();

        if (req.body.menuItems) {
            const menuItemPromises = req.body.menuItems.map(async (menuItem: MenuItemProps) => {
                const existingMenuItem = await MenuItem.findOne({ _id: menuItem._id, restaurantId: restaurant._id });

                if (existingMenuItem) {
                    existingMenuItem.name = menuItem.name,
                        existingMenuItem.price = menuItem.price
                    return existingMenuItem.save();
                } else {
                    const newMenuItem = new MenuItem({
                        price: menuItem.price,
                        name: menuItem.name,
                        restaurantId: restaurant._id,
                    });

                    return newMenuItem.save();
                }
            })

            const savedMenuItem = await Promise.all(menuItemPromises);

            return res.json({
                restaurant,
                savedMenuItem
            })
        };

        return res.json(restaurant);

    } catch (error) {
        return res.status(500).json({
            message: "Failed to update restaurant"
        })
    }
}

const getMyRestaurantOrder = async (req: Request, res: Response) => {
    try {
        const restaurant = await Restaurant.findOne({
            user: req.userId
        });

        if (!restaurant) return res.status(404).json({
            message: "Restaurant not found"
        });

        const orders = await Order.find({
            restaurant: restaurant._id
        }).populate("restaurant").populate("user").sort({
            createdAt: "desc"
        });

        return res.json(orders);

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong"
        })

    }
}

const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({
            message: "Order not found"
        });

        const restaurant = await Restaurant.findById(order.restaurant);

        if (restaurant ?.user ?._id.toString() !== req.userId) {
            return res.status(401).send()
        }

        if (status === "delivered") {
            await Order.findByIdAndDelete(orderId);
            return res.json({
                message: "Order is successfully delivered"
            })
        }

        order.status = status;
        await order.save();

        return res.json(order)
    } catch (error) {
        return res.status(500).json({
            message: "Failed to update order status"
        })
    }
}

export const removeMenuItem = async (req: Request, res: Response) => {
    try {
        const { menuItemId } = req.params;
        const userId = req.userId

        const existingRestaurant = await Restaurant.findOne({
            user: userId
        });

        if (!existingRestaurant) {
            return res.status(404).json({
            message: "Restaurant not found"
        });
    }
        const matchingOrder = await Order.findOne({
            cartItems: {
                $elemMatch: {
                    menuItemId
                }
            }
        });

        if (matchingOrder){ 
            return res.status(400).json({
            message: "Can't remove this menu. It has been ordered."
        });
    }
        await MenuItem.findByIdAndDelete(menuItemId);

        return res.status(200).json({
            message: "Menu Removed"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to remove menu"
        })
    }
}

export default {
    createRestaurant,
    getMyRestaurant,
    removeRestaurantImage,
    updateMyRestaurant,
    getMyRestaurantOrder,
    updateOrderStatus,
    removeMenuItem
}