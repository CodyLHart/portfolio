export const getOAuthRedirectUrl = () => {
  if (typeof window === "undefined") {
    return undefined;
  }

  const url = new URL(window.location.href);

  if (url.hostname === "127.0.0.1" && url.port === "3001") {
    url.hostname = "localhost";
  }

  return url.toString();
};
