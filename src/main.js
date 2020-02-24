const Apify = require('apify');
const tools = require('./tools');

const {
    utils: { log },
} = Apify;


// Create crawler
Apify.main(async () => {
    log.info('PHASE -- STARTING ACTOR.');

    global.userInput = await Apify.getInput();
    const { search, language, startUrls, proxyConfig } = global.userInput;
    log.info('ACTOR OPTIONS: -- ', global.userInput);

    // Input validation
    if (!proxyConfig) {
        throw new Error('Actor must use proxy! Aborting.');
    }

    if (!search && !language && (!startUrls || startUrls.length === 0)) {
        throw new Error('Actor must have at least one of the following attributes: starting url, search or language! Aborting.');
    }

    // Create request queue
    const requestQueue = await Apify.openRequestQueue();

    // Initialize first request
    const homepages = await tools.getSources();
    for (const homepage of homepages) {
        await requestQueue.addRequest({ ...homepage });
    }

    // Create route
    const router = tools.createRouter({ requestQueue });

    log.info('PHASE -- SETTING UP CRAWLER.');
    const crawler = new Apify.CheerioCrawler({
        requestQueue,
        handlePageTimeoutSecs: 120,
        requestTimeoutSecs: 120,
        ignoreSslErrors: true,
        ...proxyConfig,
        useSessionPool: true,
        handlePageFunction: async (context) => {
            const { request, response, session } = context;
            log.debug(`CRAWLER -- Processing ${request.url}`);

            // Status code check
            if (!response || response.statusCode !== 200) {
                session.markBad();
                throw new Error(`We got blocked by target on ${request.url}`);
            } else {
                session.markGood();
            }

            // Redirect to route
            await router(request.userData.label, context);
        },
    });

    log.info('PHASE -- STARTING CRAWLER.');

    await crawler.run();

    log.info('PHASE -- ACTOR FINISHED.');
});
