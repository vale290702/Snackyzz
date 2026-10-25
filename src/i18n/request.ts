import { getRequestConfig } from "next-intl/server";

import { defaultLocale, timeZone } from "./config";
import { loadMessages } from "./messages";

// One locale and no URL prefix (DOM-16), so the locale never depends on the request.
export default getRequestConfig(async () => {
  const locale = defaultLocale;

  return {
    locale,
    timeZone,
    messages: await loadMessages(locale),
  };
});
