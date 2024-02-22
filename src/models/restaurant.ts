import mongoose from "mongoose";



const restaurantSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    name: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    deliveryPrice: {
        type: Number,
        required: true,
    },
    estimatedDeliveryTime: {
        type: Number,
        required: true
    },
    cuisines: [
        {
            type: String,
            required: true
        }
    ],
    imageUrl: {
        type: String,
        required: true
    }
},
    {
        timestamps: true
    })

const Restaurant = mongoose.model("Restaurant", restaurantSchema);
export default Restaurant;