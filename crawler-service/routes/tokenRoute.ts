import express from "express";
const router = express.Router();

    const getEpochPlus24Hours = () => {
        const now = Date.now();
        const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
        const futureTimeInMs = now + twentyFourHoursInMs;
        const futureEpochInSeconds = Math.floor(futureTimeInMs / 1000);
        return futureEpochInSeconds;
    }

router.route("/").post(async (req, res) => {
    console.log("req for token", req.body);
        const response = await fetch(`${process.env.SKYFIRE_API_BASE_URL}/api/v1/tokens`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "skyfire-api-key": process.env.SKYFIRE_API_KEY,
            },
            body: JSON.stringify({
                type: "kya+pay",
                buyerTag: process.env.BUYER_TAG, 
                tokenAmount: "0.01", //tokenAmount,
                sellerServiceId: process.env.SELLER_SERVICE_ID,
                expiresAt: getEpochPlus24Hours(),
            }),
        });

        console.log("response",  response);

        const res1: { token: string } = await response.json();
        if (!res1) {
            console.error("Unable to create kya+pay token");
            return;
        }
        console.log("kya+pay token created", res1.token);
        res.status(200).json({"token": `${res1.token}`})
})

export default router;