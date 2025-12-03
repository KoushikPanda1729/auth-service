import express from "express";

const app = express();

app.get("/", (req, res) => {
    res.send("Wellcome to auth service");
});

export default app;
