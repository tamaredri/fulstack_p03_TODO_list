const log = console.log;

/**
 * Data Base implementation
 */

class DB {
    constructor() {
        this.getItem = localStorage.getItem;
        this.setItem = localStorage.setItem;
        log('DB constructor');
    }

    /**
     *  private functions
     */

    _usersFactory = (username, password, tasks = [])=>{
        return {
            username,
            password,
            task_running_number : 0,
            tasks
        };
    };
    
    _taskFactory = (taskid, userid, description, note)=>{
        return {
            taskid,
            userid,
            description,
            note,
            status : '',
            id_valid: true
        };
    };

    /**
     *  USER DB
     */

    GET_users(username) {
        // return the user that has the requested id
        var user_data = this.getItem(username)
        if(!user_data) return false;

        user_data = _usersFactory(username, 
                                JSON.parse(user_data).password, 
                                JSON.parse(user_data).tasks);
        
        log('GET_user', user_data);
        return user_data;
    }

    POST_users(username, password){
        // store the user. check if the user does not already exist
        if(!this.GET_users(username)) return false;

        var user_data = _usersFactory(username, password);

        log('POST_user', user_data);
        this.setItem(JSON.stringify(user_data));
        return true;
    }


    /**
     *  TASKS DB
     */

    GET_tasks(username){
        var user_data = this.GET_users(username);
        if(!user_data) return false;

        var tasks = user_data.tasks.filter((t) => t.is_valid);

        log('GET_tasks list', tasks)
        return tasks; // return false if the user has no tasks?
    }

    GET_tasks(username, taskid){
        var user_data = this.GET_users(username);
        var user_tasks = this.GET_tasks(username);

        // the users does not exist or the requested id is invalid - break in 2 return clauses?
        if(!user_data || 
            !user_tasks || 
            taskid >= user_data.task_running_number || 
            !user_data.tasks[taskid].id_valid) 
                return false;
        
        log('GET_tasks single', user_tasks[taskid]);
        return user_tasks[taskid];
    }

    POST_tasks(username, description, note){
        var user_data = this.GET_users(username);
        if(!user_data) return false;
        
        user_data.tasks += [_taskFactory(user_data.task_running_number,
                                        username,
                                        description,
                                        note)];
            
        log('POST_tasks', user_data.taks[user_data.task_running_number]);

        user_data.task_running_number++;
        this.setItem(JSON.stringify(user_data));
        return true;
    }

    PUT_tasks(username, taskid, description = "", note = "", status = ""){
        var user_data = this.GET_users(username);
        var task = this.GET_tasks(username, taskid);
        if(!user_data || !task) return false;


        if(description != "") task.description = description;
        if(note != "") task.note = note;
        if(status != "") task.status = status;

        user_data.tasks[task.taskid] = task;
        
        log('PUT_tasks', user_data.tasks[task.taskid]);
        this.setItem(JSON.stringify(user_data));
        return true;
    }

    DELETE_tasks(username, taskid){
        var user_data = this.GET_tasks(username);
        if(!user_data || 
            taskid >= user_data.task_running_number || 
            !user_data.tasks[taskid].id_valid) 
                return false;

        user_data.tasks[taskid].id_valid == false;

        log('DELETE_tasks', user_data.tasks[taskid]);
        this.setItem(JSON.stringify(user_data));
        return true;
    }
}


/**
 * Server implementation
 */


class Message {
    constructor(method, url) {
        this.method = method;
        this.url = url;
        this.content_type = "";
        this.body_data = "";
    }

    set status_code(status) {
        this.status = status;
    }

    set body(body) {
        this.body_data = body;
    }
}

class Server{
    constructor(){
        this.db_access = get_db();
    }


    parseMessage(message, parseDone){
        // go the message fields - type Message
        var request = message.url.split('/');
        var body = message.body;
        var response;

        // in each case - check the url structure - users / tasks, with or without id?
        var problem = false;
        switch (message.method) {
            case 'GET':
                if(request[0] === 'users'){
                    response = this.check_user_credentials(request)
                } else if(request[0] === 'tasks'){
                    response = this.get_tasks(request);
                } else {
                    // error
                }
                break;
                
            case 'POST':
                if(request[0] === 'users'){
                    this.enter_new_user(body);
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

    /**
     *  USERS
     */
    check_user_credentials(request){
        if(request.length < 2){
            problem = true;
        } else{
            var user = this.db_access.GET_users(parseInt(request[1]));
            // check user.body === message.body
        }
    }

    enter_new_user(){

    }
    

    /**
     * TASKS
     */

    get_tasks(request){
        if(request.length === 2){
            this.db_access.GET_tasks(request[1]);
        } else if(request.length === 3){
            this.db_access.GET_tasks(parseInt(request[1], request[2]));
        }
        else{
            // do something?
        }
    }
    
}


class Network{
    constructor(){
        this.server = get_server();
    }
    request(message, func){
        // randomly send 500 ERROR code - the server is not responding
        this.response_function = func;
        this.server.parseMessage(message, this.response);
    }

    response(message){
        this.response_function(message);
    }

}


class FXMLHttpRequest{
    constructor(){
        this.network = get_network();
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
 *  Singlton-like parameters - 
 *      access to the DB, Server and Network without creating new instances 
 *      with every generation of FXMLHttpRequest.
 */
var get_db = (() =>{
    const global_data_base = new DB();
    return () => {
        return global_data_base;
    };
}) ();

var get_server = (() =>{
    const global_server = new Server();
    return () => {
        return global_server;
    };
}) ();

var get_network = (() => {
    const global_network = new Network();
    return () => {
        return global_network;
    };
}) ();



/**
 * CLIENT code
 */

// var xhttp = new FXMLHttpRequest();



/**
 *  test for the DB class
 */
var db_access = new DB();


