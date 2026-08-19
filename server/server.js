import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import session from "express-session";

dotenv.config();

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true
    }
  })
);

const LOGIN_URL = "https://login.salesforce.com";

const OBJECT_CONFIG = {
  Account: ["Name", "Phone", "Website", "Industry", "Type"],
  Contact: ["FirstName", "LastName", "Email", "Phone", "Title"],
  Lead: ["FirstName", "LastName", "Company", "Email", "Phone"],
  Opportunity: ["Name", "StageName", "CloseDate", "Amount", "Type"],
  Case: ["CaseNumber", "Subject", "Status", "Priority", "Origin"]
};


// OAuth LOGIN WITH PKCE
app.get("/auth/login", (req, res) => {
  // Generate a random verifier
  const codeVerifier = crypto
    .randomBytes(32)
    .toString("base64url");

  // Generate SHA256 challenge
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  // Store verifier in session
  req.session.codeVerifier = codeVerifier;

  console.log("PKCE challenge generated");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SALESFORCE_CLIENT_ID,
    redirect_uri: process.env.SALESFORCE_REDIRECT_URI,
    code_challenge: codeChallenge,
    code_challenge_method: "S256"
  });

  res.redirect(
    `${LOGIN_URL}/services/oauth2/authorize?${params.toString()}`
  );
});


// OAuth CALLBACK
app.get("/auth/callback", async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        error: "Authorization code not received"
      });
    }

    if (!req.session.codeVerifier) {
      return res.status(400).json({
        error: "PKCE code verifier not found"
      });
    }

    const response = await axios.post(
      `${LOGIN_URL}/services/oauth2/token`,
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.SALESFORCE_CLIENT_ID,
        client_secret: process.env.SALESFORCE_CLIENT_SECRET,
        redirect_uri: process.env.SALESFORCE_REDIRECT_URI,
        code_verifier: req.session.codeVerifier
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    delete req.session.codeVerifier;

    req.session.salesforce = {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      instanceUrl: response.data.instance_url
    };

    console.log("Salesforce login successful");

    res.redirect(process.env.FRONTEND_URL);

  } catch (error) {
    console.error(
      "Salesforce authentication error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      error: "Salesforce authentication failed",
      details: error.response?.data || error.message
    });
  }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});