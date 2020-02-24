// routes.js
const Apify = require('apify');
const extractors = require('./extractors');

const {
    utils: { log },
} = Apify;


// Item Count
let itemCount = 0;

// Opens course detail page
// Fetch the details and push to dataset
exports.COURSE = async ({ $, request }) => {
    const { extendOutputFunction, maxItems } = global.userInput;
    log.info(`CRAWLER -- Fetching course details from ${request.url}`);

    // Check for maxItems
    if (maxItems && maxItems <= itemCount) {
        process.exit(0);
    }

    // Fetch course details
    const course = extractors.fetchCourse($);

    // Push data
    await Apify.pushData({ ...course, ...(extendOutputFunction ? { ...eval(extendOutputFunction)($) } : {}) });
    itemCount += 1;

    log.debug(`CRAWLER -- Course details fetched from ${request.url}`);
};
