import { randomUUID } from "crypto";

const locales = {
  SG: "en-SG",
  MY: "en-MY",
  JP: "ja-JP",
  KR: "ko-KR",
  FR: "fr-FR",
  GB: "en-GB",
  CA: "en-CA",
  US: "en-US",
};

const currencies = {
  SG: "SGD",
  MY: "MYR",
  JP: "JPY",
  KR: "KRW",
  FR: "EUR",
  GB: "GBP",
  CA: "CAD",
  US: "USD",
};

const languages = {
  SG: "en-GB",
  MY: "en-GB",
  JP: "ja",
  KR: "ko",
  FR: "fr",
  GB: "en-GB",
  CA: "en-GB",
  US: "en",
};

async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch nike data");

    const data = await response.json();
    if (!data.objects.length) throw new Error("No products found");

    return data;
  } catch (error) {
    throw Error(error.message);
  }
}

async function fetchUpcomingData(url, upcomingData = []) {
  try {
    const { pages, objects } = await fetchData(url);

    upcomingData.push(...objects);

    if (pages.next)
      return await fetchUpcomingData(
        `https://api.nike.com${pages.next}`,
        upcomingData
      );

    return upcomingData;
  } catch (error) {
    throw Error(error.message);
  }
}

function extractPublishedName(country, sku, publishedContent) {
  let publishedName;
  const title = publishedContent.properties.coverCard.title;
  const subtitle = publishedContent.properties.coverCard.subtitle;

  if (title && subtitle) {
    publishedName = `${subtitle} '${title}'`;
  } else {
    const seoTitle = publishedContent.properties.seo.title;
    if (!seoTitle.includes(`(${sku})`)) return;

    let startIndex = 0;
    if (country === "FR") startIndex = 21;

    let indexToDeduct = 2;
    if (country === "KR") indexToDeduct = 1;

    const endIndex = seoTitle.indexOf(sku) - indexToDeduct;

    publishedName = seoTitle.slice(startIndex, endIndex);
  }

  return publishedName;
}

function formatPrice(price, country) {
  if (!price) return "-";

  const locale = locales[country];
  const currency = currencies[country];

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

function extractImageUrl(channel, publishedContent) {
  if (channel === "SNKRS Web")
    return publishedContent.coverCard.properties.squarishURL;

  return publishedContent.productCard.properties.squarishURL;
}

export async function getUpcomingData(channel, country) {
  try {
    const language = languages[country];

    const upcomingData = await fetchUpcomingData(
      `https://api.nike.com/product_feed/threads/v3/?count=100&filter=marketplace(${country})&filter=language(${language})&filter=upcoming(true)&filter=channelName(${channel})&filter=exclusiveAccess(true,false)&sort=productInfo.merchProduct.commerceStartDateAsc`
    );

    const upcomingProducts = [];

    for (const data of upcomingData) {
      const productsInfo = data?.productInfo;
      if (!productsInfo) continue;

      for (const productInfo of productsInfo) {
        const status = productInfo.merchProduct.status;
        if (status === "CLOSEOUT") continue;

        const id = randomUUID();
        const sku = productInfo.merchProduct.styleColor;

        let name = productInfo.productContent.fullTitle;
        if (channel === "SNKRS Web" && productsInfo.length === 1)
          name =
            extractPublishedName(country, sku, data.publishedContent) ||
            productInfo.productContent.fullTitle;

        const price = formatPrice(
          +productInfo.merchPrice.currentPrice,
          country,
          productInfo.merchPrice.currency
        );
        const releaseDateTime = new Date(
          productInfo.launchView?.startEntryDate ||
            productInfo.merchProduct.commerceStartDate
        );
        const imageUrl = extractImageUrl(
          channel,
          data.publishedContent.properties
        );

        upcomingProducts.push({
          id,
          status,
          name,
          sku,
          price,
          releaseDateTime,
          imageUrl,
        });
      }
    }

    const upcomingProductsSortedByDateTime = upcomingProducts.sort(
      (a, b) => a.releaseDateTime - b.releaseDateTime
    );

    return upcomingProductsSortedByDateTime;
  } catch (error) {
    throw Error(error.message);
  }
}
