import mongoose, { Document } from "mongoose";

const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant'
    }
})

export interface MenuItemType extends Document {
    name:  string;
    price: number;
    restaurantId: string;
 }

const MenuItem = mongoose.model<MenuItemType>('MenuItem', menuItemSchema);
export default MenuItem;