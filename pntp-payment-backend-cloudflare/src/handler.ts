export async function handleRequest(request: Request): Promise<Response> {

    let requestResponse:Response;

    // Make sure we got some JSON goodness in the payload
    try {
        const parsedJson = JSON.parse( await request.text() );

        requestResponse = new Response( "Got valid JSON:\n" + JSON.stringify(parsedJson) );
    } catch(e) {
        const badParseResponse:{ [key:string] : string } = { error: 'Body contents did not successfully parse as JSON' };

        requestResponse = new Response( JSON.stringify(badParseResponse) );
    }
        
    return requestResponse;
}
