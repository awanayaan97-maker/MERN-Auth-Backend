
const dns = require("node:dns");

dns.setServers([
    "8.8.8.8",
    "8.8.4.4"
]);

require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const connectDB = require("./Config/db");
const authRoute = require("./Routes/authRoutes")
const userRoute = require("./Routes/userRoutes")


app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['X-CSRF-Token', 'X-Requested-With', 'Accept', 'Accept-Version', 'Content-Length', 'Content-MD5', 'Content-Type', 'Date', 'X-Api-Version', 'Authorization'],
    credentials: true
}));

app.use(express.json())

connectDB()

app.get("/", (req, res) => {
    res.send("<h1>Welcome To Our Website </h1>")
})

app.use("/api/auth", authRoute)
app.use("/api/user", userRoute)

const PORT = process.env.PORT

app.listen(PORT, () => {
    console.log(`Server is working on Port ${PORT}`);
})
