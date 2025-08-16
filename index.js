const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// Store OTP sessions temporarily
const otpSessions = new Map();

//check
app.get("/", (req, res) => {
  res.send("Hello World from Express!");
});

// 1. Request OTP endpoint
app.post("/request-otp", async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  const formattedPhone = phone.startsWith("tel:") ? phone : `tel:${phone}`;

  const payload = {
    applicationId: "APP_009068",
    password: "eaedc033c41eae8485c0e206476140a5",
    subscriberId: formattedPhone,
    applicationHash: "abcdefgh",
    applicationMetaData: {
      client: "WEBAPP",
      device: "Browser",
      os: "Web",
      appCode: "webapp",
    },
  };

  try {
    const response = await axios.post(
      "https://api.mspace.lk/otp/request",
      payload,
      {
        headers: {
          "Content-Type": "application/json;charset=utf-8",
        },
      }
    );

    const timestamp = new Date(); // 📅 ISO timestamp

    if (response.data.statusCode === "S1000") {
      otpSessions.set(response.data.referenceNo, {
        phone: formattedPhone,
        verified: false,
        timestamp, // optionally store it too
      });
    }

    res.json({
      status: "success",
      timestamp, // ⏱ include in response
      data: response.data,
    });
  } catch (error) {
    console.error("OTP request failed:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 2. Verify OTP endpoint
app.post("/verify-otp", async (req, res) => {
  const { referenceNo, otp } = req.body;

  if (!referenceNo || !otp) {
    return res
      .status(400)
      .json({ error: "Reference number and OTP are required" });
  }

  const payload = {
    applicationId: "APP_009068",
    password: "eaedc033c41eae8485c0e206476140a5",
    referenceNo: referenceNo,
    otp: otp,
  };

  try {
    const response = await axios.post(
      "https://api.mspace.lk/otp/verify",
      payload,
      {
        headers: {
          "Content-Type": "application/json;charset=utf-8",
        },
      }
    );

    if (response.data.statusCode === "S1000") {
      const session = otpSessions.get(referenceNo);
      if (session) {
        session.verified = true;
        otpSessions.set(referenceNo, session);
      }
    }

    res.json({ status: "success", data: response.data });
  } catch (error) {
    console.error("OTP verification failed:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 3. Send SMS endpoint
app.post("/send-sms", async (req, res) => {
  const { phone, message, referenceNo } = req.body;

  if (!phone || !message || !referenceNo) {
    return res
      .status(400)
      .json({ error: "Phone, message, and reference number are required" });
  }

  const session = otpSessions.get(referenceNo);
  if (!session || !session.verified) {
    return res.status(403).json({ error: "OTP verification required" });
  }

  const payload = {
    version: "1.0",
    applicationId: "APP_009068",
    password: "eaedc033c41eae8485c0e206476140a5",
    message: message,
    destinationAddresses: [`tel:${phone}`],
  };

  try {
    const response = await axios.post(
      "https://api.mspace.lk/sms/send",
      payload,
      {
        headers: {
          "Content-Type": "application/json;charset=utf-8",
        },
      }
    );

    otpSessions.delete(referenceNo);
    res.json({ status: "success", data: response.data });
  } catch (error) {
    console.error("SMS send failed:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.listen(5000, "192.168.39.20", () => {
  console.log("Server running on 192.168.39.20:5000");
});
