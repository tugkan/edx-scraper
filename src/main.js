const Apify = require('apify');
const tools = require('./tools');

const {
    utils: { log, requestAsBrowser },
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
    const crawler = new Apify.BasicCrawler({
        requestQueue,
        handleRequestTimeoutSecs: 120,
        maxRequestRetries: 10,
        useSessionPool: true,
        handleRequestFunction: async (context) => {
            const { request, session } = context;
            log.debug(`CRAWLER -- Processing ${request.url}`);

            // Send request
            const response = await requestAsBrowser({
                url: request.url,
                method: 'GET',
                proxyUrl: tools.createProxyUrl(session.id),
                timeoutSecs: 120,
                abortFunction: (res) => {
                    // Status code check
                    if (!res || res.statusCode !== 200) {
                        session.markBad();
                        return true;
                    }
                    session.markGood();
                    return false;
                },
            }).catch((err) => {
                session.markBad();
                throw new Error(err);
            });

            const data = response.body;

            // Add to context
            context.data = data;

            // Redirect to route
            await router(request.userData.label, context);
        },
    });

    log.info('PHASE -- STARTING CRAWLER.');

    await crawler.run();

    log.info('PHASE -- ACTOR FINISHED.');
});
