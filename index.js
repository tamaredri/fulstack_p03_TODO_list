class Message {
    constructor(method, url) {
        this.method = method;
        this.url = url;
        this.body_data = "";
    }

    set status_code(status) {
        this.status = status;
    }

    set body(body) {
        this.body_data = body;
    }
}

const usersFactory = (id, username, password)=>{
    return {
        id,
        username,
        password
    };
};

const taskFactory = (id, description, note, status, user_id)=>{
    return {
        id,
        description,
        note,
        status,
        user_id
    };
};


class DB {
    constructor() {
        this.getItem = localStorage.getItem;
        this.setItem = localStorage.setItem;

        // the running number should be according to the size of the list
        this.usersRunningNumber = 1;
    }

    /**
     *  USER DB
     */


    GET_users(id) {
        // return the user that has the requested id

        // if user does not exist - return None
        return usersFactory();
    }

    POST_users(user_data){
        // store the user and generate an id. check if the user is valid and does not already exist
    }


    /**
     *  TASKS DB
     */

    GET_tasks(user_id){

    }

    GET_tasks(user_id, id){

    }

    POST_tasks(task_data){

    }

    PUT_tasks(id){

    }

    DELETE_tasks(id){

    }
}

class Server{
    constructor(){
        this.db_access = new DB();
    }


    parseMessage(message){
        // go the message fields - type Message
        var request = message.url.split('/');
        var body = message.body;

        // in each case - check the url structure - users / tasks, with or without id?
        var problem = false;
        switch (message.method) {
            case 'GET':
                if(request[0] === 'users'){
                    if(request.length != 2){
                        problem = true;
                    } else{
                        var user = this.db_access.GET_users(parseInt(request[1]));
                        // check user.body === message.body
                    }
                } else if(request[0] === 'tasks'){
                    if(request.length === 2){
                        this.db_access.GET_tasks(request[1]);
                    } else if(request.length === 3){
                        this.db_access.GET_tasks(parseInt(request[1], request[2]));
                    }
                    else{
                        // do something?
                    }
                } else {
                    // error
                }
                break;
                
            case 'POST':
                if(request[0] === 'users'){

                } else if(request[0] === 'tasks'){

                } else {

                }
                break; 

            case 'PUT':
                if(request[0] === 'tasks'){

                } else {

                }
                break;

            case 'DELETE':
                if(request[0] === 'tasks'){

                } else {

                }
                break;

            default:
                // invalid request - return an error message
                break;
        }
    }

    // add helpers
    // randomly add 400 / 300 ERROR codes
    check_user_credentials(){

    }

    enter_new_user(){

    }
    
    
}

class Network{
    constructor(){
        this.server = new Server();
    }
    request(message, func){
        // randomly send 500 ERROR code - the server is not responding
        this.response_function = func;
        this.server.parseMessage(message);
    }

    response(message){
        this.response_function(message);
    }

}

class FXMLHttpRequest{
    constructor(){
        this.network = new Network();
    }

    open(method, url, async){
        this. request_message = new Message(method, url);

    }

    send(body = ""){
        this.request_message.body = body;
        this.network.request(this.request_message, receive_response);
    }
    
    receive_response(message){
        this.response = message;
        this.onload_func();

    }

    set onload(func){
        this.onload_func = func;
    }
}

/**
 * CLIENT code
 */

var xhttp = new FXMLHttpRequest();