/**
 * Server implementation
 */


class Server{
    constructor(){
        this.db_access = get_db();
        // this.network_access = get_network(); - circular dependancies
    }


    parseMessage(httpRequest, parseDoneCallBack){
        // go the message fields - type Message
        httpRequest.readyState = 2; // 2: request received
        httpRequest.readyState = 3; // 3: processing request

        var request_url = httpRequest.request_message.url.split('/').slice(1);
        var body = httpRequest.request_message.body;
        var response = new Message();
        response.status = "200 OK";
        

        switch (request_url[0]) {
            case 'users':
                
                switch (httpRequest.request_message.method) {
                    case 'GET':
                        // check credentials. if there was a false returned or wrong password - find an error with the request body.
                        if (request_url.length != 2 || body  === undefined) {
                            response.status = "400 Bad Request";
                            break;
                        } // the url was unrecognized

                        var user_data = this.db_access.GET_users(request_url[1]);
                        
                        if(!user_data){
                            response.status = "404 Not Found"; // the user was not found
                            break;
                        }

                        if(user_data.password != body.password) {
                            response.status = "403 Forbidden"; // wrong password
                            break;
                        }

                        break;
                        
                    case 'POST':
                        // store the user in the DB and return a code according to the result of the DB function. 
                        if (request_url.length != 1 || body  === undefined){
                            response.status = "400 Bad Request";
                            break;
                        } // the url was unrecognized
                        if(!this.db_access.POST_users(body.username, body.password)){
                            response.status = "404 Not Found";
                            break;
                        } // the requested action could not be performed
                        break; 
        
                    default:
                        response.status = "400 Bad Request";
                        // the url was unrecognized
                        break;
                }
                break;


            case 'tasks':
                switch (httpRequest.request_message.method) {
                    case 'GET':
                        // check if the get requests the entire list or just 1 task. 
                        // according to the return value of the DB - decied the code to return
                        if(2 > request_url.length || request_url.length > 3){
                            response.status = "400 Bad Request";
                            break;
                        } // the url was unrecognized

                        var taskid = -1;
                        if(request_url.length === 3) taskid = parseInt(request_url[2]);

                        var tasks = this.db_access.GET_tasks(request_url[1], taskid);
                        if(!tasks) {
                            response.status = "404 Not Found";
                            break;
                        } // the requested action could not be performed

                        response.body = {'tasks' : tasks};

                        break;
                        
                    case 'POST':
                        if (request_url.length != 2 || body  === undefined) {
                            response.status = "400 Bad Request";
                            break;
                        } // the url was unrecognized
                        
                        if(!this.db_access.POST_tasks(request_url[1], body.description, body.note))  {
                            response.status = "404 Not Found";
                            break;
                        } // the requested action could not be performed

                        break; 

                    case 'PUT':
                        if (request_url.length != 3) {
                            response.status = "400 Bad Request";
                            break;
                        } // the url was unrecognized

                        if(!this.db_access.PUT_tasks(request_url[1], parseInt(request_url[2]), 
                                                    httpRequest.request_message.body.description,
                                                    httpRequest.request_message.body.note, 
                                                    httpRequest.request_message.body.is_done)){
                            response.status = "404 Not Found";
                            break;
                        } // the requested action could not be performed

                        break;

                    case 'DELETE':
                        if (request_url.length != 3) {
                            response.status = "400 Bad Request";
                            break;
                        } // the url was unrecognized
                        
                        if(!this.db_access.DELETE_tasks(request_url[1], parseInt(request_url[2])))  {
                            response.status = "404 Not Found";
                            break;
                        } // the requested action could not be performed

                        break;

                    default:
                        response.status = "400 Bad Request";
                        break;
                }
                break;
        
            default:
                response.status = "400 Bad Request";
                break;
        }
        
        // send the response to the caller
        httpRequest.response_message = response;
        Network.response(httpRequest);
    }  
}
