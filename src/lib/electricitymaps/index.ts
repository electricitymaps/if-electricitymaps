import * as dayjs from 'dayjs';
import {buildErrorMessage} from '../util/helpers';
import {inputSchema} from '../util/schemas';
import {ElectricityMapsAPI} from './electricitymaps-api';

import {z, ZodError} from 'zod';
import {ERRORS} from '@grnsft/if-core/utils';
const {InputValidationError} = ERRORS;

import {PluginParams, PluginInterface} from '@grnsft/if-core/types';

export const ElectricityMapsCarbonIntensity = (): PluginInterface => {
  const metadata = {};
  const api = ElectricityMapsAPI();
  const errorBuilder = buildErrorMessage(ElectricityMapsCarbonIntensity.name);

  /**
   * Test and init authentication by making a test request to EMaps API.
   */
  const initializeAuthentication = async () => {
    await api.authenticate();
  };

  /**
   * Ensure inputs are valid.
   */
  const validateInputs = (inputs: PluginParams[]) => {
    const inputsSchema = z.array(inputSchema);
    try {
      inputsSchema.parse(inputs);
    } catch (error) {
      if (error instanceof ZodError) {
        error.errors.map(e => {
          throw new InputValidationError(
            errorBuilder({
              message: e.message,
              scope: 'input',
            })
          );
        });
      } else {
        throw error;
      }
    }
  };

  const execute = async (inputs: PluginParams[]): Promise<PluginParams[]> => {
    await initializeAuthentication();
    validateInputs(inputs);
    const result = [];

    for await (const input of inputs) {
      let unit = 'gCO2eq/kWh';
      let powerConsumption = input.power_consumption;

      if (!input.power_consumption) {
        powerConsumption = 1;
        unit = 'gCO2eq';
      }

      const start = dayjs(input.timestamp);
      const end = start.add(input.duration, 'second');

      const carbonIntensityParams = input.zone
        ? {
            zone: input.zone,
            start: start.toISOString(),
            end: end.toISOString(),
          }
        : {
            lon: input.longitude,
            lat: input.latitude,
            start: start.toISOString(),
            end: end.toISOString(),
          };

      const carbonIntensities = api.getCarbonIntensity(carbonIntensityParams);

      const numHours = Math.floor(input.duration / 3600);
      const blocks = [...Array(numHours).keys()];

      // For each full hour, calculate the ratio of the hour that is in the block
      const hourlyRatios = blocks.map(hour => {
        // This is the first hourly block, the ratio is the time between the start and the next hour.
        if (hour === 0) {
          return (
            start.add(1, 'hour').startOf('hour').diff(start, 'second') / 3600
          );
        }
        // This is the last hourly block, the ratio is the time between the start of the hour and the end.
        if (hour === numHours - 1) {
          return (
            end.diff(start.add(hour, 'hour').startOf('hour'), 'second') / 3600
          );
        }
        return 1;
      });

      const totalCarbonIntensity = await carbonIntensities.then(intensities =>
        intensities.reduce((memo, ci, index) => {
          memo += ci.value * hourlyRatios[index];
          return memo;
        }, 0)
      );

      result.push({
        ...input,
        carbonIntensity: totalCarbonIntensity * powerConsumption,
        unit: unit,
      });
    }

    return result;
  };

  return {
    metadata,
    execute,
  };
};
