import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import { Resend } from "resend";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use lazy initialization for Stripe
  let stripe: Stripe | null = null;
  const getStripe = () => {
    if (!stripe && process.env.STRIPE_SECRET_KEY) {
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return stripe;
  };

  // Use lazy initialization for Resend
  let resend: Resend | null = null;
  const getResend = () => {
    if (!resend && process.env.RESEND_API_KEY) {
      resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
  };

  app.use(express.json());

  // API Routes
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { amount, userId } = req.body;
      const stripeClient = getStripe();
      
      if (!stripeClient) {
        return res.status(500).json({ error: "Stripe is not configured on the server." });
      }

      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `${amount} Neural Credits`,
                description: "Virtual currency for Voltair ecosystem",
              },
              unit_amount: Math.round((amount / 100) * 100), // Example: 1000 credits = $10.00
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.origin}/dashboard?payment=success`,
        cancel_url: `${req.headers.origin}/dashboard?payment=cancel`,
        metadata: {
          userId,
          amount: amount.toString(),
        },
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe Session Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/send-email", async (req, res) => {
    try {
      const { to, subject, html } = req.body;
      const resendClient = getResend();
      
      if (!resendClient) {
        return res.status(500).json({ error: "Resend is not configured on the server." });
      }

      const data = await resendClient.emails.send({
        from: "Nexus <onboarding@resend.dev>",
        to,
        subject,
        html,
      });

      res.json(data);
    } catch (error: any) {
      console.error("Resend Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
