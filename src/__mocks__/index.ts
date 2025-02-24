import * as PAST_RANGE_DATA from './past-range-response.json';

export function getMockResponse(url: string) {
  switch (url) {
    case 'https://api.electricitymap.org/v3/zones':
      if (process.env.EMAPS_TOKEN === 'bad_token') {
        return Promise.reject({
          response: {
            status: 403,
            data: {
              error: 'Token is invalid',
            },
          },
        });
      } else if (process.env.EMAPS_TOKEN === 'good_token') {
        return Promise.resolve({
          status: 200,
          data: {
            VI: {countryName: 'USA', zoneName: 'Virgin Islands'},
            VN: {zoneName: 'Vietnam'},
          },
        });
      }
      return Promise.resolve({});
    case 'https://api.electricitymap.org/v3/carbon-intensity/past-range':
      return Promise.resolve({
        status: 200,
        data: PAST_RANGE_DATA,
      });
  }
  return Promise.resolve({});
}
