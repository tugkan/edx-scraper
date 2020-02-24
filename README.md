# Actor - edx.org Scraper

edx.org Scraper is an [Apify actor](https://apify.com/actors) for extracting data of courses from [edx.org](https://edx.org). It allows you to search for keywords and pick a language. It is build on top of [Apify SDK](https://sdk.apify.com/) and you can run it both on [Apify platform](https://my.apify.com) and locally.

- [edx.org Scraper Input Parameters](#input-parameters)
- [edx.org Scraper Input Example](#input-example)
- [edx.org Scraper Course Output](#output)
- [Extend output function](#extend-output-function)
- [Compute Unit Consumption](#compute-unit-consumption)
- [During The Run](#during-the-run)
- [edx.org Export](#export)


## edx.org Scraper Input Parameters

The input of this scraper should be JSON containing the list of pages on edx that should be visited. Required fields are:

| Field | Type | Description |
| ----- | ---- | ----------- |
| search | String | (optional)  | The keyword that you want to search on edx |
| language | Array | (optional) List of languages that edx provides. You can fetch all courses of a language with it |
| startUrls | Array | (optional) List of edx URLs. You should provide only URLs from `https://www.edx.org/course` |
| maxItems | Integer | (optional) Maximum number of items that output will contain |
| extendOutputFunction | string | Function that takes a JQuery handle (page) as argument and returns data that will be merged with the default output. More information in [Extend output function](#extend-output-function) |
| proxyConfig | Object | Proxy configuration |

This solution requires the use of **Proxy servers**, either your own proxy servers or you can use <a href="https://www.apify.com/docs/proxy">Apify Proxy</a>.


### edx Scraper Input example
```json
{
  "language": "Spanish",
  "maxItems": 7,
  "proxyConfig": {
    "useApifyProxy": true,
    "apifyProxyGroups": [
      "SHADER"
    ]
  }
}


```

## edx Course Output
The structure of each item in edx courses looks like this:
```json
{
  "courseTitle": "Comunicarnos sin daño para la reconciliación y la salud mental",
  "subject": "Medicine",
  "code": "course-v1:JaverianaX+CRSx+1T2020",
  "url": "https://courses.edx.org/courses/course-v1:JaverianaX+CRSx+1T2020/course/."
}
```

### Extend output function

You can use this function to update the default output of this actor. This function gets a JQuery handle `$` as an argument so you can choose what data from the page you want to scrape. The output from this will function will get merged with the default output.

The return value of this function has to be an object!

You can return fields to achive 3 different things:
- Add a new field - Return object with a field that is not in the default output
- Change a field - Return an existing field with a new value
- Remove a field - Return an existing field with a value `undefined`


### Compute Unit Consumption
The actor optimized to run blazing fast and scrape many product as possible. Therefore, it forefronts all product detail requests. If actor doesn't block very often it'll scrape XXX products in XXX minutes with XXX compute units.

## During the Run

During the run, the actor will output messages letting you know what is going on. Each message always contains a short label specifying which page from the provided list is currently specified.
When items are loaded from the page, you should see a message about this event with a loaded item count and total item count for each page.

If you provide incorrect input to the actor, it will immediately stop with failure state and output an explanation of what is wrong.

## edx Export

During the run, the actor stores results into a dataset. Each item is a separate item in the dataset.

You can manage the results in any languague (Python, PHP, Node JS/NPM). See the FAQ or <a href="https://www.apify.com/docs/api" target="blank">our API reference</a> to learn more about getting results from this edx actor.

