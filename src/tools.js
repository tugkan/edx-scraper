const Apify = require('apify');
const routes = require('./routes');

const {
    utils: { log, puppeteer },
} = Apify;


// Iteratively fetch listing pages
// Intercept search requests
const getAPIRequests = async (listPages) => {
    log.info(`Getting request from ${listPages.length} list(s)`);
    const { proxyConfig } = global.userInput;

    // Open browser
    const browser = await Apify.launchPuppeteer({ ...proxyConfig, headless: true });
    const requests = [];

    // Iterate list urls
    for (const listPage of listPages) {
        // Open new page
        const page = await browser.newPage();

        // Block requests
        await puppeteer.blockRequests(page, {
            urlPatterns: ['.css', '.jpg', '.jpeg', '.png', '.svg', '.gif', '.woff', '.pdf', '.zip', '*ads*', '*analytics*', '*facebook*', '*optimizely*'],
        });

        // Set interception
        let interceptedRequest = null;
        await page.setRequestInterception(true);

        // Promisify requests
        const checkForSearchRequest = new Promise(resolve => page.on('request', (request) => {
            const requestUrl = request.url();
            if (requestUrl.includes('https://www.edx.org/api/v1/catalog/search')) {
                interceptedRequest = request.url();
                resolve();
            }
            request.continue();
        }));


        // Open page
        await page.goto(listPage, {
            waitFor: 'load',
            timeout: 120000,
        });


        // Intercept & search for API request
        await checkForSearchRequest;

        requests.push(interceptedRequest);
    }

    // Close browser
    await browser.close();

    return requests;
};

// Retrieves sources and returns object for request list
exports.getSources = async () => {
    log.info('Getting sources');

    // Get user input
    const { search, language, startUrls } = global.userInput;

    const listPages = [];
    const coursePages = [];

    // Check input combinations
    if (search && (!language || language === 'none')) {
        listPages.push(`https://www.edx.org/course?search_query=${search.toLowerCase().replace(' ', '+')}`);
    }

    if (language && language !== 'none' && !search) {
        listPages.push(`https://www.edx.org/course?language=${encodeURIComponent(language)}`);
    }

    if (language && language !== 'none' && search) {
        listPages.push(`https://www.edx.org/course?search_query=${search.toLowerCase().replace(' ', '+')}&language=${encodeURIComponent(language)}`);
    }

    if (startUrls && startUrls.length > 0) {
        startUrls.forEach((startUrl) => {
            startUrl.url = startUrl.url.replace('course/?', 'course?');
            if (startUrl.url.split('/').length === 5 && startUrl.url.includes('course')) {
                coursePages.push({
                    url: startUrl.url,
                    userData: {
                        label: 'COURSE',
                    },
                });
            } else {
                listPages.push(startUrl.url);
            }
        });
    }

    // Get API list links
    const foundListLinks = await getAPIRequests(listPages);

    return coursePages.concat(foundListLinks.map(foundListLink => ({
        url: foundListLink,
        userData: {
            label: 'LIST',
            baseURL: foundListLink,
            page: 1,
        },
    })));
};

// Create router
exports.createRouter = (globalContext) => {
    return async function (routeName, requestContext) {
        const route = routes[routeName];
        if (!route) throw new Error(`No route for name: ${routeName}`);
        log.debug(`Invoking route: ${routeName}`);
        return route(requestContext, globalContext);
    };
};


// Build proxy URL
exports.createProxyUrl = (session) => {
    const { proxyConfig } = global.userInput;

    // Random return of proxyUrls
    if (proxyConfig.proxyUrls && proxyConfig.proxyUrls.length > 0) {
        return proxyConfig.proxyUrls[Math.floor(Math.random() * proxyConfig.proxyUrls.length)];
    }

    // Build proxy url
    return `http://session-${session}${proxyConfig.apifyProxyGroups && proxyConfig.apifyProxyGroups.length > 0 ? `,groups-${proxyConfig.apifyProxyGroups.join('+')}` : ''}:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`;
};
