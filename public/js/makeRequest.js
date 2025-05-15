
async function makeRequest(route, body)
{
    //automatically format a fetch request with the specified route (string) and body (object), along with the result
    //returns the response success/failure, along with the successful values or error information. some requests may
    //also require a redirect url

    let result = { success: false, details: "", url: "" };

    const response = await fetch(route, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-type": "application/json; charset=UTF-8" }
    });

    try
    {
        result.details = await response.json();
    }
    catch (err)
    {
        //response did not contain json information, so no details value to provide - leave it blank.
    }

    result.url = response.url;

    if (response.status === 200)
    {
        result.success = true;
    }

    if (response.status === 429)
    {
        //rate limiter doesn't provide details, so write here
        result.details = "You have made too many requests, please try again later";
    }

    return result;
}