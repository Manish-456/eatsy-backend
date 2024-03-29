import { Request, Response } from "express";
import Restaurant from "../models/restaurant";
import MenuItem from "../models/menu-item";

const searchRestaurant = async (req: Request, res: Response) => {
    try {
        const city = req.params.city;

        const searchQuery = (req.query.searchQuery as string) || "";
        const selectedCuisines = req.query.selectedCuisines as string || "";
        const sortOption = req.query.sortOption as string || "updatedAt";

        const page = parseInt(req.query.page as string) || 1;

        let query: any = {};

        query["city"] = new RegExp(city, "i");

        const cityCheck = await Restaurant.countDocuments(query);

        if (cityCheck < 1) {
            return res.status(404).json({
                data: [],
                pagination: {
                    total: 0,
                    page: 1,
                    pages: 1
                }
            });
        }

        if (selectedCuisines) {
            const cuisinesArray = selectedCuisines.split(",").map(cuisine => new RegExp(cuisine, "i"))
            query["cuisines"] = { $all: cuisinesArray }
        }

        if (searchQuery) {
            const searchRegex = new RegExp(searchQuery, "i");
            query.$or = [
                {
                    name: { $regex: searchRegex }
                }, {
                    cuisines: {
                        $in: [searchRegex]
                    }
                }
            ]
        }

        const pageSize = 10;
        const skip = (page - 1) * pageSize;

        const restaurants = await Restaurant.find(query).sort({
            [sortOption]: 1
        }).skip(skip).limit(pageSize).sort({
            createdAt:  "desc"
        }).lean();

        const total = await Restaurant.countDocuments(query);

        const response = {
            data: restaurants,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / pageSize)  
            }
        }

        return res.json(response);
    } catch (error) {
        return res.status(500).json({
            message: `Something went wrong`
        })
    }
};

const getRestaurantDetails = async(req: Request, res: Response) => {
    try {
        const restaurantId = req.params.restaurantId;

        const restaurant = await Restaurant.findById(restaurantId)

        if (!restaurant) {
            return res.status(404).json({
                message: "Restaurant not found"
            })
        };

        const menuItems = await MenuItem.find({
            restaurantId: restaurant._id
        }).select('-restaurantId -__v');

        return res.json({
            restaurant,
            menuItems
        })
    } catch (error) {
        return res.status(500).json({
            message: `Failed to get restaurant details`
        })
    }
}

export default {
    searchRestaurant,
    getRestaurantDetails
}