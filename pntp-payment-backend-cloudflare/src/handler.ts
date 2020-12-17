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

export async function handleRequest(request: Request): Promise<Response> {

    let requestResponse:Response;

    // Make sure we got some JSON goodness in the payload
    try {
        const payloadBody:string = await request.text();
        const parsedJson:{ [key:string]:{[key:string]:any } } = JSON.parse( payloadBody );

        if ( validateBodyJson(parsedJson) === true ) {
            requestResponse = new Response( "Fully validated input, ready to start processing" );
        } else {
            requestResponse = new Response( "Input data failed validation" );
        }
    } catch(e) {
        const badParseResponse:{ [key:string] : string } = { error: 'Threw exception in parsing: ' + e };

        return new Response( JSON.stringify(badParseResponse) );
    }

    return requestResponse;
}
