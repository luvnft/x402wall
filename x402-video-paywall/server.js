import express from "express";
import { paymentMiddleware } from "x402-express";
import dotenv from "dotenv";
import path from "path";
import { log } from "./utils/log.js";
import { videoAccessHandler } from "./handlers/videoAccessHandler.js";

dotenv.config();

const app = express();

// Network configuration
const network = "base-sepolia"; // Using Base Sepolia testnet

// Facilitator configuration
const facilitatorObj = {
  url: "https://402-server.rpgdm2cbc4.workers.dev",
};

// Middleware setup
app.use(express.static(path.join(process.cwd(), "public")));
app.use(express.json());

// x402 payment middleware - corrected configuration
app.use(
  paymentMiddleware({
    walletAddress: process.env.WALLET_ADDRESS,
    routes: {
      "/authenticate": {  // Changed from "GET /authenticate" to "/authenticate"
        price: "$0.10",
        network,
        method: "GET"  // Explicitly specify the method
      },
    },
    facilitator: facilitatorObj
  })
);

// Enhanced logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  log(`Incoming request: ${req.method} ${req.url}`);
  log(`Headers: ${JSON.stringify(req.headers)}`);
  log(`Query params: ${JSON.stringify(req.query)}`);
  next();
});

// Payment verification endpoint - modified to handle verification properly
app.get("/authenticate", (req, res, next) => {
  log("Payment verification in progress...");
  
  // The paymentMiddleware should have already verified the payment
  // We just need to handle the successful case
  log("✅ Payment verified, redirecting to content");
  res.redirect("/video-content");
});

// Protected content endpoint
app.get("/video-content", videoAccessHandler);

// Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  log(`❌ Error: ${err.message}`);
  res.status(500).json({ error: "Payment processing failed" });
});

// Server setup
const PORT = process.env.PORT || 4021;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

export default app;
