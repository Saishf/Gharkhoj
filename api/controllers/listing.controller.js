import Listing from "../models/listing.model.js";
import { errorHandler } from "../utils/error.js";
import Groq from "groq-sdk";

/* ===========================
   CREATE LISTING
=========================== */
export const createListing = async (req, res, next) => {
    try {
        const listing = await Listing.create(req.body);
        return res.status(201).json(listing);
    } catch (error) {
        next(error);
    }
};

/* ===========================
   DELETE LISTING
=========================== */
export const deleteListing = async (req, res, next) => {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
        return next(errorHandler(404, "Listing not found!"));
    }

    if (req.user.id !== listing.userRef) {
        return next(errorHandler(401, "You can only delete your own listings!"));
    }

    try {
        await Listing.findByIdAndDelete(req.params.id);
        res.status(200).json("Listing has been deleted!");
    } catch (error) {
        next(error);
    }
};

/* ===========================
   UPDATE LISTING
=========================== */
export const updateListing = async (req, res, next) => {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
        return next(errorHandler(404, "Listing not found!"));
    }

    if (req.user.id !== listing.userRef) {
        return next(errorHandler(401, "You can only update your own listings!"));
    }

    try {
        const updatedListing = await Listing.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.status(200).json(updatedListing);
    } catch (error) {
        next(error);
    }
};

/* ===========================
   GET SINGLE LISTING
=========================== */
export const getListing = async (req, res, next) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return next(errorHandler(404, "Listing not found"));
        }

        res.status(200).json(listing);
    } catch (error) {
        next(error);
    }
};

/* ===========================
   GET LISTINGS (NORMAL SEARCH)
=========================== */
export const getListings = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 9;
        const startIndex = parseInt(req.query.startIndex) || 0;

        let offer = req.query.offer;
        if (offer === undefined || offer === "false") {
            offer = { $in: [false, true] };
        }

        let furnished = req.query.furnished;
        if (furnished === undefined || furnished === "false") {
            furnished = { $in: [false, true] };
        }

        let parking = req.query.parking;
        if (parking === undefined || parking === "false") {
            parking = { $in: [false, true] };
        }

        let type = req.query.type;
        if (type === undefined || type === "all") {
            type = { $in: ["sale", "rent"] };
        }

        const searchTerm = req.query.searchTerm || "";
        const sort = req.query.sort || "createdAt";
        const order = req.query.order || "desc";

        const listings = await Listing.find({
            $or: [
                { name: { $regex: searchTerm, $options: "i" } },
                { address: { $regex: searchTerm, $options: "i" } },
            ],
            offer,
            furnished,
            parking,
            type,
        })
            .sort({ [sort]: order })
            .limit(limit)
            .skip(startIndex);

        return res.status(200).json(listings);
    } catch (error) {
        next(error);
    }
};

/* ===========================
   AI SEARCH (NEW FEATURE)
=========================== */
export const aiSearch = async (req, res, next) => {
    try {
        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });

        const { query } = req.body;
        let modifiedQuery = query.replace(
            /(\d+)\s?bhk/gi,
            "$1 bedroom"
        );

        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant", // free + fast
            messages: [
                {
                    role: "system",
                    content: `
Return ONLY pure JSON.
No explanation.
No extra text.

Format:
{
  "location": string | null,
  "maxPrice": number | null,
  "minPrice": number | null,
  "bedrooms": number | null,
  "type": "rent" | "sale" | null
}
          `
                },
                { role: "user", content: modifiedQuery }
            ],
            temperature: 0,
        });

        let filters = {};

        try {
            filters = JSON.parse(
                completion.choices[0].message.content.trim()
            );
        } catch (err) {
            return res.status(200).json({
                filtersApplied: {},
                listings: []
            });
        }

        let mongoQuery = {};

        if (filters.location) {
            mongoQuery.address = { $regex: filters.location, $options: "i" };
        }

        if (filters.maxPrice) {
            mongoQuery.regularPrice = { $lte: filters.maxPrice };
        }

        if (filters.minPrice) {
            mongoQuery.regularPrice = {
                ...mongoQuery.regularPrice,
                $gte: filters.minPrice
            };
        }

        if (filters.bedrooms) {
            mongoQuery.bedrooms = filters.bedrooms;
        }

        if (filters.type) {
            mongoQuery.type = filters.type;
        }

        const listings = await Listing.find(mongoQuery).limit(9);

        return res.status(200).json({
            filtersApplied: filters,
            listings
        });

    } catch (error) {
        console.log("GROQ ERROR:", error);
        return res.status(200).json({
            filtersApplied: {},
            listings: []
        });
    }
};