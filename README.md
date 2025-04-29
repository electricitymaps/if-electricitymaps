# Electricity Maps Carbon Intensity

Electricity Maps provides historical, real-time, and forecastsed electricity data for more than 150 countries worldwide. Electricity Maps' API is used by leading companies around the world to power carbon-aware decisions. [Read more...](https://www.electricitymaps.com/product-features)

# Overview

The `ElectricityMapsCarbonIntensity` plugin uses [the Electricity Maps API](https://portal.electricitymaps.com/docs/getting-started#geolocation) to compute the average carbon intensity of electricity consumption for a given time period.

Electricity Maps' carbon intensity calculation follows a peer-reviewed methodology to trace back all electricity flows and calculate the carbon intensity of the electricity grid mix adjusted for electricity imports and exports. This provides the most accurate calculation of emissions from electricity consumption.

This plugin can be used to monitor or account for emissions resulting from electricity consumption. The intensity / emissions are aggregated over the duration of the event using hourly data from [the API](https://portal.electricitymaps.com/docs/api#carbon-intensity-past-range).


## Prerequisites

This plugin requires a [Commercial API token](https://www.electricitymaps.com/pricing) from Electricity Maps for authentication.

**Environment Variables**: Set the `EMAPS_TOKEN` environment variable to your API token.

```txt
EMAPS_TOKEN: <your_token>
```

# Inputs

The plugin requires the following inputs:

* `timestamp`: Timestamp of the recorded event (2021-01-01T00:00:00Z) RFC3339
* `longitude`: Longitude of the software system connected to a grid (12.5683). Required if `zone` is not provided.
* `latitude`: Latitude of the software system connected to a grid (55.6761). Required if `zone` is not provided.
* `zone`: Zone identifier of the grid (e.g. `PJM`). Required if `latitude` and `longitude` are not provided.
* `duration`: Duration of the recorded event in seconds (e.g. 3600 for one hour). A single event can last at most 10 days, so the maximum value of this parameter is 864000.
* (optional) `power_consumption`: You can provide the average power consumption in `kWh` for the duration of the event. This will allow the plugin to calulate the total emissions for the event. If this input is not provided, the plugin will calculate the average carbon intensity of the grid for the duration of the event and return the value in units of `gCO2eq`.

# Usage

### In Typescript

Configure the API token environment variable before running the code.

```bash
export EMAPS_TOKEN=your_token
```

```typescript
const plugin = ElectricityMapsCarbonIntensity();
const inputs = [
  {
    timestamp: '2024-03-18T01:36:00Z',
    longitude: 12.5683,
    latitude: 55.6761,
    duration: 3600,
  },
];
const outputs = await plugin.execute(inputs);
```

### Manifest usage

Configure the API token environment variable before running the code.

```bash
export EMAPS_TOKEN=your_token
```

#### Example Input

```yaml
name: electricitymaps-demo
description: example usage of electricitymaps model
tags:
initialize:
  plugins:
    if-electricitymaps:
      method: ElectricityMapsCarbonIntensity
      path: 'https://github.com/electricitymaps/if-electricitymaps'
tree:
  children:
    child:
      pipeline:
        compute:
          - if-electricitymaps
      inputs:
        - timestamp: '2024-03-18T01:36:00Z'
          longitude: 12.5683
          latitude: 55.6761
          duration: 3600
        - timestamp: '2024-03-18T01:36:00Z'
          longitude: 12.5683
          latitude: 55.6761
          duration: 3600
          power_consumption: 100
```

# Outputs

The model returns the average carbon intensity of the grid for the duration of the event. If the power consumption is provided, the model will also return the total emissions for the event.

In JSON (from Typescript):

```json
[
  {
    "carbon_intensity": 0.3,
    "unit": "kgCO2eq/kWh",
  },
  {
    "carbon_intensity": 0.3,
    "unit": "kgCO2eq",
  }
]
```

In YAML (from Manifest):

```yaml
outputs:
  - timestamp: '2024-03-18T01:36:00Z'
    longitude: 12.5683
    latitude: 55.6761
    duration: 3600
    carbonIntensity: 64.4
    unit: gCO2eq
  - timestamp: '2024-03-18T01:36:00Z'
    longitude: 12.5683
    latitude: 55.6761
    duration: 3600
    power_consumption: 100
    carbonIntensity: 6440.000000000001
    unit: gCO2eq/kWh
```
