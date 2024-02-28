import { Request, Response } from "express";
import Stripe from "stripe";
import Restaurant from "../models/restaurant";
import MenuItem, { MenuItemType } from "../models/menu-item";
import Order from "../models/order";

const stripe = new Stripe(process.env.STRIPE_API_KEY!);
const FRONTEND_URL = process.env.FRONTEND_URL;
const STRIPE_ENDPOINT_SECRET = process.env.STRIPE_WEBHOOK_SECRET

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

const getMyOrders = async (req: Request, res: Response) => {
    try {
        const orders = await Order.find({
            user: req.userId
        }).populate("restaurant").populate("user");

        return res.status(200)
            .json(orders);

    } catch (error) {
        res.status(500).json({
            message: "Something went wrong"
        })
    }
}

const stripeWebhookHandler = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig as string,
            STRIPE_ENDPOINT_SECRET!);

    } catch (error: any) {
        return res.status(400).send(`Webhook Error: ${error.message}`)
    }

    if (event.type === "checkout.session.completed") {
        const order = await Order.findById(event.data.object.metadata ?.orderId);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            })
        }

        order.totalAmount = event.data.object.amount_total;
        order.status = "paid";

        await order.save()
    }

    return res.sendStatus(200);

}

const createCheckoutSession = async (req: Request, res: Response) => {
    try {
        const checkoutSessionRequest: CheckoutSessionRequest = req.body;
        const restaurant = await Restaurant.findById(checkoutSessionRequest.restaurantId);

        if (!restaurant) throw new Error("Restaurant not found");

        const menuItems = await MenuItem.find({
            restaurantId: restaurant._id
        })

        const newOrder = new Order({
            restaurant: restaurant._id,
            user: req.userId,
            status: "placed",
            deliveryDetails: checkoutSessionRequest.deliveryDetails,
            cartItems: checkoutSessionRequest.cartItems
        })

        const line_items = createLineItems(checkoutSessionRequest, menuItems);

        const session = await createSession(line_items, newOrder._id.toString(), restaurant.deliveryPrice, restaurant._id.toString(), checkoutSessionRequest.deliveryDetails.email);

        if (!session.url) return res.status(500).json({ message: "Error creating stripe session" });

        await newOrder.save();

        return res.json({
            url: session.url
        });

    } catch (error: any) {
        return res.status(500).json({
            message: error.raw.message
        })
    }
}

const createLineItems = (checkoutSessionRequest: CheckoutSessionRequest, menuItems: MenuItemType[]) => {
    const lineItems = checkoutSessionRequest.cartItems.map((cartItem) => {
        const menuItem = menuItems.find(item => item._id.toString() === cartItem.menuItemId.toString());

        if (!menuItem) {
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

const createSession = async (lineItems: Stripe.Checkout.SessionCreateParams.LineItem[], orderId: string, deliveryPrice: number, restaurantId: string, email: string) => {

    const sessionData = await stripe.checkout.sessions.create({
        line_items: lineItems,
        customer_email: email,
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
    getMyOrders,
    createCheckoutSession,
    stripeWebhookHandler
}