import { handlePreflight, handleRequest } from './handler'

addEventListener('fetch', (event) => {
    const request:Request = event.request;

    // The fact that we use POST ensures that browsers will do a preflight test using OPTIONS method 
    if ( request.method === "OPTIONS" ) {
        event.respondWith( handlePreflight(request) ); 
    } else if ( request.method === "POST") {
        event.respondWith( handleRequest(request) );
    } else {
        event.respondWith( 
            new Response(`{ "error": "Unsupported request method: ${request.method}" }`,
                { headers: { "Access-Control-Allow-Origin" : "*" } } ) );
    }
})
