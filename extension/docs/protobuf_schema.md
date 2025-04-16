# Google Flights Protobuf Schema Documentation

This document outlines the reverse-engineered Protobuf schema used by Google Flights API for data exchange.

## Request Schema

The request to Google Flights is sent via the `tfs` URL parameter, which appears to be a Base64-encoded Protobuf message.

### Key Fields

| Field ID | Type | Description | Example |
|----------|------|-------------|---------|
| 1 | string | Origin airport code | "JFK" |
| 2 | string | Destination airport code | "LHR" |
| 3 | string | Departure date (YYYY-MM-DD) | "2023-12-15" |
| 4 | string | Return date (YYYY-MM-DD) | "2023-12-22" |
| 5 | int32 | Number of adults | 1 |
| 6 | int32 | Number of children | 0 |
| 7 | int32 | Number of infants | 0 |
| 8 | int32 | Cabin class (1=economy, 2=premium_economy, 3=business, 4=first) | 1 |

## Response Schema

The response is embedded in the HTML of the Google Flights results page, typically within a JavaScript variable.

### Key Fields

| Field ID | Type | Description | Example |
|----------|------|-------------|---------|
| 1 | repeated FlightResult | List of flight results | |

### FlightResult Schema

| Field ID | Type | Description | Example |
|----------|------|-------------|---------|
| 1 | int32 | Price in cents/lowest currency unit | 45000 (= $450.00) |
| 2 | string | Currency code | "USD" |
| 3 | int32 | Duration in minutes | 480 (= 8h) |
| 4 | int32 | Number of stops | 1 |
| 5 | string | Airline code/name | "DL" or "Delta" |
| 6 | int64 | Departure time (timestamp) | 1671091200000 |
| 7 | int64 | Arrival time (timestamp) | 1671109200000 |
| 8 | string | Origin airport | "JFK" |
| 9 | string | Destination airport | "LHR" |
| 10 | string | Departure date | "2023-12-15" |
| 11 | string | Return date | "2023-12-22" |

## Notes on Implementation

This is a simplified schema based on observation. The actual Google Flights schema is much more complex, with additional fields for:
- Multiple flight segments
- Layover details
- Fare class/booking class
- Baggage allowance 
- Aircraft information
- Etc.

The actual implementation would require significant additional reverse engineering and testing.