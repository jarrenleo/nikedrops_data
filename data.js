import { randomUUID } from "crypto";

const locales = {
  JP: "ja-JP",
  KR: "ko-KR",
  SG: "en-SG",
  MY: "en-MY",
  FR: "fr-FR",
  GB: "en-GB",
  CA: "en-CA",
  AU: "en-AU",
  US: "en-US",
  MX: "es-MX",
};

const currencies = {
  JP: "JPY",
  KR: "KRW",
  SG: "SGD",
  MY: "MYR",
  FR: "EUR",
  GB: "GBP",
  CA: "CAD",
  AU: "AUD",
  US: "USD",
  MX: "MXN",
};

const languages = {
  JP: "ja",
  KR: "ko",
  SG: "en-GB",
  MY: "en-GB",
  FR: "fr",
  GB: "en-GB",
  CA: "en-GB",
  AU: "en-GB",
  US: "en",
  MX: "es-419",
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
    if (country === "MX") startIndex = 28;

    let indexToDeduct = 2;
    if (country === "KR" || country === "MX") indexToDeduct = 1;

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

async function extractImageUrl(sku) {
  const response = await fetch(
    `https://secure-images.nike.com/is/image/DotCom/${sku.replace("-", "_")}`
  );
  const imageUrl = response.url.replace(
    "rgb:FFFFFF,q_auto,h_400",
    "rgb:D4D4D4,q_auto,h_720"
  );

  return imageUrl;
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
        const imageUrl = await extractImageUrl(sku);

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
