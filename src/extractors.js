// Fetch course details
const fetchCourse = ($) => {
    // Get course key
    const courseKey = decodeURIComponent(
        $('.enroll-cta a').attr('href')
            .replace('https://courses.edx.org/register?', '')
            .split('&')[0]
            .replace('course_id=', ''),
    );

    return {
        courseTitle: $('#course-header h1').text().trim(),
        subject: $('.breadcrumb-list .link').last().text().replace('Courses', '')
            .trim(),
        code: courseKey,
        url: `https://courses.edx.org/courses/${courseKey}/course/.`,
    };
};


module.exports = {
    fetchCourse,
};
