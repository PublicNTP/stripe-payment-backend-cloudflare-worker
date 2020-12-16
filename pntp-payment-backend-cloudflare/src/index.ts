import { handleRequest } from './handler'

addEventListener('fetch', (event) => {
    const request:Request = event.request;

    if ( request.method === "POST") {
        event.respondWith( handleRequest(request) );
    } else {
        event.respondWith( new Response(`{ "error": "Unsupported request method: ${request.method}" }`) );
    }
})
