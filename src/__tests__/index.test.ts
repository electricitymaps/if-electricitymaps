import axios from 'axios';

import {ElectricityMapsCarbonIntensity} from '../lib';
import {getMockResponse} from '../__mocks__';
import {ERRORS} from '@grnsft/if-core/utils';

jest.mock('axios');

const mockAxios = axios as jest.Mocked<typeof axios>;
const {AuthorizationError, InputValidationError} = ERRORS;

mockAxios.get.mockImplementation(getMockResponse);

describe('lib/electricitymaps: ', () => {
  describe('ElectricityMapsCarbonIntensity: ', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('init ElectricityMapsCarbonIntensity: ', () => {
      it('initalizes object with properties.', async () => {
        const plugin = ElectricityMapsCarbonIntensity();
        expect(plugin).toHaveProperty('execute');
      });
    });

    describe('execute(): ', () => {
      it('throws an error given an invaild API token', async () => {
        process.env.EMAPS_TOKEN = 'bad_token';

        const plugin = ElectricityMapsCarbonIntensity();
        try {
          await plugin.execute([
            {
              timestamp: '2024-03-18T01:36:00Z',
              longitude: 12.5683,
              latitude: 55.6761,
              duration: 3600,
            },
          ]);
        } catch (error) {
          expect(error).toBeInstanceOf(AuthorizationError);
        }
      });

      it('throws an error in the absence of an API token', async () => {
        delete process.env.EMAPS_TOKEN;

        const plugin = ElectricityMapsCarbonIntensity();
        try {
          await plugin.execute([
            {
              timestamp: '2024-03-18T01:36:00Z',
              longitude: 12.5683,
              latitude: 55.6761,
              duration: 3600,
            },
          ]);
        } catch (error) {
          expect(error).toBeInstanceOf(AuthorizationError);
        }
      });

      it('throws an error given invalid inputs', async () => {
        process.env.EMAPS_TOKEN = 'good_token';

        const errorMessage =
          "ElectricityMapsCarbonIntensity(input): The 'longitude' field is required.";
        const plugin = ElectricityMapsCarbonIntensity();
        try {
          await plugin.execute([
            {
              timestamp: '2024-03-18T01:36:00Z',
              latitude: 55.6761,
              duration: 3600,
            },
          ]);
        } catch (error) {
          expect(error).toBeInstanceOf(InputValidationError);
          expect(error).toEqual(new InputValidationError(errorMessage));
        }
      });

      it('returns a result given valid inputs and API token', async () => {
        process.env.EMAPS_TOKEN = 'good_token';

        const plugin = ElectricityMapsCarbonIntensity();
        const result = await plugin.execute([
          {
            timestamp: '2024-03-18T01:36:00Z',
            longitude: 12.5683,
            latitude: 55.6761,
            duration: 7200,
          },
        ]);

        expect(result).toStrictEqual([
          {
            carbonIntensity: 331.6,
            duration: 7200,
            latitude: 55.6761,
            longitude: 12.5683,
            timestamp: '2024-03-18T01:36:00Z',
            unit: 'gCO2eq',
          },
        ]);
      });
    });

    process.env = originalEnv;
  });
});
