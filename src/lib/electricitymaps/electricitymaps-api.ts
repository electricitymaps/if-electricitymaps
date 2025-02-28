import * as dotenv from 'dotenv';
import axios from 'axios';

import {ERRORS} from '@grnsft/if-core/utils';
import {buildErrorMessage} from '../util/helpers';

import {ElectricityMapsCarbonIntensityParams} from './types';
import {KeyValuePair} from '../types/common';
const {AuthorizationError, APIRequestError} = ERRORS;

export const ElectricityMapsAPI = () => {
  const BASE_URL = 'https://api.electricitymap.org/v3';
  let authToken = '';

  const errorBuilder = buildErrorMessage(ElectricityMapsAPI.name);

  /**
   * Loads ENV and validates credentials
   */
  const authenticate = async (): Promise<void> => {
    dotenv.config();

    const token = loadToken();
    const isAuthorized = await getZones(token);

    if (!isAuthorized) {
      throw new AuthorizationError(
        errorBuilder({
          message: 'Invalid API token',
          scope: 'authorization',
        })
      );
    }
    authToken = token;
  };

  /**
   * Validates that the `EMAPS_TOKEN` env var is set.
   */
  const loadToken = (): string => {
    const token = process.env.EMAPS_TOKEN;

    if (token) {
      return String(token);
    }

    throw new AuthorizationError(
      errorBuilder({
        message:
          'Invalid credentials provided. The `EMAPS_TOKEN` ENV variable is required',
      })
    );
  };

  /**
   * Fetches zones list to test authentication
   */
  const getZones = async (token: string): Promise<boolean> => {
    const url = `${BASE_URL}/zones`;
    let isAuthenticated = true;

    await axios
      .get(url, {
        headers: {
          'auth-token': token,
        },
      })
      .catch(error => {
        if (
          error.response.data &&
          error.response.data.error === 'Token is invalid'
        ) {
          isAuthenticated = false;
        } else {
          throw new APIRequestError(
            errorBuilder({
              message: `Error from Electricity Maps API. ${JSON.stringify(
                error?.message || error
              )}`,
            })
          );
        }
      });

    return isAuthenticated;
  };

  const getCarbonIntensity = async (
    params: ElectricityMapsCarbonIntensityParams
  ): Promise<KeyValuePair[]> => {
    const url = `${BASE_URL}/carbon-intensity/past-range`;

    const response = await axios
      .get(url, {
        params: params,
        headers: {
          'auth-token': authToken,
        },
      })
      .catch(error => {
        throw new APIRequestError(
          errorBuilder({
            message: `Error from Electricity Maps API. ${JSON.stringify(
              error?.message || error
            )}`,
          })
        );
      });

    if (response.status !== 200) {
      throw new APIRequestError(
        errorBuilder({
          message: `Error: ${JSON.stringify(response.status)}`,
        })
      );
    }

    const data: KeyValuePair[] = response.data.data;

    return data.map(carbonIntensityData => {
      return {
        datetime: carbonIntensityData.datetime,
        value: carbonIntensityData.carbonIntensity,
      };
    });
  };

  return {
    authenticate,
    getCarbonIntensity,
  };
};
