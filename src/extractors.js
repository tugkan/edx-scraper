// Fetch course details
const fetchCourse = (data) => {
    return {
        courseTitle: data.title,
        subject: data.subjects[0].title,
        code: data.course_id,
        url: `https://courses.edx.org/courses/${data.course_id}/course/.`,
    };
};


module.exports = {
    fetchCourse,
};
