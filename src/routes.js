// routes.js
const Apify = require('apify');
const cheerio = require('cheerio');
const extractors = require('./extractors');

const {
    utils: { log },
} = Apify;


// Item Count
let itemCount = 0;


// Opens course detail page
// Fetch the details and push to dataset
exports.LIST = async ({ data, request }, { requestQueue }) => {
    const { page, baseURL } = request.userData;
    log.info(`CRAWLER -- Fetching list details with page: ${page}`);

    const currentData = JSON.parse(data);

    if (currentData && currentData.objects && currentData.objects.results && currentData.objects.results.length > 0) {
        // Fetch course details
        const courses = currentData.objects.results.filter(course => course.key).map(course => ({
            name: course.title,
            link: `https://www.edx.org/api/catalog/v2/courses/${course.key}`,
        }));

        // Check if courses found
        if (courses.length > 0) {
            for (const course of courses) {
                await requestQueue.addRequest({
                    url: course.link,
                    userData: {
                        label: 'COURSE_API',
                        courseName: course.name,
                    },
                });
            }

            // Add next page
            await requestQueue.addRequest({
                url: `${baseURL}&page_size=9&page=${page + 1}`,
                userData: {
                    label: 'LIST',
                    page: page + 1,
                    baseURL,
                },
            });
        }
    }

    log.debug('CRAWLER -- Course details fetched from list ');
};


// Opens course detail page
// Fetch the course key and call API
exports.COURSE = async ({ data, request }, { requestQueue }) => {
    log.info(`CRAWLER -- Fetching course key from ${request.url}`);

    // Load to cheerio
    const $ = cheerio.load(data);

    const courseKey = $('#course-info-page').data('course-id');
    const courseName = $('title').text().trim();

    await requestQueue.addRequest({
        url: `https://www.edx.org/api/catalog/v2/courses/${courseKey}`,
        userData: {
            label: 'COURSE_API',
            courseName,
        },
    });
};

// Gets course detail API
// Fetch details and push to dataset
exports.COURSE_API = async ({ data, request }) => {
    const { courseName } = request.userData;
    log.info(`CRAWLER -- Fetching course ${courseName} from API`);

    // Parse JSON
    const currentData = JSON.parse(data);

    const { maxItems } = global.userInput;

    // Check for maxItems
    if (maxItems && maxItems <= itemCount) {
        process.exit(0);
    }

    // Fetch course details
    const course = extractors.fetchCourse(currentData);

    // Push data
    await Apify.pushData({ ...course });
    itemCount += 1;

    log.debug(`CRAWLER -- Course details fetched from ${request.url}`);
};
