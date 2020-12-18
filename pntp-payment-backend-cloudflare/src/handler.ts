/**
 * Validate the JSON contents of the form content passed to us in the payload of the POST request
 *
 * @param { Object } jsonBody
 * 
 * @return { boolean } True if the JSON in the body passed full validation, else false
 */
function validateBodyJson( jsonBody: { [key:string]:{ [key:string]:any } } ):boolean {
    const requiredFields:string[] = [
        "stripe_key",
        "amount",
        "currency",
        "source",
        "description",
        "receipt_email"
    ];

    // Initialize with proper-top level key and proper number of sub keys found
    let returnVal:boolean = ( ("payment_info" in jsonBody) && 
        (Object.keys(jsonBody["payment_info"]).length >= requiredFields.length) );

    // Only do the deep dive if the previous test passed
    if ( returnVal === true ) {
        const paymentInfo:{ [key:string]:any } = jsonBody["payment_info"];
        for ( let currTestKey of requiredFields ) {
            if ( currTestKey in paymentInfo === false ) {
                returnVal = false;
                break;
            } 
        }
    }

    return returnVal;
}

/**
 * Main processing logic for pulling secrets and then POSTing to Stripe API
 *
 * @param {Object} paymentInfo - JSON object containing everything we need in order to submit a payment request to Stripe
 * 
 * @return {string} String with body contents of HTTP response
 */
async function processPaymentRequest( paymentInfo:{[key:string]:any } ):Promise<string> {
    // Find out which key we're using
    const whichKey:string = paymentInfo['stripe_key']

    // Pull the relevant Worker secret -- env vars are actually pushed as glboal namespace with type String
    let secretKeyContent:string;
    if ( whichKey === "test" ) {
        secretKeyContent = STRIPE_API_KEY_SECRET_TEST;
    } else if ( whichKey === "live" ) {
        secretKeyContent = STRIPE_API_KEY_SECRET_LIVE;
    } else {
        // Unknown key type
    }

    //return JSON.stringify( "Secret key content prefix: " + secretKeyContent.substring(0, 8) );


    // Now we need to strip "stripe_key" out of the parameters, because stripe doesn't actually know what that is
    delete paymentInfo['stripe_key'];

    // We've got all the parameters from the UI and the secret key.  That's all that Stripe API needs 
    //  to do a Charge

    // NOTE: we authenticate using the secret key contents as an access token, 
    //      in the Bearer token format -- fetch API doesn't let us pass username/password
    //
    //      Reference: https://stripe.com/docs/api/authentication

    const stripeChargesApiEndpointUrl:string = "https://api.stripe.com/v1/charges";

    let chargeRequestFormData:URLSearchParams = new URLSearchParams();
    for ( let formField in paymentInfo ) {
        chargeRequestFormData.append( formField, paymentInfo[formField] );
    }

    //return "Here's our form body: " + chargeRequestFormData.toString();

    const fetchResponse = await fetch( stripeChargesApiEndpointUrl, 
        {
            body: chargeRequestFormData,
            headers: {
                "Authorization"     : "Bearer " + secretKeyContent,
                "Content-Type"      : "application/x-www-form-urlencoded",

                // Tells stripe to send body response in JSON format
                "Accept"            : "application/json"
            },
            method: "POST"
        }
    );

    if ( fetchResponse.status === 200 ) {
        const responseBody = fetchResponse.text();

        return JSON.stringify( 
            { 
                "status"                : "success", 
                "stripe_response_body"  : responseBody
            }
        );
    } else {
        return JSON.stringify( { "status": "stripe_error", "stripe_response_code": fetchResponse.status } );
    }
}

/** 
 * Have to handle requests of method OPTIONS because we're doing a POST, and all POSTs are preflighted.
 *
 * @param {Request} request - OPTIONS query from browser
 *
 * @return {Promise<Response>} Preflight response
 */
export async function handlePreflight( request:Request ): Promise<Response> {
    // check for headers that indicate preflight
    const headers = request.headers;
    if ( headers.get("Origin") !== null                                 &&
            headers.get("Access-Control-Request-Method") !== null       &&
            headers.get("Access-Control-Request-Headers") !== null      ) {

        const corsHeaders:{ [key:string]:string } = {
            "Access-Control-Allow-Origin"       : "*",
            "Access-Control-Allow-Methods"      : "POST, OPTIONS",
            "Access-Control-Max-Age"            : "86400",
        }

        return new Response( null, { headers: corsHeaders } );
    } else {
        // Standard options request, finding out what methods our endpoint supports
        return new Response( null, { headers: { Allow: "POST, OPTIONS" } } );
    }
}

/**
 * Main logic for taking in the HTTP request, validating contents, and then passing them to Stripe
 *
 * @param { Request } request - Original HTTP request passed into the Worker
 *
 * @return { Promise<Response> } Will contain body contents for HTTP response
 */
export async function handleRequest(request: Request): Promise<Response> {

    let requestResponse:Response;
    const corsHeader:{[key:string]:string} = { "Access-Control-Allow-Origin" : "*" };

    // Make sure we got some JSON goodness in the payload
    try {
        const payloadBody:string = await request.text();
        const parsedJson:{ [key:string]:{[key:string]:any } } = JSON.parse( payloadBody );

        if ( validateBodyJson(parsedJson) === true ) {
            requestResponse = new Response( 
                await processPaymentRequest(parsedJson['payment_info']), { headers: corsHeader } );
                
        } else {
            requestResponse = new Response( "Input data failed validation",
                { headers: corsHeader} );
        }
    } catch(e) {
        const badParseResponse:{ [key:string] : string } = { error: 'Threw exception in handling content: ' + e };

        return new Response( JSON.stringify(badParseResponse), 
            { headers: corsHeader } );
    }

    return requestResponse;
}
