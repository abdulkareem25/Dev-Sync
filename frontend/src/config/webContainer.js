import { WebContainer } from '@webcontainer/api';

let webContainerInstance = null;

export const getWebContainer = async () => {
  if (!self.crossOriginIsolated) {
    throw new Error(
      "SharedArrayBuffer requires crossOriginIsolated. Ensure your server includes the required headers."
    );
  }

  if(webContainerInstance === null) {
    webContainerInstance = await WebContainer.boot();
  }
  return webContainerInstance;
};

export const verifyThirdPartyResources = async (urls) => {
  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        const crossOriginResourcePolicy = response.headers.get('Cross-Origin-Resource-Policy');
        const accessControlAllowOrigin = response.headers.get('Access-Control-Allow-Origin');
        return {
          url,
          crossOriginResourcePolicy,
          accessControlAllowOrigin,
          supportsCrossOriginIsolated:
            crossOriginResourcePolicy === 'cross-origin' ||
            crossOriginResourcePolicy === 'same-origin',
        };
      } catch (error) {
        return { url, error: error.message };
      }
    })
  );
  return results;
};