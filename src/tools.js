const Apify = require('apify');
const routes = require('./routes');

const {
    utils: { log, puppeteer },
} = Apify;


// Iteratively fetch listing pages
// Infinite scroll
// Fetch all the links
const getCourseLinks = async (listPages) => {
    log.info(`Getting course links from ${listPages.length} list(s)`);
    const { proxyConfig } = global.userInput;
    let foundCourseLinks = [];

    // Open browser
    const browser = await Apify.launchPuppeteer({ ...proxyConfig, headless: true });
    // Open new page
    const page = await browser.newPage();

    // Block requests
    await puppeteer.blockRequests(page, {
        urlPatterns: ['.jpg', '.jpeg', '.png', '.svg', '.gif', '.woff', '.pdf', '.zip', '*ads*', '*analytics*', '*facebook*', '*optimizely*'],
    });

    // Iterate list urls
    for (const listPage of listPages) {
        // Open page
        await page.goto(listPage, { timeout: 120000 });

        // Infinite scroll
        await puppeteer.infiniteScroll(page, {
            waitForSecs: 20,
        });

        // Fetch and concat links
        const links = await page.evaluate(() => Array.from(
            document.querySelectorAll('.discovery-card a'),
        ).map(link => link.href).filter(link => link.href.includes('https://www.edx.org/course')));
        foundCourseLinks = foundCourseLinks.concat(links);
    }

    return foundCourseLinks;
};

// Retrieves sources and returns object for request list
exports.getSources = async () => {
    log.info('Getting sources');

    // Get user input
    const { search, language, startUrls } = global.userInput;

    const listPages = [];
    const coursePages = [];

    // Check input combinations
    if (search && !language) {
        listPages.push(`https://www.edx.org/course?search_query=${search.toLowerCase().replace(' ', '+')}`);
    }

    if (language && !search) {
        listPages.push(`https://www.edx.org/course/?language=${encodeURIComponent(language)}`);
    }

    if (language && search) {
        listPages.push(`https://www.edx.org/course/?search_query=${search.toLowerCase().replace(' ', '+')}&language=${encodeURIComponent(language)}`);
    }

    if (startUrls && startUrls.length > 0) {
        startUrls.forEach((startUrl) => {
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

    // Get course links from list pages
    const foundCourseLinks = await getCourseLinks(listPages);

    return coursePages.concat(foundCourseLinks.map(foundCouseLink => ({
        url: foundCouseLink,
        userData: {
            label: 'COURSE',
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
