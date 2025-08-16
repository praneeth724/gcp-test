// const express = require("express");
// const bodyParser = require("body-parser");
// const axios = require("axios");

// const app = express();
// app.use(bodyParser.json());

// // Store OTP sessions temporarily
// const otpSessions = new Map();

// //check
// app.get("/", (req, res) => {
//   res.send("Hello World from Express!");
// });

// // 1. Request OTP endpoint
// app.post("/request-otp", async (req, res) => {
//   const { phone } = req.body;

//   if (!phone) {
//     return res.status(400).json({ error: "Phone number is required" });
//   }

//   const formattedPhone = phone.startsWith("tel:") ? phone : `tel:${phone}`;

//   const payload = {
//     applicationId: "APP_009068",
//     password: "eaedc033c41eae8485c0e206476140a5",
//     subscriberId: formattedPhone,
//     applicationHash: "abcdefgh",
//     applicationMetaData: {
//       client: "WEBAPP",
//       device: "Browser",
//       os: "Web",
//       appCode: "webapp",
//     },
//   };

//   try {
//     const response = await axios.post(
//       "https://api.mspace.lk/otp/request",
//       payload,
//       {
//         headers: {
//           "Content-Type": "application/json;charset=utf-8",
//         },
//       }
//     );

//     const timestamp = new Date(); // 📅 ISO timestamp

//     if (response.data.statusCode === "S1000") {
//       otpSessions.set(response.data.referenceNo, {
//         phone: formattedPhone,
//         verified: false,
//         timestamp, // optionally store it too
//       });
//     }

//     res.json({
//       status: "success",
//       timestamp, // ⏱ include in response
//       data: response.data,
//     });
//   } catch (error) {
//     console.error("OTP request failed:", error.message);
//     res.status(500).json({ status: "error", message: error.message });
//   }
// });

// // 2. Verify OTP endpoint
// app.post("/verify-otp", async (req, res) => {
//   const { referenceNo, otp } = req.body;

//   if (!referenceNo || !otp) {
//     return res
//       .status(400)
//       .json({ error: "Reference number and OTP are required" });
//   }

//   const payload = {
//     applicationId: "APP_009068",
//     password: "eaedc033c41eae8485c0e206476140a5",
//     referenceNo: referenceNo,
//     otp: otp,
//   };

//   try {
//     const response = await axios.post(
//       "https://api.mspace.lk/otp/verify",
//       payload,
//       {
//         headers: {
//           "Content-Type": "application/json;charset=utf-8",
//         },
//       }
//     );

//     if (response.data.statusCode === "S1000") {
//       const session = otpSessions.get(referenceNo);
//       if (session) {
//         session.verified = true;
//         otpSessions.set(referenceNo, session);
//       }
//     }

//     res.json({ status: "success", data: response.data });
//   } catch (error) {
//     console.error("OTP verification failed:", error.message);
//     res.status(500).json({ status: "error", message: error.message });
//   }
// });

// // 3. Send SMS endpoint
// app.post("/send-sms", async (req, res) => {
//   const { phone, message, referenceNo } = req.body;

//   if (!phone || !message || !referenceNo) {
//     return res
//       .status(400)
//       .json({ error: "Phone, message, and reference number are required" });
//   }

//   const session = otpSessions.get(referenceNo);
//   if (!session || !session.verified) {
//     return res.status(403).json({ error: "OTP verification required" });
//   }

//   const payload = {
//     version: "1.0",
//     applicationId: "APP_009068",
//     password: "eaedc033c41eae8485c0e206476140a5",
//     message: message,
//     destinationAddresses: [`tel:${phone}`],
//   };

//   try {
//     const response = await axios.post(
//       "https://api.mspace.lk/sms/send",
//       payload,
//       {
//         headers: {
//           "Content-Type": "application/json;charset=utf-8",
//         },
//       }
//     );

//     otpSessions.delete(referenceNo);
//     res.json({ status: "success", data: response.data });
//   } catch (error) {
//     console.error("SMS send failed:", error.message);
//     res.status(500).json({ status: "error", message: error.message });
//   }
// });

// app.listen(5000, "192.168.39.20", () => {
//   console.log("Server running on 192.168.39.20:5000");
// });
// server.js
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());              // if your frontend calls from browser
app.use(express.json());      // bodyParser not needed on modern Express

// env vars
const {
  APP_ID,
  APP_PASSWORD,
  APP_HASH,
  PORT = 5000
} = process.env;

// simple in-memory store (OK for demo; use Redis/DB for real apps)
const otpSessions = new Map();

app.get("/", (req, res) => {
  res.send("Hello World from Express!");
});

app.post("/request-otp", async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Phone number is required" });

  const formattedPhone = phone.startsWith("tel:") ? phone : `tel:${phone}`;
  const payload = {
    applicationId: APP_ID,
    password: APP_PASSWORD,
    subscriberId: formattedPhone,
    applicationHash: APP_HASH,
    applicationMetaData: { client: "WEBAPP", device: "Browser", os: "Web", appCode: "webapp" },
  };

  try {
    const r = await axios.post("https://api.mspace.lk/otp/request", payload, {
      headers: { "Content-Type": "application/json;charset=utf-8" },
    });
    const timestamp = new Date();
    if (r.data.statusCode === "S1000") {
      otpSessions.set(r.data.referenceNo, { phone: formattedPhone, verified: false, timestamp });
    }
    res.json({ status: "success", timestamp, data: r.data });
  } catch (e) {
    console.error("OTP request failed:", e.message);
    res.status(500).json({ status: "error", message: e.message });
  }
});

app.post("/verify-otp", async (req, res) => {
  const { referenceNo, otp } = req.body;
  if (!referenceNo || !otp) return res.status(400).json({ error: "Reference number and OTP are required" });

  const payload = { applicationId: APP_ID, password: APP_PASSWORD, referenceNo, otp };
  try {
    const r = await axios.post("https://api.mspace.lk/otp/verify", payload, {
      headers: { "Content-Type": "application/json;charset=utf-8" },
    });
    if (r.data.statusCode === "S1000") {
      const s = otpSessions.get(referenceNo);
      if (s) { s.verified = true; otpSessions.set(referenceNo, s); }
    }
    res.json({ status: "success", data: r.data });
  } catch (e) {
    console.error("OTP verification failed:", e.message);
    res.status(500).json({ status: "error", message: e.message });
  }
});

app.post("/send-sms", async (req, res) => {
  const { phone, message, referenceNo } = req.body;
  if (!phone || !message || !referenceNo) {
    return res.status(400).json({ error: "Phone, message, and reference number are required" });
  }
  const s = otpSessions.get(referenceNo);
  if (!s || !s.verified) return res.status(403).json({ error: "OTP verification required" });

  const payload = {
    version: "1.0",
    applicationId: APP_ID,
    password: APP_PASSWORD,
    message,
    destinationAddresses: [`tel:${phone}`],
  };

  try {
    const r = await axios.post("https://api.mspace.lk/sms/send", payload, {
      headers: { "Content-Type": "application/json;charset=utf-8" },
    });
    otpSessions.delete(referenceNo);
    res.json({ status: "success", data: r.data });
  } catch (e) {
    console.error("SMS send failed:", e.message);
    res.status(500).json({ status: "error", message: e.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
