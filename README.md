# Nike Drops Data Scraper

Node.js automation script that fetches and updates upcoming Nike and SNKRS product release data to MongoDB every 12 hours. The data powers the nikedrops app.

## Overview

This service automatically scrapes upcoming product release information from Nike's API for multiple countries and channels, storing structured data in MongoDB for consumption by the nikedrops app.

## Features

- **Multi-Country Support**: Fetches data for 10 countries (AU, JP, KR, SG, MY, FR, GB, CA, US, MX)
- **Dual Channel Tracking**: Monitors both SNKRS Web and Nike.com release channels
- **Automated Updates**: Refreshes data every 12 hours to ensure accuracy
- **Comprehensive Product Data**: Extracts product name, SKU, price, release date/time, images, and status
- **MongoDB Integration**: Stores data in organized collections for easy consumption by frontend applications
- **Localized Pricing**: Formats prices according to each country's currency and locale

## Configuration

The script is configured to fetch data for the following countries:

- **AU** - Australia
- **JP** - Japan
- **KR** - South Korea
- **SG** - Singapore
- **MY** - Malaysia
- **FR** - France
- **GB** - United Kingdom
- **CA** - Canada
- **US** - United States
- **MX** - Mexico

Data is fetched from two channels:

- SNKRS Web
- Nike.com

## Usage

The script will:

1. Connect to MongoDB
2. Fetch upcoming product data from Nike's API for all configured countries
3. Update the corresponding collections in the `sneakify` database
4. Repeat every 12 hours automatically

## Data Structure

Each product document includes:

| Field             | Type   | Description                                 |
| ----------------- | ------ | ------------------------------------------- |
| `id`              | UUID   | Unique identifier for the product           |
| `status`          | String | Product status (e.g., "ACTIVE", "UPCOMING") |
| `name`            | String | Full product name                           |
| `sku`             | String | Product SKU/style code                      |
| `price`           | String | Localized price with currency symbol        |
| `releaseDateTime` | Date   | Release date and time                       |
| `imageUrl`        | String | Product image URL                           |

## Database Collections

Data is organized in MongoDB collections by channel and country:

- **SNKRS Collections**: `snkrs-au`, `snkrs-jp`, `snkrs-kr`, etc.
- **Nike Collections**: `nike-au`, `nike-jp`, `nike-kr`, etc.

All collections are stored in the `sneakify` database.
