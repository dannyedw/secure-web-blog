
// Takes Input and replaces any unwanted characters with a blank value
function checkDetails(params)
{
    
    for (i=0; i<params.length; i++) 
    {
        params[i] = params[i].replace(/</gi,'&lt;').replace(/>/gi,'&gt;').replace(/"/gi,'&quot;').replace(/'/gi,'&#x27;')
    }

    return params

}