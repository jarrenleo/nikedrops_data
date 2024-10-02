import { config } from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";
import { getUpcomingData } from "./data.js";
config();

const countries = ["SG", "MY", "JP", "KR", "FR", "GB", "CA", "US"];

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function updateData() {
  try {
    await client.connect();

    for (const country of countries) {
      const upcomingData = await Promise.allSettled([
        getUpcomingData("SNKRS Web", country),
        getUpcomingData("Nike.com", country),
      ]);

      const snkrsData = upcomingData[0]?.value;
      const nikeData = upcomingData[1]?.value;

      const db = client.db("sneakify");

      if (snkrsData && snkrsData.length) {
        const snkrsCollection = db.collection(`snkrs-${country.toLowerCase()}`);

        await snkrsCollection.deleteMany({});
        await snkrsCollection.insertMany(snkrsData);
      }

      if (nikeData && nikeData.length) {
        const nikeCollection = db.collection(`nike-${country.toLowerCase()}`);

        await nikeCollection.deleteMany({});
        await nikeCollection.insertMany(nikeData);
      }
      // console.log(`Updated ${country} data`);
    }
  } catch (error) {
    console.log(error.message);
  } finally {
    await client.close();
  }
}

setInterval(updateData, 1000 * 60 * 60);
// updateData();
