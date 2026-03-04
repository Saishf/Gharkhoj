import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ListingItem from "../components/ListingItem";

export default function Search() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebardata, setSidebardata] = useState({
    searchTerm: "",
    type: "all",
    parking: false,
    furnished: false,
    offer: false,
    sort: "created_at",
    order: "desc",
  });

  const [showMore, setShowMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState([]);

  // ✅ AI STATES
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFilters, setAiFilters] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);

    const searchTermFromUrl = urlParams.get("searchTerm");
    const typeFromUrl = urlParams.get("type");
    const parkingFromUrl = urlParams.get("parking");
    const furnishedFromUrl = urlParams.get("furnished");
    const offerFromUrl = urlParams.get("offer");
    const sortFromUrl = urlParams.get("sort");
    const orderFromUrl = urlParams.get("order");

    if (
      searchTermFromUrl ||
      typeFromUrl ||
      parkingFromUrl ||
      furnishedFromUrl ||
      offerFromUrl ||
      sortFromUrl ||
      orderFromUrl
    ) {
      setSidebardata({
        searchTerm: searchTermFromUrl || "",
        type: typeFromUrl || "all",
        parking: parkingFromUrl === "true",
        furnished: furnishedFromUrl === "true",
        offer: offerFromUrl === "true",
        sort: sortFromUrl || "created_at",
        order: orderFromUrl || "desc",
      });
    }

    const fetchListings = async () => {
      setLoading(true);
      setShowMore(false);

      const searchQuery = urlParams.toString();
      const res = await fetch(`/api/listing/get?${searchQuery}`);
      const data = await res.json();

      if (data.length > 8) setShowMore(true);

      setListings(data);
      setLoading(false);
    };

    fetchListings();
  }, [location.search]);

  const handleChange = (e) => {
    if (["all", "rent", "sale"].includes(e.target.id)) {
      setSidebardata({ ...sidebardata, type: e.target.id });
    }

    if (e.target.id === "searchTerm") {
      setSidebardata({ ...sidebardata, searchTerm: e.target.value });
    }

    if (["parking", "furnished", "offer"].includes(e.target.id)) {
      setSidebardata({
        ...sidebardata,
        [e.target.id]: e.target.checked,
      });
    }

    if (e.target.id === "sort_order") {
      const sort = e.target.value.split("_")[0];
      const order = e.target.value.split("_")[1];
      setSidebardata({ ...sidebardata, sort, order });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const urlParams = new URLSearchParams();
    Object.entries(sidebardata).forEach(([key, value]) =>
      urlParams.set(key, value),
    );

    navigate(`/search?${urlParams.toString()}`);
  };

  const onShowMoreClick = async () => {
    const startIndex = listings?.length;

    const urlParams = new URLSearchParams(location.search);
    urlParams.set("startIndex", startIndex);

    const res = await fetch(`/api/listing/get?${urlParams.toString()}`);
    const data = await res.json();

    if (data.length < 9) setShowMore(false);

    setListings([...listings, ...data]);
  };

  // ✅ AI SEARCH FUNCTION
  const handleAiSearch = async () => {
    if (!aiQuery) return;

    try {
      setAiLoading(true);
      setLoading(true);

      const res = await fetch("/api/listing/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiQuery }),
      });

      const data = await res.json();

      setListings(data.listings || []);
      setAiFilters(data.filtersApplied);
      setShowMore(false);
    } catch (error) {
      console.log(error);
    } finally {
      setAiLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row">
      <div className="p-7 border-b-2 md:border-r-2 md:min-h-screen">
        {/* ✅ AI SEARCH UI */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h2 className="font-semibold mb-2">✨ AI Search</h2>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="2BHK in Pune under 25000 rent..."
              className="border rounded-lg p-3 w-full"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
            />
            <button
              type="button"
              onClick={handleAiSearch}
              className="bg-blue-600 text-white px-4 rounded-lg"
            >
              {aiLoading ? "..." : "Go"}
            </button>
          </div>

          {/* {aiFilters && (
            <p className="text-sm mt-2 text-gray-600">
              🤖 AI understood: {JSON.stringify(aiFilters)}
            </p>
          )} */}
        </div>

        {/* NORMAL FILTER FORM */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="flex items-center gap-2">
            <label className="font-semibold">Search Term:</label>
            <input
              type="text"
              id="searchTerm"
              className="border rounded-lg p-3 w-full"
              value={sidebardata.searchTerm}
              onChange={handleChange}
            />
          </div>

          <button className="bg-slate-700 text-white p-3 rounded-lg uppercase">
            Search
          </button>
        </form>
      </div>

      <div className="flex-1">
        <h1 className="text-3xl font-semibold border-b p-3 text-slate-700 mt-5">
          Listing results:
        </h1>

        <div className="p-7 flex flex-wrap gap-4">
          {!loading && listings.length === 0 && (
            <p className="text-xl text-slate-700">No listing found!</p>
          )}

          {loading && (
            <p className="text-xl text-slate-700 w-full text-center">
              Loading...
            </p>
          )}

          {!loading &&
            listings.map((listing) => (
              <ListingItem key={listing._id} listing={listing} />
            ))}

          {showMore && (
            <button
              onClick={onShowMoreClick}
              className="text-green-700 hover:underline p-7 w-full"
            >
              Show more
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
