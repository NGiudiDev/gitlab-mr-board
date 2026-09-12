// Revisado: 12/09

import { DEFAULT_API_BASE_URL } from "./features/api/constants/api.consts.js";

import { parseApiBaseUrl } from "./features/api/utils/api.utils.js";

export const config = {
  apiBaseUrl: parseApiBaseUrl(
    import.meta.env.VITE_API_BASE_URL,
    import.meta.env.PROD ? "" : DEFAULT_API_BASE_URL,
  ),
};
