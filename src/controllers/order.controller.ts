import { Request, Response } from "express";
import Stripe from "stripe";
import Restaurant from "../models/restaurant";
import MenuItem, { MenuItemType } from "../models/menu-item";

const stripe = new Stripe(process.env.STRIPE_API_KEY!);
const FRONTEND_URL = process.env.FRONTEND_URL

type CheckoutSessionRequest = {
    cartItems: {
        menuItemId: string;
        name: string;
        quantity: string;
    }[];
    restaurantId: string;
    deliveryDetails: {
        email: string;
        name: string;
        addressLine1: string;
        city: string;
        country: string;
    }
}

const createCheckoutSession = async(req: Request, res: Response) => {
    try {
        const checkoutSessionRequest: CheckoutSessionRequest = req.body;
        const restaurant = await Restaurant.findById(checkoutSessionRequest.restaurantId);

        if(!restaurant) throw new Error("Restaurant not found");

        const menuItems = await MenuItem.find({
            restaurantId: restaurant._id
        })
        const line_items = createLineItems(checkoutSessionRequest, menuItems);

        const session = await createSession(line_items,"TEST_ORDER_ID", restaurant.deliveryPrice, restaurant._id.toString());

        if(!session.url) return res.status(500).json({ message: "Error creating stripe session"});

        return res.json({
            url: session.url
        });
        
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            message: error.raw.message
        })
    }
}

const createLineItems = (checkoutSessionRequest: CheckoutSessionRequest, menuItems: MenuItemType[]) => {
    const lineItems = checkoutSessionRequest.cartItems.map((cartItem) => {
        const menuItem = menuItems.find(item => item._id.toString() === cartItem.menuItemId.toString());

        if(!menuItem){
            throw new Error(`Menu item not found: ${cartItem.menuItemId}`);
        }

        const line_item: Stripe.Checkout.SessionCreateParams.LineItem = {
            price_data: {
                currency: "usd",
                unit_amount: menuItem.price,
                product_data: {
                    name: menuItem.name,
                }
            },
            quantity: parseInt(cartItem.quantity)
        }
        return line_item;
    });

    return lineItems;

}

const createSession = async(lineItems: Stripe.Checkout.SessionCreateParams.LineItem[], orderId: string, deliveryPrice: number, restaurantId: string ) => {
    
    const sessionData = await stripe.checkout.sessions.create({
        line_items: lineItems,
        shipping_options: [
            {
                shipping_rate_data: {
                    display_name: "Delivery",
                    type: "fixed_amount",
                    fixed_amount: {
                        amount: deliveryPrice,
                        currency: "usd"
                    }
                
                }
            }
        ],
        mode: "payment",
        metadata: {
            orderId,
            restaurantId
        },
        success_url: `${FRONTEND_URL}/order-status?success=true`,
        cancel_url: `${FRONTEND_URL}/detail/${restaurantId}?canceled=true`
    });

    return sessionData;

}

export default {
    createCheckoutSession
}