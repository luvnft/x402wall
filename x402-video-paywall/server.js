import express from "express";
import { paymentMiddleware } from "x402-express";
import dotenv from "dotenv";
import path from "path";
import { log } from "./utils/log.js";
import { videoAccessHandler } from "./handlers/videoAccessHandler.js";

dotenv.config();

const app = express();

// Use Base Sepolia (testnet) for development
const network = "base-sepolia";

// ✅ Use your own Cloudflare-deployed 402-server
const facilitatorObj = {
  url: "https://402-server.rpgdm2cbc4.workers.dev", // <-- Custom facilitator
};

// Serve static files from the public directory
app.use(express.static(path.join(process.cwd(), "public")));
app.use(express.json());

// x402 payment middleware configuration
app.use(
  paymentMiddleware(
    process.env.WALLET_ADDRESS, // Your wallet address
    {
      "GET /authenticate": {
        price: "$0.10", // Example price
        network,
      },
    },
    facilitatorObj
  )
);

// Log each request
app.use((req, res, next) => {
  const start = Date.now();
  log(`${req.method} ${req.url}`);
  log(`Request Headers: ${JSON.stringify(req.headers)}`);
  res.on("finish", () => {
    const duration = Date.now() - start;
    log(`${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Redirect to paywalled content after payment
app.get("/authenticate", (req, res) => {
  log("✅ Payment verified, serving content");
  res.redirect("/video-content");
});

// Actual gated video endpoint
app.get("/video-content", videoAccessHandler);

// Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

export default app;

// Local dev server
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 4021;
  app.listen(PORT, () => {
    console.log(`🚀 Server running at https://x402wall.vercel.app/:${PORT}`);
  });
}
