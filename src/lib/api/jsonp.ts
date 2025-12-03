/**
 * Simple JSONP implementation
 * @param url The URL to fetch
 * @param params Query parameters
 * @param callbackParam The name of the query parameter that specifies the callback function name (default: 'callback')
 */
export function jsonp<T>(
    url: string,
    params: Record<string, string>,
    callbackParam: string = 'callback'
): Promise<T> {
    return new Promise((resolve, reject) => {
        const callbackName = `jsonp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const script = document.createElement('script');

        // Construct URL with params
        const queryString = new URLSearchParams({
            ...params,
            [callbackParam]: callbackName,
        }).toString();

        script.src = `${url}?${queryString}`;
        script.async = true;

        // Define global callback
        (window as any)[callbackName] = (data: T) => {
            cleanup();
            resolve(data);
        };

        // Error handling
        script.onerror = () => {
            cleanup();
            reject(new Error(`JSONP request to ${url} failed`));
        };

        // Cleanup function
        const cleanup = () => {
            document.body.removeChild(script);
            delete (window as any)[callbackName];
        };

        document.body.appendChild(script);
    });
}
